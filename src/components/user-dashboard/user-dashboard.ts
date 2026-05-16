import { MobxLitElement } from '@adobe/lit-mobx';
import { css, html, nothing, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import '@/components/svg-icon/svg/svg-key';
import '@/components/svg-icon/svg/svg-settings';
import '@/components/svg-icon/svg/svg-database';
import '@/components/svg-icon/svg/svg-layers';

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

    .cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-top: 1rem;
    }

    .card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 2.5rem 1.5rem;
      border: 2px solid var(--color-border, #ddd);
      border-radius: 0.5rem;
      background: var(--color-surface, #fff);
      text-decoration: none;
      color: inherit;
      cursor: pointer;
      transition:
        background 0.15s ease,
        border-color 0.15s ease;
    }

    .card:hover {
      background: var(--color-surface-hover, #f5f5f5);
      border-color: var(--color-primary, #666);
    }

    .card svg-key,
    .card svg-settings,
    .card svg-database,
    .card svg-layers {
      width: 3rem;
      height: 3rem;
    }

    .card-label {
      font-size: 1.1rem;
      font-weight: 600;
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
        <div class="cards">
          <a href="access" class="card">
            <svg-key></svg-key>
            <span class="card-label">${translate('access')}</span>
          </a>

          <a href="settings" class="card">
            <svg-settings></svg-settings>
            <span class="card-label">${translate('settings')}</span>
          </a>

          <a href="admin/data" class="card">
            <svg-database></svg-database>
            <span class="card-label">${translate('dataManager')}</span>
          </a>

          <a href="admin/entityConfig" class="card">
            <svg-layers></svg-layers>
            <span class="card-label">${translate('entityConfig')}</span>
          </a>
        </div>
      </div>
    `;
  }
}
