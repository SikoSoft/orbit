import { css, html, LitElement, nothing, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { toDataURL as qrToDataURL } from 'qrcode';

import { translate } from '@/lib/Localization';
import { storage } from '@/lib/Storage';
import { addToast } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';
import { themed } from '@/lib/Theme';

import { InputChangedEvent, InputSubmittedEvent } from '@ss/ui/components/ss-input.events';
import {
  MfaSetupConfirmedEvent,
  MfaSetupCancelledEvent,
} from './mfa-setup-form.events';

import '@ss/ui/components/ss-button';
import '@ss/ui/components/ss-input';

@themed()
@customElement('mfa-setup-form')
export class MfaSetupForm extends LitElement {
  static styles = css`
    .setup-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
      max-width: 360px;
    }

    .qr-code {
      display: flex;
      justify-content: center;
    }

    .qr-code img {
      width: 200px;
      height: 200px;
    }

    .actions {
      display: flex;
      gap: 0.75rem;
    }
  `;

  @state() private qrDataUrl: string = '';
  @state() private secret: string = '';
  @state() private code: string = '';
  @state() private loading: boolean = false;

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    await this.loadSetupData();
  }

  private async loadSetupData(): Promise<void> {
    const result = await storage.getMfaSetup();

    if (!result.isOk) {
      addToast(translate('mfa.setupError'), NotificationType.ERROR);
      this.dispatchEvent(new MfaSetupCancelledEvent());
      return;
    }

    this.secret = result.value.secret;
    this.qrDataUrl = await qrToDataURL(result.value.uri);
  }

  private handleCodeChanged(e: InputChangedEvent): void {
    this.code = e.detail.value;
  }

  private handleCodeSubmitted(_e: InputSubmittedEvent): void {
    this.confirm();
  }

  private async confirm(): Promise<void> {
    if (!this.code || this.code.length !== 6) {
      return;
    }

    this.loading = true;
    const result = await storage.verifyMfaSetup({ secret: this.secret, code: this.code });

    if (result.isOk) {
      addToast(translate('mfa.setupSuccess'), NotificationType.SUCCESS);
      this.dispatchEvent(new MfaSetupConfirmedEvent());
    } else {
      addToast(translate('mfa.setupError'), NotificationType.ERROR);
      this.code = '';
    }

    this.loading = false;
  }

  private handleCancel(): void {
    this.dispatchEvent(new MfaSetupCancelledEvent());
  }

  render(): TemplateResult {
    return html`
      <div class="setup-form">
        <p>${translate('mfa.setupInstructions')}</p>

        ${this.qrDataUrl
          ? html`<div class="qr-code"><img src=${this.qrDataUrl} alt="QR Code" /></div>`
          : nothing}

        <ss-input
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          maxlength="6"
          placeholder="000000"
          .value=${this.code}
          @input-changed=${this.handleCodeChanged}
          @input-submitted=${this.handleCodeSubmitted}
        ></ss-input>

        <div class="actions">
          <ss-button
            @click=${this.confirm}
            text=${translate('mfa.confirmSetup')}
            ?loading=${this.loading}
          ></ss-button>
          <ss-button
            @click=${this.handleCancel}
            text=${translate('mfa.cancel')}
          ></ss-button>
        </div>
      </div>
    `;
  }
}
