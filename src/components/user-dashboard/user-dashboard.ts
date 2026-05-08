import { MobxLitElement } from '@adobe/lit-mobx';
import { css, html, nothing, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import { appState } from '@/state';
import { translate } from '@/lib/Localization';
import { StorageSource } from '@/models/Storage';

@customElement('user-dashboard')
export class UserDashboard extends MobxLitElement {
  private state = appState;

  static styles = css`
    .user-dashboard {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .welcome {
      font-size: 1.5rem;
    }

    .links {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
  `;

  private get isCloudStorage(): boolean {
    return this.state.storageSource === StorageSource.CLOUD;
  }

  private get displayName(): string {
    if (!this.state.user) {
      return '';
    }
    const { firstName, lastName, username } = this.state.user;
    const fullName = [firstName, lastName].filter(Boolean).join(' ');
    return fullName || username;
  }

  render(): TemplateResult {
    return html`
      <div class="user-dashboard">
        ${this.isCloudStorage && this.displayName
          ? html`<p class="welcome">
              ${translate('dashboard.welcome', { name: this.displayName })}
            </p>`
          : nothing}
        <div class="links">
          <a href="/access">${translate('dashboard.manageAccess')}</a>
          <a href="/settings">${translate('settings')}</a>
        </div>
      </div>
    `;
  }
}
