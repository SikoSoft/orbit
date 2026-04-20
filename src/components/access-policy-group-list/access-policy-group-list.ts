import { css, html, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { AccessPartyType, AccessPolicyGroup } from 'api-spec/models/Access';
import { translate } from '@/lib/Localization';
import { storage } from '@/lib/Storage';
import { themed } from '@/lib/Theme';

import '@ss/ui/components/ss-collapsable';
import '@/components/access-policy-group/access-policy-group';

import { AccessPolicyGroupSavedEvent } from '@/components/access-policy-group/access-policy-group.events';
import { AccessPolicyMember } from '@/components/access-policy-group/access-policy-group.models';

@themed()
@customElement('access-policy-group-list')
export class AccessPolicyGroupList extends MobxLitElement {
  static styles = css`
    .access-policy-group-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
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
  `;

  @state() private _groups: AccessPolicyGroup[] = [];

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    await this.loadGroups();
  }

  private async loadGroups(): Promise<void> {
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

  private handleGroupSaved(e: AccessPolicyGroupSavedEvent): void {
    e.stopPropagation();
    void this.loadGroups();
  }

  render(): TemplateResult {
    return html`
      <div class="access-policy-group-list box">
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
            >${translate('accessPolicyGroupList.addNew')}</span
          >
          <div class="add-group-form">
            <access-policy-group
              @access-policy-group-saved=${this.handleGroupSaved}
            ></access-policy-group>
          </div>
        </div>
      </div>
    `;
  }
}
