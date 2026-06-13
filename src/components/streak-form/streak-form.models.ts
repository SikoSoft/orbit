import { StreakContext, FactOperation } from 'api-spec/models/Fact';
import { SegmentationTimeUnit } from 'api-spec/models/Statistic';
import { defaultListFilter } from 'api-spec/models/List';

import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';

export enum StreakFormProp {
  CONTEXT = 'context',
}

export interface StreakFormProps extends PropTypes {
  [StreakFormProp.CONTEXT]: StreakContext;
}

export function defaultStreakContext(): StreakContext {
  return {
    segmentUnit: SegmentationTimeUnit.DAY,
    length: 1,
    innerContext: {
      operation: FactOperation.ENTITY_COUNT,
      filter: { ...defaultListFilter },
    },
    innerOperator: '==',
    innerValue: 0,
  };
}

export const streakFormProps: PropConfigMap<StreakFormProps> = {
  [StreakFormProp.CONTEXT]: {
    default: defaultStreakContext(),
    description: 'The streak context being configured',
    control: { type: ControlType.HIDDEN },
  },
};
