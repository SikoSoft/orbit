import { html, css, nothing, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { MedalConfig, Criterion, Criteria } from 'api-spec/models/Medal';
import { FactRequest, StreakRequest } from 'api-spec/models/Fact';
import { FactOperation } from 'api-spec/models/Fact';
import { SegmentationTimeUnit } from 'api-spec/models/Statistic';
import { defaultListFilter } from 'api-spec/models/List';
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
import '@ss/ui/components/file-upload';
import '@ss/ui/components/pop-up';
import '@/components/medal-config-form/fact-request-editor/fact-request-editor';
import '@/components/medal-config-form/streak-request-editor/streak-request-editor';
import '@/components/medal-config-form/criteria-editor/criteria-editor';
import '@/components/svg-icon/svg-icon';

import { MobxLitElement } from '@adobe/lit-mobx';
import { translate } from '@/lib/Localization';
import { appState } from '@/state';
import { FileUploadSuccessEvent } from '@ss/ui/components/file-upload.events';
import {
  MedalConfigCopiedEvent,
  MedalConfigDeletedEvent,
  MedalConfigUpdatedEvent,
} from './medal-config-form.events';
import { themed } from '@/lib/Theme';
import {
  FactRequestChangedEvent,
  FactRequestRemovedEvent,
} from './fact-request-editor/fact-request-editor.events';
import {
  StreakRequestChangedEvent,
  StreakRequestRemovedEvent,
} from './streak-request-editor/streak-request-editor.events';
import { CriteriaChangedEvent } from './criteria-editor/criteria-editor.events';

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

    .section-title {
      font-weight: bold;
      margin-bottom: 0.5rem;
    }

    .section {
      margin-bottom: 1.25rem;
    }

    .icon-field {
      display: flex;
      gap: 0.5rem;

      ss-input {
        flex-grow: 1;
      }
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
    factRequests: [],
    streakRequests: [],
    criteria: {} as Criterion | Criteria,
  };

  private state = appState;

  @state()
  isSaving: boolean = false;

  @state()
  confirmationModalIsOpen: boolean = false;

  @state()
  iconUploadPopUpIsOpen: boolean = false;

  get uploadUrl(): string {
    return new URL('file/medals/', import.meta.env.APP_BASE_API_URL).toString();
  }

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

  @property({ type: Array })
  [MedalConfigFormProp.FACT_REQUESTS]: MedalConfigFormProps[MedalConfigFormProp.FACT_REQUESTS] =
    medalConfigFormProps[MedalConfigFormProp.FACT_REQUESTS].default;

  @property({ type: Array })
  [MedalConfigFormProp.STREAK_REQUESTS]: MedalConfigFormProps[MedalConfigFormProp.STREAK_REQUESTS] =
    medalConfigFormProps[MedalConfigFormProp.STREAK_REQUESTS].default;

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
      factRequests: this[MedalConfigFormProp.FACT_REQUESTS],
      streakRequests: this[MedalConfigFormProp.STREAK_REQUESTS],
      criteria: this[MedalConfigFormProp.CRITERIA],
    };
  }

  private get factAliases(): string[] {
    const fromFacts = this.localConfig.factRequests.map(fr => fr.alias);
    const fromStreaks = this.localConfig.streakRequests.map(sr => sr.alias);
    return [...fromFacts, ...fromStreaks].filter(a => a.trim() !== '');
  }

  validate(): string[] {
    const errors: string[] = [];
    if (!this.localConfig.name) {
      errors.push(translate('medalConfigNameRequired'));
    }
    return errors;
  }

  async save(): Promise<void> {
    const errors = this.validate();
    if (errors.length > 0) {
      addToast(errors[0], NotificationType.ERROR);
      return;
    }

    this.isSaving = true;

    const body = {
      name: this.localConfig.name,
      description: this.localConfig.description,
      series: this.localConfig.series,
      recurrence: this.localConfig.recurrence,
      prestige: this.localConfig.prestige,
      icon: this.localConfig.icon,
      factRequests: this.localConfig.factRequests,
      streakRequests: this.localConfig.streakRequests,
      criteria: this.localConfig.criteria,
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

  copy(): void {
    const { name, description, series, recurrence, prestige, icon, factRequests, streakRequests, criteria } = this.localConfig;
    this.dispatchEvent(
      new MedalConfigCopiedEvent({ name, description, series, recurrence, prestige, icon, factRequests, streakRequests, criteria }),
    );
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

  private iconFileUploadSuccess(e: FileUploadSuccessEvent): void {
    this.localConfig = { ...this.localConfig, icon: e.detail.url };
    addToast(translate('fileUploadSuccess'), NotificationType.SUCCESS);
    this.iconUploadPopUpIsOpen = false;
  }

  private iconFileUploadFailed(): void {
    addToast(translate('fileUploadFailed'), NotificationType.ERROR);
  }

  private addFactRequest(): void {
    const newRequest: FactRequest = {
      alias: '',
      context: { operation: FactOperation.ENTITY_COUNT, filter: { ...defaultListFilter } },
    };
    this.localConfig = {
      ...this.localConfig,
      factRequests: [...this.localConfig.factRequests, newRequest],
    };
  }

  private handleFactRequestChanged(e: FactRequestChangedEvent): void {
    const updated = [...this.localConfig.factRequests];
    updated[e.detail.index] = e.detail.factRequest;
    this.localConfig = { ...this.localConfig, factRequests: updated };
  }

  private handleFactRequestRemoved(e: FactRequestRemovedEvent): void {
    const updated = this.localConfig.factRequests.filter((_, idx) => idx !== e.detail.index);
    this.localConfig = { ...this.localConfig, factRequests: updated };
  }

  private handleStreakRequestChanged(e: StreakRequestChangedEvent): void {
    const updated = [...this.localConfig.streakRequests];
    updated[e.detail.index] = e.detail.streakRequest;
    this.localConfig = { ...this.localConfig, streakRequests: updated };
  }

  private handleStreakRequestRemoved(e: StreakRequestRemovedEvent): void {
    const updated = this.localConfig.streakRequests.filter((_, idx) => idx !== e.detail.index);
    this.localConfig = { ...this.localConfig, streakRequests: updated };
  }

  private addStreakRequest(): void {
    const newRequest: StreakRequest = {
      alias: '',
      context: {
        segmentUnit: SegmentationTimeUnit.DAY,
        length: 1,
        innerContext: {
          operation: FactOperation.ENTITY_COUNT,
          filter: { ...defaultListFilter },
        },
        innerOperator: '==',
        innerValue: 0,
      },
    };
    this.localConfig = {
      ...this.localConfig,
      streakRequests: [...this.localConfig.streakRequests, newRequest],
    };
  }

  render(): TemplateResult {
    return html`
      <ss-collapsable
        title=${this.localConfig.name || translate('medalConfig')}
        ?open=${this.open}
        panelId=${`medalConfigForm-${this.localConfig.id}`}
      >
        <div class="section">
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
            <div class="icon-field">
              <ss-input
                .value=${this.localConfig.icon}
                @input-changed=${(e: InputChangedEvent): void => {
                  this.localConfig = { ...this.localConfig, icon: e.detail.value };
                }}
              ></ss-input>
              <ss-button
                tabindex="-1"
                @click=${(): void => {
                  this.iconUploadPopUpIsOpen = !this.iconUploadPopUpIsOpen;
                }}
              >
                <svg-icon name="upload" size="16"></svg-icon>
              </ss-button>
            </div>
            <pop-up
              closeButton
              ?open=${this.iconUploadPopUpIsOpen}
              @pop-up-closed=${(): void => {
                this.iconUploadPopUpIsOpen = false;
              }}
            >
              <file-upload
                endpointUrl=${this.uploadUrl}
                authToken=${this.state.authToken}
                @file-upload-success=${this.iconFileUploadSuccess}
                @file-upload-failed=${this.iconFileUploadFailed}
              ></file-upload>
            </pop-up>
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
        </div>

        <div class="section">
          <div class="section-title">${translate('factRequests')}</div>
          ${this.localConfig.factRequests.length === 0
            ? html`<div style="font-style:italic;opacity:0.6;margin-bottom:0.5rem;">${translate('noFactRequests')}</div>`
            : nothing}
          ${repeat(
            this.localConfig.factRequests,
            (_, i) => i,
            (fr, i) => html`
              <fact-request-editor
                .factRequest=${fr}
                .index=${i}
                @fact-request-changed=${(e: FactRequestChangedEvent): void => this.handleFactRequestChanged(e)}
                @fact-request-removed=${(e: FactRequestRemovedEvent): void => this.handleFactRequestRemoved(e)}
              ></fact-request-editor>
            `,
          )}
          <ss-button @click=${this.addFactRequest}>${translate('addFactRequest')}</ss-button>
        </div>

        <div class="section">
          <div class="section-title">${translate('streakRequests')}</div>
          ${this.localConfig.streakRequests.length === 0
            ? html`<div style="font-style:italic;opacity:0.6;margin-bottom:0.5rem;">${translate('noStreakRequests')}</div>`
            : nothing}
          ${repeat(
            this.localConfig.streakRequests,
            (_, i) => i,
            (sr, i) => html`
              <streak-request-editor
                .streakRequest=${sr}
                .index=${i}
                @streak-request-changed=${(e: StreakRequestChangedEvent): void => this.handleStreakRequestChanged(e)}
                @streak-request-removed=${(e: StreakRequestRemovedEvent): void => this.handleStreakRequestRemoved(e)}
              ></streak-request-editor>
            `,
          )}
          <ss-button @click=${this.addStreakRequest}>${translate('addStreakRequest')}</ss-button>
        </div>

        <div class="section">
          <div class="section-title">${translate('criteria')}</div>
          <criteria-editor
            .criteria=${this.localConfig.criteria}
            .factAliases=${this.factAliases}
            @criteria-changed=${(e: CriteriaChangedEvent): void => {
              this.localConfig = { ...this.localConfig, criteria: e.detail.criteria };
            }}
          ></criteria-editor>
        </div>

        <div class="buttons">
          <ss-button
            positive
            ?disabled=${this.isSaving}
            @click=${this.save}
          >${translate(this.localConfig.id ? 'update' : 'create')}</ss-button>

          ${this.localConfig.id
            ? html`<ss-button @click=${this.copy}>${translate('copyMedalConfig')}</ss-button>`
            : nothing}

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
