import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';
import { ListFilter as ListFilterSpec } from 'api-spec/models/List';

export enum ListFilterProp {
  LIST_FILTER = 'listFilter',
  ALL = 'all',
  TYPES = 'types',
  PROPERTIES = 'properties',
  PUBLISHED = 'published',
  SUGGESTED = 'suggested',
  IDENTIFIED = 'identified',
  TAGGING = 'tagging',
  TIME = 'time',
}

export interface ListFilterProps extends PropTypes {
  [ListFilterProp.LIST_FILTER]: ListFilterSpec | undefined;
  [ListFilterProp.ALL]: boolean;
  [ListFilterProp.TYPES]: boolean;
  [ListFilterProp.PROPERTIES]: boolean;
  [ListFilterProp.PUBLISHED]: boolean;
  [ListFilterProp.SUGGESTED]: boolean;
  [ListFilterProp.IDENTIFIED]: boolean;
  [ListFilterProp.TAGGING]: boolean;
  [ListFilterProp.TIME]: boolean;
}

export const listFilterProps: PropConfigMap<ListFilterProps> = {
  [ListFilterProp.LIST_FILTER]: {
    default: undefined,
    control: { type: ControlType.HIDDEN },
    description: 'Filter value passed in from outside',
  },
  [ListFilterProp.ALL]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Show all filter sections',
  },
  [ListFilterProp.TYPES]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Show the types filter section',
  },
  [ListFilterProp.PROPERTIES]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Show the properties filter section',
  },
  [ListFilterProp.PUBLISHED]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Show the published filter section',
  },
  [ListFilterProp.SUGGESTED]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Show the suggested filter section',
  },
  [ListFilterProp.IDENTIFIED]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Show the identified filter section',
  },
  [ListFilterProp.TAGGING]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Show the tagging filter section',
  },
  [ListFilterProp.TIME]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Show the time filter section',
  },
};
