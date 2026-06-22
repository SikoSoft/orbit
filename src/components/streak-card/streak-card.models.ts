import { Streak, StreakResult } from 'api-spec/models/Fact';
import {
  ChartConfig,
  ChartConfigType,
  ChartVersion,
  DataWindowType,
  SegmentationType,
} from 'api-spec/models/Statistic';

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

export function getStreakChartConfig(streak: Streak): ChartConfig {
  return {
    version: ChartVersion.V2,
    type: ChartConfigType.LINE,
    dataWindow: { type: DataWindowType.LAST_30_DAYS },
    segmentation: {
      type: SegmentationType.TIME,
      unit: streak.context.segmentUnit,
    },
    dataPoints: [streak.context.innerContext],
  };
}

export function getStreakChartUrl(streak: Streak): string {
  const params = new URLSearchParams({
    config: JSON.stringify(getStreakChartConfig(streak)),
    name: streak.name,
  });
  return `/chart?${params.toString()}`;
}
