import { html, css, nothing, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import {
  Chart,
  ChartConfig,
  ChartConfigType,
  ChartConfigV2,
  ChartRequest,
  ChartVersion,
  DataWindow,
  DataWindowType,
  SegmentationType,
  SegmentationTimeUnit,
} from 'api-spec/models/Statistic';
import { FactContext, FactOperation } from 'api-spec/models/Fact';

import { translate } from '@/lib/Localization';
import { storage } from '@/lib/Storage';
import { defaultListFilter } from '@/state';
import { SelectChangedEvent } from '@ss/ui/components/ss-select.events';
import { InputChangedEvent } from '@ss/ui/components/ss-input.events';
import { ToggleChangedEvent } from '@ss/ui/components/ss-toggle.events';
import { DataPointUpdatedEvent } from '@/components/data-point-builder/data-point-builder.events';

import { ChartBuiltEvent, ChartGeneratingEvent } from './chart-builder.events';

import '@ss/ui/components/ss-select';
import '@ss/ui/components/ss-input';
import '@ss/ui/components/ss-toggle';
import '@/components/data-point-builder/data-point-builder';

@customElement('chart-builder')
export class ChartBuilder extends MobxLitElement {
  @property({ type: Object, attribute: false }) chart?: Chart;
  @property({ type: Object, attribute: false }) initialConfig?: ChartConfig;
  @property({ type: String }) initialName = '';

  @state() private chartType: ChartConfigType = ChartConfigType.LINE;
  @state() private dataWindowType: DataWindowType = DataWindowType.LAST_30_DAYS;
  @state() private rollingDataWindow = false;
  @state() private customStart = '';
  @state() private customEnd = '';
  @state() private segmentationType: SegmentationType = SegmentationType.TIME;
  @state() private segmentationUnit: SegmentationTimeUnit =
    SegmentationTimeUnit.DAY;
  @state() private dataPoints: FactContext[] = [
    { operation: FactOperation.ENTITY_COUNT, filter: structuredClone(defaultListFilter) },
  ];
  @state() private isLoading = false;
  @state() private errorMessage = '';
  @state() private chartName = '';
  @state() private resync = false;

  updated(changedProperties: PropertyValues): void {
    if (changedProperties.has('chart') && this.chart) {
      this.initFromConfig(this.chart.config, this.chart.name);
    } else if (changedProperties.has('initialConfig') && this.initialConfig) {
      this.initFromConfig(this.initialConfig, this.initialName);
      void this.handleGenerateChart(false);
    }
  }

  private initFromConfig(config: ChartConfig, name = ''): void {
    this.chartName = name;
    if (config.version === ChartVersion.V2) {
      this.chartType = (config as ChartConfigV2).type as ChartConfigType;
    }
    this.segmentationType = config.segmentation.type;
    this.segmentationUnit = config.segmentation.unit;
    this.dataPoints = structuredClone(config.dataPoints) as FactContext[];
    if (config.dataWindow.type === DataWindowType.CUSTOM) {
      this.dataWindowType = DataWindowType.CUSTOM;
      this.rollingDataWindow = false;
      this.customStart = new Date(config.dataWindow.start).toISOString().slice(0, 16);
      this.customEnd = new Date(config.dataWindow.end).toISOString().slice(0, 16);
    } else {
      this.dataWindowType = config.dataWindow.type;
      this.rollingDataWindow = true;
    }
  }

  static styles = css`
    .chart-builder {
      padding: 1rem;
    }

    .section {
      margin-bottom: 1.5rem;
    }

    .section h3 {
      margin: 0 0 0.75rem;
      font-size: 1rem;
    }

    .field {
      margin-bottom: 0.75rem;
    }

    .field label {
      display: block;
      margin-bottom: 0.25rem;
      font-size: 0.875rem;
    }

    .toggle-field {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.75rem;
      font-size: 0.875rem;
    }

    .custom-dates {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-top: 0.75rem;
    }

    .segmentation-fields {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .data-point-item {
      margin-bottom: 0.75rem;
    }

    .data-point-header {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 0.25rem;
    }

    .btn {
      padding: 0.5rem 1rem;
      cursor: pointer;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: transparent;
      font-size: 0.875rem;
    }

    .btn-primary {
      background: var(--color-primary, #0066cc);
      color: white;
      border-color: var(--color-primary, #0066cc);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-danger {
      color: var(--color-danger, #cc0000);
      border-color: var(--color-danger, #cc0000);
    }

    .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .error {
      color: var(--color-danger, #cc0000);
      margin-top: 0.5rem;
      font-size: 0.875rem;
    }
  `;

  private getDataWindow(): DataWindow {
    if (this.rollingDataWindow && this.dataWindowType !== DataWindowType.CUSTOM) {
      return { type: this.dataWindowType };
    }

    if (this.dataWindowType === DataWindowType.CUSTOM) {
      return {
        type: DataWindowType.CUSTOM,
        start: new Date(this.customStart),
        end: new Date(this.customEnd),
      };
    }

    const now = new Date();
    let start: Date;

    switch (this.dataWindowType) {
      case DataWindowType.YEAR_TO_DATE: {
        start = new Date(now.getFullYear(), 0, 1);
        break;
      }
      case DataWindowType.MONTH_TO_DATE: {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      }
      case DataWindowType.WEEK_TO_DATE: {
        const daysToMonday = now.getDay() === 0 ? 6 : now.getDay() - 1;
        start = new Date(now);
        start.setDate(now.getDate() - daysToMonday);
        start.setHours(0, 0, 0, 0);
        break;
      }
      case DataWindowType.LAST_365_DAYS: {
        start = new Date(now);
        start.setDate(now.getDate() - 365);
        break;
      }
      case DataWindowType.LAST_30_DAYS: {
        start = new Date(now);
        start.setDate(now.getDate() - 30);
        break;
      }
      case DataWindowType.LAST_7_DAYS: {
        start = new Date(now);
        start.setDate(now.getDate() - 7);
        break;
      }
    }

    return { type: DataWindowType.CUSTOM, start: start!, end: now };
  }

  private addDataPoint(): void {
    this.dataPoints = [
      ...this.dataPoints,
      { operation: FactOperation.ENTITY_COUNT, filter: structuredClone(defaultListFilter) },
    ];
  }

  private removeDataPoint(index: number): void {
    this.dataPoints = this.dataPoints.filter((_, i) => i !== index);
  }

  private handleDataPointUpdated(index: number, e: DataPointUpdatedEvent): void {
    e.stopPropagation();
    const updated = [...this.dataPoints];
    updated[index] = e.detail;
    this.dataPoints = updated;
  }

  private async handleGenerateChart(save = false): Promise<void> {
    if (this.isLoading) {
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;
    this.dispatchEvent(new ChartGeneratingEvent());

    const config: ChartConfig = {
      version: ChartVersion.V2,
      type: this.chartType,
      dataWindow: this.getDataWindow(),
      segmentation: {
        type: this.segmentationType,
        unit: this.segmentationUnit,
      },
      dataPoints: this.dataPoints,
    };

    const request: ChartRequest = {
      config,
      ...(save ? { save: true, name: this.chartName } : {}),
      ...(this.resync ? { resync: true } : {}),
    };

    let result;
    if (save && this.chart) {
      result = await storage.updateChart?.(this.chart.id, request);
    } else {
      result = await storage.createChart?.(request);
    }

    this.isLoading = false;

    if (!result || !result.isOk) {
      if (save && this.chart) {
        this.errorMessage = translate('failedToUpdateChart');
      } else if (save) {
        this.errorMessage = translate('failedToSaveChart');
      } else {
        this.errorMessage = translate('failedToGenerateChart');
      }
      return;
    }

    this.dispatchEvent(
      new ChartBuiltEvent({
        ...result.value,
        chartType: this.chartType,
        dataPoints: this.dataPoints,
        chartName: this.chartName || undefined,
        saved: save,
        updated: save && !!this.chart,
      }),
    );
  }

  private renderCustomDates(): TemplateResult {
    if (this.dataWindowType !== DataWindowType.CUSTOM) {
      return html`${nothing}`;
    }

    return html`
      <div class="custom-dates">
        <div class="field">
          <label>${translate('startDate')}</label>
          <ss-input
            type="datetime-local"
            value=${this.customStart}
            @input-changed=${(e: InputChangedEvent): void => {
              this.customStart = e.detail.value;
            }}
          ></ss-input>
        </div>
        <div class="field">
          <label>${translate('endDate')}</label>
          <ss-input
            type="datetime-local"
            value=${this.customEnd}
            @input-changed=${(e: InputChangedEvent): void => {
              this.customEnd = e.detail.value;
            }}
          ></ss-input>
        </div>
      </div>
    `;
  }

  render(): TemplateResult {
    return html`
      <div class="chart-builder">
        <section class="section">
          <h3>${translate('chartType')}</h3>
          <div class="field">
            <ss-select
              selected=${this.chartType}
              .options=${Object.values(ChartConfigType).map(v => ({
                value: v,
                label: translate(`chartType.${v}`),
              }))}
              @select-changed=${(e: SelectChangedEvent<string>): void => {
                this.chartType = e.detail.value as ChartConfigType;
              }}
            ></ss-select>
          </div>
        </section>

        <section class="section">
          <h3>${translate('dataWindow')}</h3>
          <div class="field">
            <ss-select
              selected=${this.dataWindowType}
              .options=${Object.values(DataWindowType).map(v => ({
                value: v,
                label: translate(`dataWindowPreset.${v}`),
              }))}
              @select-changed=${(e: SelectChangedEvent<string>): void => {
                this.dataWindowType = e.detail.value as DataWindowType;
              }}
            ></ss-select>
          </div>
          <div class="toggle-field">
            <ss-toggle
              ?on=${this.rollingDataWindow}
              @toggle-changed=${(e: ToggleChangedEvent): void => {
                this.rollingDataWindow = e.detail.on;
              }}
            ></ss-toggle>
            <span>${translate('rollingDataWindow')}</span>
          </div>
          ${this.renderCustomDates()}
        </section>

        <section class="section">
          <h3>${translate('segmentation')}</h3>
          <div class="segmentation-fields">
            <div class="field">
              <label>${translate('segmentationType')}</label>
              <ss-select
                selected=${this.segmentationType}
                .options=${Object.values(SegmentationType).map(v => ({
                  value: v,
                  label: translate(`segmentationType.${v}`),
                }))}
                @select-changed=${(e: SelectChangedEvent<string>): void => {
                  this.segmentationType = e.detail.value as SegmentationType;
                }}
              ></ss-select>
            </div>
            <div class="field">
              <label>${translate('segmentationUnit')}</label>
              <ss-select
                selected=${this.segmentationUnit}
                .options=${Object.values(SegmentationTimeUnit).map(v => ({
                  value: v,
                  label: translate(`segmentationUnit.${v}`),
                }))}
                @select-changed=${(e: SelectChangedEvent<string>): void => {
                  this.segmentationUnit = e.detail.value as SegmentationTimeUnit;
                }}
              ></ss-select>
            </div>
          </div>
        </section>

        <section class="section">
          <h3>${translate('dataPoints')}</h3>
          ${repeat(
            this.dataPoints,
            (_, i) => i,
            (dataPoint, i) => html`
              <div class="data-point-item">
                <div class="data-point-header">
                  <button
                    class="btn btn-danger btn-sm"
                    @click=${(): void => this.removeDataPoint(i)}
                  >
                    ${translate('removeDataPoint')}
                  </button>
                </div>
                <data-point-builder
                  .data-point=${dataPoint}
                  @data-point-updated=${(e: DataPointUpdatedEvent): void =>
                    this.handleDataPointUpdated(i, e)}
                ></data-point-builder>
              </div>
            `,
          )}
          <button class="btn" @click=${this.addDataPoint}>
            ${translate('addDataPoint')}
          </button>
        </section>

        <div class="field">
          <label>${translate('chartName')}</label>
          <ss-input
            value=${this.chartName}
            @input-changed=${(e: InputChangedEvent): void => {
              this.chartName = e.detail.value;
            }}
          ></ss-input>
        </div>

        <div class="toggle-field">
          <ss-toggle
            ?on=${this.resync}
            @toggle-changed=${(e: ToggleChangedEvent): void => {
              this.resync = e.detail.on;
            }}
          ></ss-toggle>
          <span>${translate('forceUpdateFreshData')}</span>
        </div>

        <div class="actions">
          <button
            class="btn btn-primary"
            ?disabled=${this.isLoading}
            @click=${(): Promise<void> => this.handleGenerateChart(false)}
          >
            ${this.isLoading
              ? translate('generating')
              : translate('generateChart')}
          </button>
          <button
            class="btn btn-primary"
            ?disabled=${this.isLoading}
            @click=${(): Promise<void> => this.handleGenerateChart(true)}
          >
            ${this.isLoading
              ? this.chart
                ? translate('updating')
                : translate('saving')
              : this.chart
                ? translate('updateChart')
                : translate('saveChart')}
          </button>
          ${this.errorMessage
            ? html`<div class="error">${this.errorMessage}</div>`
            : nothing}
        </div>
      </div>
    `;
  }
}
