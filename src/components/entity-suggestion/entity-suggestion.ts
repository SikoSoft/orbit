import { html, css, nothing, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { themed } from '@/lib/Theme';

import {
  EntitySuggestionProp,
  EntitySuggestionProps,
  entitySuggestionProps,
} from './entity-suggestion.models';

import '@/components/entity-list/entity-list-item/entity-list-item';

@themed()
@customElement('entity-suggestion')
export class EntitySuggestion extends MobxLitElement {
  static styles = css`
    :host {
      display: block;
    }
  `;

  @property({ type: Object })
  [EntitySuggestionProp.ENTITY]: EntitySuggestionProps[EntitySuggestionProp.ENTITY] =
    entitySuggestionProps[EntitySuggestionProp.ENTITY].default;

  render(): TemplateResult | typeof nothing {
    if (!this.entity) {
      return nothing;
    }

    return html`
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
    `;
  }
}
