import { css, html, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import '@/components/logged-in/logged-in';
import '@/components/password-form/password-form';
import '@/components/user-header/user-header';
import { ViewElement } from '@/lib/ViewElement';

@customElement('reset-password-view')
export class ResetPasswordView extends ViewElement {
  static styles = [
    css`
      .view-content {
        margin-top: 1rem;
      }
    `,
  ];

  render(): TemplateResult {
    return html`<user-header></user-header>
      <div class="view-content">
        <logged-in
          ><template><password-form></password-form></template
        ></logged-in>
      </div>`;
  }
}
