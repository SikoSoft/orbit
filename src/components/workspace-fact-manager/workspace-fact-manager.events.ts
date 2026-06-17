export const workspaceFactsChangedEventName = 'workspace-facts-changed';

export interface WorkspaceFactsChangedPayload {
  facts: number[];
}

export class WorkspaceFactsChangedEvent extends CustomEvent<WorkspaceFactsChangedPayload> {
  constructor(detail: WorkspaceFactsChangedPayload) {
    super(workspaceFactsChangedEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}
