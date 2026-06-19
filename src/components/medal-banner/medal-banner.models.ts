import { Medal } from 'api-spec/models/Medal';
import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';
import { MedalConfigWithProgress } from '@/components/medal-list/medal-list.models';

export enum MedalBannerProp {
  CONFIG = 'config',
  MEDAL = 'medal',
}

export interface MedalBannerProps extends PropTypes {
  [MedalBannerProp.CONFIG]: MedalConfigWithProgress;
  [MedalBannerProp.MEDAL]: Medal | undefined;
}

export const medalBannerProps: PropConfigMap<MedalBannerProps> = {
  [MedalBannerProp.CONFIG]: {
    default: {} as MedalConfigWithProgress,
    control: { type: ControlType.HIDDEN },
    description: 'The medal config with optional criteria progress data',
  },
  [MedalBannerProp.MEDAL]: {
    default: undefined,
    control: { type: ControlType.HIDDEN },
    description: 'The earned medal instance, or undefined if not yet earned',
  },
};
