import { translate } from '@/lib/Localization';
import { appState } from '@/state';
import { MobxLitElement } from '@adobe/lit-mobx';
import { css, html, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { saveAs } from 'file-saver';

import '@ss/ui/components/ss-button';
import '@ss/ui/components/ss-select';
import { NotificationType } from '@ss/ui/components/notification-provider.models';
import JSZip from 'jszip';
import {
  ExportEntityConfigData,
  ExportDataContents,
  ExportDataSet,
  ExportDataType,
} from 'api-spec/models/Data';
import { addToast, sha256 } from '@/lib/Util';
import { InputChangedEvent } from '@ss/ui/components/ss-input.events';
import { repeat } from 'lit/directives/repeat.js';
import { storage } from '@/lib/Storage';
import { baseFileName } from '../data-manager.models';

@customElement('export-tool')
export class ExportTool extends MobxLitElement {
  private state = appState;

  static styles = css`
    .export-tool {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .include-type-header,
    .include-type {
      display: flex;
      align-items: left;
      gap: 0.5rem;
    }

    .include-type {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .time-range {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .time-range-options {
      display: flex;
      gap: 1rem;
    }

    .time-range-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .time-range-dates {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
  `;

  @state()
  exporting: boolean = false;

  @state()
  configsJson: string = '';

  @state()
  entitiesJson: string = '';

  @state()
  fileName: string = `${baseFileName}.zip`;

  @state()
  selectedDataSets: ExportDataSet[] = [];

  @state()
  selectedListConfigs: string[] = [];

  @state()
  timeRangeType: 'allTime' | 'range' = 'allTime';

  @state()
  startDate: string = '';

  @state()
  endDate: string = '';

  @state()
  dataSetsHash: string = '';

  @state()
  listConfigsHash: string = '';

  @state()
  get everythingIsSelected(): boolean {
    return (
      this.selectedDataSets.length ===
      this.state.entityConfigs.length * Object.values(ExportDataType).length
    );
  }

  @state()
  get allListConfigsAreSelected(): boolean {
    return this.selectedListConfigs.length === this.state.listConfigs.length;
  }

  mapConfigData(): ExportEntityConfigData {
    const configData: ExportEntityConfigData = [];
    for (const config of this.state.entityConfigs) {
      const { userId: _, properties, ...rest } = config;
      if (this.dataSetIsSelected(config.id, ExportDataType.ENTITY_CONFIGS)) {
        configData.push({
          ...rest,
          properties: properties.map(prop => {
            const { userId: __, ...propRest } = prop;
            return propRest;
          }),
        });
      }
    }
    return configData;
  }

  getEntityConfigIdsForData(): number[] {
    const ids = this.selectedDataSets
      .filter(ds => ds.dataType === ExportDataType.ENTITIES)
      .map(ds => ds.entityConfigId);
    return Array.from(new Set(ids));
  }

  async getEntityData(): Promise<string> {
    const data = await storage.exportEntities(
      this.getEntityConfigIdsForData(),
      ...this.getDateRangeArgs(),
    );
    return JSON.stringify(data);
  }

  getDateRangeArgs(): [string?, string?] {
    if (this.timeRangeType === 'range') {
      return [this.startDate || undefined, this.endDate || undefined];
    }
    return [];
  }

  handleTimeRangeTypeChanged(type: 'allTime' | 'range'): void {
    this.timeRangeType = type;
  }

  handleStartDateChanged(e: InputChangedEvent): void {
    this.startDate = e.detail.value;
  }

  handleEndDateChanged(e: InputChangedEvent): void {
    this.endDate = e.detail.value;
  }

  async exportData(): Promise<void> {
    try {
      const zip = new JSZip();

      const dataFile: ExportDataContents = {
        meta: {
          version: '0.0.0',
          date: new Date().toISOString(),
        },
        entityConfigs: [],
        entities: [],
        listConfigs: [],
      };

      if (
        this.selectedDataSets.some(
          ds => ds.dataType === ExportDataType.ENTITY_CONFIGS,
        )
      ) {
        dataFile.entityConfigs = this.mapConfigData();
      }

      if (
        this.selectedDataSets.some(
          ds => ds.dataType === ExportDataType.ENTITIES,
        )
      ) {
        dataFile.entities = await storage.exportEntities(
          this.getEntityConfigIdsForData(),
          ...this.getDateRangeArgs(),
        );
      }

      if (this.selectedListConfigs.length > 0) {
        dataFile.listConfigs = this.state.listConfigs.filter(config =>
          this.selectedListConfigs.includes(config.id),
        );
      }

      zip.file('data.json', JSON.stringify(dataFile, null, 2));

      const content = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 9,
        },
      });

      saveAs(content, this.fileName);
      addToast(translate('fileDownloaded'), NotificationType.SUCCESS);
    } catch (error) {
      console.error('Error creating ZIP file:', error);
    }
  }

  updateFileName(e: InputChangedEvent): void {
    this.fileName = e.detail.value;
  }

  async handleDataSetChanged(
    entityConfigId: number,
    dataType: ExportDataType,
  ): Promise<void> {
    const isSelected = this.selectedDataSets.some(
      ds => ds.entityConfigId === entityConfigId && ds.dataType === dataType,
    );

    if (isSelected) {
      this.selectedDataSets = this.selectedDataSets.filter(
        ds =>
          !(ds.entityConfigId === entityConfigId && ds.dataType === dataType),
      );

      this.syncDataSets();
      return;
    }

    if (dataType === ExportDataType.ENTITIES) {
      this.selectEntityConfig(entityConfigId);
    }

    this.selectedDataSets = [
      ...this.selectedDataSets,
      { entityConfigId, dataType },
    ];
    this.syncDataSets();
  }

  selectEntityConfig(entityConfigId: number): void {
    this.selectedDataSets = this.selectedDataSets.filter(
      ds =>
        ds.entityConfigId !== entityConfigId ||
        ds.dataType !== ExportDataType.ENTITY_CONFIGS,
    );

    this.selectedDataSets = [
      ...this.selectedDataSets,
      { entityConfigId, dataType: ExportDataType.ENTITY_CONFIGS },
    ];
  }

  async syncDataSets(): Promise<void> {
    this.dataSetsHash = await sha256(
      this.selectedDataSets
        .map(ds => `${ds.entityConfigId}-${ds.dataType}`)
        .join(','),
    );
  }

  async syncListConfigs(): Promise<void> {
    this.listConfigsHash = await sha256(this.selectedListConfigs.join(','));
  }

  dataSetIsSelected(entityConfigId: number, dataType: ExportDataType): boolean {
    return this.selectedDataSets.some(
      ds => ds.entityConfigId === entityConfigId && ds.dataType === dataType,
    );
  }

  entityConfigIdIsSelected(entityConfigId: number): boolean {
    return (
      this.dataSetIsSelected(entityConfigId, ExportDataType.ENTITY_CONFIGS) &&
      this.dataSetIsSelected(entityConfigId, ExportDataType.ENTITIES)
    );
  }

  selectEntityConfigGroup(entityConfigId: number): void {
    this.handleDataSetChanged(entityConfigId, ExportDataType.ENTITY_CONFIGS);
    this.handleDataSetChanged(entityConfigId, ExportDataType.ENTITIES);
  }

  selectEverything(): void {
    if (this.everythingIsSelected) {
      this.selectedDataSets = [];
      this.syncDataSets();
      return;
    }

    const allDataSets: ExportDataSet[] = [];
    for (const config of this.state.entityConfigs) {
      for (const dataType of Object.values(ExportDataType)) {
        allDataSets.push({ entityConfigId: config.id, dataType });
      }
    }
    this.selectedDataSets = allDataSets;
    this.syncDataSets();

    this.selectAllListConfigs();
  }

  selectAllListConfigs(): void {
    this.selectedListConfigs = this.allListConfigsAreSelected
      ? []
      : this.state.listConfigs.map(config => config.id);

    this.syncListConfigs();
  }

  listConfigIsSelected(listConfigId: string): boolean {
    return this.selectedListConfigs.includes(listConfigId);
  }

  async handleListConfigChanged(listConfigId: string): Promise<void> {
    const isSelected = this.selectedListConfigs.includes(listConfigId);

    if (isSelected) {
      this.selectedListConfigs = this.selectedListConfigs.filter(
        id => id !== String(listConfigId),
      );
      return;
    }

    this.selectedListConfigs = [...this.selectedListConfigs, listConfigId];
    this.syncListConfigs();
  }

  render(): TemplateResult {
    return html`
      <div class="export-tool">
        <div class="data-sets" data-hash=${this.dataSetsHash}>
          <div class="include-type-header">
            <input
              type="checkbox"
              id="everything"
              ?checked=${this.everythingIsSelected}
              @change=${(): void => this.selectEverything()}
            />
            <h3>${translate('everything')}</h3>
          </div>

          ${repeat(
            this.state.entityConfigs,
            config => `${this.dataSetsHash}-${config.id}`,
            config => html`
              <div>
                <div class="include-type-header">
                  <input
                    type="checkbox"
                    id="${config.id}-both"
                    ?checked=${this.entityConfigIdIsSelected(config.id)}
                    @change=${(): void =>
                      this.selectEntityConfigGroup(config.id)}
                  />
                  <h3>${config.name}</h3>
                </div>

                ${repeat(
                  [ExportDataType.ENTITY_CONFIGS, ExportDataType.ENTITIES],
                  dataType => html`
                    <div class="include-type">
                      <input
                        type="checkbox"
                        id="${config.id}-${dataType}"
                        ?checked=${this.dataSetIsSelected(config.id, dataType)}
                        ?disabled=${dataType ===
                          ExportDataType.ENTITY_CONFIGS &&
                        this.dataSetIsSelected(
                          config.id,
                          ExportDataType.ENTITIES,
                        )}
                        @change=${(): Promise<void> =>
                          this.handleDataSetChanged(config.id, dataType)}
                      />
                      <label for="${config.id}-${dataType}">
                        ${dataType === ExportDataType.ENTITY_CONFIGS
                          ? translate('includeConfigs')
                          : translate('includeEntities')}
                      </label>
                    </div>
                  `,
                )}
              </div>
            `,
          )}
        </div>

        <div class="list-configs">
          <div class="include-type-header">
            <input
              type="checkbox"
              id="all-list-configs"
              ?checked=${this.allListConfigsAreSelected}
              @change=${(): void => this.selectAllListConfigs()}
            />
            <h3>${translate('allListConfigs')}</h3>
          </div>

          ${repeat(
            this.state.listConfigs,
            config => `${this.dataSetsHash}-${config.id}`,
            config => html`
              <div class="include-type">
                <input
                  type="checkbox"
                  id="listConfig-${config.id}"
                  ?checked=${this.listConfigIsSelected(config.id)}
                  @change=${(): Promise<void> =>
                    this.handleListConfigChanged(config.id)}
                />
                <label for="listConfig-${config.id}"> ${config.name} </label>
              </div>
            `,
          )}
        </div>

        <div class="time-range">
          <h3>${translate('exportTimeRange')}</h3>
          <div class="time-range-options">
            <div class="time-range-option">
              <input
                type="radio"
                id="timeRange-allTime"
                name="timeRange"
                ?checked=${this.timeRangeType === 'allTime'}
                @change=${(): void => this.handleTimeRangeTypeChanged('allTime')}
              />
              <label for="timeRange-allTime">${translate('allTime')}</label>
            </div>
            <div class="time-range-option">
              <input
                type="radio"
                id="timeRange-range"
                name="timeRange"
                ?checked=${this.timeRangeType === 'range'}
                @change=${(): void => this.handleTimeRangeTypeChanged('range')}
              />
              <label for="timeRange-range">${translate('range')}</label>
            </div>
          </div>

          ${this.timeRangeType === 'range'
            ? html`
                <div class="time-range-dates">
                  <ss-input
                    type="datetime-local"
                    value=${this.startDate}
                    label=${translate('startDate')}
                    @input-changed=${this.handleStartDateChanged}
                  ></ss-input>
                  <ss-input
                    type="datetime-local"
                    value=${this.endDate}
                    label=${translate('endDate')}
                    @input-changed=${this.handleEndDateChanged}
                  ></ss-input>
                </div>
              `
            : ''}
        </div>

        <div class="file-name">
          <ss-input
            value=${this.fileName}
            label=${translate('fileName')}
            @input-changed=${this.updateFileName}
          ></ss-input>
        </div>

        <ss-button
          ?disabled=${(!this.selectedDataSets.length &&
            !this.selectedListConfigs.length) ||
          this.exporting}
          @click=${this.exportData}
          >${translate('exportData')}</ss-button
        >
      </div>
    `;
  }
}
