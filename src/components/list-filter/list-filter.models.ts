import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';
import { ListFilter as ListFilterSpec } from 'api-spec/models/List';

export enum ListFilterProp {
  EXTERNAL_FILTER = 'externalFilter',
}

export interface ListFilterProps extends PropTypes {
  [ListFilterProp.EXTERNAL_FILTER]: ListFilterSpec | undefined;
}

export const listFilterProps: PropConfigMap<ListFilterProps> = {
  [ListFilterProp.EXTERNAL_FILTER]: {
    default: undefined,
    control: { type: ControlType.HIDDEN },
    description: 'Optional external filter used instead of the app state filter',
  },
};
