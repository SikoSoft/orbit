import { html, css, nothing, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { Workspace } from 'api-spec/models/Workspace';
import { ThemeName, defaultTheme } from '@/models/Page';
import { addToast } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';
import { translate } from '@/lib/Localization';
import { storage } from '@/lib/Storage';
import { appState } from '@/state';
import { TabIndexChangedEvent } from '@ss/ui/components/tab-container.events';

import { MobxLitElement } from '@adobe/lit-mobx';
import { themed } from '@/lib/Theme';

import '@ss/ui/components/ss-collapsable';
import '@ss/ui/components/ss-button';
import '@ss/ui/components/tab-container';
import '@ss/ui/components/tab-pane';
import '@ss/ui/components/confirmation-modal';
import '@/components/workspace-config/workspace-config';
import '@/components/workspace-list-manager/workspace-list-manager';
import '@/components/workspace-fact-manager/workspace-fact-manager';
import '@/components/workspace-streak-manager/workspace-streak-manager';

import {
  WorkspaceManagerProp,
  workspaceManagerProps,
  WorkspaceManagerProps,
} from './workspace-manager.models';
import { WorkspaceConfigChangedEvent } from '@/components/workspace-config/workspace-config.events';
import { WorkspaceListsChangedEvent } from '@/components/workspace-list-manager/workspace-list-manager.events';
import { WorkspaceFactsChangedEvent } from '@/components/workspace-fact-manager/workspace-fact-manager.events';
import { WorkspaceStreaksChangedEvent } from '@/components/workspace-streak-manager/workspace-streak-manager.events';
import { WorkspaceDeletedEvent, WorkspaceSavedEvent } from './workspace-manager.events';

@themed()
@customElement('workspace-manager')
export class WorkspaceManager extends MobxLitElement {
  static styles = css`
    :host {
      display: block;
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

  @state()
  activeTabIndex: number = 0;

  @property({ type: Boolean, reflect: true })
  [WorkspaceManagerProp.OPEN]: WorkspaceManagerProps[WorkspaceManagerProp.OPEN] =
    workspaceManagerProps[WorkspaceManagerProp.OPEN].default;

  @property({ type: String })
  [WorkspaceManagerProp.WORKSPACE_ID]: WorkspaceManagerProps[WorkspaceManagerProp.WORKSPACE_ID] =
    workspaceManagerProps[WorkspaceManagerProp.WORKSPACE_ID].default;

  @property({ type: String })
  [WorkspaceManagerProp.NAME]: WorkspaceManagerProps[WorkspaceManagerProp.NAME] =
    workspaceManagerProps[WorkspaceManagerProp.NAME].default;

  @property({ type: String })
  [WorkspaceManagerProp.COLOR]: WorkspaceManagerProps[WorkspaceManagerProp.COLOR] =
    workspaceManagerProps[WorkspaceManagerProp.COLOR].default;

  @property({ type: Boolean })
  [WorkspaceManagerProp.SHOW_EVERYTHING]: WorkspaceManagerProps[WorkspaceManagerProp.SHOW_EVERYTHING] =
    workspaceManagerProps[WorkspaceManagerProp.SHOW_EVERYTHING].default;

  @property({ type: Array })
  [WorkspaceManagerProp.LIST_CONFIGS]: WorkspaceManagerProps[WorkspaceManagerProp.LIST_CONFIGS] =
    workspaceManagerProps[WorkspaceManagerProp.LIST_CONFIGS].default;

  @property({ type: String })
  [WorkspaceManagerProp.THEME]: WorkspaceManagerProps[WorkspaceManagerProp.THEME] =
    workspaceManagerProps[WorkspaceManagerProp.THEME].default;

  @property({ type: Array })
  [WorkspaceManagerProp.FACTS]: WorkspaceManagerProps[WorkspaceManagerProp.FACTS] =
    workspaceManagerProps[WorkspaceManagerProp.FACTS].default;

  @property({ type: Array })
  [WorkspaceManagerProp.STREAKS]: WorkspaceManagerProps[WorkspaceManagerProp.STREAKS] =
    workspaceManagerProps[WorkspaceManagerProp.STREAKS].default;

  connectedCallback(): void {
    super.connectedCallback();
    this.localWorkspace = {
      id: this[WorkspaceManagerProp.WORKSPACE_ID],
      name: this[WorkspaceManagerProp.NAME],
      color: this[WorkspaceManagerProp.COLOR],
      showEverything: this[WorkspaceManagerProp.SHOW_EVERYTHING],
      listConfigs: [...this[WorkspaceManagerProp.LIST_CONFIGS]],
      theme: this[WorkspaceManagerProp.THEME],
      facts: [...this[WorkspaceManagerProp.FACTS]],
      streaks: [...this[WorkspaceManagerProp.STREAKS]],
    };
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
        facts: this.localWorkspace.facts,
        streaks: this.localWorkspace.streaks,
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

  private async handleConfirmDelete(): Promise<void> {
    await this.delete();
    this.confirmDeleteIsOpen = false;
  }

  render(): TemplateResult {
    const tabs = [
      {
        title: translate('workspaceConfigTab'),
        content: () => html`
          <workspace-config
            name=${this.localWorkspace.name}
            color=${this.localWorkspace.color}
            theme=${this.localWorkspace.theme}
            @workspace-config-changed=${(e: WorkspaceConfigChangedEvent): void => {
              this.localWorkspace = {
                ...this.localWorkspace,
                name: e.detail.name,
                color: e.detail.color,
                theme: e.detail.theme,
              };
            }}
          ></workspace-config>
        `,
      },
      {
        title: translate('workspaceListsTab'),
        content: () => html`
          <workspace-list-manager
            ?showEverything=${this.localWorkspace.showEverything}
            .listConfigs=${this.localWorkspace.listConfigs}
            @workspace-lists-changed=${(e: WorkspaceListsChangedEvent): void => {
              this.localWorkspace = {
                ...this.localWorkspace,
                showEverything: e.detail.showEverything,
                listConfigs: e.detail.listConfigs,
              };
            }}
          ></workspace-list-manager>
        `,
      },
      {
        title: translate('workspaceFactsTab'),
        content: () => html`
          <workspace-fact-manager
            .facts=${this.localWorkspace.facts}
            @workspace-facts-changed=${(e: WorkspaceFactsChangedEvent): void => {
              this.localWorkspace = {
                ...this.localWorkspace,
                facts: e.detail.facts,
              };
            }}
          ></workspace-fact-manager>
        `,
      },
      {
        title: translate('workspaceStreaksTab'),
        content: () => html`
          <workspace-streak-manager
            .streaks=${this.localWorkspace.streaks}
            @workspace-streaks-changed=${(e: WorkspaceStreaksChangedEvent): void => {
              this.localWorkspace = {
                ...this.localWorkspace,
                streaks: e.detail.streaks,
              };
            }}
          ></workspace-streak-manager>
        `,
      },
    ];

    return html`
      <ss-collapsable
        title=${this.localWorkspace.name || translate('newWorkspace')}
        ?open=${this[WorkspaceManagerProp.OPEN]}
        panelId=${`workspaceManager-${this.localWorkspace.id}`}
      >
        <tab-container
          @tab-index-changed=${(e: TabIndexChangedEvent): void => {
            this.activeTabIndex = e.detail.index;
          }}
        >
          ${tabs.map(
            (tab, index) =>
              html`<tab-pane title=${tab.title}>
                ${index === this.activeTabIndex ? tab.content() : nothing}
              </tab-pane>`,
          )}
        </tab-container>

        <div class="buttons">
          <ss-button ?disabled=${this.isSaving} @click=${this.save}>
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
          @confirmation-accepted=${(): Promise<void> =>
            this.handleConfirmDelete()}
          @confirmation-declined=${(): void => {
            this.confirmDeleteIsOpen = false;
          }}
        ></confirmation-modal>
      </ss-collapsable>
    `;
  }
}
