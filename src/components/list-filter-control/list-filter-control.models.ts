import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';
import { ListFilter } from 'api-spec/models/List';

export enum ListFilterControlProp {
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

export interface ListFilterControlProps extends PropTypes {
  [ListFilterControlProp.LIST_FILTER]: ListFilter | undefined;
  [ListFilterControlProp.SHOW_ALL]: boolean;
  [ListFilterControlProp.SHOW_TYPES]: boolean;
  [ListFilterControlProp.SHOW_PROPERTIES]: boolean;
  [ListFilterControlProp.SHOW_PUBLISHED]: boolean;
  [ListFilterControlProp.SHOW_SUGGESTED]: boolean;
  [ListFilterControlProp.SHOW_IDENTIFIED]: boolean;
  [ListFilterControlProp.SHOW_TAGGING]: boolean;
  [ListFilterControlProp.SHOW_TIME]: boolean;
}

export const listFilterControlProps: PropConfigMap<ListFilterControlProps> = {
  [ListFilterControlProp.LIST_FILTER]: {
    default: undefined,
    control: { type: ControlType.HIDDEN },
    description: 'The initial filter value',
  },
  [ListFilterControlProp.SHOW_ALL]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Show all filter sections',
  },
  [ListFilterControlProp.SHOW_TYPES]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Show the types filter section',
  },
  [ListFilterControlProp.SHOW_PROPERTIES]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Show the properties filter section',
  },
  [ListFilterControlProp.SHOW_PUBLISHED]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Show the published filter section',
  },
  [ListFilterControlProp.SHOW_SUGGESTED]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Show the suggested filter section',
  },
  [ListFilterControlProp.SHOW_IDENTIFIED]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Show the identified filter section',
  },
  [ListFilterControlProp.SHOW_TAGGING]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Show the tagging filter section',
  },
  [ListFilterControlProp.SHOW_TIME]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Show the time filter section',
  },
};
