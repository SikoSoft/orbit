import { html, css, nothing, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { translate } from '@/lib/Localization';
import { appState } from '@/state';

import { MobxLitElement } from '@adobe/lit-mobx';
import { themed } from '@/lib/Theme';

import {
  WorkspaceListManagerProp,
  workspaceListManagerProps,
  WorkspaceListManagerProps,
} from './workspace-list-manager.models';
import { WorkspaceListsChangedEvent } from './workspace-list-manager.events';

@themed()
@customElement('workspace-list-manager')
export class WorkspaceListManager extends MobxLitElement {
  static styles = css`
    :host {
      display: block;
    }

    .field {
      margin-bottom: 1rem;
    }

    .field label {
      display: block;
      font-weight: bold;
      margin-bottom: 0.25rem;
    }

    .list-configs-field {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .list-config-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      padding: 0.25rem 0;
    }
  `;

  private appState = appState;

  @property({ type: Boolean })
  [WorkspaceListManagerProp.SHOW_EVERYTHING]: WorkspaceListManagerProps[WorkspaceListManagerProp.SHOW_EVERYTHING] =
    workspaceListManagerProps[WorkspaceListManagerProp.SHOW_EVERYTHING].default;

  @property({ type: Array })
  [WorkspaceListManagerProp.LIST_CONFIGS]: WorkspaceListManagerProps[WorkspaceListManagerProp.LIST_CONFIGS] =
    workspaceListManagerProps[WorkspaceListManagerProp.LIST_CONFIGS].default;

  private dispatchChange(partial: Partial<{ showEverything: boolean; listConfigs: string[] }>): void {
    this.dispatchEvent(
      new WorkspaceListsChangedEvent({
        showEverything: this[WorkspaceListManagerProp.SHOW_EVERYTHING],
        listConfigs: this[WorkspaceListManagerProp.LIST_CONFIGS],
        ...partial,
      }),
    );
  }

  private toggleListConfig(listConfigId: string): void {
    const current = this[WorkspaceListManagerProp.LIST_CONFIGS];
    const updated = current.includes(listConfigId)
      ? current.filter(id => id !== listConfigId)
      : [...current, listConfigId];
    this.dispatchChange({ listConfigs: updated });
  }

  render(): TemplateResult {
    const availableListConfigs = this.appState.listConfigs;

    return html`
      <div class="field">
        <label class="list-config-option">
          <input
            type="checkbox"
            ?checked=${this[WorkspaceListManagerProp.SHOW_EVERYTHING]}
            @change=${(): void => {
              this.dispatchChange({
                showEverything: !this[WorkspaceListManagerProp.SHOW_EVERYTHING],
              });
            }}
          />
          ${translate('showEverything')}
        </label>
      </div>

      ${availableListConfigs.length > 0
        ? html`
            <div class="field">
              <label>${translate('listConfigs')}</label>
              <div class="list-configs-field">
                ${repeat(
                  availableListConfigs,
                  config => config.id,
                  config => html`
                    <label class="list-config-option">
                      <input
                        type="checkbox"
                        ?checked=${this[WorkspaceListManagerProp.LIST_CONFIGS].includes(
                          config.id,
                        )}
                        @change=${(): void => this.toggleListConfig(config.id)}
                      />
                      ${config.name}
                    </label>
                  `,
                )}
              </div>
            </div>
          `
        : nothing}
    `;
  }
}
