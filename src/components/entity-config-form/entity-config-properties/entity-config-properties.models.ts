import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';
import {
  EntityCalculatedPropertyConfig,
  EntityPropertyConfig,
} from 'api-spec/models/Entity';

export enum EntityConfigPropertiesProp {
  ENTITY_CONFIG_ID = 'entityConfigId',
  PROPERTIES = 'properties',
  PERFORM_DRIFT_CHECK = 'performDriftCheck',
}

export interface EntityConfigPropertiesProps extends PropTypes {
  [EntityConfigPropertiesProp.ENTITY_CONFIG_ID]: number;
  [EntityConfigPropertiesProp.PROPERTIES]: (
    | EntityPropertyConfig
    | EntityCalculatedPropertyConfig
  )[];
  [EntityConfigPropertiesProp.PERFORM_DRIFT_CHECK]: boolean;
}

export const entityConfigPropertiesProps: PropConfigMap<EntityConfigPropertiesProps> =
  {
    [EntityConfigPropertiesProp.ENTITY_CONFIG_ID]: {
      default: 0,
      control: { type: ControlType.NUMBER },
      description: 'The id of the entity config these properties belong to',
    },
    [EntityConfigPropertiesProp.PROPERTIES]: {
      default: [],
      control: { type: ControlType.HIDDEN },
      description: 'The property configs for this entity config',
    },
    [EntityConfigPropertiesProp.PERFORM_DRIFT_CHECK]: {
      default: false,
      control: { type: ControlType.BOOLEAN },
      description: 'Whether to check for breaking changes in property configs',
    },
  };
