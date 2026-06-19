import { css, html, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import '@/components/medal-list/medal-list';
import '@/components/login-form/login-form';
import '@/components/logged-in/logged-in';
import '@/components/logged-out/logged-out';
import '@/components/user-header/user-header';
import { ViewElement } from '@/lib/ViewElement';

@customElement('user-medals-view')
export class UserMedalsView extends ViewElement {
  static styles = css`
    .view-content {
      margin-top: 1rem;
    }
  `;

  render(): TemplateResult {
    return html`
      <user-header></user-header>
      <div class="view-content">
        <logged-out
          ><template><login-form></login-form></template
        ></logged-out>
        <logged-in
          ><template><medal-list></medal-list></template
          ></logged-in>
      </div>
    `;
  }
}
