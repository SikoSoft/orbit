import { PropConfigMap, PropTypes } from '@/models/Prop';
import { ControlType } from '@/models/Control';

export enum WorkspaceChartManagerProp {
  CHARTS = 'charts',
}

export interface WorkspaceChartManagerProps extends PropTypes {
  [WorkspaceChartManagerProp.CHARTS]: number[];
}

export const workspaceChartManagerProps: PropConfigMap<WorkspaceChartManagerProps> = {
  [WorkspaceChartManagerProp.CHARTS]: {
    default: [],
    description: 'Chart IDs assigned to this workspace',
    control: { type: ControlType.HIDDEN },
  },
};
