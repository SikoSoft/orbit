import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';

export enum PrestigeGemProp {
  PRESTIGE = 'prestige',
}

export interface PrestigeGemProps extends PropTypes {
  [PrestigeGemProp.PRESTIGE]: number;
}

export const prestigeGemProps: PropConfigMap<PrestigeGemProps> = {
  [PrestigeGemProp.PRESTIGE]: {
    default: 1,
    description: 'Prestige level (1–10) that determines gem color tier',
    control: { type: ControlType.NUMBER, min: 1, max: 10 },
  },
};
