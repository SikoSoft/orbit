import { ControlType } from '@/models/Control';
import { StreakRequest } from 'api-spec/models/Medal';
import { FactOperation } from 'api-spec/models/Fact';
import { AnalysisClassificationType } from 'api-spec/models/Fact';
import { SegmentationTimeUnit } from 'api-spec/models/Statistic';
import { defaultListFilter } from 'api-spec/models/List';
import { PropConfigMap, PropTypes } from '@/models/Prop';

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
      segmentUnit: SegmentationTimeUnit.DAY,
      length: 1,
      innerContext: {
        operation: FactOperation.ANALYSIS_CLASSIFICATION,
        filter: { ...defaultListFilter },
        analysisType: AnalysisClassificationType.MORNING_FASTING,
      },
      innerOperator: '==',
      innerValue: true,
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
