import {
  DataType,
  EntityProperty,
  PropertyDataValue,
} from 'api-spec/models/Entity';
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
  TAG_VALUE = 'tagValue',
  PROPERTIES = 'properties',
}

export interface EntityFormProps extends PropTypes {
  [EntityFormProp.ENTITY_ID]: number;
  [EntityFormProp.TYPE]: number;
  [EntityFormProp.DESC]: string;
  [EntityFormProp.OCCURRED_AT]: string;
  [EntityFormProp.TAGS]: string[];
  [EntityFormProp.TAG_VALUE]: string;
  [EntityFormProp.PROPERTIES]: EntityProperty[];
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
  [EntityFormProp.TAG_VALUE]: {
    default: '',
    control: {
      type: ControlType.TEXT,
    },
    description: 'The value of the tag',
  },
  [EntityFormProp.PROPERTIES]: {
    default: [],
    control: {
      type: ControlType.TEXT,
    },
    description: 'The properties of the entity',
  },
};

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
}

export enum SuggestionInputType {
  TAG = 'tag',
  ACTION = 'action',
}

export type SuggestionLastInput = Record<
  SuggestionInputType,
  { hadResults: boolean; value: string }
>;

export enum EntityFormTab {
  PROPERTIES = 'properties',
  ACCESS = 'access',
}
