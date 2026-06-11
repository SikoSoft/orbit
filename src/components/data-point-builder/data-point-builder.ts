import { html, css, nothing, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import {
  AnalysisClassificationType,
  FactContext,
  FactOperation,
  MedalCountFactContext,
  PropertySumFactContext,
} from 'api-spec/models/Fact';
import { DataType } from 'api-spec/models/Entity';
import { ListFilter as ListFilterSpec } from 'api-spec/models/List';

import { translate } from '@/lib/Localization';
import { appState, defaultListFilter } from '@/state';
import { SelectChangedEvent } from '@ss/ui/components/ss-select.events';
import { InputChangedEvent } from '@ss/ui/components/ss-input.events';
import { ListFilterUpdatedEvent } from '@/components/list-filter/list-filter.events';

import {
  DataPointBuilderProp,
  DataPointBuilderProps,
  dataPointBuilderProps,
} from './data-point-builder.models';
import { DataPointUpdatedEvent } from './data-point-builder.events';

import '@ss/ui/components/ss-select';
import '@ss/ui/components/ss-input';
import '@/components/list-filter-control/list-filter-control';

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

  private buildFactContext(): FactContext {
    switch (this.operation) {
      case FactOperation.ENTITY_COUNT:
        return { operation: FactOperation.ENTITY_COUNT, filter: this.filter };
      case FactOperation.UNIQUE_TAG_COUNT:
        return {
          operation: FactOperation.UNIQUE_TAG_COUNT,
          filter: this.filter,
        };
      case FactOperation.MEDAL_COUNT: {
        const ctx: MedalCountFactContext = {
          operation: FactOperation.MEDAL_COUNT,
          medalConfigId: this.medalConfigId,
          series: this.series,
        };
        if (this.medalStart) {
          ctx.start = this.medalStart;
        }
        if (this.medalEnd) {
          ctx.end = this.medalEnd;
        }
        return ctx;
      }
      case FactOperation.ANALYSIS_CLASSIFICATION:
        return {
          operation: FactOperation.ANALYSIS_CLASSIFICATION,
          filter: this.filter,
          analysisType: this.analysisType,
        };
      case FactOperation.PROPERTY_SUM:
        return {
          operation: FactOperation.PROPERTY_SUM,
          filter: this.filter,
          propertyConfigId: this.propertyConfigId,
        };
    }
  }

  private emitUpdate(): void {
    this.dispatchEvent(new DataPointUpdatedEvent(this.buildFactContext()));
  }

  private getIntPropertyOptions(): { value: string; label: string }[] {
    const types = this.filter.includeTypes ?? [];
    const configs =
      types.length > 0
        ? appState.entityConfigs.filter(c => types.includes(c.id))
        : appState.entityConfigs;
    const seen = new Set<number>();
    const options: { value: string; label: string }[] = [];
    for (const config of configs) {
      for (const property of config.properties) {
        if (property.dataType === DataType.INT && !seen.has(property.id)) {
          seen.add(property.id);
          options.push({ value: String(property.id), label: property.name });
        }
      }
    }
    return options;
  }

  private renderFilterField(): TemplateResult {
    return html`
      <div class="field">
        <list-filter-control
          showAll
          .listFilter=${this.filter}
          @list-filter-updated=${(e: ListFilterUpdatedEvent): void => {
            e.stopPropagation();
            this.filter = e.detail;
            this.emitUpdate();
          }}
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
              @input-changed=${(e: InputChangedEvent): void => {
                this.medalConfigId = parseInt(e.detail.value) || 0;
                this.emitUpdate();
              }}
            ></ss-input>
          </div>
          <div class="field">
            <label>${translate('series')}</label>
            <ss-input
              value=${this.series}
              @input-changed=${(e: InputChangedEvent): void => {
                this.series = e.detail.value;
                this.emitUpdate();
              }}
            ></ss-input>
          </div>
          <div class="field">
            <label>${translate('startDate')}</label>
            <ss-input
              type="datetime-local"
              value=${this.medalStart}
              @input-changed=${(e: InputChangedEvent): void => {
                this.medalStart = e.detail.value;
                this.emitUpdate();
              }}
            ></ss-input>
          </div>
          <div class="field">
            <label>${translate('endDate')}</label>
            <ss-input
              type="datetime-local"
              value=${this.medalEnd}
              @input-changed=${(e: InputChangedEvent): void => {
                this.medalEnd = e.detail.value;
                this.emitUpdate();
              }}
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
              @select-changed=${(e: SelectChangedEvent<string>): void => {
                this.analysisType = e.detail
                  .value as AnalysisClassificationType;
                this.emitUpdate();
              }}
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
              .options=${this.getIntPropertyOptions()}
              @select-changed=${(e: SelectChangedEvent<string>): void => {
                this.propertyConfigId = parseInt(e.detail.value) || 0;
                this.emitUpdate();
              }}
            ></ss-select>
          </div>
        `;
      default:
        return html`${nothing}`;
    }
  }

  render(): TemplateResult {
    return html`
      <div class="data-point-builder">
        <div class="field">
          <label>${translate('operation')}</label>
          <ss-select
            selected=${this.operation}
            .options=${Object.values(FactOperation).map(v => ({
              value: v,
              label: translate(`factOperation.${v}`),
            }))}
            @select-changed=${(e: SelectChangedEvent<string>): void => {
              this.operation = e.detail.value as FactOperation;
              this.emitUpdate();
            }}
          ></ss-select>
        </div>
        ${this.renderOperationFields()}
      </div>
    `;
  }
}
