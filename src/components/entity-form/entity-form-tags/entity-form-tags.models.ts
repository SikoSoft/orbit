import { PropConfigMap, PropTypes } from '@/models/Prop';
import { ControlType } from '@/models/Control';

export enum EntityFormTagsProp {
  TAGS = 'tags',
  ALLOW_TAGS = 'allowTags',
}

export interface EntityFormTagsProps extends PropTypes {
  [EntityFormTagsProp.TAGS]: string[];
  [EntityFormTagsProp.ALLOW_TAGS]: boolean;
}

export const entityFormTagsProps: PropConfigMap<EntityFormTagsProps> = {
  [EntityFormTagsProp.TAGS]: {
    default: [],
    description: 'Current tags on the entity',
    control: { type: ControlType.TEXT },
  },
  [EntityFormTagsProp.ALLOW_TAGS]: {
    default: false,
    description: 'Whether the entity config allows tagging',
    control: { type: ControlType.BOOLEAN },
  },
};
