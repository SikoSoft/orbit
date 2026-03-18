import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';
import { Entity, EntityConfig } from 'api-spec/models/Entity';
import { ListConfig } from 'api-spec/models/List';

export enum EntityListProp {
  PUBLIC_VIEW = 'publicView',
}

export interface EntityListProps extends PropTypes {
  [EntityListProp.PUBLIC_VIEW]: boolean;
}

export const entityListProps: PropConfigMap<EntityListProps> = {
  [EntityListProp.PUBLIC_VIEW]: {
    default: false,
    control: {
      type: ControlType.BOOLEAN,
    },
    description: 'Whether the entity list is in public view',
  },
};

export type EntityListResult = {
  entities: Entity[];
  total: number;
};

export type PublicEntityListResult = EntityListResult & {
  listConfig: ListConfig;
  entityConfigs: EntityConfig[];
};
