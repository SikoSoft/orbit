import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';

export interface OptionListBuilderItem {
  id: string;
  label: string;
}

export enum OptionListBuilderProp {
  AVAILABLE = 'available',
  SELECTED = 'selected',
  EMPTY_MESSAGE = 'emptyMessage',
}

export interface OptionListBuilderProps extends PropTypes {
  [OptionListBuilderProp.AVAILABLE]: OptionListBuilderItem[];
  [OptionListBuilderProp.SELECTED]: string[];
  [OptionListBuilderProp.EMPTY_MESSAGE]: string;
}

export const optionListBuilderProps: PropConfigMap<OptionListBuilderProps> = {
  [OptionListBuilderProp.AVAILABLE]: {
    default: [],
    description: 'The options that can be added to the selected list',
    control: { type: ControlType.HIDDEN },
  },
  [OptionListBuilderProp.SELECTED]: {
    default: [],
    description: 'The ids of the currently selected options, in order',
    control: { type: ControlType.HIDDEN },
  },
  [OptionListBuilderProp.EMPTY_MESSAGE]: {
    default: '',
    description: 'Message shown when no options are selected',
    control: { type: ControlType.TEXT },
  },
};
