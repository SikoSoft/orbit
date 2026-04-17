import { AccessPolicyGroup } from 'api-spec/models/Access';
import { AccessPolicyMember } from '@/components/access-policy/access-policy.models';

export const accessPolicyGroupSavedEventName = 'access-policy-group-saved';

export interface AccessPolicyGroupSavedPayload {
  group: AccessPolicyGroup;
}

export class AccessPolicyGroupSavedEvent extends CustomEvent<AccessPolicyGroupSavedPayload> {
  constructor(detail: AccessPolicyGroupSavedPayload) {
    super(accessPolicyGroupSavedEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}

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
