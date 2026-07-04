import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';

export enum EntityListItemTimeProp {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export interface EntityListItemTimeProps extends PropTypes {
  [EntityListItemTimeProp.CREATED_AT]: string;
  [EntityListItemTimeProp.UPDATED_AT]: string;
}

export const entityListItemTimeProps: PropConfigMap<EntityListItemTimeProps> = {
  [EntityListItemTimeProp.CREATED_AT]: {
    default: '',
    control: { type: ControlType.TEXT },
    description: 'The creation date of the entity',
  },
  [EntityListItemTimeProp.UPDATED_AT]: {
    default: '',
    control: { type: ControlType.TEXT },
    description: 'The last updated date of the entity',
  },
};
