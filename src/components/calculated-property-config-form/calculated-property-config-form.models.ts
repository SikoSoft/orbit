import { ControlType } from '@/models/Control';
import {
  DataType,
  EntityCalculatedPropertyConfig,
  EntityPropertyCalculation,
  EntityPropertyCalculationOperation,
  EntityPropertyConfig,
} from 'api-spec/models/Entity';
import { PropConfigMap, PropTypes } from '@/models/Prop';

export enum CalculatedPropertyConfigFormProp {
  OPEN = 'open',
  ENTITY_CONFIG_ID = 'entityConfigId',
  PROPERTY_CONFIG_ID = 'propertyConfigId',
  NAME = 'name',
  PREFIX = 'prefix',
  SUFFIX = 'suffix',
  HIDDEN = 'hidden',
  CALCULATION = 'calculation',
  ALL_PROPERTIES = 'allProperties',
}

export type OperandType = 'property' | 'number';

export const defaultCalculation: EntityPropertyCalculation = {
  value1: 0,
  value2: 0,
  operation: '+' as EntityPropertyCalculationOperation,
};

export interface CalculatedPropertyConfigFormProps extends PropTypes {
  [CalculatedPropertyConfigFormProp.OPEN]: boolean;
  [CalculatedPropertyConfigFormProp.ENTITY_CONFIG_ID]: number;
  [CalculatedPropertyConfigFormProp.PROPERTY_CONFIG_ID]: number;
  [CalculatedPropertyConfigFormProp.NAME]: string;
  [CalculatedPropertyConfigFormProp.PREFIX]: string;
  [CalculatedPropertyConfigFormProp.SUFFIX]: string;
  [CalculatedPropertyConfigFormProp.HIDDEN]: boolean;
  [CalculatedPropertyConfigFormProp.CALCULATION]: EntityPropertyCalculation;
  [CalculatedPropertyConfigFormProp.ALL_PROPERTIES]: EntityPropertyConfig[];
}

export const calculatedPropertyConfigFormProps: PropConfigMap<CalculatedPropertyConfigFormProps> =
  {
    [CalculatedPropertyConfigFormProp.OPEN]: {
      default: false,
      control: { type: ControlType.HIDDEN },
      description: 'Whether the form is open',
    },
    [CalculatedPropertyConfigFormProp.ENTITY_CONFIG_ID]: {
      default: 0,
      control: { type: ControlType.HIDDEN },
      description: 'The entity config ID',
    },
    [CalculatedPropertyConfigFormProp.PROPERTY_CONFIG_ID]: {
      default: 0,
      control: { type: ControlType.HIDDEN },
      description: 'The property config ID (0 if new)',
    },
    [CalculatedPropertyConfigFormProp.NAME]: {
      default: '',
      control: { type: ControlType.TEXT },
      description: 'The name of the calculated property',
    },
    [CalculatedPropertyConfigFormProp.PREFIX]: {
      default: '',
      control: { type: ControlType.TEXT },
      description: 'The prefix displayed before the value',
    },
    [CalculatedPropertyConfigFormProp.SUFFIX]: {
      default: '',
      control: { type: ControlType.TEXT },
      description: 'The suffix displayed after the value',
    },
    [CalculatedPropertyConfigFormProp.HIDDEN]: {
      default: false,
      control: { type: ControlType.BOOLEAN },
      description: 'Whether the property is hidden from list views',
    },
    [CalculatedPropertyConfigFormProp.CALCULATION]: {
      default: defaultCalculation,
      control: { type: ControlType.HIDDEN },
      description: 'The calculation formula object',
    },
    [CalculatedPropertyConfigFormProp.ALL_PROPERTIES]: {
      default: [],
      control: { type: ControlType.HIDDEN },
      description: 'All non-calculated properties for the operand picker',
    },
  };

export function isPickableProperty(p: EntityPropertyConfig): boolean {
  return (
    (p.dataType === DataType.INT || p.dataType === DataType.DATE) && p.repeat === 0
  );
}

export function buildCalculatedConfig(
  entityConfigId: number,
  propertyConfigId: number,
  name: string,
  prefix: string,
  suffix: string,
  hidden: boolean,
  calculation: EntityPropertyCalculation,
): EntityCalculatedPropertyConfig {
  return {
    entityConfigId,
    id: propertyConfigId,
    userId: '',
    name,
    prefix,
    suffix,
    hidden,
    dataType: DataType.INT,
    defaultValue: 0,
    calculation,
  } as EntityCalculatedPropertyConfig;
}
