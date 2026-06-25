import { PropTypes, PropConfigMap } from '@/models/Prop';
import { ControlType } from 'api-spec/models/Setting';

export enum ListConfigMenusProp {
  VIEW_ONLY = 'viewOnly',
}

export interface ListConfigMenusProps extends PropTypes {
  [ListConfigMenusProp.VIEW_ONLY]: boolean;
}

export const listConfigMenusProps: PropConfigMap<ListConfigMenusProps> = {
  [ListConfigMenusProp.VIEW_ONLY]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Whether the menus are view only',
  },
};
