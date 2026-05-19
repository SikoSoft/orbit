import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import { translate } from '@/lib/Localization';
import { performMfaVerify } from '@/lib/Auth';
import { UserLoggedInEvent } from '@/events/user-logged-in';

import {
  MfaVerifyFormProp,
  mfaVerifyFormProps,
  MfaVerifyFormProps,
} from './mfa-verify-form.models';

import {
  InputChangedEvent,
  InputSubmittedEvent,
} from '@ss/ui/components/ss-input.events';
import { themed } from '@/lib/Theme';

import '@ss/ui/components/ss-button';
import '@ss/ui/components/ss-input';

@themed()
@customElement('mfa-verify-form')
export class MfaVerifyForm extends LitElement {
  static styles = css`
    .form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding: 1.5rem;
    }
  `;

  @property()
  [MfaVerifyFormProp.PENDING_MFA_TOKEN]: MfaVerifyFormProps[MfaVerifyFormProp.PENDING_MFA_TOKEN] =
    mfaVerifyFormProps[MfaVerifyFormProp.PENDING_MFA_TOKEN].default;

  @query('#mfa-code') private codeInput!: HTMLElement & { focus(): void };

  @state() private code: string = '';
  @state() private loading: boolean = false;

  async firstUpdated(): Promise<void> {
    await this.updateComplete;
    this.codeInput.focus();
  }

  private handleCodeChanged(e: InputChangedEvent): void {
    this.code = e.detail.value;
  }

  private handleCodeSubmitted(_e: InputSubmittedEvent): void {
    this.verify();
  }

  private async verify(): Promise<void> {
    if (!this.code || this.code.length !== 6) {
      return;
    }

    this.loading = true;
    const success = await performMfaVerify(this.pendingMfaToken, this.code);

    if (success) {
      this.dispatchEvent(new UserLoggedInEvent({}));
      this.code = '';
    }

    this.loading = false;
  }

  render(): TemplateResult {
    return html`
      <form class="form">
        <p>${translate('mfa.enterCode')}</p>

        <ss-input
          id="mfa-code"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          maxlength="6"
          placeholder="000000"
          .value=${this.code}
          @input-changed=${this.handleCodeChanged}
          @input-submitted=${this.handleCodeSubmitted}
        ></ss-input>

        <ss-button
          @click=${this.verify}
          text=${translate('mfa.verifyCode')}
          ?loading=${this.loading}
        ></ss-button>
      </form>
    `;
  }
}
