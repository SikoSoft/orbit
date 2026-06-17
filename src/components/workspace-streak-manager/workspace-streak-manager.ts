import { html, css, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { classMap } from 'lit/directives/class-map.js';

import { Streak } from 'api-spec/models/Fact';
import { translate } from '@/lib/Localization';
import { storage } from '@/lib/Storage';
import { addToast } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';

import { MobxLitElement } from '@adobe/lit-mobx';
import { themed } from '@/lib/Theme';

import '@ss/ui/components/sortable-list';
import '@ss/ui/components/sortable-item';
import '@ss/ui/components/ss-icon';
import { SortUpdatedEvent } from '@ss/ui/components/sortable-list.events';

import {
  WorkspaceStreakManagerProp,
  workspaceStreakManagerProps,
  WorkspaceStreakManagerProps,
} from './workspace-streak-manager.models';
import { WorkspaceStreaksChangedEvent } from './workspace-streak-manager.events';

@themed()
@customElement('workspace-streak-manager')
export class WorkspaceStreakManager extends MobxLitElement {
  static styles = css`
    :host {
      display: block;
    }

    a {
      display: inline-block;
      margin-bottom: 1rem;
    }

    ul {
      list-style: none;
      padding: 0;
    }

    ul li {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.25rem 0;
    }

    ul li.active {
      opacity: 0.5;
      pointer-events: none;
    }

    ul li.active ss-icon {
      display: none;
    }

    ss-icon {
      cursor: pointer;
    }

    .empty {
      font-style: italic;
    }

    h3 {
      margin: 1rem 0 0.5rem;
    }
  `;

  @property({ type: Array })
  [WorkspaceStreakManagerProp.STREAKS]: WorkspaceStreakManagerProps[WorkspaceStreakManagerProp.STREAKS] =
    workspaceStreakManagerProps[WorkspaceStreakManagerProp.STREAKS].default;

  @state()
  allStreaks: Streak[] = [];

  connectedCallback(): void {
    super.connectedCallback();
    this.loadStreaks();
  }

  async loadStreaks(): Promise<void> {
    try {
      const { streaks } = await storage.getStreaks();
      this.allStreaks = streaks;
    } catch {
      addToast(translate('failedToLoadStreaks'), NotificationType.ERROR);
    }
  }

  private get workspaceStreaks(): Streak[] {
    return this[WorkspaceStreakManagerProp.STREAKS]
      .map(id => this.allStreaks.find(s => s.id === id))
      .filter((s): s is Streak => s !== undefined);
  }

  private addStreak(streakId: number): void {
    this.dispatchEvent(
      new WorkspaceStreaksChangedEvent({
        streaks: [...this[WorkspaceStreakManagerProp.STREAKS], streakId],
      }),
    );
  }

  private removeStreak(streakId: number): void {
    this.dispatchEvent(
      new WorkspaceStreaksChangedEvent({
        streaks: this[WorkspaceStreakManagerProp.STREAKS].filter(id => id !== streakId),
      }),
    );
  }

  private handleSortUpdated(e: SortUpdatedEvent): void {
    this.dispatchEvent(
      new WorkspaceStreaksChangedEvent({
        streaks: e.detail.sortedIds.map(Number),
      }),
    );
  }

  render(): TemplateResult {
    return html`
      <a href="/streaks">${translate('manageStreaks')}</a>

      <h3>${translate('availableStreaks')}</h3>
      <ul>
        ${repeat(
          this.allStreaks,
          streak => streak.id,
          streak =>
            html`<li
              class=${classMap({
                active: this[WorkspaceStreakManagerProp.STREAKS].includes(streak.id),
              })}
            >
              <span>${streak.name}</span>
              <ss-icon
                name="add"
                size="16"
                @click=${(): void => this.addStreak(streak.id)}
              ></ss-icon>
            </li>`,
        )}
      </ul>

      <h3>${translate('workspaceStreaks')}</h3>
      ${this.workspaceStreaks.length > 0
        ? html`
            <sortable-list @sort-updated=${this.handleSortUpdated}>
              ${this.workspaceStreaks.map(
                streak =>
                  html`<sortable-item id=${String(streak.id)}>
                    <span>${streak.name}</span>
                    <ss-icon
                      name="trash"
                      size="16"
                      @click=${(): void => this.removeStreak(streak.id)}
                    ></ss-icon>
                  </sortable-item>`,
              )}
            </sortable-list>
          `
        : html`<p class="empty">${translate('noWorkspaceStreaks')}</p>`}
    `;
  }
}
