import { html, css, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { classMap } from 'lit/directives/class-map.js';

import { Fact } from 'api-spec/models/Fact';
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
  WorkspaceFactManagerProp,
  workspaceFactManagerProps,
  WorkspaceFactManagerProps,
} from './workspace-fact-manager.models';
import { WorkspaceFactsChangedEvent } from './workspace-fact-manager.events';

@themed()
@customElement('workspace-fact-manager')
export class WorkspaceFactManager extends MobxLitElement {
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
  [WorkspaceFactManagerProp.FACTS]: WorkspaceFactManagerProps[WorkspaceFactManagerProp.FACTS] =
    workspaceFactManagerProps[WorkspaceFactManagerProp.FACTS].default;

  @state()
  allFacts: Fact[] = [];

  connectedCallback(): void {
    super.connectedCallback();
    this.loadFacts();
  }

  async loadFacts(): Promise<void> {
    try {
      const { facts } = await storage.getFacts();
      this.allFacts = facts;
    } catch {
      addToast(translate('failedToLoadFacts'), NotificationType.ERROR);
    }
  }

  private get workspaceFacts(): Fact[] {
    return this[WorkspaceFactManagerProp.FACTS]
      .map(id => this.allFacts.find(f => f.id === id))
      .filter((f): f is Fact => f !== undefined);
  }

  private addFact(factId: number): void {
    this.dispatchEvent(
      new WorkspaceFactsChangedEvent({
        facts: [...this[WorkspaceFactManagerProp.FACTS], factId],
      }),
    );
  }

  private removeFact(factId: number): void {
    this.dispatchEvent(
      new WorkspaceFactsChangedEvent({
        facts: this[WorkspaceFactManagerProp.FACTS].filter(id => id !== factId),
      }),
    );
  }

  private handleSortUpdated(e: SortUpdatedEvent): void {
    this.dispatchEvent(
      new WorkspaceFactsChangedEvent({
        facts: e.detail.sortedIds.map(Number),
      }),
    );
  }

  render(): TemplateResult {
    return html`
      <a href="/facts">${translate('manageFacts')}</a>

      <h3>${translate('availableFacts')}</h3>
      <ul>
        ${repeat(
          this.allFacts,
          fact => fact.id,
          fact =>
            html`<li
              class=${classMap({
                active: this[WorkspaceFactManagerProp.FACTS].includes(fact.id),
              })}
            >
              <span>${fact.name}</span>
              <ss-icon
                name="add"
                size="16"
                @click=${(): void => this.addFact(fact.id)}
              ></ss-icon>
            </li>`,
        )}
      </ul>

      <h3>${translate('workspaceFacts')}</h3>
      ${this.workspaceFacts.length > 0
        ? html`
            <sortable-list @sort-updated=${this.handleSortUpdated}>
              ${this.workspaceFacts.map(
                fact =>
                  html`<sortable-item id=${String(fact.id)}>
                    <span>${fact.name}</span>
                    <ss-icon
                      name="trash"
                      size="16"
                      @click=${(): void => this.removeFact(fact.id)}
                    ></ss-icon>
                  </sortable-item>`,
              )}
            </sortable-list>
          `
        : html`<p class="empty">${translate('noWorkspaceFacts')}</p>`}
    `;
  }
}
