import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';

export enum EntityActionBarProp {
  SUGGESTION = 'suggestion',
}

export interface EntityActionBarProps extends PropTypes {
  [EntityActionBarProp.SUGGESTION]: boolean;
}

export const entityActionBarProps: PropConfigMap<EntityActionBarProps> = {
  [EntityActionBarProp.SUGGESTION]: {
    default: false,
    control: {
      type: ControlType.BOOLEAN,
    },
    description: 'Whether to show the add suggestion button',
  },
};
