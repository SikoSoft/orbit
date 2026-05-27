import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import {
  EntityCalculatedPropertyConfig,
  EntityPropertyCalculation,
  EntityPropertyCalculationOperation,
  EntityPropertyCalculationReference,
  EntityPropertyConfig,
} from 'api-spec/models/Entity';

import { storage } from '@/lib/Storage';
import { addToast } from '@/lib/Util';
import { translate } from '@/lib/Localization';
import { NotificationType } from '@ss/ui/components/notification-provider.models';
import { InputChangedEvent } from '@ss/ui/components/ss-input.events';
import { ToggleChangedEvent } from '@ss/ui/components/ss-toggle.events';

import {
  PropertyConfigAddedEvent,
  PropertyConfigDeletedEvent,
  PropertyConfigUpdatedEvent,
} from '@/components/property-config-form/property-config-form.events';

import {
  CalculatedPropertyConfigFormProp,
  CalculatedPropertyConfigFormProps,
  calculatedPropertyConfigFormProps,
  OperandType,
  buildCalculatedConfig,
  isPickableProperty,
} from './calculated-property-config-form.models';

import '@ss/ui/components/ss-collapsable';
import '@ss/ui/components/ss-input';
import '@ss/ui/components/ss-select';
import '@ss/ui/components/ss-toggle';
import '@ss/ui/components/ss-button';
import '@ss/ui/components/confirmation-modal';

@customElement('calculated-property-config-form')
export class CalculatedPropertyConfigForm extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    fieldset {
      border-color: var(--border-color);
      border-radius: 0.5rem;
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

    .calculated-badge {
      display: inline-block;
      font-size: 0.7rem;
      background: var(--color-accent, #4a90e2);
      color: #fff;
      border-radius: 0.25rem;
      padding: 0.1rem 0.4rem;
      margin-left: 0.5rem;
      vertical-align: middle;
    }

    .buttons {
      padding: 0.5rem 0;
      touch-action: manipulation;

      ss-button {
        display: block;
        margin-bottom: 0.5rem;
      }
    }
  `;

  @property({ type: Boolean, reflect: true })
  [CalculatedPropertyConfigFormProp.OPEN]: CalculatedPropertyConfigFormProps[CalculatedPropertyConfigFormProp.OPEN] =
    calculatedPropertyConfigFormProps[CalculatedPropertyConfigFormProp.OPEN].default;

  @property({ type: Number })
  [CalculatedPropertyConfigFormProp.ENTITY_CONFIG_ID]: CalculatedPropertyConfigFormProps[CalculatedPropertyConfigFormProp.ENTITY_CONFIG_ID] =
    calculatedPropertyConfigFormProps[CalculatedPropertyConfigFormProp.ENTITY_CONFIG_ID].default;

  @property({ type: Number })
  [CalculatedPropertyConfigFormProp.PROPERTY_CONFIG_ID]: CalculatedPropertyConfigFormProps[CalculatedPropertyConfigFormProp.PROPERTY_CONFIG_ID] =
    calculatedPropertyConfigFormProps[CalculatedPropertyConfigFormProp.PROPERTY_CONFIG_ID].default;

  @property({ type: String })
  [CalculatedPropertyConfigFormProp.NAME]: CalculatedPropertyConfigFormProps[CalculatedPropertyConfigFormProp.NAME] =
    calculatedPropertyConfigFormProps[CalculatedPropertyConfigFormProp.NAME].default;

  @property({ type: String })
  [CalculatedPropertyConfigFormProp.PREFIX]: CalculatedPropertyConfigFormProps[CalculatedPropertyConfigFormProp.PREFIX] =
    calculatedPropertyConfigFormProps[CalculatedPropertyConfigFormProp.PREFIX].default;

  @property({ type: String })
  [CalculatedPropertyConfigFormProp.SUFFIX]: CalculatedPropertyConfigFormProps[CalculatedPropertyConfigFormProp.SUFFIX] =
    calculatedPropertyConfigFormProps[CalculatedPropertyConfigFormProp.SUFFIX].default;

  @property({ type: Boolean })
  [CalculatedPropertyConfigFormProp.HIDDEN]: CalculatedPropertyConfigFormProps[CalculatedPropertyConfigFormProp.HIDDEN] =
    calculatedPropertyConfigFormProps[CalculatedPropertyConfigFormProp.HIDDEN].default;

  @property({ type: Object })
  [CalculatedPropertyConfigFormProp.CALCULATION]: CalculatedPropertyConfigFormProps[CalculatedPropertyConfigFormProp.CALCULATION] =
    calculatedPropertyConfigFormProps[CalculatedPropertyConfigFormProp.CALCULATION].default;

  @property({ type: Array })
  [CalculatedPropertyConfigFormProp.ALL_PROPERTIES]: CalculatedPropertyConfigFormProps[CalculatedPropertyConfigFormProp.ALL_PROPERTIES] =
    calculatedPropertyConfigFormProps[CalculatedPropertyConfigFormProp.ALL_PROPERTIES].default;

  @state() localName = '';
  @state() localPrefix = '';
  @state() localSuffix = '';
  @state() localHidden = false;
  @state() operation: EntityPropertyCalculationOperation = '+';
  @state() value1Type: OperandType = 'number';
  @state() value1PropertyConfigId = 0;
  @state() value1Number = 0;
  @state() value2Type: OperandType = 'number';
  @state() value2PropertyConfigId = 0;
  @state() value2Number = 0;
  @state() confirmationModalIsOpen = false;

  connectedCallback(): void {
    super.connectedCallback();
    this.localName = this[CalculatedPropertyConfigFormProp.NAME];
    this.localPrefix = this[CalculatedPropertyConfigFormProp.PREFIX];
    this.localSuffix = this[CalculatedPropertyConfigFormProp.SUFFIX];
    this.localHidden = this[CalculatedPropertyConfigFormProp.HIDDEN];

    const calc = this[CalculatedPropertyConfigFormProp.CALCULATION];
    if (calc) {
      this.operation = calc.operation;
      if (typeof calc.value1 === 'number') {
        this.value1Type = 'number';
        this.value1Number = calc.value1;
      } else {
        this.value1Type = 'property';
        this.value1PropertyConfigId = (calc.value1 as EntityPropertyCalculationReference).propertyConfigId;
      }
      if (typeof calc.value2 === 'number') {
        this.value2Type = 'number';
        this.value2Number = calc.value2;
      } else {
        this.value2Type = 'property';
        this.value2PropertyConfigId = (calc.value2 as EntityPropertyCalculationReference).propertyConfigId;
      }
    }
  }

  get pickableProperties(): EntityPropertyConfig[] {
    return this[CalculatedPropertyConfigFormProp.ALL_PROPERTIES].filter(p => {
      if (!isPickableProperty(p)) {
        return false;
      }
      return p.id !== this[CalculatedPropertyConfigFormProp.PROPERTY_CONFIG_ID];
    });
  }

  get formulaDisplay(): string {
    const fmtOperand = (type: OperandType, propId: number, num: number): string => {
      if (type === 'number') {
        return String(num);
      }
      const prop = this[CalculatedPropertyConfigFormProp.ALL_PROPERTIES].find(
        p => p.id === propId,
      );
      return prop ? `[${prop.name}]` : `[#${propId}]`;
    };

    const v1 = fmtOperand(this.value1Type, this.value1PropertyConfigId, this.value1Number);
    const v2 = fmtOperand(this.value2Type, this.value2PropertyConfigId, this.value2Number);
    return `${v1} ${this.operation} ${v2}`;
  }

  get collapsableTitle(): string {
    const name = this.localName || translate('propertyConfiguration');
    return `${name} (${translate('calculatedPropertyConfig.calculated')})`;
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

  validate(): boolean {
    if (!this.localName.trim()) {
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
    if (!this.validate()) {
      return;
    }

    const config = buildCalculatedConfig(
      this[CalculatedPropertyConfigFormProp.ENTITY_CONFIG_ID],
      this[CalculatedPropertyConfigFormProp.PROPERTY_CONFIG_ID],
      this.localName,
      this.localPrefix,
      this.localSuffix,
      this.localHidden,
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

  async delete(): Promise<void> {
    this.confirmationModalIsOpen = false;

    const deleted = await storage.deletePropertyConfig(
      this[CalculatedPropertyConfigFormProp.ENTITY_CONFIG_ID],
      this[CalculatedPropertyConfigFormProp.PROPERTY_CONFIG_ID],
    );

    if (deleted) {
      addToast(translate('calculatedPropertyConfig.deletedSuccessfully'));
      this.dispatchEvent(
        new PropertyConfigDeletedEvent(
          this[CalculatedPropertyConfigFormProp.PROPERTY_CONFIG_ID],
        ),
      );
    }
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
                  .options=${pickable.map(p => ({ label: p.name, value: String(p.id) }))}
                  selected=${String(propConfigId)}
                  @select-changed=${(e: InputChangedEvent): void => {
                    onPropChange(Number(e.detail.value));
                  }}
                ></ss-select>
              `
            : html`<span>${translate('calculatedPropertyConfig.noPickableProperties')}</span>`
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

  render(): TemplateResult {
    return html`
      <ss-collapsable
        title=${this.collapsableTitle}
        panelId=${`propertyConfigForm-${this[CalculatedPropertyConfigFormProp.PROPERTY_CONFIG_ID]}`}
        .open=${this[CalculatedPropertyConfigFormProp.OPEN]}
      >
        <fieldset>
          <legend>${translate('propertyConfiguration')}</legend>

          <div class="formula-preview">${this.formulaDisplay}</div>

          <div class="field">
            <label>${translate('calculatedPropertyConfig.field.name')}</label>
            <ss-input
              type="text"
              value=${this.localName}
              @input-changed=${(e: InputChangedEvent): void => {
                this.localName = e.detail.value;
              }}
            ></ss-input>
          </div>

          <div class="field">
            <label>${translate('calculatedPropertyConfig.field.prefix')}</label>
            <ss-input
              type="text"
              value=${this.localPrefix}
              @input-changed=${(e: InputChangedEvent): void => {
                this.localPrefix = e.detail.value;
              }}
            ></ss-input>
          </div>

          <div class="field">
            <label>${translate('calculatedPropertyConfig.field.suffix')}</label>
            <ss-input
              type="text"
              value=${this.localSuffix}
              @input-changed=${(e: InputChangedEvent): void => {
                this.localSuffix = e.detail.value;
              }}
            ></ss-input>
          </div>

          <div class="field">
            <label>${translate('calculatedPropertyConfig.field.hidden')}</label>
            <ss-toggle
              ?on=${this.localHidden}
              @toggle-changed=${(e: ToggleChangedEvent): void => {
                this.localHidden = e.detail.on;
              }}
            ></ss-toggle>
          </div>

          <div class="field">
            <label>${translate('calculatedPropertyConfig.field.value1')}</label>
            ${this.renderOperandPicker(
              this.value1Type,
              this.value1PropertyConfigId,
              this.value1Number,
              (t): void => { this.value1Type = t; },
              (id): void => { this.value1PropertyConfigId = id; },
              (n): void => { this.value1Number = n; },
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
                this.operation = e.detail.value as EntityPropertyCalculationOperation;
              }}
            ></ss-select>
          </div>

          <div class="field">
            <label>${translate('calculatedPropertyConfig.field.value2')}</label>
            ${this.renderOperandPicker(
              this.value2Type,
              this.value2PropertyConfigId,
              this.value2Number,
              (t): void => { this.value2Type = t; },
              (id): void => { this.value2PropertyConfigId = id; },
              (n): void => { this.value2Number = n; },
            )}
          </div>
        </fieldset>

        <div class="buttons">
          <ss-button positive @click=${this.save}>
            ${translate('save')}
          </ss-button>
          <ss-button
            negative
            ?disabled=${!this[CalculatedPropertyConfigFormProp.PROPERTY_CONFIG_ID]}
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
