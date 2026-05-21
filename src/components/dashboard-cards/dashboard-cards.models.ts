import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';
import { IconName } from '@/components/svg-icon/svg-icon.models';

export interface DashboardCard {
  label: string;
  icon: IconName;
  url: string;
}

export enum DashboardCardsProp {
  CARDS = 'cards',
}

export interface DashboardCardsProps extends PropTypes {
  [DashboardCardsProp.CARDS]: DashboardCard[];
}

export const dashboardCardsProps: PropConfigMap<DashboardCardsProps> = {
  [DashboardCardsProp.CARDS]: {
    default: [],
    description: 'Array of card definitions to render',
    control: { type: ControlType.HIDDEN },
  },
};
