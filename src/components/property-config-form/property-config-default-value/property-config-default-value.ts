import { LitElement, html, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { DataType, ImageDataValue } from 'api-spec/models/Entity';

import {
  PropertyConfigDefaultValueProp,
  propertyConfigDefaultValueProps,
  PropertyConfigDefaultValueProps,
} from './property-config-default-value.models';
import { DefaultValueChangedEvent } from './property-config-default-value.events';

import { InputChangedEvent } from '@ss/ui/components/ss-input.events';
import { ToggleChangedEvent } from '@ss/ui/components/ss-toggle.events';
import { PropertyChangedEvent } from '@/components/entity-form/property-field/property-field.events';

import '@ss/ui/components/ss-input';
import '@ss/ui/components/ss-toggle';
import '@/components/entity-form/date-field/date-field';
import '@/components/entity-form/image-field/image-field';

@customElement('property-config-default-value')
export class PropertyConfigDefaultValue extends LitElement {
  @property({ type: String })
  [PropertyConfigDefaultValueProp.DATA_TYPE]: PropertyConfigDefaultValueProps[PropertyConfigDefaultValueProp.DATA_TYPE] =
    propertyConfigDefaultValueProps[PropertyConfigDefaultValueProp.DATA_TYPE]
      .default;

  @property()
  [PropertyConfigDefaultValueProp.DEFAULT_VALUE]: PropertyConfigDefaultValueProps[PropertyConfigDefaultValueProp.DEFAULT_VALUE] =
    propertyConfigDefaultValueProps[PropertyConfigDefaultValueProp.DEFAULT_VALUE]
      .default;

  private handleDateChanged(e: PropertyChangedEvent): void {
    this.dispatchEvent(new DefaultValueChangedEvent({ value: e.detail.value }));
  }

  private handleBooleanChanged(e: ToggleChangedEvent): void {
    this.dispatchEvent(new DefaultValueChangedEvent({ value: e.detail.on }));
  }

  private handleImageChanged(e: PropertyChangedEvent): void {
    this.dispatchEvent(new DefaultValueChangedEvent({ value: e.detail.value }));
  }

  private handleIntChanged(e: InputChangedEvent): void {
    this.dispatchEvent(
      new DefaultValueChangedEvent({ value: parseInt(e.detail.value) }),
    );
  }

  private handleTextChanged(e: InputChangedEvent): void {
    this.dispatchEvent(new DefaultValueChangedEvent({ value: e.detail.value }));
  }

  render(): TemplateResult {
    switch (this.dataType) {
      case DataType.DATE:
        return html`<date-field
          .value=${this.defaultValue}
          @property-changed=${this.handleDateChanged}
        ></date-field>`;
      case DataType.BOOLEAN:
        return html`<ss-toggle
          ?on=${this.defaultValue}
          @toggle-changed=${this.handleBooleanChanged}
        ></ss-toggle>`;
      case DataType.IMAGE:
        return html`<image-field
          src=${(this.defaultValue as ImageDataValue).src}
          alt=${(this.defaultValue as ImageDataValue).alt}
          @property-changed=${this.handleImageChanged}
        ></image-field>`;
      case DataType.INT:
        return html`<ss-input
          type="number"
          value=${this.defaultValue}
          @input-changed=${this.handleIntChanged}
        ></ss-input>`;
      default:
        return html`<ss-input
          type="text"
          value=${this.defaultValue}
          @input-changed=${this.handleTextChanged}
        ></ss-input>`;
    }
  }
}
