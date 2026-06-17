import { PropConfigMap, PropTypes } from '@/models/Prop';
import { ControlType } from '@/models/Control';

export enum WorkspaceStreakManagerProp {
  STREAKS = 'streaks',
}

export interface WorkspaceStreakManagerProps extends PropTypes {
  [WorkspaceStreakManagerProp.STREAKS]: number[];
}

export const workspaceStreakManagerProps: PropConfigMap<WorkspaceStreakManagerProps> = {
  [WorkspaceStreakManagerProp.STREAKS]: {
    default: [],
    description: 'Streak IDs assigned to this workspace',
    control: { type: ControlType.HIDDEN },
  },
};
