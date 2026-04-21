import { css, html, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { AccessPolicy } from 'api-spec/models/Access';
import { translate } from '@/lib/Localization';
import { storage } from '@/lib/Storage';
import { addToast } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';
import { themed } from '@/lib/Theme';

import '@ss/ui/components/ss-select';
import '@ss/ui/components/ss-button';
import '@/components/access-policy-list/access-policy-list';

import { SelectChangedEvent } from '@ss/ui/components/ss-select.events';

import {
  AccessPolicyAssignmentProp,
  accessPolicyAssignmentProps,
  AccessPolicyAssignmentProps,
} from './access-policy-assignment.models';

@themed()
@customElement('access-policy-assignment')
export class AccessPolicyAssignment extends MobxLitElement {
  static styles = css`
    .access-policy-assignment {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .field-label {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-color);
    }

    .actions {
      display: flex;
    }
  `;

  @property({ type: String })
  [AccessPolicyAssignmentProp.CONTEXT]: AccessPolicyAssignmentProps[AccessPolicyAssignmentProp.CONTEXT] =
    accessPolicyAssignmentProps[AccessPolicyAssignmentProp.CONTEXT].default;

  @property({ type: Number })
  [AccessPolicyAssignmentProp.ENTITY_ID]: AccessPolicyAssignmentProps[AccessPolicyAssignmentProp.ENTITY_ID] =
    accessPolicyAssignmentProps[AccessPolicyAssignmentProp.ENTITY_ID].default;

  @property({ type: String })
  [AccessPolicyAssignmentProp.LIST_CONFIG_ID]: AccessPolicyAssignmentProps[AccessPolicyAssignmentProp.LIST_CONFIG_ID] =
    accessPolicyAssignmentProps[AccessPolicyAssignmentProp.LIST_CONFIG_ID]
      .default;

  @property({ type: Number })
  [AccessPolicyAssignmentProp.VIEW_ACCESS_POLICY_ID]: AccessPolicyAssignmentProps[AccessPolicyAssignmentProp.VIEW_ACCESS_POLICY_ID] =
    accessPolicyAssignmentProps[
      AccessPolicyAssignmentProp.VIEW_ACCESS_POLICY_ID
    ].default;

  @property({ type: Number })
  [AccessPolicyAssignmentProp.EDIT_ACCESS_POLICY_ID]: AccessPolicyAssignmentProps[AccessPolicyAssignmentProp.EDIT_ACCESS_POLICY_ID] =
    accessPolicyAssignmentProps[
      AccessPolicyAssignmentProp.EDIT_ACCESS_POLICY_ID
    ].default;

  @state() private _policies: AccessPolicy[] = [];
  @state() private _selectedViewId: number = 0;
  @state() private _selectedEditId: number = 0;

  protected willUpdate(changedProperties: PropertyValues): void {
    if (
      changedProperties.has(AccessPolicyAssignmentProp.VIEW_ACCESS_POLICY_ID)
    ) {
      this._selectedViewId =
        this[AccessPolicyAssignmentProp.VIEW_ACCESS_POLICY_ID];
    }
    if (
      changedProperties.has(AccessPolicyAssignmentProp.EDIT_ACCESS_POLICY_ID)
    ) {
      this._selectedEditId =
        this[AccessPolicyAssignmentProp.EDIT_ACCESS_POLICY_ID];
    }
  }

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    await this.loadPolicies();
  }

  private async loadPolicies(): Promise<void> {
    const result = await storage.getAccessPolicies();
    if (result.isOk) {
      this._policies = result.value;
    }
  }

  private get inSync(): boolean {
    return (
      this._selectedViewId ===
        this[AccessPolicyAssignmentProp.VIEW_ACCESS_POLICY_ID] &&
      this._selectedEditId ===
        this[AccessPolicyAssignmentProp.EDIT_ACCESS_POLICY_ID]
    );
  }

  private get selectOptions(): { value: string; label: string }[] {
    const noneOption = {
      value: '0',
      label: translate('accessPolicyAssignment.none'),
    };
    const policyOptions = this._policies.map(p => ({
      value: String(p.id),
      label: p.name,
    }));
    return [noneOption, ...policyOptions];
  }

  private handleViewSelectChanged(e: SelectChangedEvent<string>): void {
    this._selectedViewId = parseInt(e.detail.value, 10);
  }

  private handleEditSelectChanged(e: SelectChangedEvent<string>): void {
    this._selectedEditId = parseInt(e.detail.value, 10);
  }

  private async handleSave(): Promise<void> {
    const context = this[AccessPolicyAssignmentProp.CONTEXT];
    let success: boolean;

    if (context === 'listConfig') {
      const listConfigId = this[AccessPolicyAssignmentProp.LIST_CONFIG_ID];
      success = await storage.saveListConfigAccessPolicy(
        listConfigId,
        this._selectedViewId,
        this._selectedEditId,
      );
    } else if (context === 'entityConfig') {
      const entityConfigId = this[AccessPolicyAssignmentProp.ENTITY_ID];
      success = await storage.saveEntityConfigAccessPolicy(
        entityConfigId,
        this._selectedViewId,
        this._selectedEditId,
      );
    } else {
      const entityId = this[AccessPolicyAssignmentProp.ENTITY_ID];
      success = await storage.saveEntityAccessPolicy(
        entityId,
        this._selectedViewId,
        this._selectedEditId,
      );
    }

    if (success) {
      this[AccessPolicyAssignmentProp.VIEW_ACCESS_POLICY_ID] =
        this._selectedViewId;
      this[AccessPolicyAssignmentProp.EDIT_ACCESS_POLICY_ID] =
        this._selectedEditId;
      addToast(
        translate('accessPolicyAssignment.saveSuccess'),
        NotificationType.SUCCESS,
      );
    } else {
      addToast(
        translate('accessPolicyAssignment.saveError'),
        NotificationType.ERROR,
      );
    }
  }

  render(): TemplateResult {
    return html`
      <div class="access-policy-assignment">
        <div class="field">
          <span class="field-label"
            >${translate('accessPolicyAssignment.viewLabel')}</span
          >
          <ss-select
            selected=${String(this._selectedViewId)}
            .options=${this.selectOptions}
            @select-changed=${this.handleViewSelectChanged}
          ></ss-select>
        </div>

        <div class="field">
          <span class="field-label"
            >${translate('accessPolicyAssignment.editLabel')}</span
          >
          <ss-select
            selected=${String(this._selectedEditId)}
            .options=${this.selectOptions}
            @select-changed=${this.handleEditSelectChanged}
          ></ss-select>
        </div>

        <div class="actions">
          <ss-button
            positive
            ?disabled=${this.inSync}
            @click=${this.handleSave}
          >
            ${translate('save')}
          </ss-button>
        </div>

        <access-policy-list></access-policy-list>
      </div>
    `;
  }
}
