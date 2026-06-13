import { Streak, StreakResult } from 'api-spec/models/Fact';

import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';

export enum StreakCardProp {
  STREAK = 'streak',
  RESULT = 'result',
}

export interface StreakCardProps extends PropTypes {
  [StreakCardProp.STREAK]: Streak | null;
  [StreakCardProp.RESULT]: StreakResult | null;
}

export const streakCardProps: PropConfigMap<StreakCardProps> = {
  [StreakCardProp.STREAK]: {
    default: null,
    description: 'The streak to display',
    control: { type: ControlType.HIDDEN },
  },
  [StreakCardProp.RESULT]: {
    default: null,
    description: 'The computed streak result with current and longest values',
    control: { type: ControlType.HIDDEN },
  },
};
