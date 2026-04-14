import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';

export enum TagFiltersProp {
  CONTAINS_ONE_OF = 'containsOneOf',
  CONTAINS_ALL_OF = 'containsAllOf',
  INCLUDE_UNTAGGED = 'includeUntagged',
}

export interface TagFiltersProps extends PropTypes {
  [TagFiltersProp.CONTAINS_ONE_OF]: string[];
  [TagFiltersProp.CONTAINS_ALL_OF]: string[];
  [TagFiltersProp.INCLUDE_UNTAGGED]: boolean;
}

export const tagFiltersProps: PropConfigMap<TagFiltersProps> = {
  [TagFiltersProp.CONTAINS_ONE_OF]: {
    default: [],
    control: { type: ControlType.HIDDEN },
    description: 'Tags where the entity must contain at least one',
  },
  [TagFiltersProp.CONTAINS_ALL_OF]: {
    default: [],
    control: { type: ControlType.HIDDEN },
    description: 'Tags where the entity must contain all of them',
  },
  [TagFiltersProp.INCLUDE_UNTAGGED]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Whether to include entities that have no tags',
  },
};
