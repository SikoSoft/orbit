import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';

export enum ColorSelectorProp {
  VALUE = 'value',
}

export interface ColorSelectorProps extends PropTypes {
  [ColorSelectorProp.VALUE]: string;
}

export const colorSelectorProps: PropConfigMap<ColorSelectorProps> = {
  [ColorSelectorProp.VALUE]: {
    default: '',
    description: 'The currently selected hex color value',
    control: { type: ControlType.TEXT },
  },
};

export const CURATED_COLORS: string[] = [
  '#E53935',
  '#E91E63',
  '#8E24AA',
  '#3949AB',
  '#1E88E5',
  '#039BE5',
  '#00ACC1',
  '#00897B',
  '#43A047',
  '#7CB342',
  '#F9A825',
  '#FB8C00',
  '#F4511E',
  '#6D4C41',
  '#546E7A',
  '#78909C',
  '#D81B60',
  '#1565C0',
  '#2E7D32',
  '#BF360C',
];
