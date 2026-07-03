import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';
import { Entity, EntityConfig } from 'api-spec/models/Entity';
import { ListConfig, ListFilter } from 'api-spec/models/List';

export enum EntityListProp {
  PUBLIC_VIEW = 'publicView',
  OVERRIDE_FILTER = 'overrideFilter',
}

export interface EntityListProps extends PropTypes {
  [EntityListProp.PUBLIC_VIEW]: boolean;
  [EntityListProp.OVERRIDE_FILTER]: ListFilter | null;
}

export const entityListProps: PropConfigMap<EntityListProps> = {
  [EntityListProp.PUBLIC_VIEW]: {
    default: false,
    control: {
      type: ControlType.BOOLEAN,
    },
    description: 'Whether the entity list is in public view',
  },
  [EntityListProp.OVERRIDE_FILTER]: {
    default: null,
    control: {
      type: ControlType.HIDDEN,
    },
    description: 'When set, overrides the state listFilter for fetching entities',
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
