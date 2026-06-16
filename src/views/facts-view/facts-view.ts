import { html, css, TemplateResult } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import { ViewElement } from '@/lib/ViewElement';
import { themed } from '@/lib/Theme';
import { appState } from '@/state';
import { FactSavedEvent } from '@/components/fact-config-form/fact-config-form.events';
import { FactList } from '@/components/fact-list/fact-list';

import '@/components/user-header/user-header';
import '@/components/login-form/login-form';
import '@/components/fact-config-form/fact-config-form';
import '@/components/fact-list/fact-list';

@customElement('facts-view')
@themed()
export class FactsView extends ViewElement {
  private appState = appState;

  @query('fact-list') private factList: FactList | undefined;

  static styles = css`
    .view-content {
      margin-top: 1rem;
      padding: 0 1rem;
    }

    .box {
      padding: 1rem;
    }
  `;

  render(): TemplateResult {
    if (!this.appState.authToken) {
      return html`
        <user-header></user-header>
        <div class="view-content"><login-form></login-form></div>
      `;
    }

    return html`
      <user-header></user-header>
      <div class="view-content">
        <div class="box">
          <fact-config-form
            @fact-saved=${(_e: FactSavedEvent): void => {
              this.factList?.refresh();
            }}
          ></fact-config-form>
        </div>
        <fact-list></fact-list>
      </div>
    `;
  }
}
