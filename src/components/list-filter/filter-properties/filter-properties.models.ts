import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';
import { FilterProperty } from 'api-spec/models/List';

export enum FilterPropertiesProp {
  INCLUDE_TYPES = 'includeTypes',
  FILTERS = 'filters',
}

export interface FilterPropertiesProps extends PropTypes {
  [FilterPropertiesProp.INCLUDE_TYPES]: string[];
  [FilterPropertiesProp.FILTERS]: FilterProperty[];
}

export const filterPropertiesProps: PropConfigMap<FilterPropertiesProps> = {
  [FilterPropertiesProp.INCLUDE_TYPES]: {
    default: [],
    control: { type: ControlType.HIDDEN },
    description: 'The list of property types that can be filtered on',
  },
  [FilterPropertiesProp.FILTERS]: {
    default: [],
    control: { type: ControlType.HIDDEN },
    description: 'The list of property filters',
  },
};
