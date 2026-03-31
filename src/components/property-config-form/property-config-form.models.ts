import { ControlType } from '@/models/Control';
import { DataType, PropertyDataValue } from 'api-spec/models/Entity';
import { PropConfigMap, PropTypes } from '@/models/Prop';

export enum PropertyConfigFormProp {
  OPEN = 'open',
  DATA_TYPE = 'dataType',
  UI_ID = 'uiId',
  ENTITY_CONFIG_ID = 'entityConfigId',
  PROPERTY_CONFIG_ID = 'propertyConfigId',
  NAME = 'name',
  REPEAT = 'repeat',
  ALLOWED = 'allowed',
  REQUIRED = 'required',
  PREFIX = 'prefix',
  SUFFIX = 'suffix',
  HIDDEN = 'hidden',
  DEFAULT_VALUE = 'defaultValue',
  PERFORM_DRIFT_CHECK = 'performDriftCheck',
}

export const propertyConfigFormRequiredProps: PropertyConfigFormProp[] = [
  PropertyConfigFormProp.NAME,
];

export interface PropertyConfigFormProps extends PropTypes {
  [PropertyConfigFormProp.OPEN]: boolean;
  [PropertyConfigFormProp.DATA_TYPE]: string;
  [PropertyConfigFormProp.UI_ID]: string;
  [PropertyConfigFormProp.ENTITY_CONFIG_ID]: number;
  [PropertyConfigFormProp.PROPERTY_CONFIG_ID]: number;
  [PropertyConfigFormProp.NAME]: string;
  [PropertyConfigFormProp.REQUIRED]: number;
  [PropertyConfigFormProp.REPEAT]: number;
  [PropertyConfigFormProp.ALLOWED]: number;
  [PropertyConfigFormProp.PREFIX]: string;
  [PropertyConfigFormProp.SUFFIX]: string;
  [PropertyConfigFormProp.HIDDEN]: boolean;
  [PropertyConfigFormProp.DEFAULT_VALUE]: PropertyDataValue;
  [PropertyConfigFormProp.PERFORM_DRIFT_CHECK]: boolean;
}

export const propertyConfigFormProps: PropConfigMap<PropertyConfigFormProps> = {
  [PropertyConfigFormProp.OPEN]: {
    default: false,
    control: { type: ControlType.HIDDEN },
    description: 'Whether the form is open or closed',
  },
  [PropertyConfigFormProp.DATA_TYPE]: {
    default: DataType.SHORT_TEXT,
    control: { type: ControlType.SELECT, options: Object.values(DataType) },
    description: 'The data type of the property',
  },
  [PropertyConfigFormProp.UI_ID]: {
    default: '',
    control: { type: ControlType.HIDDEN },
    description: 'The UI ID of the property',
  },
  [PropertyConfigFormProp.ENTITY_CONFIG_ID]: {
    default: 0,
    control: { type: ControlType.HIDDEN },
    description: 'The ID of the entity config',
  },
  [PropertyConfigFormProp.PROPERTY_CONFIG_ID]: {
    default: 0,
    control: { type: ControlType.HIDDEN },
    description: 'The ID of the property',
  },
  [PropertyConfigFormProp.NAME]: {
    default: '',
    control: { type: ControlType.TEXT },
    description: 'The name of the property',
  },
  [PropertyConfigFormProp.REQUIRED]: {
    default: 0,
    control: { type: ControlType.NUMBER },
    description: 'How many of this property are required',
  },
  [PropertyConfigFormProp.REPEAT]: {
    default: 0,
    control: { type: ControlType.NUMBER },
    description: 'How many times this property can be repeated',
  },
  [PropertyConfigFormProp.ALLOWED]: {
    default: 0,
    control: { type: ControlType.NUMBER },
    description: 'How many of this property are allowed',
  },
  [PropertyConfigFormProp.PREFIX]: {
    default: '',
    control: { type: ControlType.TEXT },
    description: 'The prefix of the property',
  },
  [PropertyConfigFormProp.SUFFIX]: {
    default: '',
    control: { type: ControlType.TEXT },
    description: 'The suffix of the property',
  },
  [PropertyConfigFormProp.HIDDEN]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Whether the property is hidden',
  },
  [PropertyConfigFormProp.DEFAULT_VALUE]: {
    default: '',
    control: { type: ControlType.TEXT },
    description: 'The default value of the property',
  },
  [PropertyConfigFormProp.PERFORM_DRIFT_CHECK]: {
    default: false,
    control: { type: ControlType.HIDDEN },
    description: 'Whether to perform a drift check on the property',
  },
};
