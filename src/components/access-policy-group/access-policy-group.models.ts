import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';
import { AccessPolicyMember } from '@/components/access-policy/access-policy.models';

export type { AccessPolicyMember };

export enum AccessPolicyGroupProp {
  ID = 'id',
  NAME = 'name',
  MEMBERS = 'members',
  SUGGESTIONS = 'suggestions',
}

export interface AccessPolicyGroupProps extends PropTypes {
  [AccessPolicyGroupProp.ID]: string;
  [AccessPolicyGroupProp.NAME]: string;
  [AccessPolicyGroupProp.MEMBERS]: AccessPolicyMember[];
  [AccessPolicyGroupProp.SUGGESTIONS]: AccessPolicyMember[];
}

export const accessPolicyGroupProps: PropConfigMap<AccessPolicyGroupProps> = {
  [AccessPolicyGroupProp.ID]: {
    default: '',
    control: { type: ControlType.HIDDEN },
    description: 'The ID of the group being edited (empty string when creating a new group)',
  },
  [AccessPolicyGroupProp.NAME]: {
    default: '',
    control: { type: ControlType.TEXT },
    description: 'The name of the group',
  },
  [AccessPolicyGroupProp.MEMBERS]: {
    default: [],
    control: { type: ControlType.HIDDEN },
    description: 'The current list of users in the group',
  },
  [AccessPolicyGroupProp.SUGGESTIONS]: {
    default: [],
    control: { type: ControlType.HIDDEN },
    description: 'Search result suggestions for users to add to the group',
  },
};
