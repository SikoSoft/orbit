import { EntityConfig, EntityProperty } from 'api-spec/models/Entity';
import { PropConfigMap, PropTypes } from '@/models/Prop';
import { ControlType } from '@/models/Control';

export enum EntityFormPropertiesProp {
  ENTITY_ID = 'entityId',
  ENTITY_CONFIG = 'entityConfig',
  PROPERTIES = 'properties',
}

export interface EntityFormPropertiesProps extends PropTypes {
  [EntityFormPropertiesProp.ENTITY_ID]: number;
  [EntityFormPropertiesProp.ENTITY_CONFIG]: EntityConfig | undefined;
  [EntityFormPropertiesProp.PROPERTIES]: EntityProperty[];
}

export const entityFormPropertiesProps: PropConfigMap<EntityFormPropertiesProps> =
  {
    [EntityFormPropertiesProp.ENTITY_ID]: {
      default: 0,
      description: 'The ID of the entity being edited (0 for new)',
      control: { type: ControlType.NUMBER },
    },
    [EntityFormPropertiesProp.ENTITY_CONFIG]: {
      default: undefined,
      description: 'The active entity config defining available properties',
      control: { type: ControlType.TEXT },
    },
    [EntityFormPropertiesProp.PROPERTIES]: {
      default: [],
      description: 'The existing property values for the entity',
      control: { type: ControlType.TEXT },
    },
  };
