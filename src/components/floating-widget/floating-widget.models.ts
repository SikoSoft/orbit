import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';

export enum FloatingWidgetProp {
  POSITION = 'position',
}

export enum FloatingWidgetPosition {
  TOP = 'top',
  BOTTOM = 'bottom',
}

export interface FloatingWidgetProps extends PropTypes {
  [FloatingWidgetProp.POSITION]: FloatingWidgetPosition;
}

export const floatingWidgetProps: PropConfigMap<FloatingWidgetProps> = {
  [FloatingWidgetProp.POSITION]: {
    default: FloatingWidgetPosition.BOTTOM,
    control: {
      type: ControlType.SELECT,
      options: Object.values(FloatingWidgetPosition),
    },
    description: 'Whether the widget is anchored to the top or bottom of the viewport',
  },
};
