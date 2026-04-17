import { css, html, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { AccessPartyType, AccessPolicyGroup } from 'api-spec/models/Access';
import { translate } from '@/lib/Localization';
import { InputType } from '@ss/ui/components/ss-input.models';
import { storage } from '@/lib/Storage';

import '@ss/ui/components/ss-input';
import '@/components/access-policy-group/access-policy-group';

import { InputChangedEvent } from '@ss/ui/components/ss-input.events';
import { AccessPolicyGroupSavedEvent } from '@/components/access-policy-group/access-policy-group.events';
import { AccessPolicyMember } from '@/components/access-policy-group/access-policy-group.models';

import {
  AccessPolicyChangedEvent,
  AccessPolicyDescriptionChangedEvent,
  AccessPolicyNameChangedEvent,
  AccessPolicySearchChangedEvent,
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

      .groups-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .groups-section-title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-color);
        margin: 0;
      }

      .groups-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .group-item {
        padding: 0.75rem;
        border: 1px solid var(--input-border-color, #ccc);
        border-radius: 4px;
      }

      .add-group-section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .add-group-label {
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--text-color);
        opacity: 0.8;
      }

      .add-group-form {
        padding: 0.75rem;
        border: 1px dashed var(--input-border-color, #ccc);
        border-radius: 4px;
      }
    `,
  ];

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
  @state() private _groups: AccessPolicyGroup[] = [];

  protected willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has(AccessPolicyProp.NAME)) {
      this._policyName = this[AccessPolicyProp.NAME];
    }
    if (changedProperties.has(AccessPolicyProp.DESCRIPTION)) {
      this._policyDescription = this[AccessPolicyProp.DESCRIPTION];
    }
  }

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    await this.loadGroups();
  }

  private async loadGroups(): Promise<void> {
    console.log('Loading access policy groups from storage');
    const result = await storage.getAccessPolicyGroups();
    if (result.isOk) {
      this._groups = result.value;
    }
  }

  private groupToMembers(group: AccessPolicyGroup): AccessPolicyMember[] {
    return group.users.map(member => ({
      targetId: member.id,
      type: AccessPartyType.USER,
      displayName: member.name,
    }));
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

  private handleGroupSaved(e: AccessPolicyGroupSavedEvent): void {
    e.stopPropagation();
    void this.loadGroups();
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

        <div class="groups-section">
          <p class="groups-section-title">
            ${translate('accessPolicy.manageUserGroups')}
          </p>

          <div class="groups-list">
            ${repeat(
              this._groups,
              g => g.id,
              g => html`
                <div class="group-item">
                  <access-policy-group
                    .id=${g.id}
                    .name=${g.name}
                    .members=${this.groupToMembers(g)}
                    @access-policy-group-saved=${this.handleGroupSaved}
                  ></access-policy-group>
                </div>
              `,
            )}
          </div>

          <div class="add-group-section">
            <span class="add-group-label"
              >${translate('accessPolicy.addNewGroup')}</span
            >
            <div class="add-group-form">
              <access-policy-group
                @access-policy-group-saved=${this.handleGroupSaved}
              ></access-policy-group>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
