import { css, html, LitElement, nothing, TemplateResult } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import { ListFilterTimeType, TimeContext } from 'api-spec/models/List';
import { InputType } from '@ss/ui/components/ss-input.models';
import { Time } from '@/lib/Time';
import {
  TimeFiltersProp,
  timeFiltersProps,
  TimeFiltersProps,
} from './time-filters.models';
import { translate } from '@/lib/Localization';

import { TimeFiltersUpdatedEvent } from './time-filters.events';
import { SelectChangedEvent } from '@ss/ui/components/ss-select.events';

import { SSInput } from '@ss/ui/components/ss-input';
import { themed } from '@/lib/Theme';

@themed()
@customElement('time-filters')
export class TimeFilters extends LitElement {
  static styles = css`
    fieldset {
      border-color: var(--border-color);
    }
  `;

  @property()
  [TimeFiltersProp.TIME_STR]: TimeFiltersProps[TimeFiltersProp.TIME_STR] =
    timeFiltersProps[TimeFiltersProp.TIME_STR].default;

  @property({ reflect: true })
  [TimeFiltersProp.TYPE]: TimeFiltersProps[TimeFiltersProp.TYPE] =
    timeFiltersProps[TimeFiltersProp.TYPE].default;

  @property({ reflect: true })
  [TimeFiltersProp.DATE]: TimeFiltersProps[TimeFiltersProp.DATE] =
    timeFiltersProps[TimeFiltersProp.DATE].default;

  @property({ reflect: true })
  [TimeFiltersProp.START]: TimeFiltersProps[TimeFiltersProp.START] =
    timeFiltersProps[TimeFiltersProp.START].default;

  @property({ reflect: true })
  [TimeFiltersProp.END]: TimeFiltersProps[TimeFiltersProp.END] =
    timeFiltersProps[TimeFiltersProp.END].default;

  @state() time: TimeContext = {
    type: ListFilterTimeType.ALL_TIME,
  };

  @query('#date') dateNode!: SSInput;
  @query('#start') startNode!: SSInput;
  @query('#end') endNode!: SSInput;

  connectedCallback(): void {
    super.connectedCallback();

    if (!this.date) {
      this.date = Time.formatDateTime(new Date());
    }

    if (!this.start) {
      this.start = Time.formatDateTime(new Date(new Date().getTime() - 86400000));
    }

    if (!this.end) {
      this.end = Time.formatDateTime(new Date());
    }
  }

  private handleTypeChanged(e: SelectChangedEvent<string>): void {
    this.type = e.detail.value as ListFilterTimeType;
    this.sendUpdatedEvent();
  }

  private handleDateChanged(e: CustomEvent): void {
    this.date = e.detail.value;
    this.sendUpdatedEvent();
  }

  private handleStartChanged(e: CustomEvent): void {
    this.start = e.detail.value;
    this.sendUpdatedEvent();
  }

  private handleEndChanged(e: CustomEvent): void {
    this.end = e.detail.value;
    this.sendUpdatedEvent();
  }

  private sendUpdatedEvent(): void {
    this.dispatchEvent(new TimeFiltersUpdatedEvent(this.mapContextFromType()));
  }

  private mapContextFromType(): TimeContext {
    switch (this.type) {
      case ListFilterTimeType.ALL_TIME:
        return {
          type: ListFilterTimeType.ALL_TIME,
        };
      case ListFilterTimeType.EXACT_DATE:
        return {
          type: ListFilterTimeType.EXACT_DATE,
          date: this.date,
        };
      case ListFilterTimeType.RANGE:
        return {
          type: ListFilterTimeType.RANGE,
          start: this.start,
          end: this.end,
        };
    }
  }

  render(): TemplateResult | typeof nothing {
    return html`
      <fieldset>
        <legend>${translate('time')}</legend>

        <ss-select
          selected=${this.type}
          @select-changed=${(e: SelectChangedEvent<string>): void => {
            this.handleTypeChanged(e);
          }}
          .options=${Object.values(ListFilterTimeType).map(type => ({
            value: type,
            label: translate(`filterTimeType.${type}`),
          }))}
        ></ss-select>

        <div>
          ${this.type === ListFilterTimeType.EXACT_DATE
            ? html`
                <ss-input
                  id="date"
                  @input-changed=${this.handleDateChanged}
                  type=${InputType.DATETIME_LOCAL}
                  value=${this.date}
                ></ss-input>
              `
            : this.type === ListFilterTimeType.RANGE
              ? html`
                  <ss-input
                    id="start"
                    @input-changed=${this.handleStartChanged}
                    type=${InputType.DATETIME_LOCAL}
                    value=${this.start}
                  ></ss-input>

                  <ss-input
                    id="end"
                    @input-changed=${this.handleEndChanged}
                    type=${InputType.DATETIME_LOCAL}
                    value=${this.end}
                  ></ss-input>
                `
              : nothing}
        </div>
      </fieldset>
    `;
  }
}
