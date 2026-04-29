import { css, html, nothing, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import {
  BooleanDataValue,
  DataType,
  DateDataValue,
  EntityPropertyConfig,
  ImageDataValue,
  IntDataValue,
  PropertyDataValue,
} from 'api-spec/models/Entity';
import { FilterProperty, TextType } from 'api-spec/models/List';
import { translate } from '@/lib/Localization';
import { appState } from '@/state';

import {
  FilterPropertyProp,
  FilterPropertyProps,
  filterPropertyProps,
} from './filter-property.models';
import {
  FilterPropertyRemovedEvent,
  FilterPropertyUpdatedEvent,
} from './filter-property.events';
import { PropertyChangedEvent } from '@/components/entity-form/property-field/property-field.events';
import { SelectChangedEvent } from '@ss/ui/components/ss-select.events';

import '@ss/ui/components/ss-select';
import '@ss/ui/components/ss-button';
import '@/components/entity-form/boolean-field/boolean-field';
import '@/components/entity-form/date-field/date-field';
import '@/components/entity-form/image-field/image-field';
import '@/components/entity-form/int-field/int-field';
import '@/components/entity-form/long-text-field/long-text-field';
import '@/components/entity-form/short-text-field/short-text-field';
import { themed } from '@/lib/Theme';

@themed()
@customElement('filter-property')
export class FilterPropertyElement extends MobxLitElement {
  static styles = css`
    .filter-property {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .selector-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    ss-select {
      flex-grow: 1;
    }
  `;

  private state = appState;

  @property({ type: Number })
  [FilterPropertyProp.PROPERTY_CONFIG_ID]: FilterPropertyProps[FilterPropertyProp.PROPERTY_CONFIG_ID] =
    filterPropertyProps[FilterPropertyProp.PROPERTY_CONFIG_ID].default;

  @property({ attribute: false })
  [FilterPropertyProp.VALUE]: FilterPropertyProps[FilterPropertyProp.VALUE] =
    filterPropertyProps[FilterPropertyProp.VALUE].default;

  @property({ type: Number })
  [FilterPropertyProp.INDEX]: FilterPropertyProps[FilterPropertyProp.INDEX] =
    filterPropertyProps[FilterPropertyProp.INDEX].default;

  @property({ type: Array })
  [FilterPropertyProp.INCLUDE_TYPES]: FilterPropertyProps[FilterPropertyProp.INCLUDE_TYPES] =
    filterPropertyProps[FilterPropertyProp.INCLUDE_TYPES].default;

  @property({ type: String })
  [FilterPropertyProp.OPERATION]: FilterPropertyProps[FilterPropertyProp.OPERATION] =
    filterPropertyProps[FilterPropertyProp.OPERATION].default;

  @state()
  get uiId(): string {
    return `filter-property-${this.index}`;
  }

  @state()
  get propertyOptions(): { label: string; value: string }[] {
    const options: { label: string; value: string }[] = [];
    for (const entityConfig of this.state.entityConfigs) {
      const entityConfigIsIncluded =
        this.state.listFilter.includeAll ||
        this.includeTypes.length === 0 ||
        this.includeTypes.some(t => t === entityConfig.id);

      if (!entityConfigIsIncluded) {
        continue;
      }

      for (const prop of entityConfig.properties) {
        options.push({
          label: `${entityConfig.name} - ${prop.name}`,
          value: String(prop.id),
        });
      }
    }
    return options;
  }

  @state()
  get selectedPropertyConfig(): EntityPropertyConfig | null {
    if (!this.propertyConfigId) {
      return null;
    }
    for (const entityConfig of this.state.entityConfigs) {
      const found = entityConfig.properties.find(
        p => p.id === this.propertyConfigId,
      );
      if (found) {
        return found;
      }
    }
    return null;
  }

  @state()
  get operationOptions(): { label: string; value: string }[] {
    return Object.values(TextType).map(value => ({
      label: translate(`textType.${value}`),
      value,
    }));
  }

  @state()
  get entityConfigId(): number {
    if (!this.propertyConfigId) {
      return 0;
    }
    for (const entityConfig of this.state.entityConfigs) {
      if (entityConfig.properties.some(p => p.id === this.propertyConfigId)) {
        return entityConfig.id;
      }
    }
    return 0;
  }

  private getDefaultValueForDataType(dataType: DataType): PropertyDataValue {
    switch (dataType) {
      case DataType.BOOLEAN:
        return false;
      case DataType.DATE:
        return '';
      case DataType.INT:
        return 0;
      case DataType.IMAGE:
        return { src: '', alt: '' };
      case DataType.SHORT_TEXT:
      case DataType.LONG_TEXT:
        return '';
    }
  }

  private handlePropertyTypeChanged(e: SelectChangedEvent<string>): void {
    const propertyConfigId = Number(e.detail.value);
    let defaultValue: PropertyDataValue = '';

    for (const entityConfig of this.state.entityConfigs) {
      const prop = entityConfig.properties.find(p => p.id === propertyConfigId);
      if (prop) {
        defaultValue = this.getDefaultValueForDataType(prop.dataType);
        break;
      }
    }

    const filter: FilterProperty = {
      propertyId: propertyConfigId,
      value: defaultValue,
      operation: this.operation,
    };

    this.dispatchEvent(
      new FilterPropertyUpdatedEvent({ index: this.index, filter }),
    );
  }

  private handleValueChanged(e: PropertyChangedEvent): void {
    const filter: FilterProperty = {
      propertyId: this.propertyConfigId,
      value: e.detail.value,
      operation: this.operation,
    };

    this.dispatchEvent(
      new FilterPropertyUpdatedEvent({ index: this.index, filter }),
    );
  }

  private handleOperationChanged(e: SelectChangedEvent<string>): void {
    const filter: FilterProperty = {
      propertyId: this.propertyConfigId,
      value: this.value ?? '',
      operation: e.detail.value as TextType,
    };

    this.dispatchEvent(
      new FilterPropertyUpdatedEvent({ index: this.index, filter }),
    );
  }

  private handleRemove(): void {
    this.dispatchEvent(new FilterPropertyRemovedEvent({ index: this.index }));
  }

  private renderField(): TemplateResult | typeof nothing {
    const config = this.selectedPropertyConfig;
    if (!config) {
      return nothing;
    }

    switch (config.dataType) {
      case DataType.BOOLEAN:
        return html`<boolean-field
          uiId=${this.uiId}
          ?value=${(this.value as BooleanDataValue) ?? false}
          entityConfigId=${this.entityConfigId}
          propertyConfigId=${config.id}
          @property-changed=${this.handleValueChanged}
        ></boolean-field>`;

      case DataType.DATE:
        return html`<date-field
          uiId=${this.uiId}
          .value=${(this.value as DateDataValue) || ''}
          entityConfigId=${this.entityConfigId}
          propertyConfigId=${config.id}
          @property-changed=${this.handleValueChanged}
        ></date-field>`;

      case DataType.INT:
        return html`<int-field
          uiId=${this.uiId}
          value=${(this.value as IntDataValue) ?? 0}
          entityConfigId=${this.entityConfigId}
          propertyConfigId=${config.id}
          @property-changed=${this.handleValueChanged}
        ></int-field>`;

      case DataType.SHORT_TEXT:
        return html`<short-text-field
          uiId=${this.uiId}
          value=${(this.value as string) || ''}
          entityConfigId=${this.entityConfigId}
          propertyConfigId=${config.id}
          @property-changed=${this.handleValueChanged}
        ></short-text-field>`;

      case DataType.LONG_TEXT:
        return html`<long-text-field
          uiId=${this.uiId}
          value=${(this.value as string) || ''}
          entityConfigId=${this.entityConfigId}
          propertyConfigId=${config.id}
          @property-changed=${this.handleValueChanged}
        ></long-text-field>`;

      case DataType.IMAGE:
        return html`<image-field
          uiId=${this.uiId}
          src=${((this.value as ImageDataValue) || {}).src || ''}
          alt=${((this.value as ImageDataValue) || {}).alt || ''}
          entityConfigId=${this.entityConfigId}
          propertyConfigId=${config.id}
          @property-changed=${this.handleValueChanged}
        ></image-field>`;
    }

    return nothing;
  }

  render(): TemplateResult {
    return html`
      <div class="filter-property">
        <div class="selector-row">
          <ss-select
            selected=${this.propertyConfigId
              ? String(this.propertyConfigId)
              : ''}
            .options=${[
              { label: translate('selectProperty'), value: '' },
              ...this.propertyOptions,
            ]}
            @select-changed=${(e: SelectChangedEvent<string>): void => {
              this.handlePropertyTypeChanged(e);
            }}
          ></ss-select>

          <ss-select
            selected=${this.operation}
            .options=${this.operationOptions}
            @select-changed=${(e: SelectChangedEvent<string>): void => {
              this.handleOperationChanged(e);
            }}
          ></ss-select>

          <ss-button text="-" @click=${this.handleRemove}></ss-button>
        </div>

        ${this.selectedPropertyConfig ? this.renderField() : nothing}
      </div>
    `;
  }
}
