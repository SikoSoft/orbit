import { html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { Entity } from 'api-spec/models';

import { ViewElement } from '@/lib/ViewElement';
import { storage } from '@/lib/Storage';
import { appState } from '@/state';
import { routerState } from '@/lib/Router';
import { MobxReactionsController } from '@/lib/MobxReactionController';
import { translate } from '@/lib/Localization';

import '@/components/entity-list/entity-list-item/entity-list-item';
import '@/components/login-form/login-form';
import '@/components/logged-in/logged-in';
import '@/components/logged-out/logged-out';
import '@/components/user-header/user-header';

@customElement('entity-view')
export class EntityView extends ViewElement {
  private appState = appState;
  private rx = new MobxReactionsController(this);

  static styles = [
    css`
      .view-content {
        margin-top: 1rem;
      }
    `,
  ];

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
    return html`
      <user-header></user-header>
      <div class="view-content">
        <logged-out
          ><template><login-form></login-form></template
        ></logged-out>
        <logged-in>
          <template>
            ${this.loading
              ? html`<p>${translate('loading')}</p>`
              : this.entity
                ? html`<entity-list-item
                    .type=${this.entity.type}
                    .entityId=${this.entity.id}
                    .createdAt=${this.entity.createdAt}
                    .updatedAt=${this.entity.updatedAt}
                    .tags=${this.entity.tags}
                    .properties=${this.entity.properties}
                    .viewAccessPolicyId=${this.entity.viewAccessPolicyId}
                    .editAccessPolicyId=${this.entity.editAccessPolicyId}
                    .published=${this.entity.published}
                    .suggestion=${this.entity.suggestion}
                  ></entity-list-item>`
                : html`<p>${translate('entityNotFound')}</p>`}
          </template>
        </logged-in>
      </div>
    `;
  }
}
