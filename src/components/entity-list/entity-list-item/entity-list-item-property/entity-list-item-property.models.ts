import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';
import {
  EntityCalculatedPropertyConfig,
  EntityProperty,
  EntityPropertyConfig,
} from 'api-spec/models/Entity';

export enum EntityListItemPropertyProp {
  PROPERTY = 'property',
  PROPERTY_CONFIGS = 'propertyConfigs',
}

export interface EntityListItemPropertyProps extends PropTypes {
  [EntityListItemPropertyProp.PROPERTY]: EntityProperty;
  [EntityListItemPropertyProp.PROPERTY_CONFIGS]: (
    | EntityPropertyConfig
    | EntityCalculatedPropertyConfig
  )[];
}

export const entityListItemPropertyProps: PropConfigMap<EntityListItemPropertyProps> =
  {
    [EntityListItemPropertyProp.PROPERTY]: {
      default: {} as EntityProperty,
      control: { type: ControlType.TEXT },
      description: 'The entity property to render',
    },
    [EntityListItemPropertyProp.PROPERTY_CONFIGS]: {
      default: [],
      control: { type: ControlType.TEXT },
      description: 'The available property configs',
    },
  };
