import { html, css, nothing, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import {
  StreakContext,
  FactOperation,
  AnalysisClassificationType,
  EntityCountFactContext,
  UniqueTagCountFactContext,
  MedalCountFactContext,
  AnalysisClassificationFactContext,
} from 'api-spec/models/Fact';
import { EvalOperator } from 'api-spec/models/Medal';
import { SegmentationTimeUnit } from 'api-spec/models/Statistic';
import { defaultListFilter } from 'api-spec/models/List';

import { translate } from '@/lib/Localization';
import { SelectChangedEvent } from '@ss/ui/components/ss-select.events';
import { InputChangedEvent } from '@ss/ui/components/ss-input.events';
import { ListFilterUpdatedEvent } from '@/components/list-filter/list-filter.events';
import { themed } from '@/lib/Theme';

import {
  StreakFormProp,
  streakFormProps,
  StreakFormProps,
  defaultStreakContext,
} from './streak-form.models';
import { StreakContextChangedEvent } from './streak-form.events';

import '@ss/ui/components/ss-input';
import '@ss/ui/components/ss-select';
import '@/components/list-filter-control/list-filter-control';

const segmentUnitOptions = Object.values(SegmentationTimeUnit).map(v => ({
  value: v,
  label: translate(`segmentationUnit.${v}`),
}));

const operationOptions = [
  {
    value: FactOperation.ENTITY_COUNT,
    label: translate('factOperation.entityCount'),
  },
  {
    value: FactOperation.UNIQUE_TAG_COUNT,
    label: translate('factOperation.uniqueTagCount'),
  },
  {
    value: FactOperation.MEDAL_COUNT,
    label: translate('factOperation.medalCount'),
  },
  {
    value: FactOperation.ANALYSIS_CLASSIFICATION,
    label: translate('factOperation.analysisClassification'),
  },
];

const evalOperatorOptions: { value: EvalOperator; label: string }[] = [
  { value: '==', label: '== (equals)' },
  { value: '!=', label: '!= (not equals)' },
  { value: '>', label: '> (greater than)' },
  { value: '>=', label: '>= (greater than or equal)' },
  { value: '<', label: '< (less than)' },
  { value: '<=', label: '<= (less than or equal)' },
  { value: 'contains', label: 'contains' },
];

const analysisTypeOptions = Object.values(AnalysisClassificationType).map(
  v => ({
    value: v,
    label: translate(`analysisType.${v}`),
  }),
);

const booleanOptions = [
  { value: 'true', label: translate('true') },
  { value: 'false', label: translate('false') },
];

@themed()
@customElement('streak-form')
export class StreakForm extends MobxLitElement {
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

    .inner-context {
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

    .context-fields {
      border-top: 1px solid var(--color-border, #eee);
      padding-top: 0.75rem;
      margin-top: 0.25rem;
    }
  `;

  @property({ type: Object })
  [StreakFormProp.CONTEXT]: StreakFormProps[StreakFormProp.CONTEXT] =
    streakFormProps[StreakFormProp.CONTEXT].default;

  @state() private localContext: StreakContext = defaultStreakContext();

  updated(changedProperties: Map<string, unknown>): void {
    if (
      changedProperties.has(StreakFormProp.CONTEXT) &&
      this[StreakFormProp.CONTEXT]
    ) {
      this.localContext = this[StreakFormProp.CONTEXT];
    }
  }

  private emit(context: StreakContext): void {
    this.localContext = context;
    this.dispatchEvent(new StreakContextChangedEvent({ context }));
  }

  private renderInnerValue(): TemplateResult {
    const ctx = this.localContext;
    /*
    if (ctx.innerContext.operation === FactOperation.ANALYSIS_CLASSIFICATION) {
      return html`
        <div class="field">
          <label>${translate('innerValue')}</label>
          <ss-select
            .options=${booleanOptions}
            .selected=${String(ctx.innerValue)}
            @select-changed=${(e: SelectChangedEvent<string>): void => {
              this.emit({ ...ctx, innerValue: e.detail.value === 'true' });
            }}
          ></ss-select>
        </div>
      `;
    }
      */
    return html`
      <div class="field">
        <label>${translate('innerValue')}</label>
        <ss-input
          .value=${String(ctx.innerValue)}
          @input-changed=${(e: InputChangedEvent): void => {
            const raw = e.detail.value;
            const value: string | number =
              raw !== '' && !isNaN(Number(raw)) ? Number(raw) : raw;
            this.emit({ ...ctx, innerValue: value });
          }}
        ></ss-input>
      </div>
    `;
  }

  private renderFilterSection(
    context:
      | EntityCountFactContext
      | UniqueTagCountFactContext
      | AnalysisClassificationFactContext,
  ): TemplateResult {
    const ctx = this.localContext;
    return html`
      <div class="context-fields">
        <div class="section-label">${translate('filterSettings')}</div>
        <list-filter-control
          showAll
          .listFilter=${context.filter}
          @list-filter-updated=${(e: ListFilterUpdatedEvent): void => {
            this.emit({
              ...ctx,
              innerContext: { ...context, filter: e.detail },
            });
          }}
        ></list-filter-control>
      </div>
    `;
  }

  private renderMedalCountFields(
    context: MedalCountFactContext,
  ): TemplateResult {
    const ctx = this.localContext;
    return html`
      <div class="context-fields">
        <div class="row">
          <div class="field">
            <label>${translate('medalConfigId')}</label>
            <ss-input
              .value=${String(context.medalConfigId)}
              @input-changed=${(e: InputChangedEvent): void => {
                this.emit({
                  ...ctx,
                  innerContext: {
                    ...context,
                    medalConfigId: Number(e.detail.value),
                  },
                });
              }}
            ></ss-input>
          </div>
          <div class="field">
            <label>${translate('series')}</label>
            <ss-input
              .value=${context.series}
              @input-changed=${(e: InputChangedEvent): void => {
                this.emit({
                  ...ctx,
                  innerContext: { ...context, series: e.detail.value },
                });
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
    const ctx = this.localContext;
    return html`
      <div class="context-fields">
        <div class="row">
          <div class="field">
            <label>${translate('analysisType')}</label>
            <ss-select
              .options=${analysisTypeOptions}
              .selected=${context.analysisType}
              @select-changed=${(
                e: SelectChangedEvent<AnalysisClassificationType>,
              ): void => {
                const updated: AnalysisClassificationFactContext = {
                  ...context,
                  analysisType: e.detail.value,
                };
                this.emit({ ...ctx, innerContext: updated });
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
    const { operation } = ctx.innerContext;

    return html`
      <div class="row">
        <div class="field">
          <label>${translate('segmentUnit')}</label>
          <ss-select
            .options=${segmentUnitOptions}
            .selected=${ctx.segmentUnit}
            @select-changed=${(
              e: SelectChangedEvent<SegmentationTimeUnit>,
            ): void => {
              this.emit({ ...ctx, segmentUnit: e.detail.value });
            }}
          ></ss-select>
        </div>
        <div class="field">
          <label>${translate('streakLength')}</label>
          <ss-input
            .value=${String(ctx.length)}
            @input-changed=${(e: InputChangedEvent): void => {
              this.emit({
                ...ctx,
                length: Math.max(1, Number(e.detail.value) || 1),
              });
            }}
          ></ss-input>
        </div>
      </div>

      <div class="inner-context">
        <div class="section-label">${translate('innerContext')}</div>
        <div class="row">
          <div class="field">
            <label>${translate('operation')}</label>
            <ss-select
              .options=${operationOptions}
              .selected=${operation}
              @select-changed=${(
                e: SelectChangedEvent<FactOperation>,
              ): void => {
                const op = e.detail.value;
                let newInnerContext;
                if (op === FactOperation.MEDAL_COUNT) {
                  newInnerContext = {
                    operation: op,
                    medalConfigId: 0,
                    series: '',
                  };
                } else if (op === FactOperation.ANALYSIS_CLASSIFICATION) {
                  newInnerContext = {
                    operation: op,
                    filter: { ...defaultListFilter },
                    analysisType: AnalysisClassificationType.MORNING_FASTING,
                  };
                } else if (op === FactOperation.PROPERTY_SUM) {
                  newInnerContext = {
                    operation: op,
                    filter: { ...defaultListFilter },
                    propertyConfigId: 0,
                  };
                } else {
                  newInnerContext = {
                    operation: op,
                    filter: { ...defaultListFilter },
                  };
                }
                const newInnerValue =
                  op === FactOperation.ANALYSIS_CLASSIFICATION ? true : 0;
                this.emit({
                  ...ctx,
                  innerContext: newInnerContext,
                  innerValue: newInnerValue,
                });
              }}
            ></ss-select>
          </div>
          <div class="field">
            <label>${translate('innerOperator')}</label>
            <ss-select
              .options=${evalOperatorOptions}
              .selected=${ctx.innerOperator}
              @select-changed=${(e: SelectChangedEvent<EvalOperator>): void => {
                this.emit({ ...ctx, innerOperator: e.detail.value });
              }}
            ></ss-select>
          </div>
          ${this.renderInnerValue()}
        </div>

        ${operation === FactOperation.ENTITY_COUNT ||
        operation === FactOperation.UNIQUE_TAG_COUNT
          ? this.renderFilterSection(
              ctx.innerContext as
                | EntityCountFactContext
                | UniqueTagCountFactContext,
            )
          : nothing}
        ${operation === FactOperation.MEDAL_COUNT
          ? this.renderMedalCountFields(
              ctx.innerContext as MedalCountFactContext,
            )
          : nothing}
        ${operation === FactOperation.ANALYSIS_CLASSIFICATION
          ? this.renderAnalysisClassificationFields(
              ctx.innerContext as AnalysisClassificationFactContext,
            )
          : nothing}
      </div>
    `;
  }
}
