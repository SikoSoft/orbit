import { ControlType } from '@/models/Control';
import { PropConfigMap } from '@/models/Prop';
import { defaultEntityPropertyConfig } from 'api-spec/models/Entity';

export enum FloatFieldProp {
  INSTANCE_ID = 'instanceId',
  VALUE = 'value',
  PLACEHOLDER = 'placeholder',
  LABEL = 'label',
  ENTITY_CONFIG_ID = 'entityConfigId',
  PROPERTY_CONFIG_ID = 'propertyConfigId',
  UI_ID = 'uiId',
}

export interface FloatFieldProps {
  [FloatFieldProp.INSTANCE_ID]: number;
  [FloatFieldProp.VALUE]: number;
  [FloatFieldProp.PLACEHOLDER]: string;
  [FloatFieldProp.LABEL]: string;
  [FloatFieldProp.PROPERTY_CONFIG_ID]: number;
  [FloatFieldProp.ENTITY_CONFIG_ID]: number;
  [FloatFieldProp.UI_ID]: string;
}

export const floatFieldProps: PropConfigMap<FloatFieldProps> = {
  [FloatFieldProp.INSTANCE_ID]: {
    default: 0,
    control: { type: ControlType.NUMBER },
    description: 'The instance ID of the input field',
  },
  [FloatFieldProp.VALUE]: {
    default: 0,
    control: { type: ControlType.NUMBER },
    description: 'The value of the input field',
  },
  [FloatFieldProp.PLACEHOLDER]: {
    default: '',
    control: { type: ControlType.TEXT },
    description: 'The placeholder text for the input field',
  },
  [FloatFieldProp.LABEL]: {
    default: '',
    control: { type: ControlType.TEXT },
    description: 'The label text for the input field',
  },
  [FloatFieldProp.PROPERTY_CONFIG_ID]: {
    default: defaultEntityPropertyConfig.id,
    control: { type: ControlType.NUMBER },
    description: 'The property configuration ID for the input field',
  },
  [FloatFieldProp.ENTITY_CONFIG_ID]: {
    default: defaultEntityPropertyConfig.entityConfigId,
    control: { type: ControlType.NUMBER },
    description: 'The entity configuration ID for the input field',
  },
  [FloatFieldProp.UI_ID]: {
    default: '',
    control: { type: ControlType.HIDDEN },
    description: 'The UI ID for the input field',
  },
};
