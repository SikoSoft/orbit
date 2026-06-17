export const workspaceStreaksChangedEventName = 'workspace-streaks-changed';

export interface WorkspaceStreaksChangedPayload {
  streaks: number[];
}

export class WorkspaceStreaksChangedEvent extends CustomEvent<WorkspaceStreaksChangedPayload> {
  constructor(detail: WorkspaceStreaksChangedPayload) {
    super(workspaceStreaksChangedEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}
