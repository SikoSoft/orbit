import { PropConfigMap, PropTypes } from '@/models/Prop';
import { ControlType } from '@/models/Control';

export enum WorkspaceListManagerProp {
  SHOW_EVERYTHING = 'showEverything',
  LIST_CONFIGS = 'listConfigs',
}

export interface WorkspaceListManagerProps extends PropTypes {
  [WorkspaceListManagerProp.SHOW_EVERYTHING]: boolean;
  [WorkspaceListManagerProp.LIST_CONFIGS]: string[];
}

export const workspaceListManagerProps: PropConfigMap<WorkspaceListManagerProps> = {
  [WorkspaceListManagerProp.SHOW_EVERYTHING]: {
    default: false,
    description: 'Whether this workspace shows all entities regardless of list config filters',
    control: { type: ControlType.BOOLEAN },
  },
  [WorkspaceListManagerProp.LIST_CONFIGS]: {
    default: [],
    description: 'List config IDs assigned to this workspace',
    control: { type: ControlType.HIDDEN },
  },
};
