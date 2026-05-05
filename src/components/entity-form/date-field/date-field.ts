import { css, html, LitElement, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import '@ss/ui/components/ss-input';
import { DataType, DateDataValue } from 'api-spec/models/Entity';

import '@ss/ui/components/ss-button';
import '@ss/ui/components/ss-icon';

import { InputChangedEvent } from '@ss/ui/components/ss-input.events';
import { PropertyChangedEvent } from '@/components/entity-form/property-field/property-field.events';
import {
  DateFieldProp,
  DateFieldProps,
  dateFieldProps,
} from './date-field.models';
import { Time } from '@/lib/Time';
import { translate } from '@/lib/Localization';
import { SSInput } from '@ss/ui/components/ss-input';

@customElement('date-field')
export class DateField extends LitElement {
  static styles = css`
    .date-field-wrapper {
      position: relative;
    }

    ss-icon {
      position: absolute;
      top: 50%;
      left: 10px;
      transform: translateY(-50%);
      cursor: pointer;
    }

    ss-input::part(input) {
      padding-left: 36px;
    }
  `;

  @property({ type: Number })
  [DateFieldProp.INSTANCE_ID]: DateFieldProps[DateFieldProp.INSTANCE_ID] =
    dateFieldProps[DateFieldProp.INSTANCE_ID].default;

  @property({ type: String })
  [DateFieldProp.VALUE]: DateFieldProps[DateFieldProp.VALUE] =
    dateFieldProps[DateFieldProp.VALUE].default;

  @property({ type: Number })
  [DateFieldProp.PROPERTY_CONFIG_ID]: DateFieldProps[DateFieldProp.PROPERTY_CONFIG_ID] =
    dateFieldProps[DateFieldProp.PROPERTY_CONFIG_ID].default;

  @property({ type: Number })
  [DateFieldProp.ENTITY_CONFIG_ID]: DateFieldProps[DateFieldProp.ENTITY_CONFIG_ID] =
    dateFieldProps[DateFieldProp.ENTITY_CONFIG_ID].default;

  @property({ type: String })
  [DateFieldProp.UI_ID]: DateFieldProps[DateFieldProp.UI_ID] =
    dateFieldProps[DateFieldProp.UI_ID].default;

  @query('ss-input')
  inputElement!: SSInput;

  @state()
  useNow = false;

  protected firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);

    if (!this[DateFieldProp.VALUE]) {
      this.useNow = true;
    }
  }

  protected handleInputChanged(e: InputChangedEvent): void {
    const value = e.detail.value;

    this.dispatchEvent(
      new PropertyChangedEvent({
        uiId: this[DateFieldProp.UI_ID],
        dataType: DataType.DATE,
        value,
      }),
    );
  }

  get formattedValue(): string {
    return Time.formatDateTime(new Date(this[DateFieldProp.VALUE]));
  }

  resetTime(): void {
    if (!this[DateFieldProp.VALUE]) {
      const now = new Date();
      this.inputElement.value = Time.formatDateTime(now);
      return;
    }

    this.inputElement.value = this.formattedValue;
  }

  async toggleUseNow(): Promise<void> {
    this.useNow = !this.useNow;

    await this.updateComplete;

    if (!this.useNow) {
      this.resetTime();
    }

    this.syncValue();
  }

  syncValue(): void {
    if (this.useNow) {
      this.sendUpdatedEvent(null);
      return;
    }

    this.sendUpdatedEvent(this.inputElement?.value || '');
  }

  sendUpdatedEvent(value: DateDataValue | string): void {
    this.dispatchEvent(
      new PropertyChangedEvent({
        uiId: this[DateFieldProp.UI_ID],
        dataType: DataType.DATE,
        value,
      }),
    );
  }

  async focus(): Promise<void> {
    await this.updateComplete;
    this.inputElement?.focus();
  }

  renderUseNow(): TemplateResult {
    return html`<span>${translate('dateField.useNow')}</span
      ><ss-button @click=${this.toggleUseNow}
        >${translate('dateField.useCustom')}</ss-button
      >`;
  }

  renderUseCustom(): TemplateResult {
    return html`
      <ss-icon
        color="var(--text-color, #000)"
        name="validCircle"
        @click=${this.toggleUseNow}
        size="20"
      ></ss-icon>

      <ss-input
        type="datetime-local"
        value=${this.formattedValue}
        @input-changed=${this.handleInputChanged}
      ></ss-input>
    `;
  }

  render(): TemplateResult {
    return html`
      <div class="date-field-wrapper">
        ${this.useNow ? this.renderUseNow() : this.renderUseCustom()}
      </div>
    `;
  }
}
