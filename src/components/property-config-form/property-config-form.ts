import {
  LitElement,
  html,
  css,
  PropertyValues,
  TemplateResult,
  nothing,
} from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { customElement, property, query, state } from 'lit/decorators.js';
import {
  BooleanDataValue,
  DataType,
  DataTypedValue,
  DateDataValue,
  defaultEntityPropertyConfig,
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
import { defaultCalculation } from '@/components/calculated-property-config-form/calculated-property-config-form.models';
import { CalculatedPropertyConfigForm } from '@/components/calculated-property-config-form/calculated-property-config-form';

import { InputChangedEvent } from '@ss/ui/components/ss-input.events';
import {
  PropertyConfigAddedEvent,
  PropertyConfigBreakingChangeDetectedEvent,
  PropertyConfigBreakingChangesResolvedEvent,
  PropertyConfigDeletedEvent,
  PropertyConfigUpdatedEvent,
} from './property-config-form.events';
import { DefaultValueChangedEvent } from './property-config-default-value/property-config-default-value.events';
import { OptionsChangedEvent } from './property-config-options/property-config-options.events';

import '@ss/ui/components/ss-input';
import '@ss/ui/components/ss-select';
import '@ss/ui/components/confirmation-modal';
import '@ss/ui/components/ss-toggle';
import '@ss/ui/components/ss-button';
import '@ss/ui/components/ss-collapsable';
import '@/components/calculated-property-config-form/calculated-property-config-form';
import '@/components/property-config-form/property-config-default-value/property-config-default-value';
import '@/components/property-config-form/property-config-options/property-config-options';

import { ToggleChangedEvent } from '@ss/ui/components/ss-toggle.events';
import { repeat } from 'lit/directives/repeat.js';
import { Revision } from 'api-spec/lib/Revision';
import { NotificationType } from '@ss/ui/components/notification-provider.models';

@customElement('property-config-form')
export class PropertyConfigForm extends LitElement {
  @state() propertyConfig: EntityPropertyConfig = defaultEntityPropertyConfig;
  @state() confirmationModalIsOpen = false;
  @state() private invalidFields: PropertyConfigFormProp[] = [];
  @state() isCalculated = false;

  @query('calculated-property-config-form')
  private calculatedForm?: CalculatedPropertyConfigForm;

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

  connectedCallback(): void {
    super.connectedCallback();

    this.propertyConfig = { ...this.updatedPropertyConfig };

    const calc = this[PropertyConfigFormProp.CALCULATION];
    if (calc) {
      this.isCalculated = true;
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
  }

  get visibleFields(): PropertyConfigFormProp[] {
    return Object.values(PropertyConfigFormProp).filter(field => {
      const control = propertyConfigFormProps[field].control;
      return control.type !== ControlType.HIDDEN;
    }) as PropertyConfigFormProp[];
  }

  get collapsableTitle(): string {
    const name =
      (this.isCalculated
        ? this[PropertyConfigFormProp.NAME]
        : this.propertyConfig.name) || translate('propertyConfiguration');
    if (this.isCalculated) {
      return `${name} (${translate('calculatedPropertyConfig.calculated')})`;
    }
    return name;
  }

  get optionsFieldsVisible(): boolean {
    const dataType = this.propertyConfig[PropertyConfigFormProp.DATA_TYPE];
    return dataType === DataType.SHORT_TEXT || dataType === DataType.INT;
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

  async save(): Promise<void> {
    if (this.isCalculated) {
      await this.calculatedForm?.save();
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

  handlePropertyTypeChanged(e: InputChangedEvent): void {
    this.isCalculated = e.detail.value === 'calculated';
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

  private handleDefaultValueChanged(e: DefaultValueChangedEvent): void {
    this.updateField(PropertyConfigFormProp.DEFAULT_VALUE, e.detail.value);
  }

  private handleOptionsChanged(e: OptionsChangedEvent): void {
    this.updateField(
      PropertyConfigFormProp.OPTIONS,
      e.detail.options as unknown as PropertyDataValue,
    );
  }

  private handleSelectField(
    field: PropertyConfigFormProp,
    e: InputChangedEvent,
  ): void {
    if (field === PropertyConfigFormProp.DATA_TYPE) {
      this.handleDataTypeChange(e.detail.value as DataType);
    } else {
      this.updateField(field, e.detail.value);
    }
  }

  renderField(field: PropertyConfigFormProp): TemplateResult | typeof nothing {
    if (field === PropertyConfigFormProp.DEFAULT_VALUE) {
      return html`<property-config-default-value
        dataType=${this.propertyConfig.dataType}
        .defaultValue=${this.propertyConfig.defaultValue}
        @default-value-changed=${this.handleDefaultValueChanged}
      ></property-config-default-value>`;
    }

    if (field === PropertyConfigFormProp.OPTIONS) {
      return html`<property-config-options
        .options=${this.options as string[]}
        @options-changed=${this.handleOptionsChanged}
      ></property-config-options>`;
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
            selected=${String(this[field])}
            @select-changed=${(e: InputChangedEvent): void =>
              this.handleSelectField(field, e)}
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
            value=${String(this[field])}
            @input-changed=${(e: InputChangedEvent): void => {
              this.updateField(field, e.detail.value);
            }}
          ></ss-input>
        `;
    }

    return nothing;
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
              @select-changed=${(e: InputChangedEvent): void =>
                this.handlePropertyTypeChanged(e)}
            ></ss-select>
          </div>

          ${this.isCalculated
            ? html`<calculated-property-config-form
                entityConfigId=${this[PropertyConfigFormProp.ENTITY_CONFIG_ID]}
                propertyConfigId=${this[
                  PropertyConfigFormProp.PROPERTY_CONFIG_ID
                ]}
                name=${this[PropertyConfigFormProp.NAME]}
                prefix=${this[PropertyConfigFormProp.PREFIX]}
                suffix=${this[PropertyConfigFormProp.SUFFIX]}
                ?hidden=${this[PropertyConfigFormProp.HIDDEN]}
                .calculation=${this[PropertyConfigFormProp.CALCULATION] ??
                defaultCalculation}
                .allProperties=${this[PropertyConfigFormProp.ALL_PROPERTIES]}
              ></calculated-property-config-form>`
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
