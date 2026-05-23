import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';
import { ListFilter as ListFilterSpec } from 'api-spec/models/List';

export enum ListFilterProp {
  LIST_FILTER = 'listFilter',
}

export interface ListFilterProps extends PropTypes {
  [ListFilterProp.LIST_FILTER]: ListFilterSpec | undefined;
}

export const listFilterProps: PropConfigMap<ListFilterProps> = {
  [ListFilterProp.LIST_FILTER]: {
    default: undefined,
    control: { type: ControlType.HIDDEN },
    description: 'Filter value passed in from outside',
  },
};
