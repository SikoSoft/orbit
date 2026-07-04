import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';

export enum EntityListItemTagsProp {
  TAGS = 'tags',
}

export interface EntityListItemTagsProps extends PropTypes {
  [EntityListItemTagsProp.TAGS]: string[];
}

export const entityListItemTagsProps: PropConfigMap<EntityListItemTagsProps> = {
  [EntityListItemTagsProp.TAGS]: {
    default: [],
    control: { type: ControlType.TEXT },
    description: 'The tags to display',
  },
};
