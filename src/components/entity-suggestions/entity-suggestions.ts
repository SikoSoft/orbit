import { html, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { Entity } from 'api-spec/models/Entity';
import { appState } from '@/state';
import { storage } from '@/lib/Storage';
import { themed } from '@/lib/Theme';

import { EntitySuggestionAddedEvent } from '@/components/entity-suggestion/entity-suggestion.events';
import '@/components/entity-suggestion/entity-suggestion';

@themed()
@customElement('entity-suggestions')
export class EntitySuggestions extends MobxLitElement {
  private state = appState;

  @state() private entities: Entity[] = [];

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    this.entities = await storage.getEntitySuggestions(
      this.state.listConfig.filter,
    );
  }

  private handleSuggestionAdded(e: EntitySuggestionAddedEvent): void {
    this.entities = this.entities.filter(entity => entity.id !== e.detail.id);
  }

  render(): TemplateResult {
    return html`
      ${repeat(
        this.entities,
        entity => entity.id,
        entity => html`
          <entity-suggestion
            .entity=${entity}
            @entity-suggestion-added=${this.handleSuggestionAdded}
          ></entity-suggestion>
        `,
      )}
    `;
  }
}
