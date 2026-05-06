import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';
import { Entity } from 'api-spec/models/Entity';

export enum EntitySuggestionProp {
  ENTITY = 'entity',
}

export interface EntitySuggestionProps extends PropTypes {
  [EntitySuggestionProp.ENTITY]: Entity | null;
}

export const entitySuggestionProps: PropConfigMap<EntitySuggestionProps> = {
  [EntitySuggestionProp.ENTITY]: {
    default: null,
    control: {
      type: ControlType.TEXT,
    },
    description: 'The suggested entity',
  },
};
