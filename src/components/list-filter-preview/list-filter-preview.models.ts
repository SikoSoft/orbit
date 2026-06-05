import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';
import { ListFilter } from 'api-spec/models/List';

export enum ListFilterPreviewProp {
  LIST_FILTER = 'listFilter',
}

export interface ListFilterPreviewProps extends PropTypes {
  [ListFilterPreviewProp.LIST_FILTER]: ListFilter | undefined;
}

export const listFilterPreviewProps: PropConfigMap<ListFilterPreviewProps> = {
  [ListFilterPreviewProp.LIST_FILTER]: {
    default: undefined,
    control: { type: ControlType.HIDDEN },
    description: 'The filter to summarize',
  },
};
