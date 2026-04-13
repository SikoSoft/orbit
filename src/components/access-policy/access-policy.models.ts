import { AccessType } from 'api-spec/models/Access';

export interface AccessPolicyMember {
  targetId: string;
  type: AccessType;
  displayName: string;
}
