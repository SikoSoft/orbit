import { html, css, nothing, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import {
  AnalysisClassificationType,
  FactContext,
  FactOperation,
  MedalCountFactContext,
  ParseStrategy,
  PropertySumFactContext,
} from 'api-spec/models/Fact';
import { FormattedDataPointRequest } from 'api-spec/models/Statistic';
import { DataType } from 'api-spec/models/Entity';
import { ListFilter as ListFilterSpec } from 'api-spec/models/List';

import { translate } from '@/lib/Localization';
import { appState, defaultListFilter } from '@/state';
import { SelectChangedEvent } from '@ss/ui/components/ss-select.events';
import { InputChangedEvent } from '@ss/ui/components/ss-input.events';
import { ListFilterUpdatedEvent } from '@/components/list-filter/list-filter.events';
import { FormattersChangedEvent } from '@/components/property-config-form/property-config-formatters/property-config-formatters.events';

import {
  DataPointBuilderProp,
  DataPointBuilderProps,
  dataPointBuilderProps,
} from './data-point-builder.models';
import { DataPointUpdatedEvent } from './data-point-builder.events';

import '@ss/ui/components/ss-select';
import '@ss/ui/components/ss-input';
import '@ss/ui/components/tab-container';
import '@ss/ui/components/tab-pane';
import '@/components/list-filter-control/list-filter-control';
import '@/components/property-config-form/property-config-formatters/property-config-formatters';

@customElement('data-point-builder')
export class DataPointBuilder extends MobxLitElement {
  @property({ type: Object, attribute: false })
  [DataPointBuilderProp.DATA_POINT]: DataPointBuilderProps[DataPointBuilderProp.DATA_POINT] =
    dataPointBuilderProps[DataPointBuilderProp.DATA_POINT].default;

  @state() private operation: FactOperation = FactOperation.ENTITY_COUNT;
  @state() private filter: ListFilterSpec = structuredClone(defaultListFilter);
  @state() private medalConfigId = 0;
  @state() private series = '';
  @state() private medalStart = '';
  @state() private medalEnd = '';
  @state() private analysisType: AnalysisClassificationType =
    AnalysisClassificationType.MORNING_FASTING;
  @state() private propertyConfigId = 0;
  @state() private parseStrategy: ParseStrategy | undefined = undefined;
  @state() private formatters: string[] = [];

  updated(changedProperties: PropertyValues): void {
    if (changedProperties.has(DataPointBuilderProp.DATA_POINT)) {
      this.initFromDataPoint();
    }
  }

  private initFromDataPoint(): void {
    const dp = this[DataPointBuilderProp.DATA_POINT];
    if (!dp) {
      return;
    }
    this.operation = dp.operation;
    this.formatters = dp.formatters ? [...dp.formatters] : [];
    if (dp.operation === FactOperation.MEDAL_COUNT) {
      const ctx = dp as MedalCountFactContext;
      this.medalConfigId = ctx.medalConfigId;
      this.series = ctx.series;
      this.medalStart = ctx.start ?? '';
      this.medalEnd = ctx.end ?? '';
    } else if (
      dp.operation === FactOperation.ENTITY_COUNT ||
      dp.operation === FactOperation.UNIQUE_TAG_COUNT
    ) {
      this.filter = structuredClone(dp.filter);
    } else if (dp.operation === FactOperation.ANALYSIS_CLASSIFICATION) {
      this.analysisType = dp.analysisType;
      this.filter = structuredClone(dp.filter);
    } else if (dp.operation === FactOperation.PROPERTY_SUM) {
      const ctx = dp as PropertySumFactContext;
      this.filter = structuredClone(ctx.filter);
      this.propertyConfigId = ctx.propertyConfigId;
      this.parseStrategy = ctx.parseStrategy;
    }
  }

  static styles = css`
    .data-point-builder {
      border: 1px solid var(--color-border, #ccc);
      padding: 1rem;
      border-radius: 4px;
    }

    .field {
      margin-bottom: 0.75rem;
    }

    .field label {
      display: block;
      margin-bottom: 0.25rem;
      font-size: 0.875rem;
    }
  `;

  private buildDataPoint(): FormattedDataPointRequest {
    let ctx: FactContext;
    switch (this.operation) {
      case FactOperation.ENTITY_COUNT:
        ctx = { operation: FactOperation.ENTITY_COUNT, filter: this.filter };
        break;
      case FactOperation.UNIQUE_TAG_COUNT:
        ctx = { operation: FactOperation.UNIQUE_TAG_COUNT, filter: this.filter };
        break;
      case FactOperation.MEDAL_COUNT: {
        const medalCtx: MedalCountFactContext = {
          operation: FactOperation.MEDAL_COUNT,
          medalConfigId: this.medalConfigId,
          series: this.series,
        };
        if (this.medalStart) {
          medalCtx.start = this.medalStart;
        }
        if (this.medalEnd) {
          medalCtx.end = this.medalEnd;
        }
        ctx = medalCtx;
        break;
      }
      case FactOperation.ANALYSIS_CLASSIFICATION:
        ctx = {
          operation: FactOperation.ANALYSIS_CLASSIFICATION,
          filter: this.filter,
          analysisType: this.analysisType,
        };
        break;
      case FactOperation.PROPERTY_SUM: {
        const propertySumCtx: PropertySumFactContext = {
          operation: FactOperation.PROPERTY_SUM,
          filter: this.filter,
          propertyConfigId: this.propertyConfigId,
        };
        if (this.parseStrategy !== undefined) {
          propertySumCtx.parseStrategy = this.parseStrategy;
        }
        ctx = propertySumCtx;
        break;
      }
    }
    return { ...ctx, formatters: this.formatters };
  }

  private emitUpdate(): void {
    this.dispatchEvent(new DataPointUpdatedEvent(this.buildDataPoint()));
  }

  private handleFormattersChanged(e: FormattersChangedEvent): void {
    this.formatters = e.detail.formatters;
    this.emitUpdate();
  }

  private handleFilterUpdated(e: ListFilterUpdatedEvent): void {
    e.stopPropagation();
    this.filter = e.detail;
    this.emitUpdate();
  }

  private handleMedalConfigIdChanged(e: InputChangedEvent): void {
    this.medalConfigId = parseInt(e.detail.value) || 0;
    this.emitUpdate();
  }

  private handleSeriesChanged(e: InputChangedEvent): void {
    this.series = e.detail.value;
    this.emitUpdate();
  }

  private handleMedalStartChanged(e: InputChangedEvent): void {
    this.medalStart = e.detail.value;
    this.emitUpdate();
  }

  private handleMedalEndChanged(e: InputChangedEvent): void {
    this.medalEnd = e.detail.value;
    this.emitUpdate();
  }

  private handleAnalysisTypeChanged(e: SelectChangedEvent<string>): void {
    this.analysisType = e.detail.value as AnalysisClassificationType;
    this.emitUpdate();
  }

  private handlePropertyConfigIdChanged(e: SelectChangedEvent<string>): void {
    this.propertyConfigId = parseInt(e.detail.value) || 0;
    if (!this.isTextProperty(this.propertyConfigId)) {
      this.parseStrategy = undefined;
    }
    this.emitUpdate();
  }

  private handleParseStrategyChanged(e: SelectChangedEvent<string>): void {
    this.parseStrategy = e.detail.value as ParseStrategy;
    this.emitUpdate();
  }

  private handleOperationChanged(e: SelectChangedEvent<string>): void {
    this.operation = e.detail.value as FactOperation;
    this.emitUpdate();
  }

  private getNumericPropertyOptions(): { value: string; label: string }[] {
    const types = this.filter.includeTypes ?? [];
    const configs =
      types.length > 0
        ? appState.entityConfigs.filter(c => types.includes(c.id))
        : appState.entityConfigs;
    const seen = new Set<number>();
    const options: { value: string; label: string }[] = [];
    const numericTypes = new Set<DataType>([DataType.INT, DataType.SHORT_TEXT, DataType.LONG_TEXT]);
    for (const config of configs) {
      for (const property of config.properties) {
        if (numericTypes.has(property.dataType) && !seen.has(property.id)) {
          seen.add(property.id);
          options.push({ value: String(property.id), label: property.name });
        }
      }
    }
    return options;
  }

  private isTextProperty(propertyConfigId: number): boolean {
    for (const config of appState.entityConfigs) {
      for (const property of config.properties) {
        if (property.id === propertyConfigId) {
          return property.dataType === DataType.SHORT_TEXT || property.dataType === DataType.LONG_TEXT;
        }
      }
    }
    return false;
  }

  private renderFilterField(): TemplateResult {
    return html`
      <div class="field">
        <list-filter-control
          showAll
          .listFilter=${this.filter}
          @list-filter-updated=${(e: ListFilterUpdatedEvent): void =>
            this.handleFilterUpdated(e)}
        ></list-filter-control>
      </div>
    `;
  }

  private renderOperationFields(): TemplateResult {
    switch (this.operation) {
      case FactOperation.ENTITY_COUNT:
      case FactOperation.UNIQUE_TAG_COUNT:
        return this.renderFilterField();
      case FactOperation.MEDAL_COUNT:
        return html`
          <div class="field">
            <label>${translate('medalConfigId')}</label>
            <ss-input
              type="number"
              value=${String(this.medalConfigId)}
              @input-changed=${(e: InputChangedEvent): void =>
                this.handleMedalConfigIdChanged(e)}
            ></ss-input>
          </div>
          <div class="field">
            <label>${translate('series')}</label>
            <ss-input
              value=${this.series}
              @input-changed=${(e: InputChangedEvent): void =>
                this.handleSeriesChanged(e)}
            ></ss-input>
          </div>
          <div class="field">
            <label>${translate('startDate')}</label>
            <ss-input
              type="datetime-local"
              value=${this.medalStart}
              @input-changed=${(e: InputChangedEvent): void =>
                this.handleMedalStartChanged(e)}
            ></ss-input>
          </div>
          <div class="field">
            <label>${translate('endDate')}</label>
            <ss-input
              type="datetime-local"
              value=${this.medalEnd}
              @input-changed=${(e: InputChangedEvent): void =>
                this.handleMedalEndChanged(e)}
            ></ss-input>
          </div>
        `;
      case FactOperation.ANALYSIS_CLASSIFICATION:
        return html`
          <div class="field">
            <label>${translate('analysisType')}</label>
            <ss-select
              selected=${this.analysisType}
              .options=${Object.values(AnalysisClassificationType).map(v => ({
                value: v,
                label: translate(`analysisType.${v}`),
              }))}
              @select-changed=${(e: SelectChangedEvent<string>): void =>
                this.handleAnalysisTypeChanged(e)}
            ></ss-select>
          </div>
          ${this.renderFilterField()}
        `;
      case FactOperation.PROPERTY_SUM:
        return html`
          ${this.renderFilterField()}
          <div class="field">
            <label>${translate('propertyConfigId')}</label>
            <ss-select
              selected=${String(this.propertyConfigId)}
              .options=${this.getNumericPropertyOptions()}
              @select-changed=${(e: SelectChangedEvent<string>): void =>
                this.handlePropertyConfigIdChanged(e)}
            ></ss-select>
          </div>
          ${this.isTextProperty(this.propertyConfigId)
            ? html`
                <div class="field">
                  <label>${translate('parseStrategy')}</label>
                  <ss-select
                    selected=${this.parseStrategy ?? ''}
                    .options=${Object.values(ParseStrategy).map(v => ({
                      value: v,
                      label: translate(`parseStrategy.${v}`),
                    }))}
                    @select-changed=${(e: SelectChangedEvent<string>): void =>
                      this.handleParseStrategyChanged(e)}
                  ></ss-select>
                </div>
              `
            : nothing}
        `;
      default:
        return html`${nothing}`;
    }
  }

  render(): TemplateResult {
    return html`
      <div class="data-point-builder">
        <tab-container>
          <tab-pane title=${translate('dataPoint.tab.config')}>
            <div class="field">
              <label>${translate('operation')}</label>
              <ss-select
                selected=${this.operation}
                .options=${Object.values(FactOperation).map(v => ({
                  value: v,
                  label: translate(`factOperation.${v}`),
                }))}
                @select-changed=${(e: SelectChangedEvent<string>): void =>
                  this.handleOperationChanged(e)}
              ></ss-select>
            </div>
            ${this.renderOperationFields()}
          </tab-pane>
          <tab-pane title=${translate('dataPoint.tab.formatters')}>
            <property-config-formatters
              .formatters=${this.formatters}
              @formatters-changed=${this.handleFormattersChanged}
            ></property-config-formatters>
          </tab-pane>
        </tab-container>
      </div>
    `;
  }
}
