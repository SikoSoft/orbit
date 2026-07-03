import { html, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { ListFilter } from 'api-spec/models/List';

import { ViewElement } from '@/lib/ViewElement';

import '@/components/entity-list/entity-list';
import '@/components/user-header/user-header';

@customElement('entity-list-view')
export class EntityListView extends ViewElement {
  @state() private filter: ListFilter | null = this.parseFilterFromUrl();

  connectedCallback(): void {
    super.connectedCallback();
    this.filter = this.parseFilterFromUrl();
  }

  private parseFilterFromUrl(): ListFilter | null {
    const param = new URLSearchParams(window.location.search).get('filter');
    if (!param) {
      return null;
    }
    try {
      return JSON.parse(decodeURIComponent(param)) as ListFilter;
    } catch {
      return null;
    }
  }

  render(): TemplateResult {
    return html`
      <user-header></user-header>
      <entity-list .overrideFilter=${this.filter}></entity-list>
    `;
  }
}
