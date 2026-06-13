import { html, css, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { NotificationType } from '@ss/ui/components/notification-provider.models';

import { translate } from '@/lib/Localization';
import { storage } from '@/lib/Storage';
import { addToast } from '@/lib/Util';
import { InputChangedEvent } from '@ss/ui/components/ss-input.events';
import { themed } from '@/lib/Theme';

import {
  StreakConfigFormProp,
  streakConfigFormProps,
  StreakConfigFormProps,
} from './streak-config-form.models';
import { StreakSavedEvent } from './streak-config-form.events';
import { defaultStreakContext } from '@/components/streak-form/streak-form.models';
import { StreakContextChangedEvent } from '@/components/streak-form/streak-form.events';

import '@ss/ui/components/ss-input';
import '@ss/ui/components/ss-button';
import '@/components/streak-form/streak-form';

@themed()
@customElement('streak-config-form')
export class StreakConfigForm extends MobxLitElement {
  static styles = css`
    :host {
      display: block;
    }

    .row {
      display: flex;
      gap: 0.75rem;
      align-items: flex-end;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
    }

    .field {
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: 0.25rem;
      min-width: 8rem;
    }

    .field label {
      font-size: 0.8125rem;
      font-weight: bold;
    }

    .buttons {
      margin-top: 0.75rem;
    }
  `;

  @property({ type: Object })
  [StreakConfigFormProp.STREAK]: StreakConfigFormProps[StreakConfigFormProp.STREAK] =
    streakConfigFormProps[StreakConfigFormProp.STREAK].default;

  @state() private streakName = '';
  @state() private localContext = defaultStreakContext();
  @state() private isSaving = false;

  connectedCallback(): void {
    super.connectedCallback();
    const streak = this[StreakConfigFormProp.STREAK];
    if (streak) {
      this.streakName = streak.name;
      this.localContext = { ...streak.context };
    }
  }

  private async handleSave(): Promise<void> {
    if (!this.streakName.trim()) {
      addToast(translate('streakNameRequired'), NotificationType.ERROR);
      return;
    }

    this.isSaving = true;

    const streak = this[StreakConfigFormProp.STREAK];
    let result;

    if (streak) {
      result = await storage.updateStreak?.(streak.id, this.streakName, this.localContext);
    } else {
      result = await storage.createStreak?.(this.streakName, this.localContext);
    }

    this.isSaving = false;

    if (!result || !result.isOk) {
      addToast(translate('failedToSaveStreak'), NotificationType.ERROR);
      return;
    }

    addToast(translate('streakSaved'), NotificationType.SUCCESS);
    this.dispatchEvent(new StreakSavedEvent({ streak: result.value }));

    if (!streak) {
      this.streakName = '';
      this.localContext = defaultStreakContext();
    }
  }

  render(): TemplateResult {
    return html`
      <div class="row">
        <div class="field">
          <label>${translate('name')}</label>
          <ss-input
            .value=${this.streakName}
            @input-changed=${(e: InputChangedEvent): void => {
              this.streakName = e.detail.value;
            }}
          ></ss-input>
        </div>
      </div>

      <streak-form
        .context=${this.localContext}
        @streak-context-changed=${(e: StreakContextChangedEvent): void => {
          this.localContext = e.detail.context;
        }}
      ></streak-form>

      <div class="buttons">
        <ss-button
          positive
          ?disabled=${this.isSaving}
          @click=${this.handleSave}
        >
          ${translate(this[StreakConfigFormProp.STREAK] ? 'update' : 'create')}
        </ss-button>
      </div>
    `;
  }
}
