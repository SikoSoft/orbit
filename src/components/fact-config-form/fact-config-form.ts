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
  FactConfigFormProp,
  factConfigFormProps,
  FactConfigFormProps,
} from './fact-config-form.models';
import { FactSavedEvent } from './fact-config-form.events';
import { defaultFactContext } from '@/components/fact-form/fact-form.models';
import { FactContextChangedEvent } from '@/components/fact-form/fact-form.events';

import '@ss/ui/components/ss-input';
import '@ss/ui/components/ss-button';
import '@/components/fact-form/fact-form';

@themed()
@customElement('fact-config-form')
export class FactConfigForm extends MobxLitElement {
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
  [FactConfigFormProp.FACT]: FactConfigFormProps[FactConfigFormProp.FACT] =
    factConfigFormProps[FactConfigFormProp.FACT].default;

  @state() private factName = '';
  @state() private localContext = defaultFactContext();
  @state() private isSaving = false;

  connectedCallback(): void {
    super.connectedCallback();
    const fact = this[FactConfigFormProp.FACT];
    if (fact) {
      this.factName = fact.name;
      this.localContext = { ...fact.context };
    }
  }

  private async handleSave(): Promise<void> {
    if (!this.factName.trim()) {
      addToast(translate('factNameRequired'), NotificationType.ERROR);
      return;
    }

    this.isSaving = true;

    const fact = this[FactConfigFormProp.FACT];
    let result;

    if (fact) {
      result = await storage.updateFact?.(fact.id, this.factName, this.localContext);
    } else {
      result = await storage.createFact?.(this.factName, this.localContext);
    }

    this.isSaving = false;

    if (!result || !result.isOk) {
      addToast(translate('failedToSaveFact'), NotificationType.ERROR);
      return;
    }

    addToast(translate('factSaved'), NotificationType.SUCCESS);
    this.dispatchEvent(new FactSavedEvent({ fact: result.value }));

    if (!fact) {
      this.factName = '';
      this.localContext = defaultFactContext();
    }
  }

  render(): TemplateResult {
    return html`
      <div class="row">
        <div class="field">
          <label>${translate('name')}</label>
          <ss-input
            .value=${this.factName}
            @input-changed=${(e: InputChangedEvent): void => {
              this.factName = e.detail.value;
            }}
          ></ss-input>
        </div>
      </div>

      <fact-form
        .context=${this.localContext}
        @fact-context-changed=${(e: FactContextChangedEvent): void => {
          this.localContext = e.detail.context;
        }}
      ></fact-form>

      <div class="buttons">
        <ss-button
          positive
          ?disabled=${this.isSaving}
          @click=${this.handleSave}
        >
          ${translate(this[FactConfigFormProp.FACT] ? 'update' : 'create')}
        </ss-button>
      </div>
    `;
  }
}
