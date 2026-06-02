import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';
import { FactContext } from 'api-spec/models/Fact';

export enum DataPointBuilderProp {
  DATA_POINT = 'data-point',
}

export interface DataPointBuilderProps extends PropTypes {
  [DataPointBuilderProp.DATA_POINT]: FactContext | null;
}

export const dataPointBuilderProps: PropConfigMap<DataPointBuilderProps> = {
  [DataPointBuilderProp.DATA_POINT]: {
    default: null,
    description: 'The current data point configuration',
    control: { type: ControlType.HIDDEN },
  },
};
