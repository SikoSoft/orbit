import { PropTypes, PropConfigMap } from '@/models/Prop';
import { ControlType } from 'api-spec/models/Setting';

export enum ListConfigCarouselProp {
  VIEW_ONLY = 'viewOnly',
}

export interface ListConfigCarouselProps extends PropTypes {
  [ListConfigCarouselProp.VIEW_ONLY]: boolean;
}

export const listConfigCarouselProps: PropConfigMap<ListConfigCarouselProps> = {
  [ListConfigCarouselProp.VIEW_ONLY]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Whether the carousel is view only',
  },
};
