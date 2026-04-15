import { translate } from '@/lib/Localization';
import { css, html, nothing, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { appState } from '@/state';

import '@ss/ui/components/ss-collapsable';
import '@ss/ui/components/tab-container';
import '@ss/ui/components/tab-pane';
import '@/components/data-manager/export-tool/export-tool';
import '@/components/data-manager/import-tool/import-tool';
import '@/components/data-manager/sync-tool/sync-tool';
import '@/components/data-manager/tactical-nuke/tactical-nuke';
import { themed } from '@/lib/Theme';
import { Role } from '@/models/Role';

@themed()
@customElement('data-manager')
export class DataManager extends MobxLitElement {
  private state = appState;

  static styles = css`
    .data-manager {
      padding: 1rem;
      margin-bottom: 1rem;

      .import {
        textarea {
          width: 100%;
          height: 200px;
          font-family: monospace;
          font-size: 0.9rem;
          box-sizing: border-box;
        }
      }
    }
  `;

  @state()
  open: boolean = this.state.collapsablePanelState['data-manager'] ?? true;

  get nukeEnabled(): boolean {
    const envEnabled = import.meta.env.APP_ENABLE_NUKE
      ? parseInt(import.meta.env.APP_ENABLE_NUKE) === 1
      : false;
    return this.state.debugMode && envEnabled && this.state.hasRole(Role.NUKE);
  }

  render(): TemplateResult {
    return html`
      <ss-collapsable
        title=${translate('dataManager')}
        ?open=${this.open}
        panelId=${`data-manager`}
      >
        <tab-container
          paneId="data-manager"
          index=${this.state.tabState['data-manager'] ?? 0}
        >
          <tab-pane title=${translate('export')}>
            <export-tool></export-tool>
          </tab-pane>
          <tab-pane title=${translate('import')}>
            <import-tool></import-tool>
          </tab-pane>
          <tab-pane title=${translate('sync')}>
            <sync-tool></sync-tool>
          </tab-pane>
          ${this.nukeEnabled
            ? html`
                <tab-pane title=${translate('tacticalNuke')}>
                  <tactical-nuke></tactical-nuke>
                </tab-pane>
              `
            : nothing}
        </tab-container>
      </ss-collapsable>
    `;
  }
}
