import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';
import { FormattedDataPointRequest } from 'api-spec/models/Statistic';

export enum DataPointBuilderProp {
  DATA_POINT = 'data-point',
}

export interface DataPointBuilderProps extends PropTypes {
  [DataPointBuilderProp.DATA_POINT]: FormattedDataPointRequest | null;
}

export const dataPointBuilderProps: PropConfigMap<DataPointBuilderProps> = {
  [DataPointBuilderProp.DATA_POINT]: {
    default: null,
    description: 'The current data point configuration',
    control: { type: ControlType.HIDDEN },
  },
};
