import { PropConfigMap, PropTypes } from '@/models/Prop';
import { ControlType } from '@/models/Control';

export enum WorkspaceFactManagerProp {
  FACTS = 'facts',
}

export interface WorkspaceFactManagerProps extends PropTypes {
  [WorkspaceFactManagerProp.FACTS]: number[];
}

export const workspaceFactManagerProps: PropConfigMap<WorkspaceFactManagerProps> = {
  [WorkspaceFactManagerProp.FACTS]: {
    default: [],
    description: 'Fact IDs assigned to this workspace',
    control: { type: ControlType.HIDDEN },
  },
};
