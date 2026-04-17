import { AccessPartyType } from 'api-spec/models/Access';
import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';

export interface AccessPolicyMember {
  targetId: string;
  type: AccessPartyType;
  displayName: string;
}

export enum AccessPolicyProp {
  NAME = 'name',
  DESCRIPTION = 'description',
  MEMBERS = 'members',
  SUGGESTIONS = 'suggestions',
}

export interface AccessPolicyProps extends PropTypes {
  [AccessPolicyProp.NAME]: string;
  [AccessPolicyProp.DESCRIPTION]: string;
  [AccessPolicyProp.MEMBERS]: AccessPolicyMember[];
  [AccessPolicyProp.SUGGESTIONS]: AccessPolicyMember[];
}

export const accessPolicyProps: PropConfigMap<AccessPolicyProps> = {
  [AccessPolicyProp.NAME]: {
    default: '',
    control: { type: ControlType.TEXT },
    description: 'The name of the access policy',
  },
  [AccessPolicyProp.DESCRIPTION]: {
    default: '',
    control: { type: ControlType.TEXT },
    description: 'The description of the access policy',
  },
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
