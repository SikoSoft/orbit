import { html, css, nothing, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { Workspace } from 'api-spec/models/Workspace';
import { SelectChangedEvent } from '@ss/ui/components/ss-select.events';
import { ThemeName, defaultTheme } from '@/models/Page';
import { addToast } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';
import { translate } from '@/lib/Localization';
import { storage } from '@/lib/Storage';
import { appState } from '@/state';
import { InputChangedEvent } from '@ss/ui/components/ss-input.events';

import { MobxLitElement } from '@adobe/lit-mobx';
import { themed } from '@/lib/Theme';

import '@ss/ui/components/ss-collapsable';
import '@ss/ui/components/ss-button';
import '@ss/ui/components/ss-input';
import '@ss/ui/components/ss-select';
import '@ss/ui/components/confirmation-modal';
import '@/components/color-selector/color-selector';

import {
  WorkspaceFormProp,
  workspaceFormProps,
  WorkspaceFormProps,
} from './workspace-form.models';
import { ColorChangedEvent } from '@/components/color-selector/color-selector.events';
import { WorkspaceDeletedEvent, WorkspaceSavedEvent } from './workspace-form.events';

@themed()
@customElement('workspace-form')
export class WorkspaceForm extends MobxLitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1rem;
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

    .buttons {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      padding: 0.5rem 0;
    }
  `;

  private appState = appState;

  @state()
  localWorkspace: Omit<Workspace, 'userId' | 'createdAt' | 'updatedAt'> = {
    id: '',
    name: '',
    color: '',
    showEverything: false,
    listConfigs: [],
    theme: defaultTheme,
    facts: [],
    streaks: [],
  };

  @state()
  isSaving: boolean = false;

  @state()
  confirmDeleteIsOpen: boolean = false;

  @property({ type: Boolean, reflect: true })
  [WorkspaceFormProp.OPEN]: WorkspaceFormProps[WorkspaceFormProp.OPEN] =
    workspaceFormProps[WorkspaceFormProp.OPEN].default;

  @property({ type: String })
  [WorkspaceFormProp.WORKSPACE_ID]: WorkspaceFormProps[WorkspaceFormProp.WORKSPACE_ID] =
    workspaceFormProps[WorkspaceFormProp.WORKSPACE_ID].default;

  @property({ type: String })
  [WorkspaceFormProp.NAME]: WorkspaceFormProps[WorkspaceFormProp.NAME] =
    workspaceFormProps[WorkspaceFormProp.NAME].default;

  @property({ type: String })
  [WorkspaceFormProp.COLOR]: WorkspaceFormProps[WorkspaceFormProp.COLOR] =
    workspaceFormProps[WorkspaceFormProp.COLOR].default;

  @property({ type: Boolean })
  [WorkspaceFormProp.SHOW_EVERYTHING]: WorkspaceFormProps[WorkspaceFormProp.SHOW_EVERYTHING] =
    workspaceFormProps[WorkspaceFormProp.SHOW_EVERYTHING].default;

  @property({ type: Array })
  [WorkspaceFormProp.LIST_CONFIGS]: WorkspaceFormProps[WorkspaceFormProp.LIST_CONFIGS] =
    workspaceFormProps[WorkspaceFormProp.LIST_CONFIGS].default;

  @property({ type: String })
  [WorkspaceFormProp.THEME]: WorkspaceFormProps[WorkspaceFormProp.THEME] =
    workspaceFormProps[WorkspaceFormProp.THEME].default;

  connectedCallback(): void {
    super.connectedCallback();
    this.localWorkspace = {
      id: this[WorkspaceFormProp.WORKSPACE_ID],
      name: this[WorkspaceFormProp.NAME],
      color: this[WorkspaceFormProp.COLOR],
      showEverything: this[WorkspaceFormProp.SHOW_EVERYTHING],
      listConfigs: [...this[WorkspaceFormProp.LIST_CONFIGS]],
      theme: this[WorkspaceFormProp.THEME],
      facts: [],
      streaks: [],
    };
  }

  private handleDeleteConfirmed(): void {
    this.delete();
    this.confirmDeleteIsOpen = false;
  }

  private toggleListConfig(listConfigId: string): void {
    const current = this.localWorkspace.listConfigs;
    const updated = current.includes(listConfigId)
      ? current.filter(id => id !== listConfigId)
      : [...current, listConfigId];
    this.localWorkspace = { ...this.localWorkspace, listConfigs: updated };
  }

  async save(): Promise<void> {
    if (!this.localWorkspace.name.trim()) {
      addToast(translate('workspaceNameRequired'), NotificationType.ERROR);
      return;
    }

    this.isSaving = true;

    let result: { isOk: true; value: Workspace } | { isOk: false; error: Error };

    if (this.localWorkspace.id) {
      const existing = this.appState.workspaces.find(
        w => w.id === this.localWorkspace.id,
      );
      if (!existing) {
        this.isSaving = false;
        return;
      }
      result = await storage.saveWorkspace({
        ...existing,
        name: this.localWorkspace.name,
        color: this.localWorkspace.color,
        showEverything: this.localWorkspace.showEverything,
        listConfigs: this.localWorkspace.listConfigs,
        theme: this.localWorkspace.theme,
      });
    } else {
      result = await storage.createWorkspace(
        this.localWorkspace.name,
        this.localWorkspace.listConfigs,
        this.localWorkspace.color,
        this.localWorkspace.showEverything,
        this.localWorkspace.theme as ThemeName,
      );
    }

    this.isSaving = false;

    if (!result.isOk) {
      addToast(translate('failedToSaveWorkspace'), NotificationType.ERROR);
      return;
    }

    this.localWorkspace = {
      id: result.value.id,
      name: result.value.name,
      color: result.value.color,
      showEverything: result.value.showEverything,
      listConfigs: result.value.listConfigs,
      theme: result.value.theme,
      facts: result.value.facts,
      streaks: result.value.streaks,
    };

    this.dispatchEvent(new WorkspaceSavedEvent(result.value));
    addToast(translate('workspaceSaved'), NotificationType.SUCCESS);
  }

  async delete(): Promise<void> {
    const result = await storage.deleteWorkspace(this.localWorkspace.id);

    if (!result) {
      addToast(translate('failedToDeleteWorkspace'), NotificationType.ERROR);
      return;
    }

    addToast(translate('workspaceDeleted'), NotificationType.SUCCESS);
    this.dispatchEvent(new WorkspaceDeletedEvent({ id: this.localWorkspace.id }));
  }

  render(): TemplateResult {
    const availableListConfigs = this.appState.listConfigs;

    return html`
      <ss-collapsable
        title=${this.localWorkspace.name || translate('newWorkspace')}
        ?open=${this[WorkspaceFormProp.OPEN]}
        panelId=${`workspaceForm-${this.localWorkspace.id}`}
      >
        <div class="field">
          <label>${translate('workspaceName')}</label>
          <ss-input
            .value=${this.localWorkspace.name}
            @input-changed=${(e: InputChangedEvent): void => {
              this.localWorkspace = {
                ...this.localWorkspace,
                name: e.detail.value,
              };
            }}
          ></ss-input>
        </div>

        <div class="field">
          <label>${translate('workspaceColor')}</label>
          <color-selector
            value=${this.localWorkspace.color}
            @color-changed=${(e: ColorChangedEvent): void => {
              this.localWorkspace = {
                ...this.localWorkspace,
                color: e.detail.value,
              };
            }}
          ></color-selector>
        </div>

        <div class="field">
          <label class="list-config-option">
            <input
              type="checkbox"
              ?checked=${this.localWorkspace.showEverything}
              @change=${(): void => {
                this.localWorkspace = {
                  ...this.localWorkspace,
                  showEverything: !this.localWorkspace.showEverything,
                };
              }}
            />
            ${translate('showEverything')}
          </label>
        </div>

        <div class="field">
          <label>${translate('workspaceTheme')}</label>
          <ss-select
            selected=${this.localWorkspace.theme}
            .options=${Object.values(ThemeName).map(v => ({
              value: v,
              label: translate(`themeOption.${v}`),
            }))}
            @select-changed=${(e: SelectChangedEvent<ThemeName>): void => {
              this.localWorkspace = {
                ...this.localWorkspace,
                theme: e.detail.value,
              };
            }}
          ></ss-select>
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
                          ?checked=${this.localWorkspace.listConfigs.includes(
                            config.id,
                          )}
                          @change=${(): void =>
                            this.toggleListConfig(config.id)}
                        />
                        ${config.name}
                      </label>
                    `,
                  )}
                </div>
              </div>
            `
          : nothing}

        <div class="buttons">
          <ss-button
            ?disabled=${this.isSaving}
            @click=${this.save}
          >
            ${translate('save')}
          </ss-button>

          ${this.localWorkspace.id
            ? html`
                <ss-button
                  @click=${(): void => {
                    this.confirmDeleteIsOpen = true;
                  }}
                >
                  ${translate('delete')}
                </ss-button>
              `
            : nothing}
        </div>

        <confirmation-modal
          ?open=${this.confirmDeleteIsOpen}
          message=${translate('confirmDeleteWorkspace')}
          @confirmation-accepted=${(): void => this.handleDeleteConfirmed()}
          @confirmation-declined=${(): void => {
            this.confirmDeleteIsOpen = false;
          }}
        ></confirmation-modal>
      </ss-collapsable>
    `;
  }
}
