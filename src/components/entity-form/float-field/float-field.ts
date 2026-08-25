import { html, LitElement, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import '@ss/ui/components/ss-input';
import { DataType } from 'api-spec/models/Entity';
import {
  InputChangedEvent,
  InputSubmittedEvent,
} from '@ss/ui/components/ss-input.events';
import {
  PropertyChangedEvent,
  PropertySubmittedEvent,
} from '@/components/entity-form/property-field/property-field.events';
import {
  FloatFieldProp,
  floatFieldProps,
  FloatFieldProps,
} from './float-field.models';

@customElement('float-field')
export class FloatField extends LitElement {
  @property({ type: Number })
  [FloatFieldProp.INSTANCE_ID]: FloatFieldProps[FloatFieldProp.INSTANCE_ID] =
    floatFieldProps[FloatFieldProp.INSTANCE_ID].default;

  @property({ type: Number })
  [FloatFieldProp.VALUE]: FloatFieldProps[FloatFieldProp.VALUE] =
    floatFieldProps[FloatFieldProp.VALUE].default;

  @property({ type: Number })
  [FloatFieldProp.PROPERTY_CONFIG_ID]: FloatFieldProps[FloatFieldProp.PROPERTY_CONFIG_ID] =
    floatFieldProps[FloatFieldProp.PROPERTY_CONFIG_ID].default;

  @property({ type: Number })
  [FloatFieldProp.ENTITY_CONFIG_ID]: FloatFieldProps[FloatFieldProp.ENTITY_CONFIG_ID] =
    floatFieldProps[FloatFieldProp.ENTITY_CONFIG_ID].default;

  @property({ type: String })
  [FloatFieldProp.UI_ID]: FloatFieldProps[FloatFieldProp.UI_ID] =
    floatFieldProps[FloatFieldProp.UI_ID].default;

  protected handleInputChanged(e: InputChangedEvent): void {
    const value = parseFloat(e.detail.value);

    if (isNaN(value)) {
      return;
    }

    this.dispatchEvent(
      new PropertyChangedEvent({
        uiId: this[FloatFieldProp.UI_ID],
        dataType: DataType.FLOAT,
        value,
      }),
    );
  }

  handleInputSubmitted(_: InputSubmittedEvent): void {
    this.dispatchEvent(
      new PropertySubmittedEvent({ uiId: this[FloatFieldProp.UI_ID] }),
    );
  }

  async focus(): Promise<void> {
    await this.updateComplete;
    const input = this.renderRoot?.querySelector('ss-input');
    if (input) {
      (input as HTMLElement).focus();
    }
  }

  render(): TemplateResult {
    return html`
      <ss-input
        type="number"
        value=${this[FloatFieldProp.VALUE]}
        @input-changed=${this.handleInputChanged}
        @input-submitted=${this.handleInputSubmitted}
      ></ss-input>
    `;
  }
}
