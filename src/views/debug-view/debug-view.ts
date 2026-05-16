import { html, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import '@/components/push-notification/push-notification';
import '@/components/user-header/user-header';
import { ViewElement } from '@/lib/ViewElement';

@customElement('debug-view')
export class DebugView extends ViewElement {
  render(): TemplateResult {
    return html`
      <user-header></user-header>
      <push-notification></push-notification>
    `;
  }
}
