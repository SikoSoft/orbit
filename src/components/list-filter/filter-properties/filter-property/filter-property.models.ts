import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';
import { PropertyDataValue } from 'api-spec/models/Entity';

export enum FilterPropertyProp {
  PROPERTY_CONFIG_ID = 'propertyConfigId',
  VALUE = 'value',
  INDEX = 'index',
  INCLUDE_TYPES = 'includeTypes',
}

export interface FilterPropertyProps extends PropTypes {
  [FilterPropertyProp.PROPERTY_CONFIG_ID]: number;
  [FilterPropertyProp.VALUE]: PropertyDataValue | null;
  [FilterPropertyProp.INDEX]: number;
  [FilterPropertyProp.INCLUDE_TYPES]: number[];
}

export const filterPropertyProps: PropConfigMap<FilterPropertyProps> = {
  [FilterPropertyProp.PROPERTY_CONFIG_ID]: {
    default: 0,
    control: { type: ControlType.NUMBER },
    description: 'The ID of the selected property config',
  },
  [FilterPropertyProp.VALUE]: {
    default: null,
    control: { type: ControlType.HIDDEN },
    description: 'The filter value for this property',
  },
  [FilterPropertyProp.INDEX]: {
    default: -1,
    control: { type: ControlType.NUMBER },
    description: 'The index of this filter in the list',
  },
  [FilterPropertyProp.INCLUDE_TYPES]: {
    default: [],
    control: { type: ControlType.HIDDEN },
    description: 'The list of property types that can be filtered on',
  },
};
