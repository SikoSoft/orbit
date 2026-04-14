import { html, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { AccessType } from 'api-spec/models/Access';
import { translate } from '@/lib/Localization';

import {
  AccessPolicyChangedEvent,
  AccessPolicySearchChangedEvent,
} from './access-policy.events';
import {
  AccessPolicyMember,
  AccessPolicyProp,
  accessPolicyProps,
  AccessPolicyProps,
} from './access-policy.models';
import { AccessPolicyBase } from './access-policy-base';

@customElement('access-policy')
export class AccessPolicy extends AccessPolicyBase {
  @property({ type: Array })
  [AccessPolicyProp.MEMBERS]: AccessPolicyProps[AccessPolicyProp.MEMBERS] =
    accessPolicyProps[AccessPolicyProp.MEMBERS].default;

  @property({ type: Array })
  [AccessPolicyProp.SUGGESTIONS]: AccessPolicyProps[AccessPolicyProp.SUGGESTIONS] =
    accessPolicyProps[AccessPolicyProp.SUGGESTIONS].default;

  protected get searchPlaceholderKey(): string {
    return 'accessPolicy.searchPlaceholder';
  }

  protected get noMembersKey(): string {
    return 'accessPolicy.noMembers';
  }

  protected get allowedTypes(): AccessType[] {
    return [AccessType.USER, AccessType.GROUP];
  }

  protected renderTypeLabel(type: AccessType): TemplateResult {
    const key = type === AccessType.USER ? 'accessPolicy.typeUser' : 'accessPolicy.typeGroup';
    return html`<span class="member-type">${translate(key)}</span>`;
  }

  protected dispatchChangedEvent(members: AccessPolicyMember[]): void {
    this.dispatchEvent(new AccessPolicyChangedEvent({ members }));
  }

  protected dispatchSearchChangedEvent(value: string): void {
    this.dispatchEvent(new AccessPolicySearchChangedEvent({ value }));
  }
}
