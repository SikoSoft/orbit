import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';
import { Streak } from 'api-spec/models/Fact';

export enum StreakConfigFormProp {
  STREAK = 'streak',
}

export interface StreakConfigFormProps extends PropTypes {
  [StreakConfigFormProp.STREAK]: Streak | null;
}

export const streakConfigFormProps: PropConfigMap<StreakConfigFormProps> = {
  [StreakConfigFormProp.STREAK]: {
    default: null,
    description: 'The existing streak to edit, or null to create a new one',
    control: { type: ControlType.HIDDEN },
  },
};
