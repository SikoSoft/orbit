import { html, LitElement, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import '@ss/ui/components/ss-toggle';
import { DataType } from 'api-spec/models/Entity';
import { ToggleChangedEvent } from '@ss/ui/components/ss-toggle.events';
import {
  PropertyChangedEvent,
} from '@/components/entity-form/property-field/property-field.events';
import {
  BooleanFieldProp,
  booleanFieldProps,
  BooleanFieldProps,
} from './boolean-field.models';

@customElement('boolean-field')
export class BooleanField extends LitElement {
  @property({ type: Boolean })
  [BooleanFieldProp.VALUE]: BooleanFieldProps[BooleanFieldProp.VALUE] =
    booleanFieldProps[BooleanFieldProp.VALUE].default;

  @property({ type: Number })
  [BooleanFieldProp.PROPERTY_CONFIG_ID]: BooleanFieldProps[BooleanFieldProp.PROPERTY_CONFIG_ID] =
    booleanFieldProps[BooleanFieldProp.PROPERTY_CONFIG_ID].default;

  @property({ type: Number })
  [BooleanFieldProp.ENTITY_CONFIG_ID]: BooleanFieldProps[BooleanFieldProp.ENTITY_CONFIG_ID] =
    booleanFieldProps[BooleanFieldProp.ENTITY_CONFIG_ID].default;

  @property({ type: String })
  [BooleanFieldProp.UI_ID]: BooleanFieldProps[BooleanFieldProp.UI_ID] =
    booleanFieldProps[BooleanFieldProp.UI_ID].default;

  private handleToggleChanged(e: ToggleChangedEvent): void {
    this.dispatchEvent(
      new PropertyChangedEvent({
        uiId: this[BooleanFieldProp.UI_ID],
        dataType: DataType.BOOLEAN,
        value: e.detail.on,
      }),
    );
  }

  render(): TemplateResult {
    return html`
      <ss-toggle
        ?on=${this[BooleanFieldProp.VALUE]}
        @toggle-changed=${this.handleToggleChanged}
      ></ss-toggle>
    `;
  }
}
