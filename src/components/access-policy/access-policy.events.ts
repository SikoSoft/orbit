import { AccessPolicyMember } from './access-policy.models';

export const accessPolicyChangedEventName = 'access-policy-changed';

export interface AccessPolicyChangedPayload {
  members: AccessPolicyMember[];
}

export class AccessPolicyChangedEvent extends CustomEvent<AccessPolicyChangedPayload> {
  constructor(detail: AccessPolicyChangedPayload) {
    super(accessPolicyChangedEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}

export const accessPolicySearchChangedEventName = 'access-policy-search-changed';

export interface AccessPolicySearchChangedPayload {
  value: string;
}

export class AccessPolicySearchChangedEvent extends CustomEvent<AccessPolicySearchChangedPayload> {
  constructor(detail: AccessPolicySearchChangedPayload) {
    super(accessPolicySearchChangedEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}
