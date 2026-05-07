import { html, css, nothing, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { NotificationType } from '@ss/ui/components/notification-provider.models';

import { translate } from '@/lib/Localization';
import { storage } from '@/lib/Storage';
import { themed } from '@/lib/Theme';
import { addToast } from '@/lib/Util';

import {
  EntitySuggestionProp,
  EntitySuggestionProps,
  entitySuggestionProps,
} from './entity-suggestion.models';
import { EntitySuggestionAddedEvent } from './entity-suggestion.events';

import '@ss/ui/components/ss-button';
import '@/components/entity-list/entity-list-item/entity-list-item';

@themed()
@customElement('entity-suggestion')
export class EntitySuggestion extends MobxLitElement {
  static styles = css`
    :host {
      display: block;
    }

    .suggestion {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .suggestion-item {
      flex: 1;
    }
  `;

  @property({ type: Object })
  [EntitySuggestionProp.ENTITY]: EntitySuggestionProps[EntitySuggestionProp.ENTITY] =
    entitySuggestionProps[EntitySuggestionProp.ENTITY].default;

  private async handleAdd(): Promise<void> {
    if (!this.entity) {
      return;
    }
    await storage.addEntitySuggestion(this.entity.id);
    addToast(translate('itemHasBeenAdded'), NotificationType.INFO);
    this.dispatchEvent(new EntitySuggestionAddedEvent({ id: this.entity.id }));
  }

  render(): TemplateResult | typeof nothing {
    if (!this.entity) {
      return nothing;
    }

    return html`
      <div class="suggestion">
        <div class="suggestion-item">
          <entity-list-item
            entityId=${this.entity.id}
            type=${this.entity.type}
            createdAt=${this.entity.createdAt}
            updatedAt=${this.entity.updatedAt}
            .tags=${this.entity.tags}
            .properties=${this.entity.properties}
            viewAccessPolicyId=${this.entity.viewAccessPolicyId ?? 0}
            editAccessPolicyId=${this.entity.editAccessPolicyId ?? 0}
            ?published=${this.entity.published}
            ?suggestion=${this.entity.suggestion}
          ></entity-list-item>
        </div>
        <ss-button
          text=${translate('add')}
          @click=${this.handleAdd}
        ></ss-button>
      </div>
    `;
  }
}
