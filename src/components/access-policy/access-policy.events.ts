import { AccessPolicyMember } from './access-policy.models';

export const accessPolicyNameChangedEventName = 'access-policy-name-changed';

export interface AccessPolicyNameChangedPayload {
  value: string;
}

export class AccessPolicyNameChangedEvent extends CustomEvent<AccessPolicyNameChangedPayload> {
  constructor(detail: AccessPolicyNameChangedPayload) {
    super(accessPolicyNameChangedEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}

export const accessPolicyDescriptionChangedEventName =
  'access-policy-description-changed';

export interface AccessPolicyDescriptionChangedPayload {
  value: string;
}

export class AccessPolicyDescriptionChangedEvent extends CustomEvent<AccessPolicyDescriptionChangedPayload> {
  constructor(detail: AccessPolicyDescriptionChangedPayload) {
    super(accessPolicyDescriptionChangedEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}

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
