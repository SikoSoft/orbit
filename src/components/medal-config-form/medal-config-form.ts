import { html, css, nothing, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { MedalConfig, Criterion, Criteria } from 'api-spec/models/Medal';
import { addToast } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';
import {
  MedalConfigFormProp,
  medalConfigFormProps,
  MedalConfigFormProps,
} from './medal-config-form.models';
import { storage } from '@/lib/Storage';
import { InputChangedEvent } from '@ss/ui/components/ss-input.events';

import '@ss/ui/components/ss-collapsable';
import '@ss/ui/components/confirmation-modal';
import '@ss/ui/components/ss-button';
import '@ss/ui/components/ss-input';
import { MobxLitElement } from '@adobe/lit-mobx';
import { translate } from '@/lib/Localization';
import {
  MedalConfigDeletedEvent,
  MedalConfigUpdatedEvent,
} from './medal-config-form.events';
import { themed } from '@/lib/Theme';

@themed()
@customElement('medal-config-form')
export class MedalConfigForm extends MobxLitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1rem;
    }

    .field {
      margin-bottom: 1rem;
    }

    .field label {
      display: block;
      font-weight: bold;
      margin-bottom: 0.25rem;
    }

    .field textarea {
      width: 100%;
      min-height: 6rem;
      font-family: monospace;
      box-sizing: border-box;
    }

    .field .error {
      color: red;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .buttons {
      padding: 0.5rem 0;
    }

    .buttons ss-button {
      display: block;
      margin-bottom: 0.5rem;
    }

    ss-collapsable::part(head) {
      font-weight: bold;
    }
  `;

  @state()
  localConfig: Omit<MedalConfig, 'createdAt' | 'updatedAt'> = {
    id: 0,
    name: '',
    description: '',
    series: '',
    recurrence: 0,
    prestige: 0,
    icon: '',
    criteria: {} as Criterion | Criteria,
  };

  @state()
  criteriaText: string = '{}';

  @state()
  criteriaError: string = '';

  @state()
  isSaving: boolean = false;

  @state()
  confirmationModalIsOpen: boolean = false;

  @property({ type: Boolean, reflect: true })
  open: boolean = false;

  @property({ type: Number })
  [MedalConfigFormProp.MEDAL_CONFIG_ID]: MedalConfigFormProps[MedalConfigFormProp.MEDAL_CONFIG_ID] =
    medalConfigFormProps[MedalConfigFormProp.MEDAL_CONFIG_ID].default;

  @property({ type: String })
  [MedalConfigFormProp.NAME]: MedalConfigFormProps[MedalConfigFormProp.NAME] =
    medalConfigFormProps[MedalConfigFormProp.NAME].default;

  @property({ type: String })
  [MedalConfigFormProp.DESCRIPTION]: MedalConfigFormProps[MedalConfigFormProp.DESCRIPTION] =
    medalConfigFormProps[MedalConfigFormProp.DESCRIPTION].default;

  @property({ type: String })
  [MedalConfigFormProp.SERIES]: MedalConfigFormProps[MedalConfigFormProp.SERIES] =
    medalConfigFormProps[MedalConfigFormProp.SERIES].default;

  @property({ type: Number })
  [MedalConfigFormProp.RECURRENCE]: MedalConfigFormProps[MedalConfigFormProp.RECURRENCE] =
    medalConfigFormProps[MedalConfigFormProp.RECURRENCE].default;

  @property({ type: Number })
  [MedalConfigFormProp.PRESTIGE]: MedalConfigFormProps[MedalConfigFormProp.PRESTIGE] =
    medalConfigFormProps[MedalConfigFormProp.PRESTIGE].default;

  @property({ type: String })
  [MedalConfigFormProp.ICON]: MedalConfigFormProps[MedalConfigFormProp.ICON] =
    medalConfigFormProps[MedalConfigFormProp.ICON].default;

  @property({ type: Object })
  [MedalConfigFormProp.CRITERIA]: MedalConfigFormProps[MedalConfigFormProp.CRITERIA] =
    medalConfigFormProps[MedalConfigFormProp.CRITERIA].default;

  connectedCallback(): void {
    super.connectedCallback();
    this.localConfig = {
      id: this[MedalConfigFormProp.MEDAL_CONFIG_ID],
      name: this[MedalConfigFormProp.NAME],
      description: this[MedalConfigFormProp.DESCRIPTION],
      series: this[MedalConfigFormProp.SERIES],
      recurrence: this[MedalConfigFormProp.RECURRENCE],
      prestige: this[MedalConfigFormProp.PRESTIGE],
      icon: this[MedalConfigFormProp.ICON],
      criteria: this[MedalConfigFormProp.CRITERIA],
    };
    this.criteriaText = JSON.stringify(this[MedalConfigFormProp.CRITERIA], null, 2);
  }

  validate(): string[] {
    const errors: string[] = [];
    if (!this.localConfig.name) {
      errors.push(translate('medalConfigNameRequired'));
    }
    try {
      JSON.parse(this.criteriaText);
    } catch {
      errors.push(translate('medalConfigCriteriaInvalid'));
    }
    return errors;
  }

  async save(): Promise<void> {
    const errors = this.validate();
    if (errors.length > 0) {
      const criteriaInvalid = errors.includes(translate('medalConfigCriteriaInvalid'));
      this.criteriaError = criteriaInvalid ? translate('medalConfigCriteriaInvalid') : '';
      addToast(errors[0], NotificationType.ERROR);
      return;
    }

    this.criteriaError = '';
    this.isSaving = true;

    const body = {
      name: this.localConfig.name,
      description: this.localConfig.description,
      series: this.localConfig.series,
      recurrence: this.localConfig.recurrence,
      prestige: this.localConfig.prestige,
      icon: this.localConfig.icon,
      criteria: JSON.parse(this.criteriaText) as Criterion | Criteria,
    };

    let result: MedalConfig | null = null;
    if (this.localConfig.id) {
      result = await storage.updateMedalConfig(this.localConfig.id, body);
    } else {
      result = await storage.createMedalConfig(body);
    }

    this.isSaving = false;

    if (!result) {
      addToast(translate('failedToSaveMedalConfig'), NotificationType.ERROR);
      return;
    }

    this.localConfig = { ...this.localConfig, ...result };
    this.dispatchEvent(new MedalConfigUpdatedEvent({ ...result }));
    addToast(translate('medalConfigSaved'), NotificationType.SUCCESS);
  }

  async delete(): Promise<void> {
    const result = await storage.deleteMedalConfig(this.localConfig.id);

    if (!result) {
      addToast(translate('failedToDeleteMedalConfig'), NotificationType.ERROR);
      return;
    }

    addToast(translate('medalConfigDeleted'), NotificationType.SUCCESS);
    this.dispatchEvent(new MedalConfigDeletedEvent({ id: this.localConfig.id }));
  }

  render(): TemplateResult {
    return html`
      <ss-collapsable
        title=${this.localConfig.name || translate('medalConfig')}
        ?open=${this.open}
        panelId=${`medalConfigForm-${this.localConfig.id}`}
      >
        <div class="field">
          <label>${translate('name')}</label>
          <ss-input
            .value=${this.localConfig.name}
            @input-changed=${(e: InputChangedEvent): void => {
              this.localConfig = { ...this.localConfig, name: e.detail.value };
            }}
          ></ss-input>
        </div>

        <div class="field">
          <label>${translate('description')}</label>
          <ss-input
            .value=${this.localConfig.description}
            @input-changed=${(e: InputChangedEvent): void => {
              this.localConfig = { ...this.localConfig, description: e.detail.value };
            }}
          ></ss-input>
        </div>

        <div class="field">
          <label>${translate('series')}</label>
          <ss-input
            .value=${this.localConfig.series}
            @input-changed=${(e: InputChangedEvent): void => {
              this.localConfig = { ...this.localConfig, series: e.detail.value };
            }}
          ></ss-input>
        </div>

        <div class="field">
          <label>${translate('icon')}</label>
          <ss-input
            .value=${this.localConfig.icon}
            @input-changed=${(e: InputChangedEvent): void => {
              this.localConfig = { ...this.localConfig, icon: e.detail.value };
            }}
          ></ss-input>
        </div>

        <div class="field">
          <label>${translate('recurrence')}</label>
          <ss-input
            .value=${String(this.localConfig.recurrence)}
            @input-changed=${(e: InputChangedEvent): void => {
              this.localConfig = { ...this.localConfig, recurrence: Number(e.detail.value) };
            }}
          ></ss-input>
        </div>

        <div class="field">
          <label>${translate('prestige')}</label>
          <ss-input
            .value=${String(this.localConfig.prestige)}
            @input-changed=${(e: InputChangedEvent): void => {
              this.localConfig = { ...this.localConfig, prestige: Number(e.detail.value) };
            }}
          ></ss-input>
        </div>

        <div class="field">
          <label>${translate('criteria')}</label>
          <textarea
            .value=${this.criteriaText}
            @input=${(e: Event): void => {
              this.criteriaText = (e.target as HTMLTextAreaElement).value;
              this.criteriaError = '';
            }}
          ></textarea>
          ${this.criteriaError
            ? html`<div class="error">${this.criteriaError}</div>`
            : nothing}
        </div>

        <div class="buttons">
          <ss-button
            positive
            ?disabled=${this.isSaving}
            @click=${this.save}
          >${translate(this.localConfig.id ? 'update' : 'create')}</ss-button>

          <ss-button
            negative
            @click=${(): void => {
              this.confirmationModalIsOpen = true;
            }}
          >${translate('delete')}</ss-button>
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
