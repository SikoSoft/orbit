import { LitElement, html, css, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import {
  EntityPropertyCalculation,
  EntityPropertyCalculationOperation,
  EntityPropertyCalculationReference,
  EntityPropertyConfig,
} from 'api-spec/models/Entity';

import { storage } from '@/lib/Storage';
import { addToast } from '@/lib/Util';
import { translate } from '@/lib/Localization';
import { NotificationType } from '@ss/ui/components/notification-provider.models';
import {
  PropertyConfigAddedEvent,
  PropertyConfigUpdatedEvent,
} from '@/components/property-config-form/property-config-form.events';
import {
  CalculatedPropertyConfigFormProp,
  calculatedPropertyConfigFormProps,
  CalculatedPropertyConfigFormProps,
  OperandType,
  isPickableProperty,
  buildCalculatedConfig,
} from './calculated-property-config-form.models';

import { InputChangedEvent } from '@ss/ui/components/ss-input.events';
import { ToggleChangedEvent } from '@ss/ui/components/ss-toggle.events';

import '@ss/ui/components/ss-input';
import '@ss/ui/components/ss-select';
import '@ss/ui/components/ss-toggle';

@customElement('calculated-property-config-form')
export class CalculatedPropertyConfigForm extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .field {
      margin-bottom: 0.75rem;

      label {
        display: block;
        font-weight: bold;
        margin-bottom: 0.25rem;
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

  @property({ type: Number })
  [CalculatedPropertyConfigFormProp.ENTITY_CONFIG_ID]: CalculatedPropertyConfigFormProps[CalculatedPropertyConfigFormProp.ENTITY_CONFIG_ID] =
    calculatedPropertyConfigFormProps[
      CalculatedPropertyConfigFormProp.ENTITY_CONFIG_ID
    ].default;

  @property({ type: Number })
  [CalculatedPropertyConfigFormProp.PROPERTY_CONFIG_ID]: CalculatedPropertyConfigFormProps[CalculatedPropertyConfigFormProp.PROPERTY_CONFIG_ID] =
    calculatedPropertyConfigFormProps[
      CalculatedPropertyConfigFormProp.PROPERTY_CONFIG_ID
    ].default;

  @property({ type: String })
  [CalculatedPropertyConfigFormProp.NAME]: CalculatedPropertyConfigFormProps[CalculatedPropertyConfigFormProp.NAME] =
    calculatedPropertyConfigFormProps[
      CalculatedPropertyConfigFormProp.NAME
    ].default;

  @property({ type: String })
  [CalculatedPropertyConfigFormProp.PREFIX]: CalculatedPropertyConfigFormProps[CalculatedPropertyConfigFormProp.PREFIX] =
    calculatedPropertyConfigFormProps[
      CalculatedPropertyConfigFormProp.PREFIX
    ].default;

  @property({ type: String })
  [CalculatedPropertyConfigFormProp.SUFFIX]: CalculatedPropertyConfigFormProps[CalculatedPropertyConfigFormProp.SUFFIX] =
    calculatedPropertyConfigFormProps[
      CalculatedPropertyConfigFormProp.SUFFIX
    ].default;

  @property({ type: Boolean })
  [CalculatedPropertyConfigFormProp.HIDDEN]: CalculatedPropertyConfigFormProps[CalculatedPropertyConfigFormProp.HIDDEN] =
    calculatedPropertyConfigFormProps[
      CalculatedPropertyConfigFormProp.HIDDEN
    ].default;

  @property({ type: Object })
  [CalculatedPropertyConfigFormProp.CALCULATION]: CalculatedPropertyConfigFormProps[CalculatedPropertyConfigFormProp.CALCULATION] =
    calculatedPropertyConfigFormProps[
      CalculatedPropertyConfigFormProp.CALCULATION
    ].default;

  @property({ type: Array })
  [CalculatedPropertyConfigFormProp.ALL_PROPERTIES]: CalculatedPropertyConfigFormProps[CalculatedPropertyConfigFormProp.ALL_PROPERTIES] =
    calculatedPropertyConfigFormProps[
      CalculatedPropertyConfigFormProp.ALL_PROPERTIES
    ].default;

  @state() private fieldName = '';
  @state() private fieldPrefix = '';
  @state() private fieldSuffix = '';
  @state() private fieldHidden = false;
  @state() private operation: EntityPropertyCalculationOperation = '+';
  @state() value1Type: OperandType = 'number';
  @state() value1PropertyConfigId = 0;
  @state() value1Number = 0;
  @state() value2Type: OperandType = 'number';
  @state() value2PropertyConfigId = 0;
  @state() value2Number = 0;

  connectedCallback(): void {
    super.connectedCallback();

    this.fieldName = this.name;
    this.fieldPrefix = this.prefix;
    this.fieldSuffix = this.suffix;
    this.fieldHidden = this.hidden;

    const calc = this.calculation;
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

  protected willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);

    if (
      changedProperties.has('value1Type') &&
      this.value1Type === 'property' &&
      !this.value1PropertyConfigId
    ) {
      this.value1PropertyConfigId = this.pickableProperties[0]?.id ?? 0;
    }

    if (
      changedProperties.has('value2Type') &&
      this.value2Type === 'property' &&
      !this.value2PropertyConfigId
    ) {
      this.value2PropertyConfigId = this.pickableProperties[0]?.id ?? 0;
    }
  }

  private get pickableProperties(): EntityPropertyConfig[] {
    return this[CalculatedPropertyConfigFormProp.ALL_PROPERTIES].filter(p => {
      if (!isPickableProperty(p)) {
        return false;
      }
      return p.id !== this[CalculatedPropertyConfigFormProp.PROPERTY_CONFIG_ID];
    });
  }

  private get formulaDisplay(): string {
    const fmtOperand = (
      type: OperandType,
      propId: number,
      num: number,
    ): string => {
      if (type === 'number') {
        return String(num);
      }
      const prop = this[CalculatedPropertyConfigFormProp.ALL_PROPERTIES].find(
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

  validateCalculated(): boolean {
    if (!this.fieldName.trim()) {
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

  async save(): Promise<void> {
    if (!this.validateCalculated()) {
      return;
    }

    const config = buildCalculatedConfig(
      this[CalculatedPropertyConfigFormProp.ENTITY_CONFIG_ID],
      this[CalculatedPropertyConfigFormProp.PROPERTY_CONFIG_ID],
      this.fieldName,
      this.fieldPrefix,
      this.fieldSuffix,
      this.fieldHidden,
      this.buildCalculation(),
    );

    if (this[CalculatedPropertyConfigFormProp.PROPERTY_CONFIG_ID]) {
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

  private handleNameChanged(e: InputChangedEvent): void {
    this.fieldName = e.detail.value;
  }

  private handlePrefixChanged(e: InputChangedEvent): void {
    this.fieldPrefix = e.detail.value;
  }

  private handleSuffixChanged(e: InputChangedEvent): void {
    this.fieldSuffix = e.detail.value;
  }

  private handleHiddenChanged(e: ToggleChangedEvent): void {
    this.fieldHidden = e.detail.on;
  }

  private handleOperationChanged(e: InputChangedEvent): void {
    this.operation = e.detail.value as EntityPropertyCalculationOperation;
  }

  private handleValue1TypeChanged(e: InputChangedEvent): void {
    this.value1Type = e.detail.value as OperandType;
  }

  private handleValue1PropChanged(e: InputChangedEvent): void {
    this.value1PropertyConfigId = Number(e.detail.value);
  }

  private handleValue1NumberChanged(e: InputChangedEvent): void {
    this.value1Number = Number(e.detail.value);
  }

  private handleValue2TypeChanged(e: InputChangedEvent): void {
    this.value2Type = e.detail.value as OperandType;
  }

  private handleValue2PropChanged(e: InputChangedEvent): void {
    this.value2PropertyConfigId = Number(e.detail.value);
  }

  private handleValue2NumberChanged(e: InputChangedEvent): void {
    this.value2Number = Number(e.detail.value);
  }

  private renderOperandPicker(
    type: OperandType,
    propConfigId: number,
    onTypeChange: (e: InputChangedEvent) => void,
    onPropChange: (e: InputChangedEvent) => void,
    onNumChange: (e: InputChangedEvent) => void,
    numValue: number,
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
          @select-changed=${onTypeChange}
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
                  @select-changed=${onPropChange}
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
                value=${numValue}
                @input-changed=${onNumChange}
              ></ss-input>
            `}
      </div>
    `;
  }

  render(): TemplateResult {
    return html`
      <div class="formula-preview">${this.formulaDisplay}</div>

      <div class="field">
        <label>${translate('calculatedPropertyConfig.field.name')}</label>
        <ss-input
          type="text"
          value=${this.fieldName}
          @input-changed=${this.handleNameChanged}
        ></ss-input>
      </div>

      <div class="field">
        <label>${translate('calculatedPropertyConfig.field.prefix')}</label>
        <ss-input
          type="text"
          value=${this.fieldPrefix}
          @input-changed=${this.handlePrefixChanged}
        ></ss-input>
      </div>

      <div class="field">
        <label>${translate('calculatedPropertyConfig.field.suffix')}</label>
        <ss-input
          type="text"
          value=${this.fieldSuffix}
          @input-changed=${this.handleSuffixChanged}
        ></ss-input>
      </div>

      <div class="field">
        <label>${translate('calculatedPropertyConfig.field.hidden')}</label>
        <ss-toggle
          ?on=${this.fieldHidden}
          @toggle-changed=${this.handleHiddenChanged}
        ></ss-toggle>
      </div>

      <div class="field">
        <label>${translate('calculatedPropertyConfig.field.value1')}</label>
        ${this.renderOperandPicker(
          this.value1Type,
          this.value1PropertyConfigId,
          this.handleValue1TypeChanged,
          this.handleValue1PropChanged,
          this.handleValue1NumberChanged,
          this.value1Number,
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
          @select-changed=${this.handleOperationChanged}
        ></ss-select>
      </div>

      <div class="field">
        <label>${translate('calculatedPropertyConfig.field.value2')}</label>
        ${this.renderOperandPicker(
          this.value2Type,
          this.value2PropertyConfigId,
          this.handleValue2TypeChanged,
          this.handleValue2PropChanged,
          this.handleValue2NumberChanged,
          this.value2Number,
        )}
      </div>
    `;
  }
}
