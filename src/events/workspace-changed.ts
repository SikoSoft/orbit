export const workspaceChangedEventName = 'workspace-changed';

export interface WorkspaceChangedPayload {
  workspaceId: string;
}

export class WorkspaceChangedEvent extends CustomEvent<WorkspaceChangedPayload> {
  constructor(detail: WorkspaceChangedPayload) {
    super(workspaceChangedEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}
