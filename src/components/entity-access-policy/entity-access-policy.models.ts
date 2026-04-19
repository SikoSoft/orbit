import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';

export enum EntityAccessPolicyProp {
  ENTITY_ID = 'entityId',
  VIEW_ACCESS_POLICY_ID = 'viewAccessPolicyId',
  EDIT_ACCESS_POLICY_ID = 'editAccessPolicyId',
}

export interface EntityAccessPolicyProps extends PropTypes {
  [EntityAccessPolicyProp.ENTITY_ID]: number;
  [EntityAccessPolicyProp.VIEW_ACCESS_POLICY_ID]: number;
  [EntityAccessPolicyProp.EDIT_ACCESS_POLICY_ID]: number;
}

export const entityAccessPolicyProps: PropConfigMap<EntityAccessPolicyProps> = {
  [EntityAccessPolicyProp.ENTITY_ID]: {
    default: 0,
    control: { type: ControlType.HIDDEN },
    description: 'The ID of the entity whose access list is being managed',
  },
  [EntityAccessPolicyProp.VIEW_ACCESS_POLICY_ID]: {
    default: 0,
    control: { type: ControlType.HIDDEN },
    description:
      'The ID of the view access policy currently assigned to this entity (0 for none)',
  },
  [EntityAccessPolicyProp.EDIT_ACCESS_POLICY_ID]: {
    default: 0,
    control: { type: ControlType.HIDDEN },
    description:
      'The ID of the edit access policy currently assigned to this entity (0 for none)',
  },
};
