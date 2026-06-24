import { DataType, EntityProperty, PropertyDataValue } from 'api-spec/models/Entity';
import { nothing, TemplateResult } from 'lit';
import { PropConfigMap, PropTypes } from '@/models/Prop';
import { ControlType } from '@/models/Control';

export interface PropertyInstance {
  propertyConfigId: number;
  instanceId: number;
  uiId: string;
  value: PropertyDataValue;
  valueIsSet: boolean;
}

export type ValidateionResult =
  | {
      isValid: true;
    }
  | {
      isValid: false;
      errors: string[];
    };

export enum EntityFormProp {
  ENTITY_ID = 'entityId',
  TYPE = 'type',
  DESC = 'desc',
  OCCURRED_AT = 'occurredAt',
  TAGS = 'tags',
  PROPERTIES = 'properties',
  VIEW_ACCESS_POLICY_ID = 'viewAccessPolicyId',
  EDIT_ACCESS_POLICY_ID = 'editAccessPolicyId',
  PUBLISHED = 'published',
  ALLOW_COMMENTS = 'allowComments',
  OWNER_ID = 'ownerId',
}

export interface EntityFormProps extends PropTypes {
  [EntityFormProp.ENTITY_ID]: number;
  [EntityFormProp.TYPE]: number;
  [EntityFormProp.DESC]: string;
  [EntityFormProp.OCCURRED_AT]: string;
  [EntityFormProp.TAGS]: string[];
  [EntityFormProp.PROPERTIES]: EntityProperty[];
  [EntityFormProp.VIEW_ACCESS_POLICY_ID]: number;
  [EntityFormProp.EDIT_ACCESS_POLICY_ID]: number;
  [EntityFormProp.PUBLISHED]: boolean;
  [EntityFormProp.ALLOW_COMMENTS]: boolean;
  [EntityFormProp.OWNER_ID]: string;
}

export const entityFormProps: PropConfigMap<EntityFormProps> = {
  [EntityFormProp.ENTITY_ID]: {
    default: 0,
    control: {
      type: ControlType.NUMBER,
    },
    description: 'The ID of the entity',
  },
  [EntityFormProp.TYPE]: {
    default: 0,
    control: {
      type: ControlType.NUMBER,
    },
    description: 'The type of the entity',
  },
  [EntityFormProp.DESC]: {
    default: '',
    control: {
      type: ControlType.TEXT,
    },
    description: 'The description of the entity',
  },
  [EntityFormProp.OCCURRED_AT]: {
    default: '',
    control: {
      type: ControlType.TEXT,
    },
    description: 'The occurrence date of the entity',
  },
  [EntityFormProp.TAGS]: {
    default: [],
    control: {
      type: ControlType.TEXT,
    },
    description: 'The tags of the entity',
  },
  [EntityFormProp.PROPERTIES]: {
    default: [],
    control: {
      type: ControlType.TEXT,
    },
    description: 'The properties of the entity',
  },
  [EntityFormProp.VIEW_ACCESS_POLICY_ID]: {
    default: 0,
    control: {
      type: ControlType.NUMBER,
    },
    description: 'The ID of the view access policy',
  },
  [EntityFormProp.EDIT_ACCESS_POLICY_ID]: {
    default: 0,
    control: {
      type: ControlType.NUMBER,
    },
    description: 'The ID of the edit access policy',
  },
  [EntityFormProp.PUBLISHED]: {
    default: false,
    control: {
      type: ControlType.BOOLEAN,
    },
    description: 'Whether the entity is published',
  },
  [EntityFormProp.ALLOW_COMMENTS]: {
    default: false,
    control: {
      type: ControlType.BOOLEAN,
    },
    description: 'Whether comments are enabled for this entity',
  },
  [EntityFormProp.OWNER_ID]: {
    default: '',
    control: {
      type: ControlType.TEXT,
    },
    description: 'The user ID of the entity owner',
  },
};

export interface TabEntry {
  heading: string;
  content: () => TemplateResult | typeof nothing;
  shouldShow: () => boolean;
}

export type PropertyReference = {
  dataType: DataType;
  propertyValueId: number;
};

export interface RequestBody {
  entityConfigId: number;
  timeZone: number;
  tags: string[];
  properties: EntityProperty[];
  propertyReferences: PropertyReference[];
  published: boolean;
  allowComments?: boolean;
}

export enum SuggestionInputType {
  TAG = 'tag',
  ACTION = 'action',
}

export type SuggestionLastInput = Record<
  SuggestionInputType,
  { hadResults: boolean; value: string }
>;
