import { css, html, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import '@/components/account-form/account-form';
import '@/components/logged-in/logged-in';
import '@/components/user-header/user-header';
import { ViewElement } from '@/lib/ViewElement';
import { themed } from '@/lib/Theme';

@themed()
@customElement('account-view')
export class AccountView extends ViewElement {
  static styles = css`
    .view-content {
      margin-top: 1rem;
    }
  `;

  render(): TemplateResult {
    return html`
      <logged-in>
        <template><user-header></user-header></template>
      </logged-in>
      <div class="view-content">
        <account-form></account-form>
      </div>
    `;
  }
}
