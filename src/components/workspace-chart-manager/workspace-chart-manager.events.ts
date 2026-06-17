export const workspaceChartsChangedEventName = 'workspace-charts-changed';

export interface WorkspaceChartsChangedPayload {
  charts: number[];
}

export class WorkspaceChartsChangedEvent extends CustomEvent<WorkspaceChartsChangedPayload> {
  constructor(detail: WorkspaceChartsChangedPayload) {
    super(workspaceChartsChangedEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}
