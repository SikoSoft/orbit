import { css, html, nothing, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { AccessPolicy, AccessParty, AccessPartyType } from 'api-spec/models/Access';
import { translate } from '@/lib/Localization';
import { storage } from '@/lib/Storage';
import { addToast } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';
import { themed } from '@/lib/Theme';

import '@ss/ui/components/ss-collapsable';
import '@ss/ui/components/ss-button';
import '@ss/ui/components/confirmation-modal';
import '@/components/access-policy/access-policy';

import { AccessPolicySavedEvent } from '@/components/access-policy/access-policy.events';
import { AccessPolicyMember } from '@/components/access-policy/access-policy.models';

@themed()
@customElement('access-policy-list')
export class AccessPolicyList extends MobxLitElement {
  static styles = css`
    .access-policy-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .no-policies {
      font-style: italic;
      padding: 1rem;
    }

    .policy-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem 0;
    }

    .policy-actions {
      display: flex;
      justify-content: flex-end;
    }

    .new-policy-section {
      margin-top: 0.5rem;
    }
  `;

  @state() private _policies: AccessPolicy[] = [];
  @state() private _deletingId: number | null = null;
  @state() private _newFormKey: number = 0;

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

  private async handleDelete(id: number): Promise<void> {
    const success = await storage.deleteAccessPolicy(id);
    if (success) {
      this._policies = this._policies.filter(p => p.id !== id);
      this._deletingId = null;
      addToast(
        translate('accessPolicyList.deleteSuccess'),
        NotificationType.SUCCESS,
      );
    }
  }

  private handlePolicySaved(e: AccessPolicySavedEvent): void {
    void this.loadPolicies();
    if (e.detail.isNew) {
      this._newFormKey++;
    }
  }

  private ruleToMember(rule: AccessParty): AccessPolicyMember {
    return {
      targetId: rule.partyId,
      type: rule.type as AccessPartyType,
      displayName: rule.partyId,
    };
  }

  private renderPolicyItem(policy: AccessPolicy): TemplateResult {
    return html`
      <ss-collapsable
        title=${policy.name || translate('accessPolicyList.unnamedPolicy')}
        panelId=${`accessPolicy-${policy.id}`}
      >
        <div class="policy-form">
          <access-policy
            .id=${String(policy.id)}
            .name=${policy.name}
            .description=${policy.description}
            .members=${policy.parties.map(r => this.ruleToMember(r))}
            @access-policy-saved=${this.handlePolicySaved}
          ></access-policy>

          <div class="policy-actions">
            <ss-button
              negative
              @click=${(): void => {
                this._deletingId = policy.id;
              }}
            >
              ${translate('delete')}
            </ss-button>
          </div>
        </div>
      </ss-collapsable>

      <confirmation-modal
        ?open=${this._deletingId === policy.id}
        message=${translate('accessPolicyList.confirmDelete')}
        confirmText=${translate('delete')}
        cancelText=${translate('cancel')}
        @confirmation-accepted=${(): Promise<void> => this.handleDelete(policy.id)}
        @confirmation-declined=${(): void => {
          this._deletingId = null;
        }}
      ></confirmation-modal>
    `;
  }

  render(): TemplateResult {
    return html`
      <div class="access-policy-list box">
        ${this._policies.length === 0
          ? html`<p class="no-policies">
              ${translate('accessPolicyList.noPolicies')}
            </p>`
          : nothing}
        ${repeat(
          this._policies,
          p => p.id,
          p => this.renderPolicyItem(p),
        )}

        <div class="new-policy-section">
          <ss-collapsable
            title=${translate('accessPolicyList.newPolicy')}
            panelId="access-policy-new"
          >
            <access-policy
              key=${this._newFormKey}
              @access-policy-saved=${this.handlePolicySaved}
            ></access-policy>
          </ss-collapsable>
        </div>
      </div>
    `;
  }
}
