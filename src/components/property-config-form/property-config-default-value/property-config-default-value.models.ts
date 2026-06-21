import { ControlType } from '@/models/Control';
import { DataType, PropertyDataValue } from 'api-spec/models/Entity';
import { PropConfigMap, PropTypes } from '@/models/Prop';

export enum PropertyConfigDefaultValueProp {
  DATA_TYPE = 'dataType',
  DEFAULT_VALUE = 'defaultValue',
}

export interface PropertyConfigDefaultValueProps extends PropTypes {
  [PropertyConfigDefaultValueProp.DATA_TYPE]: string;
  [PropertyConfigDefaultValueProp.DEFAULT_VALUE]: PropertyDataValue;
}

export const propertyConfigDefaultValueProps: PropConfigMap<PropertyConfigDefaultValueProps> =
  {
    [PropertyConfigDefaultValueProp.DATA_TYPE]: {
      default: DataType.SHORT_TEXT,
      control: { type: ControlType.HIDDEN },
      description: 'The data type of the property',
    },
    [PropertyConfigDefaultValueProp.DEFAULT_VALUE]: {
      default: '',
      control: { type: ControlType.HIDDEN },
      description: 'The current default value',
    },
  };
