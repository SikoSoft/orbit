import { ControlType } from '@/models/Control';
import { PropConfigMap } from '@/models/Prop';
import { defaultEntityPropertyConfig } from 'api-spec/models/Entity';

export enum BooleanFieldProp {
  VALUE = 'value',
  PROPERTY_CONFIG_ID = 'propertyConfigId',
  ENTITY_CONFIG_ID = 'entityConfigId',
  UI_ID = 'uiId',
}

export interface BooleanFieldProps {
  [BooleanFieldProp.VALUE]: boolean;
  [BooleanFieldProp.PROPERTY_CONFIG_ID]: number;
  [BooleanFieldProp.ENTITY_CONFIG_ID]: number;
  [BooleanFieldProp.UI_ID]: string;
}

export const booleanFieldProps: PropConfigMap<BooleanFieldProps> = {
  [BooleanFieldProp.VALUE]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'The boolean value of the field',
  },
  [BooleanFieldProp.PROPERTY_CONFIG_ID]: {
    default: defaultEntityPropertyConfig.id,
    control: { type: ControlType.NUMBER },
    description: 'The property configuration ID for the field',
  },
  [BooleanFieldProp.ENTITY_CONFIG_ID]: {
    default: defaultEntityPropertyConfig.entityConfigId,
    control: { type: ControlType.NUMBER },
    description: 'The entity configuration ID for the field',
  },
  [BooleanFieldProp.UI_ID]: {
    default: '',
    control: { type: ControlType.HIDDEN },
    description: 'The UI ID for tracking purposes',
  },
};
