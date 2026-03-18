import { html, nothing, TemplateResult } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';

import '@/components/list-config/list-config';
import '@/components/public-entity-list/public-entity-list';

import { ViewElement } from '@/lib/ViewElement';
import { PublicEntityList } from '@/components/public-entity-list/public-entity-list';
import { listReadEventName } from '@/components/public-entity-list/public-entity-list.events';

@customElement('public-list-view')
export class PublicListView extends ViewElement {
  @state()
  listReady = false;

  @query('public-entity-list')
  publicEntityList: PublicEntityList | undefined;

  constructor() {
    super();

    this.addEventListener(listReadEventName, () => {
      this.listReady = true;
    });
  }

  sync(reset: boolean): void {
    if (this.publicEntityList) {
      this.publicEntityList.sync(reset);
    }
  }
  render(): TemplateResult {
    return html`${this.listReady
        ? html`<list-config viewOnly></list-config>`
        : nothing}

      <public-entity-list publicView></public-entity-list>`;
  }
}
