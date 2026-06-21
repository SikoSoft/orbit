import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';

export enum PropertyConfigOptionsProp {
  OPTIONS = 'options',
}

export interface PropertyConfigOptionsProps extends PropTypes {
  [PropertyConfigOptionsProp.OPTIONS]: string[];
}

export const propertyConfigOptionsProps: PropConfigMap<PropertyConfigOptionsProps> = {
  [PropertyConfigOptionsProp.OPTIONS]: {
    default: [],
    control: { type: ControlType.HIDDEN },
    description: 'The predefined options for the property',
  },
};
