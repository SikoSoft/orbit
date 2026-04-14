import { AccessPolicyMember } from '@/components/access-policy/access-policy.models';

export const accessPolicyGroupChangedEventName = 'access-policy-group-changed';

export interface AccessPolicyGroupChangedPayload {
  members: AccessPolicyMember[];
}

export class AccessPolicyGroupChangedEvent extends CustomEvent<AccessPolicyGroupChangedPayload> {
  constructor(detail: AccessPolicyGroupChangedPayload) {
    super(accessPolicyGroupChangedEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}

export const accessPolicyGroupSearchChangedEventName = 'access-policy-group-search-changed';

export interface AccessPolicyGroupSearchChangedPayload {
  value: string;
}

export class AccessPolicyGroupSearchChangedEvent extends CustomEvent<AccessPolicyGroupSearchChangedPayload> {
  constructor(detail: AccessPolicyGroupSearchChangedPayload) {
    super(accessPolicyGroupSearchChangedEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}
