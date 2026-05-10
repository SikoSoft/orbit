import { html, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { Entity } from 'api-spec/models';

import { storage } from '@/lib/Storage';
import { appState } from '@/state';
import { routerState } from '@/lib/Router';
import { MobxReactionsController } from '@/lib/MobxReactionController';
import { translate } from '@/lib/Localization';

import '@/components/entity-list/entity-list-item/entity-list-item';

@customElement('entity-instance')
export class EntityInstance extends MobxLitElement {
  private appState = appState;
  private rx = new MobxReactionsController(this);

  @state()
  private entityId: number = 0;

  @state()
  private entity: Entity.Entity | null = null;

  @state()
  private loading = false;

  constructor() {
    super();

    this.rx.add({
      expr: () => routerState.params,
      effect: async (params: Record<string, string>) => {
        const id = Number(params.id);
        if (id && id !== this.entityId) {
          this.entityId = id;
          await this.loadEntity(id);
        }
      },
      opts: { fireImmediately: true },
    });
  }

  private async loadEntity(id: number): Promise<void> {
    const cached = this.appState.listEntities.find(e => e.id === id);
    if (cached) {
      this.entity = cached;
      return;
    }

    this.loading = true;
    this.entity = await storage.getEntity(id);
    this.loading = false;
  }

  render(): TemplateResult {
    if (this.loading) {
      return html`<p>${translate('loading')}</p>`;
    }

    if (!this.entity) {
      return html`<p>${translate('entityNotFound')}</p>`;
    }

    return html`
      <entity-list-item
        type=${this.entity.type}
        entityId=${this.entity.id}
        createdAt=${this.entity.createdAt}
        updatedAt=${this.entity.updatedAt}
        .tags=${this.entity.tags}
        .properties=${this.entity.properties}
        viewAccessPolicyId=${this.entity.viewAccessPolicyId}
        editAccessPolicyId=${this.entity.editAccessPolicyId}
        ?published=${this.entity.published}
        ?suggestion=${this.entity.suggestion}
      ></entity-list-item>
    `;
  }
}
