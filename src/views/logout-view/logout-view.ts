import { LitElement, html, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import { performLogout } from '@/lib/Auth';
import { navigate } from '@/lib/Router';
import { UserLoggedOutEvent } from '@/events/user-logged-out';

@customElement('logout-view')
export class LogoutView extends LitElement {
  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    const success = await performLogout();
    if (success) {
      this.dispatchEvent(new UserLoggedOutEvent({}));
    }
    navigate('/');
  }

  render(): TemplateResult {
    return html``;
  }
}
