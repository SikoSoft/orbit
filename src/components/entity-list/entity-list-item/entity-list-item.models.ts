import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';
import { EntityProperty } from 'api-spec/models/Entity';

export enum EntityListItemMode {
  PREVIEW = 'preview',
  FULL = 'full',
  EDIT = 'edit',
}

export enum EntityListItemProp {
  TYPE = 'type',
  ENTITY_ID = 'entityId',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TAGS = 'tags',
  SELECTED = 'selected',
  PROPERTIES = 'properties',
  DEBUG = 'debug',
  PUBLIC_VIEW = 'publicView',
  VIEW_ACCESS_POLICY_ID = 'viewAccessPolicyId',
  EDIT_ACCESS_POLICY_ID = 'editAccessPolicyId',
}

export interface EntityListItemProps extends PropTypes {
  [EntityListItemProp.TYPE]: number;
  [EntityListItemProp.ENTITY_ID]: number;
  [EntityListItemProp.CREATED_AT]: string;
  [EntityListItemProp.UPDATED_AT]: string;
  [EntityListItemProp.TAGS]: string[];
  [EntityListItemProp.SELECTED]: boolean;
  [EntityListItemProp.PROPERTIES]: EntityProperty[];
  [EntityListItemProp.DEBUG]: boolean;
  [EntityListItemProp.PUBLIC_VIEW]: boolean;
  [EntityListItemProp.VIEW_ACCESS_POLICY_ID]: number;
  [EntityListItemProp.EDIT_ACCESS_POLICY_ID]: number;
}

export const entityListItemProps: PropConfigMap<EntityListItemProps> = {
  [EntityListItemProp.TYPE]: {
    default: 0,
    control: {
      type: ControlType.NUMBER,
    },
    description: 'The type of the entity',
  },
  [EntityListItemProp.ENTITY_ID]: {
    default: 0,
    control: {
      type: ControlType.NUMBER,
    },
    description: 'The ID of the entity',
  },
  [EntityListItemProp.CREATED_AT]: {
    default: '',
    control: {
      type: ControlType.TEXT,
    },
    description: 'The creation date of the entity',
  },
  [EntityListItemProp.UPDATED_AT]: {
    default: '',
    control: {
      type: ControlType.TEXT,
    },
    description: 'The update date of the entity',
  },
  [EntityListItemProp.TAGS]: {
    default: [],
    control: {
      type: ControlType.TEXT,
    },
    description: 'The tags of the entity',
  },
  [EntityListItemProp.SELECTED]: {
    default: false,
    control: {
      type: ControlType.BOOLEAN,
    },
    description: 'Whether the entity is selected',
  },
  [EntityListItemProp.PROPERTIES]: {
    default: [],
    control: {
      type: ControlType.TEXT,
    },
    description: 'The properties of the entity',
  },
  [EntityListItemProp.DEBUG]: {
    default: false,
    control: {
      type: ControlType.BOOLEAN,
    },
    description: 'Whether debug mode is enabled',
  },
  [EntityListItemProp.PUBLIC_VIEW]: {
    default: false,
    control: {
      type: ControlType.BOOLEAN,
    },
    description: 'Whether the entity is in public view',
  },
  [EntityListItemProp.VIEW_ACCESS_POLICY_ID]: {
    default: 0,
    control: {
      type: ControlType.NUMBER,
    },
    description: 'The ID of the view access policy',
  },
  [EntityListItemProp.EDIT_ACCESS_POLICY_ID]: {
    default: 0,
    control: {
      type: ControlType.NUMBER,
    },
    description: 'The ID of the edit access policy',
  },
};
