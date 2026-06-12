import { html, css, TemplateResult } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import { ViewElement } from '@/lib/ViewElement';
import { appState } from '@/state';
import { StreakSavedEvent } from '@/components/streak-config-form/streak-config-form.events';
import { StreakList } from '@/components/streak-list/streak-list';

import '@/components/user-header/user-header';
import '@/components/login-form/login-form';
import '@/components/streak-config-form/streak-config-form';
import '@/components/streak-list/streak-list';

@customElement('streaks-view')
export class StreaksView extends ViewElement {
  private appState = appState;

  @query('streak-list') private streakList: StreakList | undefined;

  static styles = css`
    .view-content {
      margin-top: 1rem;
      padding: 0 1rem;
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
        <streak-config-form
          @streak-saved=${(_e: StreakSavedEvent): void => {
            this.streakList?.refresh();
          }}
        ></streak-config-form>
        <streak-list></streak-list>
      </div>
    `;
  }
}
