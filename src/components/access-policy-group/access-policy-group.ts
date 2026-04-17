import { css, html, nothing, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { AccessPartyType } from 'api-spec/models/Access';
import { translate } from '@/lib/Localization';
import { InputType } from '@ss/ui/components/ss-input.models';
import { storage } from '@/lib/Storage';

import '@ss/ui/components/ss-input';
import '@ss/ui/components/ss-button';

import { InputChangedEvent } from '@ss/ui/components/ss-input.events';

import { AccessPolicyBase } from '@/components/access-policy/access-policy-base';

import {
  AccessPolicyGroupChangedEvent,
  AccessPolicyGroupSavedEvent,
  AccessPolicyGroupSearchChangedEvent,
} from './access-policy-group.events';
import {
  AccessPolicyMember,
  AccessPolicyGroupProp,
  accessPolicyGroupProps,
  AccessPolicyGroupProps,
} from './access-policy-group.models';
import { addToast } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';

@customElement('access-policy-group')
export class AccessPolicyGroup extends AccessPolicyBase {
  static styles = [
    AccessPolicyBase.styles,
    css`
      .group-wrapper {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
    `,
  ];

  @property({ type: String })
  [AccessPolicyGroupProp.ID]: AccessPolicyGroupProps[AccessPolicyGroupProp.ID] =
    accessPolicyGroupProps[AccessPolicyGroupProp.ID].default;

  @property({ type: String })
  [AccessPolicyGroupProp.NAME]: AccessPolicyGroupProps[AccessPolicyGroupProp.NAME] =
    accessPolicyGroupProps[AccessPolicyGroupProp.NAME].default;

  @property({ type: Array })
  [AccessPolicyGroupProp.MEMBERS]: AccessPolicyGroupProps[AccessPolicyGroupProp.MEMBERS] =
    accessPolicyGroupProps[AccessPolicyGroupProp.MEMBERS].default;

  @property({ type: Array })
  [AccessPolicyGroupProp.SUGGESTIONS]: AccessPolicyGroupProps[AccessPolicyGroupProp.SUGGESTIONS] =
    accessPolicyGroupProps[AccessPolicyGroupProp.SUGGESTIONS].default;

  @state() private _groupName: string = '';

  @state()
  get inSync(): boolean {
    const currentMembers = this[AccessPolicyGroupProp.MEMBERS]
      .map(m => m.targetId)
      .sort();
    const originalMembers = this._members.map(m => m.targetId).sort();

    return (
      this._groupName === this[AccessPolicyGroupProp.NAME] &&
      JSON.stringify(currentMembers) === JSON.stringify(originalMembers)
    );
  }

  protected willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has(AccessPolicyGroupProp.NAME)) {
      this._groupName = this[AccessPolicyGroupProp.NAME];
    }
  }

  protected get searchPlaceholderKey(): string {
    return 'accessPolicyGroup.searchPlaceholder';
  }

  protected get noMembersKey(): string {
    return 'accessPolicyGroup.noMembers';
  }

  protected get allowedTypes(): AccessPartyType[] {
    return [AccessPartyType.USER];
  }

  protected renderTypeLabel(_type: AccessPartyType): typeof nothing {
    return nothing;
  }

  protected dispatchChangedEvent(members: AccessPolicyMember[]): void {
    this.dispatchEvent(new AccessPolicyGroupChangedEvent({ members }));
  }

  protected dispatchSearchChangedEvent(value: string): void {
    this.dispatchEvent(new AccessPolicyGroupSearchChangedEvent({ value }));
  }

  private handleGroupNameChanged(e: InputChangedEvent): void {
    this._groupName = e.detail.value;
  }

  private async handleSave(): Promise<void> {
    const users = this._members.map(m => m.targetId);
    const groupId = this[AccessPolicyGroupProp.ID];

    const result = groupId
      ? await storage.updateAccessPolicyGroup(groupId, this._groupName, users)
      : await storage.createAccessPolicyGroup(this._groupName, users);

    if (result.isOk) {
      this.dispatchEvent(
        new AccessPolicyGroupSavedEvent({ group: result.value }),
      );

      if (groupId) {
        addToast(
          translate('accessPolicyGroup.updateSuccess'),
          NotificationType.SUCCESS,
        );
        return;
      }

      addToast(
        translate('accessPolicyGroup.createSuccess'),
        NotificationType.SUCCESS,
      );
    }
  }

  render(): TemplateResult {
    return html`
      <div class="group-wrapper">
        <ss-input
          type=${InputType.TEXT}
          value=${this._groupName}
          placeholder=${translate('accessPolicyGroup.namePlaceholder')}
          @input-changed=${this.handleGroupNameChanged}
        ></ss-input>

        ${super.render()}

        <ss-button
          ?disabled=${this.inSync}
          positive
          class="group-save"
          @click=${this.handleSave}
        >
          ${translate('save')}
        </ss-button>
      </div>
    `;
  }
}
