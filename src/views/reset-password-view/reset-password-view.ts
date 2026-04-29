import { html, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import '@/components/logged-in/logged-in';
import '@/components/password-form/password-form';
import '@/components/user-header/user-header';
import { ViewElement } from '@/lib/ViewElement';

@customElement('reset-password-view')
export class ResetPasswordView extends ViewElement {
  render(): TemplateResult {
    return html`<user-header></user-header>
      <logged-in
        ><template><password-form></password-form></template
      ></logged-in>`;
  }
}
