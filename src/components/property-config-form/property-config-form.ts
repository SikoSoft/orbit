import {
  LitElement,
  html,
  css,
  PropertyValues,
  TemplateResult,
  nothing,
} from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { customElement, property, state } from 'lit/decorators.js';
import {
  BooleanDataValue,
  DataType,
  DataTypedValue,
  DateDataValue,
  defaultEntityPropertyConfig,
  EntityPropertyCalculation,
  EntityPropertyCalculationOperation,
  EntityPropertyCalculationReference,
  EntityPropertyConfig,
  ImageDataValue,
  IntDataValue,
  LongTextDataValue,
  PropertyDataValue,
  ShortTextDataValue,
} from 'api-spec/models/Entity';

import { ControlType, SelectControl } from '@/models/Control';
import { storage } from '@/lib/Storage';
import { addToast } from '@/lib/Util';
import { translate } from '@/lib/Localization';
import {
  PropertyConfigFormProp,
  propertyConfigFormProps,
  propertyConfigFormRequiredProps,
  PropertyConfigFormProps,
} from './property-config-form.models';
import {
  OperandType,
  isPickableProperty,
  buildCalculatedConfig,
  defaultCalculation,
} from '@/components/calculated-property-config-form/calculated-property-config-form.models';

import { InputChangedEvent } from '@ss/ui/components/ss-input.events';
import {
  PropertyConfigAddedEvent,
  PropertyConfigBreakingChangeDetectedEvent,
  PropertyConfigBreakingChangesResolvedEvent,
  PropertyConfigDeletedEvent,
  PropertyConfigUpdatedEvent,
} from './property-config-form.events';

import '@ss/ui/components/ss-input';
import '@ss/ui/components/ss-select';
import '@ss/ui/components/confirmation-modal';
import '@ss/ui/components/ss-toggle';
import '@/components/entity-form/date-field/date-field';
import '@/components/entity-form/image-field/image-field';
import { ToggleChangedEvent } from '@ss/ui/components/ss-toggle.events';
import { PropertyChangedEvent } from '../entity-form/property-field/property-field.events';
import { repeat } from 'lit/directives/repeat.js';
import { Revision } from 'api-spec/lib/Revision';
import { NotificationType } from '@ss/ui/components/notification-provider.models';

@customElement('property-config-form')
export class PropertyConfigForm extends LitElement {
  @state() propertyConfig: EntityPropertyConfig = defaultEntityPropertyConfig;

  static styles = css`
    :host {
      display: block;
    }

    fieldset {
      border-color: var(--border-color);
      border-radius: 0.5rem;
    }

    .field {
      label {
        display: block;
        font-weight: bold;
        margin-bottom: 0.25rem;
      }

      &.invalid label {
        color: var(--color-negative, #c0392b);
      }

      &.invalid ss-input,
      &.invalid ss-select {
        --input-border-color: var(--color-negative, #c0392b);
      }
    }

    .buttons {
      padding: 0.5rem 0;

      ss-button {
        display: block;
        margin-bottom: 0.5rem;
      }
    }

    .operand-row {
      display: flex;
      gap: 0.5rem;
      align-items: flex-start;

      ss-select,
      ss-input {
        flex: 1;
      }
    }

    .formula-preview {
      font-family: monospace;
      background: var(--surface-color, #f5f5f5);
      padding: 0.5rem;
      border-radius: 0.25rem;
      margin-bottom: 0.75rem;
      font-size: 0.9rem;
      color: var(--text-color-secondary, #555);
    }
  `;

  @property({ type: Boolean, reflect: true })
  [PropertyConfigFormProp.OPEN]: PropertyConfigFormProps[PropertyConfigFormProp.OPEN] =
    propertyConfigFormProps[PropertyConfigFormProp.OPEN].default;

  @property({ type: String })
  [PropertyConfigFormProp.UI_ID]: PropertyConfigFormProps[PropertyConfigFormProp.UI_ID] =
    propertyConfigFormProps[PropertyConfigFormProp.UI_ID].default;

  @property({ type: String })
  [PropertyConfigFormProp.DATA_TYPE]: PropertyConfigFormProps[PropertyConfigFormProp.DATA_TYPE] =
    propertyConfigFormProps[PropertyConfigFormProp.DATA_TYPE].default;

  @property({ type: Number })
  [PropertyConfigFormProp.ENTITY_CONFIG_ID]: PropertyConfigFormProps[PropertyConfigFormProp.ENTITY_CONFIG_ID] =
    propertyConfigFormProps[PropertyConfigFormProp.ENTITY_CONFIG_ID].default;

  @property({ type: Number })
  [PropertyConfigFormProp.PROPERTY_CONFIG_ID]: PropertyConfigFormProps[PropertyConfigFormProp.PROPERTY_CONFIG_ID] =
    propertyConfigFormProps[PropertyConfigFormProp.PROPERTY_CONFIG_ID].default;

  @property({ type: String })
  [PropertyConfigFormProp.NAME]: PropertyConfigFormProps[PropertyConfigFormProp.NAME] =
    propertyConfigFormProps[PropertyConfigFormProp.NAME].default;

  @property({ type: Number })
  [PropertyConfigFormProp.REQUIRED]: PropertyConfigFormProps[PropertyConfigFormProp.REQUIRED] =
    propertyConfigFormProps[PropertyConfigFormProp.REQUIRED].default;

  @property({ type: Number })
  [PropertyConfigFormProp.REPEAT]: PropertyConfigFormProps[PropertyConfigFormProp.REPEAT] =
    propertyConfigFormProps[PropertyConfigFormProp.REPEAT].default;

  @property({ type: Number })
  [PropertyConfigFormProp.ALLOWED]: PropertyConfigFormProps[PropertyConfigFormProp.ALLOWED] =
    propertyConfigFormProps[PropertyConfigFormProp.ALLOWED].default;

  @property({ type: String })
  [PropertyConfigFormProp.PREFIX]: PropertyConfigFormProps[PropertyConfigFormProp.PREFIX] =
    propertyConfigFormProps[PropertyConfigFormProp.PREFIX].default;

  @property({ type: String })
  [PropertyConfigFormProp.SUFFIX]: PropertyConfigFormProps[PropertyConfigFormProp.SUFFIX] =
    propertyConfigFormProps[PropertyConfigFormProp.SUFFIX].default;

  @property({ type: Boolean })
  [PropertyConfigFormProp.HIDDEN]: PropertyConfigFormProps[PropertyConfigFormProp.HIDDEN] =
    propertyConfigFormProps[PropertyConfigFormProp.HIDDEN].default;

  @property()
  [PropertyConfigFormProp.DEFAULT_VALUE]: PropertyConfigFormProps[PropertyConfigFormProp.DEFAULT_VALUE] =
    propertyConfigFormProps[PropertyConfigFormProp.DEFAULT_VALUE].default;

  @property({ type: Boolean })
  [PropertyConfigFormProp.OPTIONS_ONLY]: PropertyConfigFormProps[PropertyConfigFormProp.OPTIONS_ONLY] =
    propertyConfigFormProps[PropertyConfigFormProp.OPTIONS_ONLY].default;

  @property({ type: Array })
  [PropertyConfigFormProp.OPTIONS]: PropertyConfigFormProps[PropertyConfigFormProp.OPTIONS] =
    propertyConfigFormProps[PropertyConfigFormProp.OPTIONS].default;

  @property({ type: Boolean })
  [PropertyConfigFormProp.PERFORM_DRIFT_CHECK]: PropertyConfigFormProps[PropertyConfigFormProp.PERFORM_DRIFT_CHECK] =
    propertyConfigFormProps[PropertyConfigFormProp.PERFORM_DRIFT_CHECK].default;

  @property({ type: Object })
  [PropertyConfigFormProp.CALCULATION]: PropertyConfigFormProps[PropertyConfigFormProp.CALCULATION] =
    propertyConfigFormProps[PropertyConfigFormProp.CALCULATION].default;

  @property({ type: Array })
  [PropertyConfigFormProp.ALL_PROPERTIES]: PropertyConfigFormProps[PropertyConfigFormProp.ALL_PROPERTIES] =
    propertyConfigFormProps[PropertyConfigFormProp.ALL_PROPERTIES].default;

  @state() confirmationModalIsOpen = false;
  @state() private invalidFields: PropertyConfigFormProp[] = [];
  @state() isCalculated = false;
  @state() operation: EntityPropertyCalculationOperation = '+';
  @state() value1Type: OperandType = 'number';
  @state() value1PropertyConfigId = 0;
  @state() value1Number = 0;
  @state() value2Type: OperandType = 'number';
  @state() value2PropertyConfigId = 0;
  @state() value2Number = 0;

  connectedCallback(): void {
    super.connectedCallback();

    this.propertyConfig = { ...this.updatedPropertyConfig };

    const calc = this[PropertyConfigFormProp.CALCULATION];
    if (calc) {
      this.isCalculated = true;
      this.operation = calc.operation;

      if (typeof calc.value1 === 'number') {
        this.value1Type = 'number';
        this.value1Number = calc.value1;
      } else {
        this.value1Type = 'property';
        this.value1PropertyConfigId = (
          calc.value1 as EntityPropertyCalculationReference
        ).propertyConfigId;
      }

      if (typeof calc.value2 === 'number') {
        this.value2Type = 'number';
        this.value2Number = calc.value2;
      } else {
        this.value2Type = 'property';
        this.value2PropertyConfigId = (
          calc.value2 as EntityPropertyCalculationReference
        ).propertyConfigId;
      }
    }
  }

  protected willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('propertyConfig')) {
      const changedPropertyConfig = changedProperties.get(
        'propertyConfig',
      ) as EntityPropertyConfig | null;

      if (changedPropertyConfig) {
        if (this.dataType !== changedPropertyConfig.dataType) {
          //this.handleDataTypeChange();
        }
      }
    }

    if (changedProperties.has('value1Type') && this.value1Type === 'property' && !this.value1PropertyConfigId) {
      this.value1PropertyConfigId = this.pickableProperties[0]?.id ?? 0;
    }
    if (changedProperties.has('value2Type') && this.value2Type === 'property' && !this.value2PropertyConfigId) {
      this.value2PropertyConfigId = this.pickableProperties[0]?.id ?? 0;
    }
  }

  get visibleFields(): PropertyConfigFormProp[] {
    return Object.values(PropertyConfigFormProp).filter(field => {
      const control = propertyConfigFormProps[field].control;
      return control.type !== ControlType.HIDDEN;
    }) as PropertyConfigFormProp[];
  }

  get collapsableTitle(): string {
    const name = this.propertyConfig.name || translate('propertyConfiguration');
    if (this.isCalculated) {
      return `${name} (${translate('calculatedPropertyConfig.calculated')})`;
    }
    return name;
  }

  get pickableProperties(): EntityPropertyConfig[] {
    return this[PropertyConfigFormProp.ALL_PROPERTIES].filter(p => {
      if (!isPickableProperty(p)) {
        return false;
      }
      return p.id !== this[PropertyConfigFormProp.PROPERTY_CONFIG_ID];
    });
  }

  get formulaDisplay(): string {
    const fmtOperand = (
      type: OperandType,
      propId: number,
      num: number,
    ): string => {
      if (type === 'number') {
        return String(num);
      }
      const prop = this[PropertyConfigFormProp.ALL_PROPERTIES].find(
        p => p.id === propId,
      );
      return prop ? `[${prop.name}]` : `[#${propId}]`;
    };

    const v1 = fmtOperand(
      this.value1Type,
      this.value1PropertyConfigId,
      this.value1Number,
    );
    const v2 = fmtOperand(
      this.value2Type,
      this.value2PropertyConfigId,
      this.value2Number,
    );
    return `${v1} ${this.operation} ${v2}`;
  }

  handleDataTypeChange(dataType: DataType = this.dataType as DataType): void {
    let typedValue: DataTypedValue;

    switch (dataType) {
      case DataType.BOOLEAN:
        typedValue = { dataType, defaultValue: false };
        break;
      case DataType.DATE:
        typedValue = { dataType, defaultValue: new Date() };
        break;
      case DataType.IMAGE:
        typedValue = { dataType, defaultValue: { src: '', alt: '' } };
        break;
      case DataType.INT:
        typedValue = { dataType, defaultValue: 0 };
        break;
      case DataType.SHORT_TEXT:
      case DataType.LONG_TEXT:
        typedValue = { dataType, defaultValue: '' };
        break;
    }

    this.propertyConfig = { ...this.propertyConfig, ...typedValue };
  }

  updateField(
    field: PropertyConfigFormProp,
    rawValue: PropertyDataValue,
  ): void {
    let value = rawValue;
    if (propertyConfigFormProps[field].control.type === ControlType.NUMBER) {
      value = Number(value) || 0;
    }

    this.propertyConfig = { ...this.propertyConfig, [field]: value };
    this.invalidFields = this.invalidFields.filter(f => f !== field);
  }

  @state()
  get updatedPropertyConfig(): EntityPropertyConfig {
    const commonEntityPropertyConfig: EntityPropertyConfig = {
      id: this[PropertyConfigFormProp.PROPERTY_CONFIG_ID],
      entityConfigId: this[PropertyConfigFormProp.ENTITY_CONFIG_ID],
      hidden: this[PropertyConfigFormProp.HIDDEN],
      name: this[PropertyConfigFormProp.NAME] as EntityPropertyConfig['name'],
      required: this[
        PropertyConfigFormProp.REQUIRED
      ] as EntityPropertyConfig['required'],
      repeat: this[
        PropertyConfigFormProp.REPEAT
      ] as EntityPropertyConfig['repeat'],
      allowed: this[
        PropertyConfigFormProp.ALLOWED
      ] as EntityPropertyConfig['allowed'],
      prefix: this[
        PropertyConfigFormProp.PREFIX
      ] as EntityPropertyConfig['prefix'],
      suffix: this[
        PropertyConfigFormProp.SUFFIX
      ] as EntityPropertyConfig['suffix'],
      dataType: DataType.BOOLEAN,
      defaultValue: false,
      optionsOnly: this[PropertyConfigFormProp.OPTIONS_ONLY],
      options: this[PropertyConfigFormProp.OPTIONS],
      userId: '' as EntityPropertyConfig['userId'],
    };

    switch (this[PropertyConfigFormProp.DATA_TYPE]) {
      case DataType.BOOLEAN:
        return {
          ...commonEntityPropertyConfig,
          dataType: DataType.BOOLEAN,
          defaultValue: Boolean(
            this[PropertyConfigFormProp.DEFAULT_VALUE],
          ) as BooleanDataValue,
        };
      case DataType.DATE:
        return {
          ...commonEntityPropertyConfig,
          dataType: DataType.DATE,
          defaultValue: this[
            PropertyConfigFormProp.DEFAULT_VALUE
          ] as DateDataValue,
        };
      case DataType.IMAGE:
        return {
          ...commonEntityPropertyConfig,
          dataType: DataType.IMAGE,
          defaultValue: this[
            PropertyConfigFormProp.DEFAULT_VALUE
          ] as ImageDataValue,
        };
      case DataType.INT:
        return {
          ...commonEntityPropertyConfig,
          dataType: DataType.INT,
          defaultValue:
            Number(this[PropertyConfigFormProp.DEFAULT_VALUE]) ||
            (0 as IntDataValue),
        };
      case DataType.SHORT_TEXT:
        return {
          ...commonEntityPropertyConfig,
          dataType: DataType.SHORT_TEXT,
          defaultValue: this[
            PropertyConfigFormProp.DEFAULT_VALUE
          ] as ShortTextDataValue,
        };
      case DataType.LONG_TEXT:
        return {
          ...commonEntityPropertyConfig,
          dataType: DataType.LONG_TEXT,
          defaultValue: this[
            PropertyConfigFormProp.DEFAULT_VALUE
          ] as LongTextDataValue,
        };
    }

    return commonEntityPropertyConfig;
  }

  validateRequiredFields(): boolean {
    const missing = propertyConfigFormRequiredProps.filter(field => {
      if (!this.visibleFields.includes(field)) {
        return false;
      }
      const value = this.propertyConfig[field as keyof EntityPropertyConfig];
      return String(value ?? '').trim() === '';
    });

    this.invalidFields = missing;

    for (const field of missing) {
      addToast(
        translate('propertyConfig.requiredFieldMissing', {
          field: translate(`propertyConfig.field.${field}`),
        }),
        NotificationType.ERROR,
      );
    }

    return missing.length === 0;
  }

  validateRevisionDrift(): boolean {
    if (!this.performDriftCheck) {
      return true;
    }

    const revisionResult = Revision.propertyIsSafe(
      this.updatedPropertyConfig,
      this.propertyConfig,
    );
    if (!revisionResult.isValid) {
      this.dispatchEvent(
        new PropertyConfigBreakingChangeDetectedEvent({
          uiId: this[PropertyConfigFormProp.UI_ID],
          propertyConfig: this.updatedPropertyConfig,
          problems: revisionResult.problems,
        }),
      );

      return false;
    }

    this.dispatchEvent(
      new PropertyConfigBreakingChangesResolvedEvent({
        uiId: this[PropertyConfigFormProp.UI_ID],
        propertyConfig: this.updatedPropertyConfig,
      }),
    );

    return true;
  }

  validate(): boolean {
    if (!this.validateRequiredFields()) {
      return false;
    }

    if (!this.validateRevisionDrift()) {
      return false;
    }

    return true;
  }

  validateCalculated(): boolean {
    if (!this.propertyConfig.name.trim()) {
      addToast(
        translate('calculatedPropertyConfig.requiredFieldMissing', {
          field: translate('calculatedPropertyConfig.field.name'),
        }),
        NotificationType.ERROR,
      );
      return false;
    }
    return true;
  }

  buildCalculation(): EntityPropertyCalculation {
    const value1: EntityPropertyCalculationReference | number =
      this.value1Type === 'number'
        ? this.value1Number
        : { propertyConfigId: this.value1PropertyConfigId };
    const value2: EntityPropertyCalculationReference | number =
      this.value2Type === 'number'
        ? this.value2Number
        : { propertyConfigId: this.value2PropertyConfigId };
    return { value1, value2, operation: this.operation };
  }

  async saveCalculated(): Promise<void> {
    if (!this.validateCalculated()) {
      return;
    }

    const config = buildCalculatedConfig(
      this[PropertyConfigFormProp.ENTITY_CONFIG_ID],
      this[PropertyConfigFormProp.PROPERTY_CONFIG_ID],
      this.propertyConfig.name,
      this.propertyConfig.prefix,
      this.propertyConfig.suffix,
      this.propertyConfig.hidden,
      this.buildCalculation(),
    );

    if (this[PropertyConfigFormProp.PROPERTY_CONFIG_ID]) {
      const result = await storage.updateCalculatedPropertyConfig(config);
      if (result) {
        addToast(translate('calculatedPropertyConfig.updatedSuccessfully'));
        this.dispatchEvent(new PropertyConfigUpdatedEvent(result));
      }
      return;
    }

    const result = await storage.addCalculatedPropertyConfig(config);
    if (result) {
      addToast(translate('calculatedPropertyConfig.addedSuccessfully'));
      this.dispatchEvent(new PropertyConfigAddedEvent(result));
    }
  }

  async save(): Promise<void> {
    if (this.isCalculated) {
      await this.saveCalculated();
      return;
    }

    if (this[PropertyConfigFormProp.PROPERTY_CONFIG_ID]) {
      const isValid = this.validate();
      if (!isValid) {
        return;
      }

      const propertyConfig = await storage.updatePropertyConfig(
        this.propertyConfig,
        this.performDriftCheck,
      );

      if (propertyConfig) {
        addToast(translate('propertyConfig.updatedSuccessfully'));
        this.dispatchEvent(new PropertyConfigUpdatedEvent(propertyConfig));
      }
      return;
    }

    const propertyConfig = await storage.addPropertyConfig(this.propertyConfig);
    if (propertyConfig) {
      addToast(translate('propertyConfig.addedSuccessfully'));
      this.dispatchEvent(new PropertyConfigAddedEvent(propertyConfig));
    }
  }

  async delete(): Promise<void> {
    this.confirmationModalIsOpen = false;

    const deleteResult = await storage.deletePropertyConfig(
      this[PropertyConfigFormProp.ENTITY_CONFIG_ID],
      this[PropertyConfigFormProp.PROPERTY_CONFIG_ID],
    );

    if (deleteResult) {
      addToast(
        this.isCalculated
          ? translate('calculatedPropertyConfig.deletedSuccessfully')
          : translate('propertyConfig.deletedSuccessfully'),
      );
      this.dispatchEvent(
        new PropertyConfigDeletedEvent(
          this[PropertyConfigFormProp.PROPERTY_CONFIG_ID],
        ),
      );
    }
  }

  get inSync(): boolean {
    if (this.isCalculated) {
      return false;
    }

    if (!this[PropertyConfigFormProp.PROPERTY_CONFIG_ID]) {
      return false;
    }

    const updatedJson = JSON.stringify(this.updatedPropertyConfig);
    const currentJson = JSON.stringify(this.propertyConfig);

    return updatedJson === currentJson;
  }

  handleTagsUpdated(e: CustomEvent): void {
    this.updateField(PropertyConfigFormProp.OPTIONS, e.detail.tags);
  }

  handleTagSuggestionsRequested(e: CustomEvent): void {
    return;
    // For demo purposes, we'll just return some static suggestions.
    // In a real application, you might fetch suggestions from an API based on the current input.
    const suggestions = ['Option 1', 'Option 2', 'Option 3'].filter(option =>
      option.toLowerCase().includes(e.detail.query.toLowerCase()),
    );

    this.dispatchEvent(
      new CustomEvent('tag-suggestions-response', {
        detail: { suggestions },
        bubbles: true,
        composed: true,
      }),
    );
  }

  renderDefaultValueField(): TemplateResult {
    switch (this.propertyConfig[PropertyConfigFormProp.DATA_TYPE]) {
      case DataType.DATE:
        return html` <date-field
          .value=${this.propertyConfig[PropertyConfigFormProp.DEFAULT_VALUE]}
          @property-changed=${(e: PropertyChangedEvent): void => {
            this.updateField(
              PropertyConfigFormProp.DEFAULT_VALUE,
              e.detail.value,
            );
          }}
        ></date-field>`;
      case DataType.BOOLEAN:
        return html` <ss-toggle
          ?on=${this.propertyConfig[PropertyConfigFormProp.DEFAULT_VALUE]}
          @toggle-changed=${(e: ToggleChangedEvent): void => {
            this.updateField(PropertyConfigFormProp.DEFAULT_VALUE, e.detail.on);
          }}
        ></ss-toggle>`;

      case DataType.IMAGE:
        return html` <image-field
          src=${this.propertyConfig[PropertyConfigFormProp.DEFAULT_VALUE].src}
          alt=${this.propertyConfig[PropertyConfigFormProp.DEFAULT_VALUE].alt}
          @property-changed=${(e: PropertyChangedEvent): void => {
            this.updateField(
              PropertyConfigFormProp.DEFAULT_VALUE,
              e.detail.value,
            );
          }}
        ></image-field>`;

      case DataType.INT:
        return html`
          <ss-input
            type="number"
            value=${this.propertyConfig[PropertyConfigFormProp.DEFAULT_VALUE]}
            @input-changed=${(e: InputChangedEvent): void => {
              this.updateField(
                PropertyConfigFormProp.DEFAULT_VALUE,
                parseInt(e.detail.value),
              );
            }}
          ></ss-input>
        `;

      default:
        return html`
          <ss-input
            type="text"
            value=${this.propertyConfig[PropertyConfigFormProp.DEFAULT_VALUE]}
            @input-changed=${(e: InputChangedEvent): void => {
              this.updateField(
                PropertyConfigFormProp.DEFAULT_VALUE,
                e.detail.value,
              );
            }}
          ></ss-input>
        `;
    }
  }

  get optionsFieldsVisible(): boolean {
    const dataType = this.propertyConfig[PropertyConfigFormProp.DATA_TYPE];
    return dataType === DataType.SHORT_TEXT || dataType === DataType.INT;
  }

  isFieldVisible(field: PropertyConfigFormProp): boolean {
    if (
      field === PropertyConfigFormProp.OPTIONS ||
      field === PropertyConfigFormProp.OPTIONS_ONLY
    ) {
      return this.optionsFieldsVisible;
    }
    return true;
  }

  renderOptionsField(): TemplateResult | typeof nothing {
    if (!this.optionsFieldsVisible) {
      return nothing;
    }

    return html`<tag-manager @tags-updated=${this.handleTagsUpdated}>
      <div slot="tags">
        ${repeat(
          this.options,
          option => option,
          option => html`<data-item>${option}</data-item>`,
        )}
      </div>
    </tag-manager>`;
  }

  renderField(field: PropertyConfigFormProp): TemplateResult | typeof nothing {
    if (field === PropertyConfigFormProp.DEFAULT_VALUE) {
      return this.renderDefaultValueField();
    }

    if (field === PropertyConfigFormProp.OPTIONS) {
      return this.renderOptionsField();
    }

    switch (propertyConfigFormProps[field].control.type) {
      case ControlType.SELECT:
        return html`
          <ss-select
            .options=${(
              propertyConfigFormProps[field].control as SelectControl
            ).options.map(option => ({
              label: translate(option),
              value: option,
            }))}
            selected=${this[field]}
            @select-changed=${(e: InputChangedEvent): void => {
              if (field === PropertyConfigFormProp.DATA_TYPE) {
                this.handleDataTypeChange(e.detail.value as DataType);
              } else {
                this.updateField(field, e.detail.value);
              }
            }}
          ></ss-select>
        `;
      case ControlType.BOOLEAN:
        return html`
          <ss-toggle
            ?on=${this[field]}
            @toggle-changed=${(e: ToggleChangedEvent): void => {
              this.updateField(field, e.detail.on);
            }}
          ></ss-toggle>
        `;
      case ControlType.NUMBER:
      case ControlType.TEXT:
        return html`
          <ss-input
            type=${propertyConfigFormProps[field].control.type}
            value=${this[field]}
            @input-changed=${(e: InputChangedEvent): void => {
              this.updateField(field, e.detail.value);
            }}
          ></ss-input>
        `;
    }

    return nothing;
  }

  renderOperandPicker(
    type: OperandType,
    propConfigId: number,
    num: number,
    onTypeChange: (t: OperandType) => void,
    onPropChange: (id: number) => void,
    onNumChange: (n: number) => void,
  ): TemplateResult {
    const pickable = this.pickableProperties;

    return html`
      <div class="operand-row">
        <ss-select
          .options=${[
            {
              label: translate('calculatedPropertyConfig.operandType.property'),
              value: 'property',
            },
            {
              label: translate('calculatedPropertyConfig.operandType.number'),
              value: 'number',
            },
          ]}
          selected=${type}
          @select-changed=${(e: InputChangedEvent): void => {
            onTypeChange(e.detail.value as OperandType);
          }}
        ></ss-select>

        ${type === 'property'
          ? pickable.length > 0
            ? html`
                <ss-select
                  .options=${pickable.map(p => ({
                    label: p.name,
                    value: String(p.id),
                  }))}
                  selected=${String(propConfigId)}
                  @select-changed=${(e: InputChangedEvent): void => {
                    onPropChange(Number(e.detail.value));
                  }}
                ></ss-select>
              `
            : html`<span
                >${translate(
                  'calculatedPropertyConfig.noPickableProperties',
                )}</span
              >`
          : html`
              <ss-input
                type="number"
                value=${num}
                @input-changed=${(e: InputChangedEvent): void => {
                  onNumChange(Number(e.detail.value));
                }}
              ></ss-input>
            `}
      </div>
    `;
  }

  renderCalculatedFields(): TemplateResult {
    return html`
      <div class="formula-preview">${this.formulaDisplay}</div>

      <div class="field">
        <label>${translate('calculatedPropertyConfig.field.name')}</label>
        <ss-input
          type="text"
          value=${this.propertyConfig.name}
          @input-changed=${(e: InputChangedEvent): void => {
            this.updateField(PropertyConfigFormProp.NAME, e.detail.value);
          }}
        ></ss-input>
      </div>

      <div class="field">
        <label>${translate('calculatedPropertyConfig.field.prefix')}</label>
        <ss-input
          type="text"
          value=${this.propertyConfig.prefix}
          @input-changed=${(e: InputChangedEvent): void => {
            this.updateField(PropertyConfigFormProp.PREFIX, e.detail.value);
          }}
        ></ss-input>
      </div>

      <div class="field">
        <label>${translate('calculatedPropertyConfig.field.suffix')}</label>
        <ss-input
          type="text"
          value=${this.propertyConfig.suffix}
          @input-changed=${(e: InputChangedEvent): void => {
            this.updateField(PropertyConfigFormProp.SUFFIX, e.detail.value);
          }}
        ></ss-input>
      </div>

      <div class="field">
        <label>${translate('calculatedPropertyConfig.field.hidden')}</label>
        <ss-toggle
          ?on=${this.propertyConfig.hidden}
          @toggle-changed=${(e: ToggleChangedEvent): void => {
            this.updateField(PropertyConfigFormProp.HIDDEN, e.detail.on);
          }}
        ></ss-toggle>
      </div>

      <div class="field">
        <label>${translate('calculatedPropertyConfig.field.value1')}</label>
        ${this.renderOperandPicker(
          this.value1Type,
          this.value1PropertyConfigId,
          this.value1Number,
          (t): void => {
            this.value1Type = t;
          },
          (id): void => {
            this.value1PropertyConfigId = id;
          },
          (n): void => {
            this.value1Number = n;
          },
        )}
      </div>

      <div class="field">
        <label>${translate('calculatedPropertyConfig.field.operation')}</label>
        <ss-select
          .options=${[
            { label: '+', value: '+' },
            { label: '-', value: '-' },
            { label: '*', value: '*' },
            { label: '/', value: '/' },
          ]}
          selected=${this.operation}
          @select-changed=${(e: InputChangedEvent): void => {
            this.operation =
              e.detail.value as EntityPropertyCalculationOperation;
          }}
        ></ss-select>
      </div>

      <div class="field">
        <label>${translate('calculatedPropertyConfig.field.value2')}</label>
        ${this.renderOperandPicker(
          this.value2Type,
          this.value2PropertyConfigId,
          this.value2Number,
          (t): void => {
            this.value2Type = t;
          },
          (id): void => {
            this.value2PropertyConfigId = id;
          },
          (n): void => {
            this.value2Number = n;
          },
        )}
      </div>
    `;
  }

  render(): TemplateResult {
    return html`
      <ss-collapsable
        title=${this.collapsableTitle}
        panelId=${`propertyConfigForm-${this.propertyConfig.id}`}
        .open=${this.open}
      >
        <fieldset class="entity-config-form">
          <legend>${translate('propertyConfiguration')}</legend>

          <div class="field">
            <label>${translate('propertyType')}</label>
            <ss-select
              .options=${[
                {
                  label: translate('propertyType.standard'),
                  value: 'standard',
                },
                {
                  label: translate('propertyType.calculated'),
                  value: 'calculated',
                },
              ]}
              selected=${this.isCalculated ? 'calculated' : 'standard'}
              ?disabled=${!!this[PropertyConfigFormProp.PROPERTY_CONFIG_ID]}
              @select-changed=${(e: InputChangedEvent): void => {
                this.isCalculated = e.detail.value === 'calculated';
                if (this.isCalculated) {
                  const calc = this[PropertyConfigFormProp.CALCULATION];
                  if (!calc) {
                    const def = defaultCalculation;
                    this.operation = def.operation;
                    this.value1Type = 'number';
                    this.value1Number =
                      typeof def.value1 === 'number' ? def.value1 : 0;
                    this.value2Type = 'number';
                    this.value2Number =
                      typeof def.value2 === 'number' ? def.value2 : 0;
                  }
                }
              }}
            ></ss-select>
          </div>

          ${this.isCalculated
            ? this.renderCalculatedFields()
            : repeat(
                this.visibleFields,
                field => field,
                field =>
                  this.isFieldVisible(field)
                    ? html` <div
                        class=${classMap({
                          field: true,
                          invalid: this.invalidFields.includes(field),
                        })}
                      >
                        <label for=${field}
                          >${translate(`propertyConfig.field.${field}`)}</label
                        >
                        ${this.renderField(field)}
                      </div>`
                    : nothing,
              )}
        </fieldset>
        <div class="buttons">
          <ss-button positive ?disabled=${this.inSync} @click=${this.save}>
            ${translate('save')}
          </ss-button>
          <ss-button
            negative
            ?disabled=${!this[PropertyConfigFormProp.PROPERTY_CONFIG_ID]}
            @click=${(): void => {
              this.confirmationModalIsOpen = true;
            }}
          >
            ${translate('delete')}
          </ss-button>
        </div>
      </ss-collapsable>

      <confirmation-modal
        ?open=${this.confirmationModalIsOpen}
        @confirmation-accepted=${this.delete}
        @confirmation-declined=${(): void => {
          this.confirmationModalIsOpen = false;
        }}
      ></confirmation-modal>
    `;
  }
}
