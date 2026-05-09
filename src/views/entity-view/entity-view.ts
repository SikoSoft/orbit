import { html, css, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import { ViewElement } from '@/lib/ViewElement';

import '@/components/entity-instance/entity-instance';
import '@/components/login-form/login-form';
import '@/components/logged-in/logged-in';
import '@/components/logged-out/logged-out';
import '@/components/user-header/user-header';

@customElement('entity-view')
export class EntityView extends ViewElement {
  static styles = [
    css`
      .view-content {
        margin-top: 1rem;
      }
    `,
  ];

  render(): TemplateResult {
    return html`
      <user-header></user-header>
      <div class="view-content">
        <logged-out
          ><template><login-form></login-form></template
        ></logged-out>
        <logged-in>
          <template><entity-instance></entity-instance></template>
        </logged-in>
      </div>
    `;
  }
}
