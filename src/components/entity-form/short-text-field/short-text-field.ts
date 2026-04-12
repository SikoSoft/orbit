import { html, LitElement, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import '@ss/ui/components/ss-input';
import {
  DataType,
  defaultEntityPropertyConfig,
  EntityPropertyConfig,
} from 'api-spec/models/Entity';
import {
  InputChangedEvent,
  InputSubmittedEvent,
} from '@ss/ui/components/ss-input.events';
import {
  PropertyChangedEvent,
  PropertyChangedEventPayload,
  PropertySubmittedEvent,
} from '@/components/entity-form/property-field/property-field.events';
import {
  ShortTextFieldProp,
  ShortTextFieldProps,
  shortTextFieldProps,
  ShortTextLastInput,
} from './short-text-field.models';
import { SSInput } from '@ss/ui/components/ss-input';
import { storage } from '@/lib/Storage';
import { PropertyFieldProp } from '../property-field/property-field.models';
import { MobxLitElement } from '@adobe/lit-mobx';
import { appState } from '@/state';
import { addToast } from '@/lib/Util';
import { translate } from '@/lib/Localization';
import { NotificationType } from '@ss/ui/components/notification-provider.models';

const minLengthForSuggestion = 1;

@customElement('short-text-field')
export class ShortTextField extends MobxLitElement {
  public state = appState;

  @property({ type: Number })
  [ShortTextFieldProp.INSTANCE_ID]: ShortTextFieldProps[ShortTextFieldProp.INSTANCE_ID] =
    shortTextFieldProps[ShortTextFieldProp.INSTANCE_ID].default;

  @property({ type: String })
  [ShortTextFieldProp.VALUE]: ShortTextFieldProps[ShortTextFieldProp.VALUE] =
    shortTextFieldProps[ShortTextFieldProp.VALUE].default;

  @property({ type: Number })
  [ShortTextFieldProp.PROPERTY_CONFIG_ID]: ShortTextFieldProps[ShortTextFieldProp.PROPERTY_CONFIG_ID] =
    shortTextFieldProps[ShortTextFieldProp.PROPERTY_CONFIG_ID].default;

  @property({ type: Number })
  [ShortTextFieldProp.ENTITY_CONFIG_ID]: ShortTextFieldProps[ShortTextFieldProp.ENTITY_CONFIG_ID] =
    shortTextFieldProps[ShortTextFieldProp.ENTITY_CONFIG_ID].default;

  @property({ type: String })
  [ShortTextFieldProp.UI_ID]: ShortTextFieldProps[ShortTextFieldProp.UI_ID] =
    shortTextFieldProps[ShortTextFieldProp.UI_ID].default;

  @state()
  lastInput: ShortTextLastInput = { hadResults: true, value: '' };

  @state()
  suggestions: string[] = [];

  @state()
  _value: string = '';

  @state()
  get propertyConfig(): EntityPropertyConfig {
    let propertyConfig = defaultEntityPropertyConfig;

    const entityConfig = this.state.entityConfigs.find(
      config => config.id === this[PropertyFieldProp.ENTITY_CONFIG_ID],
    );

    if (entityConfig) {
      propertyConfig =
        entityConfig.properties.find(
          prop => prop.id === this[PropertyFieldProp.PROPERTY_CONFIG_ID],
        ) || defaultEntityPropertyConfig;
    }

    return propertyConfig;
  }

  protected handleInputChanged(e: InputChangedEvent): void {
    const value = e.detail.value;

    this.syncValue(value);
  }

  syncValue(value: string): void {
    this._value = value;

    const changedPayload: PropertyChangedEventPayload = {
      uiId: this[ShortTextFieldProp.UI_ID],
      dataType: DataType.SHORT_TEXT,
      value,
    };

    const changedEvent = new PropertyChangedEvent(changedPayload);
    this.dispatchEvent(changedEvent);

    this.requestPropertySuggestions();
  }

  private async requestPropertySuggestions(): Promise<void> {
    if (
      !this.lastInput.hadResults &&
      this._value.startsWith(this.lastInput.value)
    ) {
      this.suggestions = [];
      return;
    }

    try {
      this.lastInput.hadResults = false;
      let suggestions: string[] = [];

      if (this._value.length >= minLengthForSuggestion) {
        suggestions = await this.getPropertySuggestions();
      }

      if (suggestions.length || this._value === '') {
        this.lastInput.hadResults = true;
      }

      this.suggestions = suggestions;
    } catch (error) {
      console.error(`Failed to get suggestions: ${JSON.stringify(error)}`);
    }

    this.lastInput.value = this._value;
  }

  async getPropertySuggestions(): Promise<string[]> {
    if (this.propertyConfig.optionsOnly) {
      return ([...this.propertyConfig.options] as string[]).filter(option =>
        option.toLowerCase().startsWith(this._value.toLowerCase()),
      );
    }

    let suggestions: string[] = [];
    const result = await storage.getPropertySuggestions(
      this[ShortTextFieldProp.PROPERTY_CONFIG_ID],
      this._value,
    );
    if (result) {
      suggestions = result;
    }
    return suggestions;
  }

  handleInputSubmitted(_: InputSubmittedEvent): void {
    this.dispatchEvent(
      new PropertySubmittedEvent({ uiId: this[ShortTextFieldProp.UI_ID] }),
    );
  }

  handleInputBlurred(_: InputChangedEvent): void {
    if (
      this.propertyConfig.optionsOnly &&
      !this.propertyConfig.options.includes(this._value)
    ) {
      addToast(
        translate('propertyValueNotAllowed', {
          value: this._value,
          name: this.propertyConfig.name,
        }),
        NotificationType.ERROR,
      );
      this.syncValue('');
    }
  }

  focus(): void {
    const input = this.renderRoot.querySelector('ss-input');
    if (input) {
      (input as SSInput).focus();
    }
  }

  render(): TemplateResult {
    return html`
      <ss-input
        value=${this[ShortTextFieldProp.VALUE]}
        @input-blurred=${this.handleInputBlurred}
        @input-changed=${this.handleInputChanged}
        @input-submitted=${this.handleInputSubmitted}
        .suggestions=${this.suggestions}
        autoComplete
      ></ss-input>
    `;
  }
}
