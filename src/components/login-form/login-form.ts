import { MobxLitElement } from '@adobe/lit-mobx';
import { css, html, nothing, PropertyValues, TemplateResult } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';

import { appState } from '@/state';
import { api } from '@/lib/Api';
import { LoginRequestBody, LoginResponseBody } from '@/models/Identity';
import { storage } from '@/lib/Storage';
import { addToast } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';
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

@themed()
@customElement('login-form')
export class LoginForm extends MobxLitElement {
  static styles = css`
    .box {
      padding: 1rem;
      margin-bottom: 1rem;
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

    try {
      const result = await api.post<LoginRequestBody, LoginResponseBody>(
        'login',
        { username: this.username, password: this.password },
      );

      if (result && result.status !== 401) {
        storage.setAuthToken(result.response.authToken);
        api.setAuthToken(result.response.authToken);
        this.state.setAuthToken(result.response.authToken);
        this.state.setForbidden(false);
        addToast(translate('youAreNowLoggedIn'), NotificationType.SUCCESS);
        this.dispatchEvent(new UserLoggedInEvent({}));
        this.username = '';
        this.password = '';
        return;
      }

      addToast(
        translate('incorrectUsernameAndPasswordCombination'),
        NotificationType.ERROR,
      );
    } catch (error) {
      addToast(
        translate('anErrorOccurredWhileLoggingIn'),
        NotificationType.ERROR,
      );
    } finally {
      this.loading = false;
    }
  }

  render(): TemplateResult | typeof nothing {
    if (this.state.storageSource === StorageSource.DEVICE) {
      return nothing;
    }

    return html`
      <form>
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
    `;
  }
}
