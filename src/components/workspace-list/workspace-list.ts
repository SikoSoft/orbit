import { html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { Workspace } from 'api-spec/models/Workspace';
import { addToast } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';
import { translate } from '@/lib/Localization';
import { storage } from '@/lib/Storage';
import { appState } from '@/state';

import { MobxLitElement } from '@adobe/lit-mobx';
import { themed } from '@/lib/Theme';
import { CollapsableToggledEvent } from '@ss/ui/components/ss-collapsable.events';

import '@ss/ui/components/ss-button';
import '@/components/workspace-form/workspace-form';

import {
  WorkspaceDeletedEvent,
  WorkspaceSavedEvent,
} from '../workspace-form/workspace-form.events';

@themed()
@customElement('workspace-list')
export class WorkspaceList extends MobxLitElement {
  static styles = css`
    .no-workspaces {
      font-style: italic;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .buttons {
      padding: 1rem;
    }
  `;

  private state = appState;

  @state()
  ready: boolean = false;

  connectedCallback(): void {
    super.connectedCallback();
    this.loadWorkspaces();
  }

  async loadWorkspaces(): Promise<void> {
    try {
      const workspaces = await storage.getWorkspaces();
      this.state.setWorkspaces(workspaces);
    } catch {
      addToast(translate('failedToLoadWorkspaces'), NotificationType.ERROR);
    }
    this.ready = true;
  }

  addWorkspace(): void {
    const newWorkspace: Workspace = {
      id: '',
      name: '',
      color: '',
      showEverything: false,
      userId: '',
      listConfigs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.state.upsertWorkspace(newWorkspace);
  }

  handleWorkspaceSaved(e: WorkspaceSavedEvent): void {
    this.dispatchEvent(
      new CollapsableToggledEvent({
        isOpen: true,
        panelId: `workspaceForm-${e.detail.id}`,
      }),
    );
    if (e.detail.id) {
      this.state.removeWorkspace('');
    }
    this.state.upsertWorkspace(e.detail);
  }

  handleWorkspaceDeleted(e: WorkspaceDeletedEvent): void {
    this.state.removeWorkspace(e.detail.id);
  }

  isPanelOpen(id: string): boolean {
    if (!id) {
      return true;
    }
    return this.state.collapsablePanelState[`workspaceForm-${id}`] || false;
  }

  render(): TemplateResult {
    const workspaces = this.state.workspaces;

    return html`
      <div class="workspace-list box">
        ${workspaces.length > 0
          ? repeat(
              workspaces,
              workspace => workspace.id,
              workspace => html`
                <workspace-form
                  workspaceId=${workspace.id}
                  name=${workspace.name}
                  color=${workspace.color}
                  ?showEverything=${workspace.showEverything}
                  .listConfigs=${workspace.listConfigs}
                  ?open=${this.isPanelOpen(workspace.id)}
                  @workspace-saved=${this.handleWorkspaceSaved}
                  @workspace-deleted=${this.handleWorkspaceDeleted}
                ></workspace-form>
              `,
            )
          : html`
              <div class="no-workspaces">${translate('noWorkspaces')}</div>
            `}

        <div class="buttons">
          <ss-button @click=${this.addWorkspace}>
            ${translate('addWorkspace')}
          </ss-button>
        </div>
      </div>
    `;
  }
}
