import { nothing, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { AccessType } from 'api-spec/models/Access';

import { AccessPolicyBase } from '@/components/access-policy/access-policy-base';

import {
  AccessPolicyGroupChangedEvent,
  AccessPolicyGroupSearchChangedEvent,
} from './access-policy-group.events';
import {
  AccessPolicyMember,
  AccessPolicyGroupProp,
  accessPolicyGroupProps,
  AccessPolicyGroupProps,
} from './access-policy-group.models';

@customElement('access-policy-group')
export class AccessPolicyGroup extends AccessPolicyBase {
  @property({ type: Array })
  [AccessPolicyGroupProp.MEMBERS]: AccessPolicyGroupProps[AccessPolicyGroupProp.MEMBERS] =
    accessPolicyGroupProps[AccessPolicyGroupProp.MEMBERS].default;

  @property({ type: Array })
  [AccessPolicyGroupProp.SUGGESTIONS]: AccessPolicyGroupProps[AccessPolicyGroupProp.SUGGESTIONS] =
    accessPolicyGroupProps[AccessPolicyGroupProp.SUGGESTIONS].default;

  protected get searchPlaceholderKey(): string {
    return 'accessPolicyGroup.searchPlaceholder';
  }

  protected get noMembersKey(): string {
    return 'accessPolicyGroup.noMembers';
  }

  protected get allowedTypes(): AccessType[] {
    return [AccessType.USER];
  }

  protected renderTypeLabel(_type: AccessType): typeof nothing {
    return nothing;
  }

  protected dispatchChangedEvent(members: AccessPolicyMember[]): void {
    this.dispatchEvent(new AccessPolicyGroupChangedEvent({ members }));
  }

  protected dispatchSearchChangedEvent(value: string): void {
    this.dispatchEvent(new AccessPolicyGroupSearchChangedEvent({ value }));
  }
}
