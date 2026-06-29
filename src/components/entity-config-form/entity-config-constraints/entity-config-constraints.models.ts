import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';
import {
  EntityConfigUniqueConstraint,
  EntityPropertyConfig,
} from 'api-spec/models/Entity';

export enum EntityConfigConstraintsProp {
  ENTITY_CONFIG_ID = 'entityConfigId',
  UNIQUE_CONSTRAINTS = 'uniqueConstraints',
  NON_CALCULATED_PROPERTIES = 'nonCalculatedProperties',
}

export interface EntityConfigConstraintsProps extends PropTypes {
  [EntityConfigConstraintsProp.ENTITY_CONFIG_ID]: number;
  [EntityConfigConstraintsProp.UNIQUE_CONSTRAINTS]: EntityConfigUniqueConstraint[];
  [EntityConfigConstraintsProp.NON_CALCULATED_PROPERTIES]: EntityPropertyConfig[];
}

export const entityConfigConstraintsProps: PropConfigMap<EntityConfigConstraintsProps> =
  {
    [EntityConfigConstraintsProp.ENTITY_CONFIG_ID]: {
      default: 0,
      control: { type: ControlType.NUMBER },
      description: 'The id of the entity config these constraints belong to',
    },
    [EntityConfigConstraintsProp.UNIQUE_CONSTRAINTS]: {
      default: [],
      control: { type: ControlType.HIDDEN },
      description: 'The unique constraints for this entity config',
    },
    [EntityConfigConstraintsProp.NON_CALCULATED_PROPERTIES]: {
      default: [],
      control: { type: ControlType.HIDDEN },
      description:
        'The non-calculated properties available for constraint selection',
    },
  };
