import { StreakRequest } from 'api-spec/models/Fact';

import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';
import { defaultStreakContext } from '@/components/streak-form/streak-form.models';

export enum StreakRequestEditorProp {
  STREAK_REQUEST = 'streakRequest',
  INDEX = 'index',
}

export interface StreakRequestEditorProps extends PropTypes {
  [StreakRequestEditorProp.STREAK_REQUEST]: StreakRequest;
  [StreakRequestEditorProp.INDEX]: number;
}

export const streakRequestEditorProps: PropConfigMap<StreakRequestEditorProps> = {
  [StreakRequestEditorProp.STREAK_REQUEST]: {
    default: {
      alias: '',
      context: defaultStreakContext(),
    },
    control: { type: ControlType.HIDDEN },
    description: 'The streak request being edited',
  },
  [StreakRequestEditorProp.INDEX]: {
    default: 0,
    control: { type: ControlType.NUMBER },
    description: 'The position of this streak request in the list',
  },
};
