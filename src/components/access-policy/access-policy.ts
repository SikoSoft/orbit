import { css, html, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { AccessPartyType, AccessPolicyParty } from 'api-spec/models/Access';
import { translate } from '@/lib/Localization';
import { InputType } from '@ss/ui/components/ss-input.models';
import { storage } from '@/lib/Storage';
import { addToast } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';

import '@ss/ui/components/ss-input';

import { InputChangedEvent } from '@ss/ui/components/ss-input.events';
import { AccessPolicyMember } from '@/components/access-policy-group/access-policy-group.models';

import {
  AccessPolicyChangedEvent,
  AccessPolicyDescriptionChangedEvent,
  AccessPolicyNameChangedEvent,
  AccessPolicySearchChangedEvent,
  AccessPolicySavedEvent,
} from './access-policy.events';
import {
  AccessPolicyProp,
  accessPolicyProps,
  AccessPolicyProps,
} from './access-policy.models';
import { AccessPolicyBase } from './access-policy-base';

@customElement('access-policy')
export class AccessPolicy extends AccessPolicyBase {
  static styles = [
    AccessPolicyBase.styles,
    css`
      .access-policy-extended {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
    `,
  ];

  @property({ type: String })
  [AccessPolicyProp.ID]: AccessPolicyProps[AccessPolicyProp.ID] =
    accessPolicyProps[AccessPolicyProp.ID].default;

  @property({ type: String })
  [AccessPolicyProp.NAME]: AccessPolicyProps[AccessPolicyProp.NAME] =
    accessPolicyProps[AccessPolicyProp.NAME].default;

  @property({ type: String })
  [AccessPolicyProp.DESCRIPTION]: AccessPolicyProps[AccessPolicyProp.DESCRIPTION] =
    accessPolicyProps[AccessPolicyProp.DESCRIPTION].default;

  @property({ type: Array })
  [AccessPolicyProp.MEMBERS]: AccessPolicyProps[AccessPolicyProp.MEMBERS] =
    accessPolicyProps[AccessPolicyProp.MEMBERS].default;

  @property({ type: Array })
  [AccessPolicyProp.SUGGESTIONS]: AccessPolicyProps[AccessPolicyProp.SUGGESTIONS] =
    accessPolicyProps[AccessPolicyProp.SUGGESTIONS].default;

  @state() private _policyName: string = '';
  @state() private _policyDescription: string = '';

  @state() get inSync(): boolean {
    const currentMemberIds = this._members.map(m => m.targetId).sort();
    const savedMemberIds = this[AccessPolicyProp.MEMBERS]
      .map(m => m.targetId)
      .sort();

    return (
      this._policyName === this[AccessPolicyProp.NAME] &&
      this._policyDescription === this[AccessPolicyProp.DESCRIPTION] &&
      JSON.stringify(currentMemberIds) === JSON.stringify(savedMemberIds)
    );
  }

  async handleSave(): Promise<void> {
    const parties: AccessPolicyParty[] = this._members.map(m => ({
      id: m.targetId,
      type: m.type,
      name: m.displayName,
    }));

    const policyId = this[AccessPolicyProp.ID];
    const result = policyId
      ? await storage.updateAccessPolicy(
          parseInt(policyId, 10),
          this._policyName,
          this._policyDescription,
          parties,
        )
      : await storage.createAccessPolicy(
          this._policyName,
          this._policyDescription,
          parties,
        );

    if (result.isOk) {
      this[AccessPolicyProp.NAME] = this._policyName;
      this[AccessPolicyProp.DESCRIPTION] = this._policyDescription;
      this[AccessPolicyProp.MEMBERS] = [...this._members];
      if (!policyId) {
        this[AccessPolicyProp.ID] = String(result.value.id);
      }

      addToast(
        translate(
          policyId ? 'accessPolicy.updateSuccess' : 'accessPolicy.createSuccess',
        ),
        NotificationType.SUCCESS,
      );

      this.dispatchEvent(
        new AccessPolicySavedEvent({
          id: this[AccessPolicyProp.ID],
          isNew: !policyId,
        }),
      );
    }
  }

  protected willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has(AccessPolicyProp.NAME)) {
      this._policyName = this[AccessPolicyProp.NAME];
    }
    if (changedProperties.has(AccessPolicyProp.DESCRIPTION)) {
      this._policyDescription = this[AccessPolicyProp.DESCRIPTION];
    }
  }

  private handleNameChanged(e: InputChangedEvent): void {
    this._policyName = e.detail.value;
    this.dispatchEvent(
      new AccessPolicyNameChangedEvent({ value: this._policyName }),
    );
  }

  private handleDescriptionChanged(e: InputChangedEvent): void {
    this._policyDescription = e.detail.value;
    this.dispatchEvent(
      new AccessPolicyDescriptionChangedEvent({
        value: this._policyDescription,
      }),
    );
  }

  protected get searchPlaceholderKey(): string {
    return 'accessPolicy.searchPlaceholder';
  }

  protected get noMembersKey(): string {
    return 'accessPolicy.noMembers';
  }

  protected get allowedTypes(): AccessPartyType[] {
    return [AccessPartyType.USER, AccessPartyType.GROUP];
  }

  protected renderTypeLabel(type: AccessPartyType): TemplateResult {
    const key =
      type === AccessPartyType.USER
        ? 'accessPolicy.typeUser'
        : 'accessPolicy.typeGroup';
    return html`<span class="member-type">${translate(key)}</span>`;
  }

  protected dispatchChangedEvent(members: AccessPolicyMember[]): void {
    this.dispatchEvent(new AccessPolicyChangedEvent({ members }));
  }

  protected dispatchSearchChangedEvent(value: string): void {
    this.dispatchEvent(new AccessPolicySearchChangedEvent({ value }));
  }

  render(): TemplateResult {
    return html`
      <div class="access-policy-extended">
        <ss-input
          type=${InputType.TEXT}
          value=${this._policyName}
          placeholder=${translate('accessPolicy.namePlaceholder')}
          @input-changed=${this.handleNameChanged}
        ></ss-input>

        <ss-input
          type=${InputType.TEXT}
          value=${this._policyDescription}
          placeholder=${translate('accessPolicy.descriptionPlaceholder')}
          @input-changed=${this.handleDescriptionChanged}
        ></ss-input>

        ${super.render()}
      </div>
    `;
  }
}
