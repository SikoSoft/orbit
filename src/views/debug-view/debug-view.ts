import { css, html, nothing, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import '@/components/push-notification/push-notification';
import '@/components/user-header/user-header';
import '@/components/forbidden-notice/forbidden-notice';
import { ViewElement } from '@/lib/ViewElement';
import { appState } from '@/state';
import { storage } from '@/lib/Storage';
import { translate } from '@/lib/Localization';
import { Role } from 'api-spec/models/Identity';

@customElement('debug-view')
export class DebugView extends ViewElement {
  private appState = appState;

  @state() private clearing = false;

  static styles = css`
    .debug-view {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: 1rem;
    }
  `;

  private async handleClearFactCache(): Promise<void> {
    this.clearing = true;
    await storage.clearFactCache();
    this.clearing = false;
  }

  render(): TemplateResult {
    if (!this.appState.hasRole(Role.DEBUG)) {
      return html`<user-header></user-header><forbidden-notice></forbidden-notice>`;
    }

    return html`
      <user-header></user-header>
      <div class="debug-view">
        <push-notification></push-notification>
        <button
          ?disabled=${this.clearing}
          @click=${this.handleClearFactCache}
        >
          ${translate('clearFactCache')}
        </button>
      </div>
    `;
  }
}
