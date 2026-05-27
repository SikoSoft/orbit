import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';
import { ListFilter as ListFilterSpec } from 'api-spec/models/List';

export enum ListFilterProp {
  LIST_FILTER = 'listFilter',
  SHOW_ALL = 'showAll',
  SHOW_TYPES = 'showTypes',
  SHOW_PROPERTIES = 'showProperties',
  SHOW_PUBLISHED = 'showPublished',
  SHOW_SUGGESTED = 'showSuggested',
  SHOW_IDENTIFIED = 'showIdentified',
  SHOW_TAGGING = 'showTagging',
  SHOW_TIME = 'showTime',
}

export interface ListFilterProps extends PropTypes {
  [ListFilterProp.LIST_FILTER]: ListFilterSpec | undefined;
  [ListFilterProp.SHOW_ALL]: boolean;
  [ListFilterProp.SHOW_TYPES]: boolean;
  [ListFilterProp.SHOW_PROPERTIES]: boolean;
  [ListFilterProp.SHOW_PUBLISHED]: boolean;
  [ListFilterProp.SHOW_SUGGESTED]: boolean;
  [ListFilterProp.SHOW_IDENTIFIED]: boolean;
  [ListFilterProp.SHOW_TAGGING]: boolean;
  [ListFilterProp.SHOW_TIME]: boolean;
}

export const listFilterProps: PropConfigMap<ListFilterProps> = {
  [ListFilterProp.LIST_FILTER]: {
    default: undefined,
    control: { type: ControlType.HIDDEN },
    description: 'Filter value passed in from outside',
  },
  [ListFilterProp.SHOW_ALL]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Show all filter sections',
  },
  [ListFilterProp.SHOW_TYPES]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Show the types filter section',
  },
  [ListFilterProp.SHOW_PROPERTIES]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Show the properties filter section',
  },
  [ListFilterProp.SHOW_PUBLISHED]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Show the published filter section',
  },
  [ListFilterProp.SHOW_SUGGESTED]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Show the suggested filter section',
  },
  [ListFilterProp.SHOW_IDENTIFIED]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Show the identified filter section',
  },
  [ListFilterProp.SHOW_TAGGING]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Show the tagging filter section',
  },
  [ListFilterProp.SHOW_TIME]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Show the time filter section',
  },
};
