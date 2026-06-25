import { MobxLitElement } from '@adobe/lit-mobx';
import { reaction } from 'mobx';
import { css, html, nothing, TemplateResult } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { translate } from '@/lib/Localization';
import { appState } from '@/state';
import { storage } from '@/lib/Storage';
import { addToast } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';
import { Access } from '@/lib/Access';

import '@ss/ui/components/ss-button';
import '@ss/ui/components/pop-up';
import '@/components/theme-manager/theme-manager';
import './list-config-carousel/list-config-carousel';
import './list-config-menus/list-config-menus';

import {
  ThemesUpdatedEvent,
  ThemesSavedEvent,
} from '../theme-manager/theme-manager.events';
import { themed } from '@/lib/Theme';
import {
  AddConfigRequestedEvent,
  ConfigNameBlurredEvent,
  ConfigNameFocusedEvent,
  ConfigNameSaveRequestedEvent,
  ConfigNameSubmittedEvent,
  DeleteConfigRequestedEvent,
  ThemeManagerRequestedEvent,
} from './list-config-carousel/list-config-carousel.events';
import {
  ListConfigProp,
  listConfigProps,
  ListConfigProps,
} from './list-config.models';

@themed()
@customElement('list-config')
export class ListConfig extends MobxLitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .list-config {
      margin-bottom: 1rem;

      .collapsable-menus {
        display: none;

        & > * {
          display: block;
          margin-top: 1rem;
        }
      }

      &.edit-mode .collapsable-menus {
        display: block;
      }
    }

    .delete-config-modal {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .delete-items-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
      }

      .delete-config-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
      }
    }
  `;

  private appState = appState;
  private isSaving: boolean = false;
  private windowClickHandler: ((e: MouseEvent) => void) | null = null;

  @property({ type: Boolean })
  [ListConfigProp.VIEW_ONLY]: ListConfigProps[ListConfigProp.VIEW_ONLY] =
    listConfigProps[ListConfigProp.VIEW_ONLY].default;

  @state() themeManagerIsOpen: boolean = false;
  @state() confirmDeleteIsOpen: boolean = false;
  @state() deleteItemsChecked: boolean = false;
  @state() nameInFocus: boolean = false;
  @state() menusInFocus: boolean = false;

  @query('list-config-menus') listConfigMenus!: HTMLElement;

  @state()
  get showEverythingSlide(): boolean {
    if (this[ListConfigProp.VIEW_ONLY]) {
      return false;
    }
    if (!this.appState.workspaces.length) {
      return true;
    }
    if (!this.appState.activeWorkspaceId) {
      return true;
    }
    const activeWorkspace = this.appState.workspaces.find(
      w => w.id === this.appState.activeWorkspaceId,
    );
    return !activeWorkspace || activeWorkspace.showEverything;
  }

  @state()
  get canEdit(): boolean {
    if (this[ListConfigProp.VIEW_ONLY] || !this.appState.user?.id) {
      return false;
    }
    const isOwner =
      this.appState.listConfig.userId === this.appState.user.id;
    if (
      !isOwner &&
      !Access.userHasAccess(
        this.appState.listConfig.editAccessPolicy,
        this.appState.user.id,
      )
    ) {
      return false;
    }
    return true;
  }

  @state()
  get canDelete(): boolean {
    if (this[ListConfigProp.VIEW_ONLY] || !this.appState.user?.id) {
      return false;
    }
    return this.appState.listConfig.userId === this.appState.user.id;
  }

  @state() get classes(): Record<string, boolean> {
    return {
      'list-config': true,
      'config-mode': this.appState.selectListConfigMode,
      'edit-mode': this.appState.editListConfigMode,
      'view-only': this.canEdit === false,
      'can-edit': this.canEdit,
      'can-delete': this.canDelete,
    };
  }

  connectedCallback(): void {
    super.connectedCallback();

    reaction(
      () => this.showEverythingSlide,
      showEverythingSlide => {
        if (!showEverythingSlide && !this.appState.listConfigId) {
          const firstConfig = this.appState.listConfigs[0];
          if (firstConfig) {
            this.setListConfigId(firstConfig.id);
          }
        }
      },
    );

    this.setup();
  }

  protected firstUpdated(): void {
    this.windowClickHandler = (e: MouseEvent): void => {
      if (
        this.listConfigMenus &&
        e.composedPath().includes(this.listConfigMenus)
      ) {
        this.menusInFocus = true;
      } else {
        this.menusInFocus = false;
        if (!this.nameInFocus) {
          this.appState.setEditListConfigMode(false);
        }
      }
    };

    window.addEventListener('click', this.windowClickHandler);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.windowClickHandler) {
      window.removeEventListener('click', this.windowClickHandler);
      this.windowClickHandler = null;
    }
  }

  async setup(): Promise<void> {
    const listConfigs = this.appState.filteredListConfigs;
    if (this.appState.hasFetchedListConfigs && !listConfigs.length) {
      await this.addConfig();
    }
  }

  setListConfigId(listConfigId: string): void {
    storage.saveActiveListConfigId(listConfigId);
    this.appState.setListConfigId(listConfigId);
  }

  async saveConfig(name: string): Promise<void> {
    if (name === this.appState.listConfig?.name || this.isSaving) {
      return;
    }

    this.isSaving = true;

    const result = await storage.saveListConfig({
      userId: '',
      id: this.appState.listConfigId,
      name,
      filter: this.appState.listFilter,
      sort: this.appState.listSort,
      setting: this.appState.listSetting,
      themes: this.appState.listConfig.themes,
      viewAccessPolicy: null,
      editAccessPolicy: null,
    });

    if (!result.isOk) {
      addToast(translate('failedToSaveListConfig'), NotificationType.ERROR);
      this.isSaving = false;
      return;
    }

    addToast(translate('listConfigSaved'), NotificationType.SUCCESS);
    this.appState.setListConfigs(await storage.getListConfigs());

    this.isSaving = false;
  }

  async deleteConfig(): Promise<void> {
    const result = await storage.deleteListConfig(
      this.appState.listConfigId,
      this.deleteItemsChecked,
    );
    if (!result) {
      addToast(translate('failedToDeleteListConfig'), NotificationType.ERROR);
      return;
    }

    addToast(translate('configDeleted'), NotificationType.INFO);
    const listConfigs = await storage.getListConfigs();
    if (listConfigs.length) {
      this.setListConfigId(listConfigs[0].id);
    }
    this.appState.setListConfigs(listConfigs);
  }

  async addConfig(): Promise<void> {
    const id = await storage.addListConfig();
    addToast(translate('configAdded'), NotificationType.SUCCESS);
    const listConfigs = await storage.getListConfigs();
    this.appState.setListConfigs(listConfigs);

    if (this.appState.activeWorkspaceId) {
      const activeWorkspace = this.appState.workspaces.find(
        w => w.id === this.appState.activeWorkspaceId,
      );
      if (activeWorkspace && !activeWorkspace.listConfigs.includes(id)) {
        const updatedWorkspace = {
          ...activeWorkspace,
          listConfigs: [...activeWorkspace.listConfigs, id],
        };
        const result = await storage.saveWorkspace(updatedWorkspace);
        if (result.isOk) {
          this.appState.upsertWorkspace(result.value);
        }
      }
    }

    this.setListConfigId(id);
  }

  private handleCarouselNameSaveRequested(
    e: ConfigNameSaveRequestedEvent,
  ): void {
    this.saveConfig(e.detail.name);
  }

  private handleCarouselNameFocused(_e: ConfigNameFocusedEvent): void {
    this.nameInFocus = true;
  }

  private handleCarouselNameBlurred(_e: ConfigNameBlurredEvent): void {
    this.nameInFocus = false;
    setTimeout((): void => {
      if (this.menusInFocus) {
        return;
      }
      this.appState.setEditListConfigMode(false);
    }, 200);
  }

  private handleCarouselNameSubmitted(_e: ConfigNameSubmittedEvent): void {
    this.appState.setEditListConfigMode(false);
  }

  private handleAddConfigRequested(_e: AddConfigRequestedEvent): void {
    this.addConfig();
  }

  private handleThemeManagerRequested(_e: ThemeManagerRequestedEvent): void {
    this.themeManagerIsOpen = true;
  }

  private handleDeleteConfigRequested(_e: DeleteConfigRequestedEvent): void {
    this.confirmDeleteIsOpen = true;
  }

  private handleDeleteConfirmClosed(): void {
    this.confirmDeleteIsOpen = false;
    this.deleteItemsChecked = false;
  }

  private handleDeleteConfigConfirmed(): void {
    this.deleteConfig();
    this.confirmDeleteIsOpen = false;
    this.deleteItemsChecked = false;
  }

  private handleDeleteConfigCanceled(): void {
    this.confirmDeleteIsOpen = false;
    this.deleteItemsChecked = false;
  }

  private handleDeleteItemsChange(e: Event): void {
    this.deleteItemsChecked = (e.target as HTMLInputElement).checked;
  }

  updateThemes(e: ThemesUpdatedEvent): void {
    e.stopPropagation();
    this.appState.setThemes(e.detail.themes);
  }

  saveThemes = (e: ThemesSavedEvent): void => {
    storage.updateListThemes(this.appState.listConfig.id, e.detail.themes);
    addToast(translate('themesSaved'), NotificationType.SUCCESS);
    this.themeManagerIsOpen = false;
  };

  render(): TemplateResult {
    return html`<div class=${classMap(this.classes)}>
      <list-config-carousel
        ?viewOnly=${this[ListConfigProp.VIEW_ONLY]}
        @config-name-save-requested=${this.handleCarouselNameSaveRequested}
        @config-name-focused=${this.handleCarouselNameFocused}
        @config-name-blurred=${this.handleCarouselNameBlurred}
        @config-name-submitted=${this.handleCarouselNameSubmitted}
        @add-config-requested=${this.handleAddConfigRequested}
        @theme-manager-requested=${this.handleThemeManagerRequested}
        @delete-config-requested=${this.handleDeleteConfigRequested}
      ></list-config-carousel>

      <div class="collapsable-menus">
        <list-config-menus
          ?viewOnly=${this[ListConfigProp.VIEW_ONLY]}
        ></list-config-menus>
      </div>

      <pop-up
        ?open=${this.confirmDeleteIsOpen}
        closeOnOutsideClick
        closeOnEsc
        closeButton
        @pop-up-closed=${(): void => this.handleDeleteConfirmClosed()}
      >
        <div class="delete-config-modal">
          <p>${translate('confirmDeleteListConfig')}</p>
          <label class="delete-items-label">
            <input
              type="checkbox"
              ?checked=${this.deleteItemsChecked}
              @change=${this.handleDeleteItemsChange}
            />
            ${translate('deleteItemsInList')}
          </label>
          <div class="delete-config-actions">
            <ss-button @click=${(): void => this.handleDeleteConfigConfirmed()}
              >${translate('delete')}</ss-button
            >
            <ss-button @click=${(): void => this.handleDeleteConfigCanceled()}
              >${translate('cancel')}</ss-button
            >
          </div>
        </div>
      </pop-up>

      <pop-up
        ?open=${this.themeManagerIsOpen}
        closeOnOutsideClick
        closeOnEsc
        closeButton
        @pop-up-closed=${(): void => {
          this.themeManagerIsOpen = false;
        }}
      >
        <theme-manager
          .open=${this.themeManagerIsOpen}
          .active=${this.appState.listConfig?.themes ?? []}
          @themes-saved=${this.saveThemes}
          @themes-updated=${this.updateThemes}
          @close=${(): void => {
            this.themeManagerIsOpen = false;
          }}
        ></theme-manager>
      </pop-up>
    </div>`;
  }
}
