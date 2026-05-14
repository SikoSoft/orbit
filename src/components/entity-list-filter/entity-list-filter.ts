import { html, nothing, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { appState } from '@/state';
import { EntityListLoadEvent } from '@/components/entity-list/entity-list.events';
import { ListFilterUpdatedEvent } from '@/components/list-filter/list-filter.events';

import '@/components/list-filter/list-filter';

@customElement('entity-list-filter')
export class EntityListFilter extends MobxLitElement {
  private state = appState;

  private handleFilterUpdated = (_e: ListFilterUpdatedEvent): void => {
    this.dispatchEvent(new EntityListLoadEvent());
  };

  render(): TemplateResult {
    if (this.state.listConfigId) {
      return html`${nothing}`;
    }

    return html`<list-filter
      @list-filter-updated=${this.handleFilterUpdated}
    ></list-filter>`;
  }
}
