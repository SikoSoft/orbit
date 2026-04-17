import { css, html, nothing, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { AccessPartyType } from 'api-spec/models/Access';
import { translate } from '@/lib/Localization';
import { InputType } from '@ss/ui/components/ss-input.models';
import { storage } from '@/lib/Storage';

import '@ss/ui/components/ss-input';

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

      .group-save {
        align-self: flex-start;
        padding: 0.4rem 1rem;
        border: 1px solid var(--input-border-color, #ccc);
        border-radius: 4px;
        background: var(--input-background-color, #fff);
        color: var(--input-text-color, #000);
        cursor: pointer;
        font-size: 0.9rem;

        &:hover {
          background-color: var(--input-border-color, #ccc);
        }
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
      this.dispatchEvent(new AccessPolicyGroupSavedEvent({ group: result.value }));
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
        <button class="group-save" @click=${this.handleSave}>
          ${translate('save')}
        </button>
      </div>
    `;
  }
}
