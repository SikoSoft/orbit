import { html, css, nothing, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { FactRequest } from 'api-spec/models/Medal';
import {
  FactOperation,
  EntityCountFactContext,
  UniqueTagCountFactContext,
  MedalCountFactContext,
  AnalysisClassificationFactContext,
  AnalysisClassificationType,
} from 'api-spec/models/Fact';
import { defaultListFilter } from 'api-spec/models/List';

import { translate } from '@/lib/Localization';
import { SelectChangedEvent } from '@ss/ui/components/ss-select.events';
import { InputChangedEvent } from '@ss/ui/components/ss-input.events';
import { themed } from '@/lib/Theme';

import {
  FactRequestEditorProp,
  factRequestEditorProps,
  FactRequestEditorProps,
} from './fact-request-editor.models';
import { FactRequestChangedEvent, FactRequestRemovedEvent } from './fact-request-editor.events';
import { ListFilterUpdatedEvent } from '@/components/list-filter/list-filter.events';

import '@ss/ui/components/ss-input';
import '@ss/ui/components/ss-select';
import '@ss/ui/components/ss-button';
import '@/components/list-filter-control/list-filter-control';

const operationOptions = [
  { value: FactOperation.ENTITY_COUNT, label: translate('factOperation.entityCount') },
  { value: FactOperation.UNIQUE_TAG_COUNT, label: translate('factOperation.uniqueTagCount') },
  { value: FactOperation.MEDAL_COUNT, label: translate('factOperation.medalCount') },
  { value: FactOperation.ANALYSIS_CLASSIFICATION, label: translate('factOperation.analysisClassification') },
];

@themed()
@customElement('fact-request-editor')
export class FactRequestEditor extends MobxLitElement {
  static styles = css`
    :host {
      display: block;
      border: 1px solid var(--color-border, #ccc);
      border-radius: 4px;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
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
  [FactRequestEditorProp.FACT_REQUEST]: FactRequestEditorProps[FactRequestEditorProp.FACT_REQUEST] =
    factRequestEditorProps[FactRequestEditorProp.FACT_REQUEST].default;

  @property({ type: Number })
  [FactRequestEditorProp.INDEX]: FactRequestEditorProps[FactRequestEditorProp.INDEX] =
    factRequestEditorProps[FactRequestEditorProp.INDEX].default;

  private emit(factRequest: FactRequest): void {
    this.dispatchEvent(
      new FactRequestChangedEvent({
        index: this[FactRequestEditorProp.INDEX],
        factRequest,
      }),
    );
  }

  private renderFilterButton(
    context: EntityCountFactContext | UniqueTagCountFactContext | AnalysisClassificationFactContext,
    fr: FactRequest,
  ): TemplateResult {
    return html`
      <div class="context-fields">
        <div class="section-label">${translate('filterSettings')}</div>
        <list-filter-control
          showAll
          .listFilter=${context.filter}
          @list-filter-updated=${(e: ListFilterUpdatedEvent): void => {
            this.emit({ ...fr, context: { ...context, filter: e.detail } });
          }}
        ></list-filter-control>
      </div>
    `;
  }

  private renderAnalysisClassificationFields(
    context: AnalysisClassificationFactContext,
    fr: FactRequest,
  ): TemplateResult {
    return html`
      <div class="context-fields">
        <div class="row">
          <div class="field">
            <label>${translate('analysisType')}</label>
            <ss-select
              .options=${Object.values(AnalysisClassificationType).map(v => ({
                value: v,
                label: translate(`analysisType.${v}`),
              }))}
              .selected=${context.analysisType}
              @select-changed=${(e: SelectChangedEvent<string>): void => {
                this.emit({
                  ...fr,
                  context: { ...context, analysisType: e.detail.value as AnalysisClassificationType },
                });
              }}
            ></ss-select>
          </div>
        </div>
      </div>
      ${this.renderFilterButton(context, fr)}
    `;
  }

  private renderMedalCountFields(context: MedalCountFactContext, fr: FactRequest): TemplateResult {
    return html`
      <div class="context-fields">
        <div class="row">
          <div class="field">
            <label>${translate('medalConfigId')}</label>
            <ss-input
              .value=${String(context.medalConfigId)}
              @input-changed=${(e: InputChangedEvent): void => {
                this.emit({ ...fr, context: { ...context, medalConfigId: Number(e.detail.value) } });
              }}
            ></ss-input>
          </div>
          <div class="field">
            <label>${translate('series')}</label>
            <ss-input
              .value=${context.series}
              @input-changed=${(e: InputChangedEvent): void => {
                this.emit({ ...fr, context: { ...context, series: e.detail.value } });
              }}
            ></ss-input>
          </div>
        </div>
      </div>
    `;
  }

  render(): TemplateResult {
    const fr = this[FactRequestEditorProp.FACT_REQUEST];
    const idx = this[FactRequestEditorProp.INDEX];
    const { operation } = fr.context;

    return html`
      <div class="row">
        <div class="field">
          <label>${translate('alias')}</label>
          <ss-input
            .value=${fr.alias}
            @input-changed=${(e: InputChangedEvent): void => {
              this.emit({ ...fr, alias: e.detail.value });
            }}
          ></ss-input>
        </div>
        <div class="field">
          <label>${translate('operation')}</label>
          <ss-select
            .options=${operationOptions}
            .selected=${operation}
            @select-changed=${(e: SelectChangedEvent<FactOperation>): void => {
              const op = e.detail.value;
              let newContext;
              if (op === FactOperation.MEDAL_COUNT) {
                newContext = { operation: op, medalConfigId: 0, series: '' };
              } else if (op === FactOperation.ANALYSIS_CLASSIFICATION) {
                newContext = { operation: op, filter: { ...defaultListFilter }, analysisType: AnalysisClassificationType.MORNING_FASTING };
              } else {
                newContext = { operation: op, filter: { ...defaultListFilter } };
              }
              this.emit({ ...fr, context: newContext });
            }}
          ></ss-select>
        </div>
        <ss-button
          negative
          @click=${(): void => {
            this.dispatchEvent(new FactRequestRemovedEvent({ index: idx }));
          }}
        >${translate('remove')}</ss-button>
      </div>

      ${operation === FactOperation.ENTITY_COUNT || operation === FactOperation.UNIQUE_TAG_COUNT
        ? this.renderFilterButton(
            fr.context as EntityCountFactContext | UniqueTagCountFactContext,
            fr,
          )
        : nothing}
      ${operation === FactOperation.MEDAL_COUNT
        ? this.renderMedalCountFields(fr.context as MedalCountFactContext, fr)
        : nothing}
      ${operation === FactOperation.ANALYSIS_CLASSIFICATION
        ? this.renderAnalysisClassificationFields(
            fr.context as AnalysisClassificationFactContext,
            fr,
          )
        : nothing}
    `;
  }
}
