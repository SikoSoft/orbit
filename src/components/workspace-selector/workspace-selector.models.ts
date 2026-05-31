import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';

export enum WorkspaceSelectorProp {
  FORCE_OPEN = 'forceOpen',
}

export interface WorkspaceSelectorProps extends PropTypes {
  [WorkspaceSelectorProp.FORCE_OPEN]: boolean;
}

export const workspaceSelectorProps: PropConfigMap<WorkspaceSelectorProps> = {
  [WorkspaceSelectorProp.FORCE_OPEN]: {
    default: false,
    description: 'Force the selector into fullscreen mode',
    control: { type: ControlType.BOOLEAN },
  },
};
