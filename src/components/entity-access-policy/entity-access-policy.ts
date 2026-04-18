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

import { SelectChangedEvent } from '@ss/ui/components/ss-select.events';

import {
  EntityAccessPolicyProp,
  entityAccessPolicyProps,
  EntityAccessPolicyProps,
} from './entity-access-policy.models';

@themed()
@customElement('entity-access-policy')
export class EntityAccessPolicy extends MobxLitElement {
  static styles = css`
    .entity-access-policy {
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

  @property({ type: Number })
  [EntityAccessPolicyProp.ENTITY_ID]: EntityAccessPolicyProps[EntityAccessPolicyProp.ENTITY_ID] =
    entityAccessPolicyProps[EntityAccessPolicyProp.ENTITY_ID].default;

  @property({ type: Number })
  [EntityAccessPolicyProp.ACCESS_POLICY_ID]: EntityAccessPolicyProps[EntityAccessPolicyProp.ACCESS_POLICY_ID] =
    entityAccessPolicyProps[EntityAccessPolicyProp.ACCESS_POLICY_ID].default;

  @state() private _policies: AccessPolicy[] = [];
  @state() private _selectedId: number = 0;

  protected willUpdate(changedProperties: PropertyValues): void {
    if (changedProperties.has(EntityAccessPolicyProp.ACCESS_POLICY_ID)) {
      this._selectedId = this[EntityAccessPolicyProp.ACCESS_POLICY_ID];
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
    return this._selectedId === this[EntityAccessPolicyProp.ACCESS_POLICY_ID];
  }

  private get selectOptions(): { value: string; label: string }[] {
    const noneOption = {
      value: '0',
      label: translate('entityAccessPolicy.none'),
    };
    const policyOptions = this._policies.map(p => ({
      value: String(p.id),
      label: p.name,
    }));
    return [noneOption, ...policyOptions];
  }

  private handleSelectChanged(e: SelectChangedEvent<string>): void {
    this._selectedId = parseInt(e.detail.value, 10);
  }

  private async handleSave(): Promise<void> {
    const entityId = this[EntityAccessPolicyProp.ENTITY_ID];
    const success = await storage.saveEntityAccessPolicy(
      entityId,
      this._selectedId,
    );

    if (success) {
      this[EntityAccessPolicyProp.ACCESS_POLICY_ID] = this._selectedId;
      addToast(
        translate('entityAccessPolicy.saveSuccess'),
        NotificationType.SUCCESS,
      );
    } else {
      addToast(
        translate('entityAccessPolicy.saveError'),
        NotificationType.ERROR,
      );
    }
  }

  render(): TemplateResult {
    return html`
      <div class="entity-access-policy">
        <div class="field">
          <span class="field-label"
            >${translate('entityAccessPolicy.label')}</span
          >
          <ss-select
            selected=${String(this._selectedId)}
            .options=${this.selectOptions}
            @select-changed=${this.handleSelectChanged}
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
      </div>
    `;
  }
}
