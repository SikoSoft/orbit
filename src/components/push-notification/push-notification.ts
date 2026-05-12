import { css, html, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { appState } from '@/state';
import { translate } from '@/lib/Localization';
import { addToast } from '@/lib/Util';
import { themed } from '@/lib/Theme';
import { config } from '@/models/Config';
import { NotificationType } from '@ss/ui/components/notification-provider.models';

import { InputChangedEvent } from '@ss/ui/components/ss-input.events';
import { NotificationAction, SendNotificationBody } from './push-notification.models';

import '@ss/ui/components/ss-button';
import '@ss/ui/components/ss-input';

@themed()
@customElement('push-notification')
export class PushNotification extends MobxLitElement {
  private appState = appState;

  static styles = css`
    .push-notification {
      padding: 1rem 0;
    }

    h3 {
      margin: 0 0 0.75rem;
    }

    .form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    label {
      font-size: 0.875rem;
      font-weight: bold;
      color: var(--label-color, var(--text-secondary, #555));
    }
  `;

  @state() private notificationTitle: string = '';
  @state() private body: string = '';
  @state() private actionTitle: string = '';
  @state() private actionUrl: string = '';
  @state() private loading: boolean = false;

  private async send(): Promise<void> {
    if (!this.notificationTitle || !this.body) {
      addToast(translate('pushNotification.titleBodyRequired'), NotificationType.ERROR);
      return;
    }

    this.loading = true;

    const actions: NotificationAction[] = this.actionTitle
      ? [{ action: 'primary', title: this.actionTitle, url: this.actionUrl || '/' }]
      : [];

    const payload: SendNotificationBody = {
      userId: this.appState.user!.id,
      title: this.notificationTitle,
      body: this.body,
      actions,
    };

    const url = new URL('notification', config.apiUrl);

    try {
      const response = await fetch(url.href, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: import.meta.env.APP_SYSTEM_API_KEY,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        addToast(translate('pushNotification.sent'), NotificationType.SUCCESS);
      } else {
        addToast(translate('pushNotification.failed'), NotificationType.ERROR);
      }
    } catch {
      addToast(translate('pushNotification.failed'), NotificationType.ERROR);
    }

    this.loading = false;
  }

  render(): TemplateResult {
    return html`
      <div class="push-notification">
        <h3>${translate('pushNotification.heading')}</h3>
        <div class="form">
          <div class="field">
            <label>${translate('pushNotification.title')}</label>
            <ss-input
              placeholder=${translate('pushNotification.title')}
              value=${this.notificationTitle}
              @input-changed=${(e: InputChangedEvent): void => {
                this.notificationTitle = e.detail.value;
              }}
            ></ss-input>
          </div>
          <div class="field">
            <label>${translate('pushNotification.body')}</label>
            <ss-input
              placeholder=${translate('pushNotification.body')}
              value=${this.body}
              @input-changed=${(e: InputChangedEvent): void => {
                this.body = e.detail.value;
              }}
            ></ss-input>
          </div>
          <div class="field">
            <label>${translate('pushNotification.actionTitle')}</label>
            <ss-input
              placeholder=${translate('pushNotification.actionTitlePlaceholder')}
              value=${this.actionTitle}
              @input-changed=${(e: InputChangedEvent): void => {
                this.actionTitle = e.detail.value;
              }}
            ></ss-input>
          </div>
          <div class="field">
            <label>${translate('pushNotification.actionUrl')}</label>
            <ss-input
              placeholder=${translate('pushNotification.actionUrlPlaceholder')}
              value=${this.actionUrl}
              @input-changed=${(e: InputChangedEvent): void => {
                this.actionUrl = e.detail.value;
              }}
            ></ss-input>
          </div>
          <ss-button
            @click=${this.send}
            text=${translate('pushNotification.send')}
            ?loading=${this.loading}
          ></ss-button>
        </div>
      </div>
    `;
  }
}
