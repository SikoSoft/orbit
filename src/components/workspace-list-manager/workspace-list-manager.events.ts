export const workspaceListsChangedEventName = 'workspace-lists-changed';

export interface WorkspaceListsChangedPayload {
  showEverything: boolean;
  listConfigs: string[];
}

export class WorkspaceListsChangedEvent extends CustomEvent<WorkspaceListsChangedPayload> {
  constructor(detail: WorkspaceListsChangedPayload) {
    super(workspaceListsChangedEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}
