export const workspaceConfigChangedEventName = 'workspace-config-changed';

export interface WorkspaceConfigChangedPayload {
  name: string;
  color: string;
  theme: string;
}

export class WorkspaceConfigChangedEvent extends CustomEvent<WorkspaceConfigChangedPayload> {
  constructor(detail: WorkspaceConfigChangedPayload) {
    super(workspaceConfigChangedEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}
