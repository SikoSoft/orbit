import { PropConfigMap, PropTypes } from '@/models/Prop';
import { ControlType } from '@/models/Control';

export enum WorkspaceFormProp {
  WORKSPACE_ID = 'workspaceId',
  NAME = 'name',
  COLOR = 'color',
  SHOW_EVERYTHING = 'showEverything',
  LIST_CONFIGS = 'listConfigs',
  OPEN = 'open',
}

export interface WorkspaceFormProps extends PropTypes {
  [WorkspaceFormProp.WORKSPACE_ID]: string;
  [WorkspaceFormProp.NAME]: string;
  [WorkspaceFormProp.COLOR]: string;
  [WorkspaceFormProp.SHOW_EVERYTHING]: boolean;
  [WorkspaceFormProp.LIST_CONFIGS]: string[];
  [WorkspaceFormProp.OPEN]: boolean;
}

export const workspaceFormProps: PropConfigMap<WorkspaceFormProps> = {
  [WorkspaceFormProp.WORKSPACE_ID]: {
    default: '',
    description: 'The ID of the workspace being edited',
    control: { type: ControlType.TEXT },
  },
  [WorkspaceFormProp.NAME]: {
    default: '',
    description: 'The workspace name',
    control: { type: ControlType.TEXT },
  },
  [WorkspaceFormProp.COLOR]: {
    default: '',
    description: 'The workspace color as a hex string',
    control: { type: ControlType.TEXT },
  },
  [WorkspaceFormProp.SHOW_EVERYTHING]: {
    default: false,
    description: 'Whether this workspace shows all entities regardless of list config filters',
    control: { type: ControlType.BOOLEAN },
  },
  [WorkspaceFormProp.LIST_CONFIGS]: {
    default: [],
    description: 'List config IDs assigned to this workspace',
    control: { type: ControlType.HIDDEN },
  },
  [WorkspaceFormProp.OPEN]: {
    default: false,
    description: 'Whether the collapsable panel is open',
    control: { type: ControlType.BOOLEAN },
  },
};
