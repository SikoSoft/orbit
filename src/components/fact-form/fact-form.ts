import { html, css, nothing, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import {
  FactContext,
  FactOperation,
  AnalysisClassificationType,
  EntityCountFactContext,
  UniqueTagCountFactContext,
  MedalCountFactContext,
  AnalysisClassificationFactContext,
  PropertySumFactContext,
} from 'api-spec/models/Fact';
import { DataType } from 'api-spec/models/Entity';
import { defaultListFilter } from 'api-spec/models/List';

import { translate } from '@/lib/Localization';
import { appState } from '@/state';
import { SelectChangedEvent } from '@ss/ui/components/ss-select.events';
import { InputChangedEvent } from '@ss/ui/components/ss-input.events';
import { ListFilterUpdatedEvent } from '@/components/list-filter/list-filter.events';
import { themed } from '@/lib/Theme';

import { FactFormProp, factFormProps, FactFormProps } from './fact-form.models';
import { FactContextChangedEvent } from './fact-form.events';

import '@ss/ui/components/ss-input';
import '@ss/ui/components/ss-select';
import '@/components/list-filter-control/list-filter-control';

const operationLabels: Record<FactOperation, string> = {
  [FactOperation.ENTITY_COUNT]: translate('factOperation.entityCount'),
  [FactOperation.UNIQUE_TAG_COUNT]: translate('factOperation.uniqueTagCount'),
  [FactOperation.MEDAL_COUNT]: translate('factOperation.medalCount'),
  [FactOperation.ANALYSIS_CLASSIFICATION]: translate('factOperation.analysisClassification'),
  [FactOperation.PROPERTY_SUM]: translate('factOperation.propertySum'),
};

const operationOptions = Object.entries(operationLabels).map(([value, label]) => ({
  value: value as FactOperation,
  label,
}));

const analysisTypeOptions = Object.values(AnalysisClassificationType).map(v => ({
  value: v,
  label: translate(`analysisType.${v}`),
}));

@themed()
@customElement('fact-form')
export class FactForm extends MobxLitElement {
  static styles = css`
    :host {
      display: block;
    }

    .row {
      display: flex;
      gap: 0.75rem;
      align-items: flex-end;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
    }

    .field {
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: 0.25rem;
      min-width: 8rem;
    }

    .field label {
      font-size: 0.8125rem;
      font-weight: bold;
    }

    .context-fields {
      border-top: 1px solid var(--color-border, #eee);
      padding-top: 0.75rem;
      margin-top: 0.25rem;
    }

    .section-label {
      font-size: 0.8125rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
      opacity: 0.7;
    }
  `;

  @property({ type: Object })
  [FactFormProp.CONTEXT]: FactFormProps[FactFormProp.CONTEXT] =
    factFormProps[FactFormProp.CONTEXT].default;

  @state() private localContext: FactContext = factFormProps[FactFormProp.CONTEXT].default;

  updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has(FactFormProp.CONTEXT) && this[FactFormProp.CONTEXT]) {
      this.localContext = this[FactFormProp.CONTEXT];
    }
  }

  private emit(context: FactContext): void {
    this.localContext = context;
    this.dispatchEvent(new FactContextChangedEvent({ context }));
  }

  private handleOperationChanged(e: SelectChangedEvent<FactOperation>): void {
    const op = e.detail.value;
    let newContext: FactContext;
    if (op === FactOperation.MEDAL_COUNT) {
      newContext = { operation: op, medalConfigId: 0, series: '' };
    } else if (op === FactOperation.ANALYSIS_CLASSIFICATION) {
      newContext = {
        operation: op,
        filter: { ...defaultListFilter },
        analysisType: AnalysisClassificationType.MORNING_FASTING,
      };
    } else if (op === FactOperation.PROPERTY_SUM) {
      newContext = { operation: op, filter: { ...defaultListFilter }, propertyConfigId: 0 };
    } else {
      newContext = { operation: op, filter: { ...defaultListFilter } };
    }
    this.emit(newContext);
  }

  private getIntPropertyOptions(): { value: string; label: string }[] {
    const seen = new Set<number>();
    const options: { value: string; label: string }[] = [];
    for (const config of appState.entityConfigs) {
      for (const property of config.properties) {
        if (property.dataType === DataType.INT && !seen.has(property.id)) {
          seen.add(property.id);
          options.push({ value: String(property.id), label: property.name });
        }
      }
    }
    return options;
  }

  private renderFilterSection(
    context: EntityCountFactContext | UniqueTagCountFactContext | AnalysisClassificationFactContext | PropertySumFactContext,
  ): TemplateResult {
    return html`
      <div class="context-fields">
        <div class="section-label">${translate('filterSettings')}</div>
        <list-filter-control
          showAll
          .listFilter=${context.filter}
          @list-filter-updated=${(e: ListFilterUpdatedEvent): void => {
            this.emit({ ...context, filter: e.detail });
          }}
        ></list-filter-control>
      </div>
    `;
  }

  private renderMedalCountFields(context: MedalCountFactContext): TemplateResult {
    return html`
      <div class="context-fields">
        <div class="row">
          <div class="field">
            <label>${translate('medalConfigId')}</label>
            <ss-input
              .value=${String(context.medalConfigId)}
              @input-changed=${(e: InputChangedEvent): void => {
                this.emit({ ...context, medalConfigId: Number(e.detail.value) });
              }}
            ></ss-input>
          </div>
          <div class="field">
            <label>${translate('series')}</label>
            <ss-input
              .value=${context.series}
              @input-changed=${(e: InputChangedEvent): void => {
                this.emit({ ...context, series: e.detail.value });
              }}
            ></ss-input>
          </div>
        </div>
      </div>
    `;
  }

  private renderAnalysisClassificationFields(
    context: AnalysisClassificationFactContext,
  ): TemplateResult {
    return html`
      <div class="context-fields">
        <div class="row">
          <div class="field">
            <label>${translate('analysisType')}</label>
            <ss-select
              .options=${analysisTypeOptions}
              .selected=${context.analysisType}
              @select-changed=${(e: SelectChangedEvent<AnalysisClassificationType>): void => {
                this.emit({ ...context, analysisType: e.detail.value });
              }}
            ></ss-select>
          </div>
        </div>
      </div>
      ${this.renderFilterSection(context)}
    `;
  }

  private renderPropertySumFields(context: PropertySumFactContext): TemplateResult {
    return html`
      <div class="context-fields">
        <div class="row">
          <div class="field">
            <label>${translate('propertyConfigId')}</label>
            <ss-select
              .options=${this.getIntPropertyOptions()}
              .selected=${String(context.propertyConfigId)}
              @select-changed=${(e: SelectChangedEvent<string>): void => {
                this.emit({ ...context, propertyConfigId: Number(e.detail.value) });
              }}
            ></ss-select>
          </div>
        </div>
      </div>
      ${this.renderFilterSection(context)}
    `;
  }

  render(): TemplateResult {
    const ctx = this.localContext;
    const { operation } = ctx;

    return html`
      <div class="row">
        <div class="field">
          <label>${translate('operation')}</label>
          <ss-select
            .options=${operationOptions}
            .selected=${operation}
            @select-changed=${this.handleOperationChanged}
          ></ss-select>
        </div>
      </div>

      ${operation === FactOperation.ENTITY_COUNT || operation === FactOperation.UNIQUE_TAG_COUNT
        ? this.renderFilterSection(
            ctx as EntityCountFactContext | UniqueTagCountFactContext,
          )
        : nothing}
      ${operation === FactOperation.MEDAL_COUNT
        ? this.renderMedalCountFields(ctx as MedalCountFactContext)
        : nothing}
      ${operation === FactOperation.ANALYSIS_CLASSIFICATION
        ? this.renderAnalysisClassificationFields(ctx as AnalysisClassificationFactContext)
        : nothing}
      ${operation === FactOperation.PROPERTY_SUM
        ? this.renderPropertySumFields(ctx as PropertySumFactContext)
        : nothing}
    `;
  }
}
