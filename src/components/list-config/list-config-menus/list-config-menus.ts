import { MobxLitElement } from '@adobe/lit-mobx';
import { css, html, nothing, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';

import { translate } from '@/lib/Localization';
import { appState } from '@/state';
import { storage } from '@/lib/Storage';
import { addToast } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';

import '@ss/ui/components/ss-collapsable';
import '@/components/setting/list-settings/list-settings';
import '@/components/list-filter/list-filter';
import '@/components/list-sort/list-sort';
import '@/components/access-policy-assignment/access-policy-assignment';

import { ListFilterUpdatedEvent } from '@/components/list-filter/list-filter.events';
import { ListSortUpdatedEvent } from '@/components/list-sort/list-sort.events';
import {
  EntityListLoadEvent,
  EntityListSyncEvent,
} from '@/components/entity-list/entity-list.events';
import {
  ListConfigMenusProp,
  listConfigMenusProps,
  ListConfigMenusProps,
} from './list-config-menus.models';

@customElement('list-config-menus')
export class ListConfigMenus extends MobxLitElement {
  static styles = css`
    :host {
      display: block;
    }

    .public-link {
      margin-top: 1rem;
      text-align: center;
      font-size: 0.9rem;
      color: var(--text-color);
      word-break: break-all;
    }

    & > * {
      display: block;
      margin-top: 1rem;
    }
  `;

  private appState = appState;

  @property({ type: Boolean })
  [ListConfigMenusProp.VIEW_ONLY]: ListConfigMenusProps[ListConfigMenusProp.VIEW_ONLY] =
    listConfigMenusProps[ListConfigMenusProp.VIEW_ONLY].default;

  @state() filterIsOpen: boolean = false;
  @state() settingIsOpen: boolean = false;
  @state() sortIsOpen: boolean = false;
  @state() accessIsOpen: boolean = false;

  @state()
  get canDelete(): boolean {
    if (this[ListConfigMenusProp.VIEW_ONLY] || !this.appState.user?.id) {
      return false;
    }
    return this.appState.listConfig?.userId === this.appState.user.id;
  }

  @state()
  get publicUrl(): string {
    const path = [
      import.meta.env.BASE_URL.replace(/\/$/, '').replace(/^\//, ''),
      'list',
      this.appState.listConfigId,
    ].join('/');
    const url = new URL(path, window.location.origin);
    return url.href;
  }

  private toggleAccess(): void {
    this.accessIsOpen = !this.accessIsOpen;
  }

  private toggleSetting(): void {
    this.settingIsOpen = !this.settingIsOpen;
  }

  private toggleFilter(): void {
    this.filterIsOpen = !this.filterIsOpen;
  }

  private toggleSort(): void {
    this.sortIsOpen = !this.sortIsOpen;
  }

  private handleFilterUpdated(e: ListFilterUpdatedEvent): void {
    this.appState.setListFilter(e.detail);
    if (this.appState.listConfigId) {
      storage.updateListFilter(this.appState.listConfigId, e.detail);
    }
    addToast(translate('filterUpdated'), NotificationType.INFO);
    this.filterIsOpen = false;
    this.dispatchEvent(new EntityListLoadEvent());
  }

  private handleSortUpdated(_e: ListSortUpdatedEvent): void {
    if (this.appState.listConfigId) {
      storage.updateListSort(this.appState.listConfigId, this.appState.listSort);
    }
    this.sortIsOpen = false;
    this.dispatchEvent(new EntityListSyncEvent());
  }

  private handleSettingUpdated(_e: CustomEvent): void {
    this.dispatchEvent(new EntityListLoadEvent());
  }

  private handleAccessPolicyUpdated(_e: CustomEvent): void {
    this.dispatchEvent(new EntityListLoadEvent());
  }

  private handlePublicLinkClick(e: MouseEvent): void {
    const input = e.currentTarget as HTMLInputElement;
    input.select();
    navigator.clipboard.writeText(this.publicUrl);
    addToast(translate('publicLinkCopied'), NotificationType.SUCCESS);
  }

  render(): TemplateResult {
    return html`
      ${this.canDelete
        ? html`<ss-collapsable
            title=${translate('access')}
            ?open=${this.accessIsOpen}
            @toggled=${this.toggleAccess}
          >
            <div class="filter-body">
              ${this.accessIsOpen
                ? html`<access-policy-assignment
                    context="listConfig"
                    listConfigId=${this.appState.listConfigId}
                    @access-policy-updated=${this.handleAccessPolicyUpdated}
                    viewAccessPolicyId=${ifDefined(
                      this.appState.listConfig.viewAccessPolicy?.id,
                    )}
                    editAccessPolicyId=${ifDefined(
                      this.appState.listConfig.editAccessPolicy?.id,
                    )}
                  ></access-policy-assignment>`
                : nothing}
            </div>
          </ss-collapsable>`
        : nothing}

      <ss-collapsable
        title=${translate('settings')}
        ?open=${this.settingIsOpen}
        @toggled=${this.toggleSetting}
      >
        <list-settings
          listConfigId=${this.appState.listConfigId}
          @setting-updated=${this.handleSettingUpdated}
        ></list-settings>

        ${this.appState.listConfig && this.appState.listConfig.setting.public
          ? html`<div class="public-link">
              <fieldset>
                <legend>${translate('publicLink')}</legend>
                <input
                  type="text"
                  readonly
                  value=${this.publicUrl}
                  @click=${(e: MouseEvent): void =>
                    this.handlePublicLinkClick(e)}
                />
              </fieldset>
            </div>`
          : nothing}
      </ss-collapsable>

      <ss-collapsable
        title=${translate('filter')}
        ?open=${this.filterIsOpen}
        @toggled=${this.toggleFilter}
      >
        <div class="filter-body">
          <list-filter
            showAll
            .listFilter=${this.appState.listFilter}
            @list-filter-updated=${this.handleFilterUpdated}
          ></list-filter>
        </div>
      </ss-collapsable>

      <ss-collapsable
        title=${translate('sort')}
        ?open=${this.sortIsOpen}
        @toggled=${this.toggleSort}
      >
        <list-sort @list-sort-updated=${this.handleSortUpdated}></list-sort>
      </ss-collapsable>
    `;
  }
}
