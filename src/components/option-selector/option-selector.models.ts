import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';

export interface SelectOption {
  name: string;
  value: string;
}

export enum OptionSelectorProp {
  OPTIONS = 'options',
  MULTIPLE = 'multiple',
  REQUIRED = 'required',
  SELECTED = 'selected',
}

export interface OptionSelectorProps extends PropTypes {
  [OptionSelectorProp.OPTIONS]: SelectOption[];
  [OptionSelectorProp.MULTIPLE]: boolean;
  [OptionSelectorProp.REQUIRED]: boolean;
  [OptionSelectorProp.SELECTED]: string[];
}

export const optionSelectorProps: PropConfigMap<OptionSelectorProps> = {
  [OptionSelectorProp.OPTIONS]: {
    default: [],
    control: { type: ControlType.HIDDEN },
    description: 'The list of options to display',
  },
  [OptionSelectorProp.MULTIPLE]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Whether multiple options can be selected simultaneously',
  },
  [OptionSelectorProp.REQUIRED]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Whether at least one option must remain selected at all times',
  },
  [OptionSelectorProp.SELECTED]: {
    default: [],
    control: { type: ControlType.HIDDEN },
    description: 'The currently selected option values',
  },
};
