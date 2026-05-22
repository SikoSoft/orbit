import { html, css, nothing, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import {
  FactRequest,
  FactOperation,
  EntityCountFactContext,
  UniqueTagCountFactContext,
  MedalCountFactContext,
} from 'api-spec/models/Medal';
import { ListFilterTimeType, TimeContext, defaultListFilter } from 'api-spec/models/List';

import { translate } from '@/lib/Localization';
import { SelectChangedEvent } from '@ss/ui/components/ss-select.events';
import { InputChangedEvent } from '@ss/ui/components/ss-input.events';
import { ToggleChangedEvent } from '@ss/ui/components/ss-toggle.events';
import { themed } from '@/lib/Theme';

import {
  FactRequestEditorProp,
  factRequestEditorProps,
  FactRequestEditorProps,
} from './fact-request-editor.models';
import { FactRequestChangedEvent, FactRequestRemovedEvent } from './fact-request-editor.events';

import '@ss/ui/components/ss-input';
import '@ss/ui/components/ss-select';
import '@ss/ui/components/ss-toggle';
import '@ss/ui/components/ss-button';

const operationOptions = [
  { value: FactOperation.ENTITY_COUNT, label: 'Entity Count' },
  { value: FactOperation.UNIQUE_TAG_COUNT, label: 'Unique Tag Count' },
  { value: FactOperation.MEDAL_COUNT, label: 'Medal Count' },
];

const timeTypeOptions = [
  { value: ListFilterTimeType.ALL_TIME, label: 'All Time' },
  { value: ListFilterTimeType.EXACT_DATE, label: 'Exact Date' },
  { value: ListFilterTimeType.RANGE, label: 'Date Range' },
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

    .field input[type='date'] {
      padding: 0.375rem 0.5rem;
      border: 1px solid var(--color-border, #ccc);
      border-radius: 4px;
      font-size: 0.875rem;
      box-sizing: border-box;
      width: 100%;
    }

    .toggle-row {
      display: flex;
      gap: 1.5rem;
      align-items: center;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
    }

    .toggle-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .toggle-item label {
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

  private renderFilterFields(
    context: EntityCountFactContext | UniqueTagCountFactContext,
    fr: FactRequest,
  ): TemplateResult {
    const { filter } = context;
    const timeType = filter.time.type;

    return html`
      <div class="context-fields">
        <div class="section-label">${translate('filterSettings')}</div>
        <div class="toggle-row">
          <div class="toggle-item">
            <label>${translate('includeAll')}</label>
            <ss-toggle
              ?on=${filter.includeAll}
              @toggle-changed=${(e: ToggleChangedEvent): void => {
                this.emit({
                  ...fr,
                  context: { ...context, filter: { ...filter, includeAll: e.detail.on } },
                });
              }}
            ></ss-toggle>
          </div>
          <div class="toggle-item">
            <label>${translate('includeUntagged')}</label>
            <ss-toggle
              ?on=${filter.includeUntagged}
              @toggle-changed=${(e: ToggleChangedEvent): void => {
                this.emit({
                  ...fr,
                  context: { ...context, filter: { ...filter, includeUntagged: e.detail.on } },
                });
              }}
            ></ss-toggle>
          </div>
        </div>
        <div class="row">
          <div class="field">
            <label>${translate('timeFilter')}</label>
            <ss-select
              .options=${timeTypeOptions}
              .selected=${timeType}
              @select-changed=${(e: SelectChangedEvent<ListFilterTimeType>): void => {
                let newTime: TimeContext;
                if (e.detail.value === ListFilterTimeType.EXACT_DATE) {
                  newTime = { type: ListFilterTimeType.EXACT_DATE, date: '' };
                } else if (e.detail.value === ListFilterTimeType.RANGE) {
                  newTime = { type: ListFilterTimeType.RANGE, start: '', end: '' };
                } else {
                  newTime = { type: ListFilterTimeType.ALL_TIME };
                }
                this.emit({ ...fr, context: { ...context, filter: { ...filter, time: newTime } } });
              }}
            ></ss-select>
          </div>
        </div>
        ${timeType === ListFilterTimeType.EXACT_DATE
          ? html`
              <div class="row">
                <div class="field">
                  <label>${translate('date')}</label>
                  <input
                    type="date"
                    .value=${(filter.time as { date: string }).date ?? ''}
                    @change=${(e: Event): void => {
                      const date = (e.target as HTMLInputElement).value;
                      this.emit({
                        ...fr,
                        context: {
                          ...context,
                          filter: { ...filter, time: { type: ListFilterTimeType.EXACT_DATE, date } },
                        },
                      });
                    }}
                  />
                </div>
              </div>
            `
          : nothing}
        ${timeType === ListFilterTimeType.RANGE
          ? html`
              <div class="row">
                <div class="field">
                  <label>${translate('startDate')}</label>
                  <input
                    type="date"
                    .value=${(filter.time as { start: string; end: string }).start ?? ''}
                    @change=${(e: Event): void => {
                      const start = (e.target as HTMLInputElement).value;
                      const current = filter.time as { start: string; end: string };
                      this.emit({
                        ...fr,
                        context: {
                          ...context,
                          filter: {
                            ...filter,
                            time: { type: ListFilterTimeType.RANGE, start, end: current.end ?? '' },
                          },
                        },
                      });
                    }}
                  />
                </div>
                <div class="field">
                  <label>${translate('endDate')}</label>
                  <input
                    type="date"
                    .value=${(filter.time as { start: string; end: string }).end ?? ''}
                    @change=${(e: Event): void => {
                      const end = (e.target as HTMLInputElement).value;
                      const current = filter.time as { start: string; end: string };
                      this.emit({
                        ...fr,
                        context: {
                          ...context,
                          filter: {
                            ...filter,
                            time: {
                              type: ListFilterTimeType.RANGE,
                              start: current.start ?? '',
                              end,
                            },
                          },
                        },
                      });
                    }}
                  />
                </div>
              </div>
            `
          : nothing}
      </div>
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
        ? this.renderFilterFields(
            fr.context as EntityCountFactContext | UniqueTagCountFactContext,
            fr,
          )
        : nothing}
      ${operation === FactOperation.MEDAL_COUNT
        ? this.renderMedalCountFields(fr.context as MedalCountFactContext, fr)
        : nothing}
    `;
  }
}
