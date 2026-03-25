import { html, LitElement, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import '@/components/logged-in/logged-in';
import '@/components/page-nav/page-nav';
import '@/components/list-config/list-config';
import '@/components/bulk-manager/bulk-manager';
import '@/components/floating-widget/floating-widget';
import '@/components/add-entity-widget/add-entity-widget';

@customElement('user-header')
export class UserHeader extends LitElement {
  render(): TemplateResult {
    return html`<logged-in>
      <template>
        <list-config></list-config>

        <page-nav></page-nav>

        <bulk-manager></bulk-manager>

        <floating-widget></floating-widget>

        <add-entity-widget></add-entity-widget>
      </template>
    </logged-in>`;
  }
}
