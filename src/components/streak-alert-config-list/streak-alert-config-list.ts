import { html, css, LitElement, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { StreakAlertConfig } from 'api-spec/models/Fact';

import { translate } from '@/lib/Localization';
import { storage } from '@/lib/Storage';
import { addToast } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';
import { InputChangedEvent } from '@ss/ui/components/ss-input.events';
import { ConfirmationAcceptedEvent } from '@ss/ui/components/confirmation-modal.events';

import { AlertsChangedEvent } from './streak-alert-config-list.events';

import '@ss/ui/components/ss-button';
import '@ss/ui/components/ss-input';
import '@ss/ui/components/confirmation-modal';

@customElement('streak-alert-config-list')
export class StreakAlertConfigList extends LitElement {
  @property({ type: Number }) streakId: number = 0;
  @property({ type: Array }) alerts: StreakAlertConfig[] = [];

  @state() private editingAlertId: number | null = null;
  @state() private editingNoticeTime: number = 0;
  @state() private addingAlert: boolean = false;
  @state() private newNoticeTime: number = 60;
  @state() private confirmDeleteAlertId: number | null = null;

  static styles = css`
    .alert-list {
      margin-top: 0.75rem;
    }

    .alert-list-heading {
      font-size: 0.95rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }

    .no-alerts {
      font-style: italic;
      font-size: 0.875rem;
      padding: 0.25rem 0;
    }

    .alert-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0;
    }

    .alert-label {
      flex: 1;
      font-size: 0.875rem;
    }

    .alert-edit-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0;
    }

    .add-alert-form {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0;
    }

    .add-alert-actions {
      margin-top: 0.5rem;
    }
  `;

  private formatNoticeTime(minutes: number): string {
    if (minutes >= 60 && minutes % 60 === 0) {
      const hours = minutes / 60;
      if (hours === 1) {
        return translate('alertNoticeTimeHourLabel', { value: hours });
      }
      return translate('alertNoticeTimeHoursLabel', { value: hours });
    }
    return translate('alertNoticeTimeLabel', { value: minutes });
  }

  private handleEditAlert(alert: StreakAlertConfig): void {
    this.editingAlertId = alert.id;
    this.editingNoticeTime = alert.noticeTime;
  }

  private handleCancelEdit(): void {
    this.editingAlertId = null;
    this.editingNoticeTime = 0;
  }

  private async handleSaveEdit(): Promise<void> {
    const id = this.editingAlertId;
    if (id === null) {
      return;
    }

    const result = await storage.updateStreakAlertConfig?.(id, this.editingNoticeTime);

    if (!result?.isOk) {
      addToast(translate('failedToUpdateAlert'), NotificationType.ERROR);
      return;
    }

    this.editingAlertId = null;
    const updatedAlerts = this.alerts.map(a =>
      a.id === id ? { ...a, noticeTime: this.editingNoticeTime } : a,
    );
    this.dispatchEvent(new AlertsChangedEvent({ alerts: updatedAlerts }));
    addToast(translate('alertUpdated'), NotificationType.SUCCESS);
  }

  private handleDeleteRequested(id: number): void {
    this.confirmDeleteAlertId = id;
  }

  private async handleDeleteConfirmed(): Promise<void> {
    const id = this.confirmDeleteAlertId;
    this.confirmDeleteAlertId = null;

    if (id === null) {
      return;
    }

    const success = await storage.deleteStreakAlertConfig?.(id);

    if (!success) {
      addToast(translate('failedToDeleteAlert'), NotificationType.ERROR);
      return;
    }

    const updatedAlerts = this.alerts.filter(a => a.id !== id);
    this.dispatchEvent(new AlertsChangedEvent({ alerts: updatedAlerts }));
    addToast(translate('alertDeleted'), NotificationType.SUCCESS);
  }

  private handleStartAdd(): void {
    this.addingAlert = true;
    this.newNoticeTime = 60;
  }

  private handleCancelAdd(): void {
    this.addingAlert = false;
    this.newNoticeTime = 60;
  }

  private async handleSaveAdd(): Promise<void> {
    const result = await storage.createStreakAlertConfig?.(this.streakId, this.newNoticeTime);

    if (!result?.isOk) {
      addToast(translate('failedToAddAlert'), NotificationType.ERROR);
      return;
    }

    this.addingAlert = false;
    this.newNoticeTime = 60;
    const updatedAlerts = [...this.alerts, result.value];
    this.dispatchEvent(new AlertsChangedEvent({ alerts: updatedAlerts }));
    addToast(translate('alertAdded'), NotificationType.SUCCESS);
  }

  private renderAlertRow(alert: StreakAlertConfig): TemplateResult {
    if (this.editingAlertId === alert.id) {
      return html`
        <div class="alert-edit-row">
          <ss-input
            type="number"
            .value=${String(this.editingNoticeTime)}
            @input-changed=${(e: InputChangedEvent): void => {
              this.editingNoticeTime = Number(e.detail.value);
            }}
          ></ss-input>
          <ss-button @click=${(): Promise<void> => this.handleSaveEdit()}
            >${translate('saveAlert')}</ss-button>
          <ss-button @click=${(): void => this.handleCancelEdit()}
            >${translate('cancelAlert')}</ss-button>
        </div>
      `;
    }

    return html`
      <div class="alert-row">
        <span class="alert-label">${this.formatNoticeTime(alert.noticeTime)}</span>
        <ss-button @click=${(): void => this.handleEditAlert(alert)}
          >${translate('editAlert')}</ss-button>
        <ss-button
          negative
          @click=${(): void => this.handleDeleteRequested(alert.id)}
          >${translate('deleteAlert')}</ss-button>
      </div>
    `;
  }

  render(): TemplateResult {
    return html`
      <confirmation-modal
        message=${translate('confirmDeleteAlert')}
        ?open=${this.confirmDeleteAlertId !== null}
        @confirmation-accepted=${(_e: ConfirmationAcceptedEvent): Promise<void> =>
          this.handleDeleteConfirmed()}
        @confirmation-declined=${(): void => {
          this.confirmDeleteAlertId = null;
        }}
      ></confirmation-modal>
      <div class="alert-list">
        <div class="alert-list-heading">${translate('streakAlerts')}</div>
        ${this.alerts.length === 0 && !this.addingAlert
          ? html`<div class="no-alerts">${translate('noAlerts')}</div>`
          : repeat(this.alerts, a => a.id, a => this.renderAlertRow(a))}
        ${this.addingAlert
          ? html`
              <div class="add-alert-form">
                <ss-input
                  type="number"
                  label=${translate('minutesBeforeMidnight')}
                  .value=${String(this.newNoticeTime)}
                  @input-changed=${(e: InputChangedEvent): void => {
                    this.newNoticeTime = Number(e.detail.value);
                  }}
                ></ss-input>
                <ss-button @click=${(): Promise<void> => this.handleSaveAdd()}
                  >${translate('saveAlert')}</ss-button>
                <ss-button @click=${(): void => this.handleCancelAdd()}
                  >${translate('cancelAlert')}</ss-button>
              </div>
            `
          : html`
              <div class="add-alert-actions">
                <ss-button @click=${(): void => this.handleStartAdd()}
                  >${translate('addAlert')}</ss-button>
              </div>
            `}
      </div>
    `;
  }
}
