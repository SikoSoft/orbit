import { html, css, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { Fact } from 'api-spec/models/Fact';
import { translate } from '@/lib/Localization';
import { storage } from '@/lib/Storage';
import { addToast } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';

import { MobxLitElement } from '@adobe/lit-mobx';
import { themed } from '@/lib/Theme';

import '@/components/option-list-builder/option-list-builder';
import { OptionListBuilderItem } from '@/components/option-list-builder/option-list-builder.models';
import { OptionListUpdatedEvent } from '@/components/option-list-builder/option-list-builder.events';

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

  private get availableFacts(): OptionListBuilderItem[] {
    return this.allFacts.map(fact => ({
      id: String(fact.id),
      label: fact.name,
    }));
  }

  private handleOptionListUpdated(e: OptionListUpdatedEvent): void {
    this.dispatchEvent(
      new WorkspaceFactsChangedEvent({
        facts: e.detail.selected.map(Number),
      }),
    );
  }

  render(): TemplateResult {
    return html`
      <a href="/facts">${translate('manageFacts')}</a>

      <option-list-builder
        .available=${this.availableFacts}
        .selected=${this[WorkspaceFactManagerProp.FACTS].map(String)}
        emptyMessage=${translate('noWorkspaceFacts')}
        @option-list-updated=${this.handleOptionListUpdated}
      >
        <h3 slot="available-heading">${translate('availableFacts')}</h3>
        <h3 slot="selected-heading">${translate('workspaceFacts')}</h3>
      </option-list-builder>
    `;
  }
}
