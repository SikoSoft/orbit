import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';

export enum EntityAccessPolicyProp {
  ENTITY_ID = 'entityId',
  ACCESS_POLICY_ID = 'accessPolicyId',
}

export interface EntityAccessPolicyProps extends PropTypes {
  [EntityAccessPolicyProp.ENTITY_ID]: number;
  [EntityAccessPolicyProp.ACCESS_POLICY_ID]: number;
}

export const entityAccessPolicyProps: PropConfigMap<EntityAccessPolicyProps> = {
  [EntityAccessPolicyProp.ENTITY_ID]: {
    default: 0,
    control: { type: ControlType.HIDDEN },
    description: 'The ID of the entity whose access list is being managed',
  },
  [EntityAccessPolicyProp.ACCESS_POLICY_ID]: {
    default: 0,
    control: { type: ControlType.HIDDEN },
    description:
      'The ID of the access policy currently assigned to this entity (0 for none)',
  },
};
