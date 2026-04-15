import { AccessPartyType } from 'api-spec/models/Access';
import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';

export interface AccessPolicyMember {
  targetId: string;
  type: AccessPartyType;
  displayName: string;
}

export enum AccessPolicyProp {
  MEMBERS = 'members',
  SUGGESTIONS = 'suggestions',
}

export interface AccessPolicyProps extends PropTypes {
  [AccessPolicyProp.MEMBERS]: AccessPolicyMember[];
  [AccessPolicyProp.SUGGESTIONS]: AccessPolicyMember[];
}

export const accessPolicyProps: PropConfigMap<AccessPolicyProps> = {
  [AccessPolicyProp.MEMBERS]: {
    default: [],
    control: { type: ControlType.HIDDEN },
    description: 'The current list of users and groups in the access policy',
  },
  [AccessPolicyProp.SUGGESTIONS]: {
    default: [],
    control: { type: ControlType.HIDDEN },
    description: 'Search result suggestions for users and groups to add',
  },
};
