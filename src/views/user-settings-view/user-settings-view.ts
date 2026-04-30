import { css, html, nothing, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import '@/components/login-form/login-form';
import '@/components/user-header/user-header';
import '@/components/setting/user-settings/user-settings';
import '@/components/setting/system-settings/system-settings';
import '@ss/ui/components/tab-container';
import '@ss/ui/components/tab-pane';

import { ViewElement } from '@/lib/ViewElement';
import { translate } from '@/lib/Localization';
import { appState } from '@/state';
import { TabIndexChangedEvent } from '@ss/ui/components/tab-container.events';

@customElement('user-settings-view')
export class UserSettingsView extends ViewElement {
  private state = appState;

  static styles = css`
    .view-content {
      margin-top: 1rem;
    }
  `;

  @state() activeTabIndex: number = 0;

  private get isLoggedIn(): boolean {
    return this.state.authToken !== '';
  }

  private get isAdmin(): boolean {
    return this.state.hasRole('admin');
  }

  private renderAdminSettings(): TemplateResult {
    return html`
      <tab-container
        @tab-index-changed=${(e: TabIndexChangedEvent): void => {
          this.activeTabIndex = e.detail.index;
        }}
      >
        <tab-pane title=${translate('settingsTab.user')}>
          ${this.activeTabIndex === 0
            ? html`<user-settings></user-settings>`
            : nothing}
        </tab-pane>
        <tab-pane title=${translate('settingsTab.system')}>
          ${this.activeTabIndex === 1
            ? html`<system-settings></system-settings>`
            : nothing}
        </tab-pane>
      </tab-container>
    `;
  }

  render(): TemplateResult {
    return html`
      <user-header></user-header>
      <div class="view-content">
        ${this.isLoggedIn
          ? this.isAdmin
            ? this.renderAdminSettings()
            : html`<user-settings></user-settings>`
          : html`<login-form></login-form>`}
      </div>
    `;
  }
}
