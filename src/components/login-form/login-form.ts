import { MobxLitElement } from '@adobe/lit-mobx';
import { css, html, nothing, PropertyValues, TemplateResult } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';

import { appState } from '@/state';
import { performLogin } from '@/lib/Auth';
import { translate } from '@/lib/Localization';

import '@ss/ui/components/ss-button';
import '@ss/ui/components/ss-input';
import '@ss/ui/components/ss-select';

import {
  InputChangedEvent,
  InputSubmittedEvent,
} from '@ss/ui/components/ss-input.events';
import { UserLoggedInEvent } from '@/events/user-logged-in';

import { SSInput } from '@ss/ui/components/ss-input';
import { themed } from '@/lib/Theme';
import { StorageSource } from '@/models/Storage';
import '@/components/svg-icon/svg-icon';
import { IconName } from '@/components/svg-icon/svg-icon.models';

@themed()
@customElement('login-form')
export class LoginForm extends MobxLitElement {
  static styles = css`
    .box {
      max-width: 400px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 1rem 1rem;
      gap: 0.5rem;
    }

    h2 {
      margin: 0;
      font-size: 1.5rem;
      text-align: center;
      opacity: 0.5;
    }

    .form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding: 1.5rem;
    }

    ss-button::part(button) {
      font-weight: bold;
      padding: 0.75rem;
      font-size: 1.25rem;
    }
  `;

  private state = appState;

  @state() username: string = '';
  @state() password: string = '';
  @state() loading: boolean = false;

  @query('#username') private usernameField!: SSInput;

  protected firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);

    if (this.usernameField) {
      setTimeout(() => this.usernameField.focus(), 100);
    }
  }

  private handleUsernameChanged(e: InputChangedEvent): void {
    this.username = e.detail.value;
  }

  private handleUsernameSubmitted(_e: InputSubmittedEvent): void {
    this.login();
  }

  private handlePasswordChanged(e: InputChangedEvent): void {
    this.password = e.detail.value;
  }

  private handlePasswordSubmitted(_e: InputSubmittedEvent): void {
    this.login();
  }

  private async login(): Promise<void> {
    this.loading = true;
    const success = await performLogin(this.username, this.password);

    if (success) {
      this.dispatchEvent(new UserLoggedInEvent({}));
      this.username = '';
      this.password = '';
    }

    this.loading = false;
  }

  render(): TemplateResult | typeof nothing {
    if (this.state.storageSource === StorageSource.DEVICE) {
      return nothing;
    }

    return html`
      <div class="box">
        <div class="header">
          <svg-icon name=${IconName.CLOUD} size="48"></svg-icon>
          <h2>${translate('login')}</h2>
        </div>
        <form class="form">
          <ss-input
            id="username"
            placeholder=${translate('username')}
            @input-submitted=${this.handleUsernameSubmitted}
            @input-changed=${this.handleUsernameChanged}
            value=${this.username}
          ></ss-input>

          <ss-input
            id="password"
            placeholder=${translate('password')}
            type="password"
            @input-submitted=${this.handlePasswordSubmitted}
            @input-changed=${this.handlePasswordChanged}
            value=${this.password}
          ></ss-input>

          <ss-button
            @click=${this.login}
            text=${translate('login')}
            ?loading=${this.loading}
          ></ss-button>
        </form>
      </div>
    `;
  }
}
