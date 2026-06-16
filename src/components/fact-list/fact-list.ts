import { html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { Fact, FactResult } from 'api-spec/models/Fact';

import { translate } from '@/lib/Localization';
import { appState } from '@/state';
import { storage } from '@/lib/Storage';
import { addToast } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';
import { CollapsableToggledEvent } from '@ss/ui/components/ss-collapsable.events';
import { ConfirmationAcceptedEvent } from '@ss/ui/components/confirmation-modal.events';
import { FactSavedEvent } from '@/components/fact-config-form/fact-config-form.events';

import '@ss/ui/components/ss-collapsable';
import '@ss/ui/components/ss-button';
import '@ss/ui/components/confirmation-modal';
import '@/components/fact-config-form/fact-config-form';

@customElement('fact-list')
export class FactList extends MobxLitElement {
  private appState = appState;

  @state() private facts: Fact[] = [];
  @state() private results: FactResult[] = [];
  @state() private confirmDeleteFactId: number | null = null;
  @state() private editingFactId: number | null = null;

  static styles = css`
    .saved-facts {
      margin-top: 2rem;
    }

    ss-collapsable {
      display: block;
      margin-bottom: 1rem;
    }

    .saved-facts-heading {
      font-size: 1.1rem;
      font-weight: bold;
      margin-bottom: 0.75rem;
    }

    .no-saved-facts {
      font-style: italic;
      padding: 0.5rem 0;
    }

    .fact-actions {
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem 0;
    }

    .fact-stats {
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
    void this.loadFacts();
  }

  refresh(): void {
    void this.loadFacts();
  }

  private async loadFacts(): Promise<void> {
    const data = await storage.getFacts();
    this.facts = data.facts;
    this.results = data.results;
  }

  private getResult(factId: number): FactResult | undefined {
    return this.results.find(r => r.factId === factId);
  }

  private handleDeleteRequested(id: number): void {
    this.confirmDeleteFactId = id;
  }

  private async handleDeleteConfirmed(): Promise<void> {
    const id = this.confirmDeleteFactId;
    this.confirmDeleteFactId = null;

    if (id === null) {
      return;
    }

    const success = await storage.deleteFact?.(id);

    if (!success) {
      addToast(translate('failedToDeleteFact'), NotificationType.ERROR);
      return;
    }

    this.facts = this.facts.filter(f => f.id !== id);
    addToast(translate('factDeleted'), NotificationType.SUCCESS);
  }

  private handleEdit(id: number): void {
    this.editingFactId = id;
  }

  private handleCancelEdit(): void {
    this.editingFactId = null;
  }

  private handleFactSaved(e: FactSavedEvent): void {
    e.stopPropagation();
    this.editingFactId = null;
    void this.loadFacts();
  }

  private isPanelOpen(id: number): boolean {
    return this.appState.collapsablePanelState[`fact-${id}`] || false;
  }

  private renderFactView(fact: Fact): TemplateResult {
    const result = this.getResult(fact.id);
    return html`
      <div class="fact-stats">
        <div class="stat">
          <span class="stat-label">${translate('factValue')}</span>
          <span class="stat-value">${result?.value ?? 0}</span>
        </div>
      </div>
      <div class="fact-actions">
        <ss-button
          @click=${(): void => this.handleEdit(fact.id)}
        >${translate('editFact')}</ss-button>
        <ss-button
          negative
          @click=${(): void => this.handleDeleteRequested(fact.id)}
        >${translate('deleteFact')}</ss-button>
      </div>
    `;
  }

  private renderFactEdit(fact: Fact): TemplateResult {
    return html`
      <fact-config-form
        .fact=${fact}
        @fact-saved=${(e: FactSavedEvent): void => this.handleFactSaved(e)}
      ></fact-config-form>
      <div class="fact-actions">
        <ss-button @click=${(): void => this.handleCancelEdit()}
          >${translate('cancelEdit')}</ss-button>
      </div>
    `;
  }

  render(): TemplateResult {
    return html`
      <confirmation-modal
        message=${translate('confirmDeleteFact')}
        ?open=${this.confirmDeleteFactId !== null}
        @confirmation-accepted=${(_e: ConfirmationAcceptedEvent): Promise<void> =>
          this.handleDeleteConfirmed()}
        @confirmation-declined=${(): void => {
          this.confirmDeleteFactId = null;
        }}
      ></confirmation-modal>
      <div class="saved-facts">
        <div class="saved-facts-heading">${translate('savedFacts')}</div>
        ${this.facts.length === 0
          ? html`<div class="no-saved-facts">${translate('noSavedFacts')}</div>`
          : repeat(
              this.facts,
              fact => fact.id,
              fact => html`
                <ss-collapsable
                  title=${fact.name}
                  panelId=${'fact-' + fact.id}
                  ?open=${this.isPanelOpen(fact.id)}
                  @collapsable-toggled=${(e: CollapsableToggledEvent): void => {
                    this.dispatchEvent(new CollapsableToggledEvent(e.detail));
                  }}
                >
                  ${this.editingFactId === fact.id
                    ? this.renderFactEdit(fact)
                    : this.renderFactView(fact)}
                </ss-collapsable>
              `,
            )}
      </div>
    `;
  }
}
