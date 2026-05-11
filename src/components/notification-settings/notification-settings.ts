import { css, html, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { appState } from '@/state';
import { translate } from '@/lib/Localization';
import { themed } from '@/lib/Theme';

import '@ss/ui/components/ss-button';

@themed()
@customElement('notification-settings')
export class NotificationSettings extends MobxLitElement {
  private state = appState;

  static styles = css`
    .notification-settings {
      padding: 1rem 0;
    }

    h3 {
      margin: 0 0 0.75rem;
    }
  `;

  private handleEnable = async (): Promise<void> => {
    await this.state.enableNotifications();
  };

  private handleDisable = async (): Promise<void> => {
    await this.state.disableNotifications();
  };

  render(): TemplateResult {
    if (!this.state.notificationsSupported) {
      return html`
        <div class="notification-settings">
          <p>${translate('notifications.notSupported')}</p>
        </div>
      `;
    }

    if (this.state.permissionState === 'denied') {
      return html`
        <div class="notification-settings">
          <p>${translate('notifications.blocked')}</p>
        </div>
      `;
    }

    return html`
      <div class="notification-settings">
        <h3>${translate('notifications.heading')}</h3>
        ${this.state.subscription
          ? html`<ss-button @click=${this.handleDisable}
              >${translate('notifications.disable')}</ss-button
            >`
          : html`<ss-button @click=${this.handleEnable}
              >${translate('notifications.enable')}</ss-button
            >`}
      </div>
    `;
  }
}
