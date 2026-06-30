import { html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { Streak, StreakResult } from 'api-spec/models/Fact';

import { translate } from '@/lib/Localization';
import { appState } from '@/state';
import { storage } from '@/lib/Storage';
import { addToast } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';
import { CollapsableToggledEvent } from '@ss/ui/components/ss-collapsable.events';
import { ConfirmationAcceptedEvent } from '@ss/ui/components/confirmation-modal.events';
import { StreakSavedEvent } from '@/components/streak-config-form/streak-config-form.events';
import { AlertsChangedEvent } from '@/components/streak-alert-config-list/streak-alert-config-list.events';

import '@ss/ui/components/ss-collapsable';
import '@ss/ui/components/ss-button';
import '@ss/ui/components/confirmation-modal';
import '@/components/streak-config-form/streak-config-form';
import '@/components/streak-alert-config-list/streak-alert-config-list';

@customElement('streak-list')
export class StreakList extends MobxLitElement {
  private appState = appState;

  @state() private streaks: Streak[] = [];
  @state() private results: StreakResult[] = [];
  @state() private confirmDeleteStreakId: number | null = null;
  @state() private editingStreakId: number | null = null;

  static styles = css`
    .saved-streaks {
      margin-top: 2rem;
    }

    ss-collapsable {
      display: block;
      margin-bottom: 1rem;
    }

    .saved-streaks-heading {
      font-size: 1.1rem;
      font-weight: bold;
      margin-bottom: 0.75rem;
    }

    .no-saved-streaks {
      font-style: italic;
      padding: 0.5rem 0;
    }

    .streak-actions {
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem 0;
    }

    .streak-stats {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 0.5rem;
    }

    .stat {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-label {
      font-size: 0.8125rem;
      opacity: 0.7;
    }

    .stat-value {
      font-size: 1.25rem;
      font-weight: bold;
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    void this.loadStreaks();
  }

  refresh(): void {
    void this.loadStreaks();
  }

  private async loadStreaks(): Promise<void> {
    const data = await storage.getStreaks();
    this.streaks = data.streaks;
    this.results = data.results;
  }

  private getResult(streakId: number): StreakResult | undefined {
    return this.results.find(r => r.streakId === streakId);
  }

  private handleDeleteRequested(id: number): void {
    this.confirmDeleteStreakId = id;
  }

  private async handleDeleteConfirmed(): Promise<void> {
    const id = this.confirmDeleteStreakId;
    this.confirmDeleteStreakId = null;

    if (id === null) {
      return;
    }

    const success = await storage.deleteStreak?.(id);

    if (!success) {
      addToast(translate('failedToDeleteStreak'), NotificationType.ERROR);
      return;
    }

    this.streaks = this.streaks.filter(s => s.id !== id);
    addToast(translate('streakDeleted'), NotificationType.SUCCESS);
  }

  private handleEdit(id: number): void {
    this.editingStreakId = id;
  }

  private handleCancelEdit(): void {
    this.editingStreakId = null;
  }

  private handleStreakSaved(e: StreakSavedEvent): void {
    e.stopPropagation();
    this.editingStreakId = null;
    void this.loadStreaks();
  }

  private isPanelOpen(id: number): boolean {
    return this.appState.collapsablePanelState[`streak-${id}`] || false;
  }

  private renderStreakView(streak: Streak): TemplateResult {
    const result = this.getResult(streak.id);
    return html`
      <div class="streak-stats">
        <div class="stat">
          <span class="stat-label">${translate('currentStreak')}</span>
          <span class="stat-value">${result?.current ?? 0}</span>
        </div>
        <div class="stat">
          <span class="stat-label">${translate('longestStreak')}</span>
          <span class="stat-value">${result?.longest ?? 0}</span>
        </div>
      </div>
      <div class="streak-actions">
        <ss-button
          @click=${(): void => this.handleEdit(streak.id)}
        >${translate('editStreak')}</ss-button>
        <ss-button
          negative
          @click=${(): void => this.handleDeleteRequested(streak.id)}
        >${translate('deleteStreak')}</ss-button>
      </div>
      <streak-alert-config-list
        .streakId=${streak.id}
        .alerts=${streak.alerts}
        @alerts-changed=${(e: AlertsChangedEvent): void => {
          this.streaks = this.streaks.map(s =>
            s.id === streak.id ? { ...s, alerts: e.detail.alerts } : s,
          );
        }}
      ></streak-alert-config-list>
    `;
  }

  private renderStreakEdit(streak: Streak): TemplateResult {
    return html`
      <streak-config-form
        .streak=${streak}
        @streak-saved=${(e: StreakSavedEvent): void => this.handleStreakSaved(e)}
      ></streak-config-form>
      <div class="streak-actions">
        <ss-button @click=${(): void => this.handleCancelEdit()}
          >${translate('cancelEdit')}</ss-button>
      </div>
    `;
  }

  render(): TemplateResult {
    return html`
      <confirmation-modal
        message=${translate('confirmDeleteStreak')}
        ?open=${this.confirmDeleteStreakId !== null}
        @confirmation-accepted=${(_e: ConfirmationAcceptedEvent): Promise<void> =>
          this.handleDeleteConfirmed()}
        @confirmation-declined=${(): void => {
          this.confirmDeleteStreakId = null;
        }}
      ></confirmation-modal>
      <div class="saved-streaks">
        <div class="saved-streaks-heading">${translate('savedStreaks')}</div>
        ${this.streaks.length === 0
          ? html`<div class="no-saved-streaks">${translate('noSavedStreaks')}</div>`
          : repeat(
              this.streaks,
              streak => streak.id,
              streak => html`
                <ss-collapsable
                  title=${streak.name}
                  panelId=${'streak-' + streak.id}
                  ?open=${this.isPanelOpen(streak.id)}
                  @collapsable-toggled=${(e: CollapsableToggledEvent): void => {
                    this.dispatchEvent(new CollapsableToggledEvent(e.detail));
                  }}
                >
                  ${this.editingStreakId === streak.id
                    ? this.renderStreakEdit(streak)
                    : this.renderStreakView(streak)}
                </ss-collapsable>
              `,
            )}
      </div>
    `;
  }
}
