import { MobxLitElement } from '@adobe/lit-mobx';
import { css, html, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { translate } from '@/lib/Localization';
import { performLogout } from '@/lib/Auth';
import { navigate } from '@/lib/Router';

import { UserLoggedOutEvent } from '@/events/user-logged-out';

import '@ss/ui/components/ss-button';
import '@ss/ui/components/ss-input';
import '@ss/ui/components/ss-select';
import { themed } from '@/lib/Theme';

@themed()
@customElement('user-pane')
export class UserPane extends MobxLitElement {
  static styles = css`
    .box {
      padding: 1rem;
      margin-bottom: 1rem;
    }
  `;

  @state() username: string = '';
  @state() password: string = '';

  private async logout(): Promise<void> {
    const success = await performLogout();
    if (success) {
      this.dispatchEvent(new UserLoggedOutEvent({}));
      navigate('/');
    }
  }

  render(): TemplateResult {
    return html`
      <div>
        <ss-button @click=${this.logout}>${translate('logout')}</ss-button>
      </div>
    `;
  }
}
