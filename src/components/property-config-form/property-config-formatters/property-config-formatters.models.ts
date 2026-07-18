import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';

export enum PropertyConfigFormattersProp {
  FORMATTERS = 'formatters',
}

export interface PropertyConfigFormattersProps extends PropTypes {
  [PropertyConfigFormattersProp.FORMATTERS]: string[];
}

export const propertyConfigFormattersProps: PropConfigMap<PropertyConfigFormattersProps> =
  {
    [PropertyConfigFormattersProp.FORMATTERS]: {
      default: [],
      description: 'The ids of the currently selected formatters, in order',
      control: { type: ControlType.HIDDEN },
    },
  };
