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
import { IntFieldProp, intFieldProps, IntFieldProps } from './int-field.models';
import { ShortTextFieldProp } from '../short-text-field/short-text-field.models';

@customElement('int-field')
export class IntField extends LitElement {
  @property({ type: Number })
  [IntFieldProp.INSTANCE_ID]: IntFieldProps[IntFieldProp.INSTANCE_ID] =
    intFieldProps[IntFieldProp.INSTANCE_ID].default;

  @property({ type: Number })
  [IntFieldProp.VALUE]: IntFieldProps[IntFieldProp.VALUE] =
    intFieldProps[IntFieldProp.VALUE].default;

  @property({ type: Number })
  [IntFieldProp.PROPERTY_CONFIG_ID]: IntFieldProps[IntFieldProp.PROPERTY_CONFIG_ID] =
    intFieldProps[IntFieldProp.PROPERTY_CONFIG_ID].default;

  @property({ type: Number })
  [IntFieldProp.ENTITY_CONFIG_ID]: IntFieldProps[IntFieldProp.ENTITY_CONFIG_ID] =
    intFieldProps[IntFieldProp.ENTITY_CONFIG_ID].default;

  @property({ type: String })
  [IntFieldProp.UI_ID]: IntFieldProps[IntFieldProp.UI_ID] =
    intFieldProps[IntFieldProp.UI_ID].default;

  protected handleInputChanged(e: InputChangedEvent): void {
    const value = parseInt(e.detail.value);

    if (isNaN(value)) {
      return;
    }

    this.dispatchEvent(
      new PropertyChangedEvent({
        uiId: this[IntFieldProp.UI_ID],
        dataType: DataType.INT,
        value,
      }),
    );
  }

  handleInputSubmitted(_: InputSubmittedEvent): void {
    this.dispatchEvent(
      new PropertySubmittedEvent({ uiId: this[ShortTextFieldProp.UI_ID] }),
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
        value=${this[IntFieldProp.VALUE]}
        @input-changed=${this.handleInputChanged}
        @input-submitted=${this.handleInputSubmitted}
      ></ss-input>
    `;
  }
}
