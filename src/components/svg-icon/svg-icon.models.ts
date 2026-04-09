import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';

export enum IconName {
  CAMERA = 'camera',
  CLOUD = 'cloud',
  DEVICE = 'device',
  FOLDER = 'folder',
  IMAGE = 'image',
  SETTINGS = 'settings',
  SPINNER = 'spinner',
  UPLOAD = 'upload',
}

export enum SvgIconProp {
  NAME = 'name',
  SIZE = 'size',
  COLOR = 'color',
}

export interface SvgIconProps extends PropTypes {
  [SvgIconProp.NAME]: IconName;
  [SvgIconProp.SIZE]: number;
  [SvgIconProp.COLOR]: string;
}

export const svgIconProps: PropConfigMap<SvgIconProps> = {
  [SvgIconProp.NAME]: {
    default: IconName.DEVICE,
    description: 'The name of the icon to display',
    control: { type: ControlType.SELECT, options: Object.values(IconName) },
  },
  [SvgIconProp.SIZE]: {
    default: 24,
    description: 'The size of the icon in pixels',
    control: { type: ControlType.NUMBER },
  },
  [SvgIconProp.COLOR]: {
    default: 'currentColor',
    description: 'The color of the icon',
    control: { type: ControlType.TEXT },
  },
};
