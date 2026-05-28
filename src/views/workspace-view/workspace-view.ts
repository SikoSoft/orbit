import { css, html, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import '@/components/workspace-list/workspace-list';
import '@/components/login-form/login-form';
import '@/components/logged-in/logged-in';
import '@/components/logged-out/logged-out';
import '@/components/user-header/user-header';
import { ViewElement } from '@/lib/ViewElement';

@customElement('workspace-view')
export class WorkspaceView extends ViewElement {
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
          ><template><workspace-list></workspace-list></template
        ></logged-in>
      </div>
    `;
  }
}
