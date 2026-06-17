import { Workspace } from 'api-spec/models/Workspace';

export const workspaceSavedEventName = 'workspace-saved';

export type WorkspaceSavedPayload = Workspace;

export class WorkspaceSavedEvent extends CustomEvent<WorkspaceSavedPayload> {
  constructor(detail: WorkspaceSavedPayload) {
    super(workspaceSavedEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}

export const workspaceDeletedEventName = 'workspace-deleted';

export interface WorkspaceDeletedPayload {
  id: string;
}

export class WorkspaceDeletedEvent extends CustomEvent<WorkspaceDeletedPayload> {
  constructor(detail: WorkspaceDeletedPayload) {
    super(workspaceDeletedEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}
