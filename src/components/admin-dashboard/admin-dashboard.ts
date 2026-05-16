import { css, html, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import '@/components/svg-icon/svg/svg-database';
import '@/components/svg-icon/svg/svg-settings';

import { ViewElement } from '@/lib/ViewElement';
import { translate } from '@/lib/Localization';

@customElement('admin-dashboard')
export class AdminDashboard extends ViewElement {
  static styles = css`
    .admin-dashboard {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-top: 1rem;
    }

    .admin-card {
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

    .admin-card:hover {
      background: var(--color-surface-hover, #f5f5f5);
      border-color: var(--color-primary, #666);
    }

    .admin-card svg-database,
    .admin-card svg-settings {
      width: 3rem;
      height: 3rem;
    }

    .admin-card-label {
      font-size: 1.1rem;
      font-weight: 600;
    }
  `;

  render(): TemplateResult {
    return html`
      <div class="admin-dashboard">
        <a href="admin/data" class="admin-card">
          <svg-database></svg-database>
          <span class="admin-card-label">${translate('dataManager')}</span>
        </a>

        <a href="admin/entityConfig" class="admin-card">
          <svg-settings></svg-settings>
          <span class="admin-card-label">${translate('entityConfig')}</span>
        </a>
      </div>
    `;
  }
}
