import { MobxLitElement } from '@adobe/lit-mobx';
import {
  css,
  CSSResult,
  html,
  nothing,
  PropertyValues,
  TemplateResult,
} from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { classMap } from 'lit/directives/class-map.js';

import { translate } from '@/lib/Localization';
import { appState } from '@/state';
import { storage } from '@/lib/Storage';
import { InputType } from '@ss/ui/components/ss-input.models';
import { addToast } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';

import '@ss/ui/components/ss-button';
import '@ss/ui/components/ss-carousel';
import '@ss/ui/components/ss-select';
import '@ss/ui/components/confirmation-modal';
import '@ss/ui/components/pop-up';
import '@/components/setting/setting-form/setting-form';
import '@/components/list-filter/list-filter';
import '@/components/list-sort/list-sort';
import '@/components/theme-manager/theme-manager';

import { InputChangedEvent } from '@ss/ui/components/ss-input.events';
import { ListConfigChangedEvent } from './list-config.events';
import { CarouselSlideChangedEvent } from '@ss/ui/components/ss-carousel.events';

import {
  ThemesUpdatedEvent,
  ThemesSavedEvent,
} from '../theme-manager/theme-manager.events';
import { themed } from '@/lib/Theme';
import { ListFilterUpdatedEvent } from '../list-filter/list-filter.events';
import { ListSortUpdatedEvent } from '../list-sort/list-sort.events';
import {
  EntityListLoadEvent,
  EntityListSyncEvent,
} from '../entity-list/entity-list.events';
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
      touch-action: none;
    }

    .list-config {
      margin-bottom: 1rem;
      //position: relative;

      .config {
        transition: all 0.3s;
        opacity: 0;
      }

      .name {
        transition: all 0.3s;
        opacity: 1;
        font-size: 2rem;
        text-align: center;
        height: 3rem;
        line-height: 3rem;

        ss-input {
          margin: auto;
        }

        ss-input::part(input) {
          transition: all 0.2s;
          width: 80%;
          text-align: center;
          font-size: 2rem;
          height: 3rem;
          line-height: 3rem;
          background-color: transparent;
          border-color: transparent;
          color: var(--text-color);
        }
      }

      &:not(.view-only).edit-mode .name,
      &:not(.view-only) .name:hover {
        ss-input::part(input) {
          font-size: 2.2rem;
          border-color: var(--input-border-color);
          background-color: var(--input-background-color);
          color: var(--input-text-color);
        }
        ss-input[unsaved]::part(input) {
          border-color: var(--input-unsaved-border-color);
        }
      }

      &.view-only .name,
      &.view-only .name:hover {
        ss-input::part(input) {
          cursor: default;
          border-color: transparent;
          background-color: transparent;
          pointer-events: none;
        }
      }

      .carousel-wrapper {
        padding: 1rem;
        position: relative;
      }

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

      .buttons {
        position: relative;
        width: 100%;
        top: -1.5rem;

        .buttons-inner {
          display: flex;
          justify-content: center;
          gap: 1rem;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          top: 2rem;
        }

        button {
          display: inline-block;
          width: 16px;
          height: 16px;
          line-height: 16px;
          box-sizing: content-box;
          border-radius: 50%;
          background-color: var(--input-background-color);
          border: 1px solid var(--input-border-color);
          cursor: pointer;
          color: var(--input-text-color);
          transition: all 0.1s;
          opacity: 0;
          pointer-events: none;
          padding: 0.5rem;

          &:hover {
            scale: 1.5;
          }
        }
      }
    }
  `;
  private defaultModeStyles = css`
    .config-slide {
      display: flex;
      flex-direction: column;
      justify-content: center;

      .config {
        display: none;
      }
    }
  `;
  private editModeStyles = css`
    .config-slide {
      .config {
        display: block;
      }

      &.active {
        .buttons button {
          opacity: 1;
          pointer-events: auto;
        }
      }
    }
  `;
  private configModeStyles = css`
    .config-slide {
      .config {
        display: block;
      }
    }
  `;

  private state = appState;
  private isSaving: boolean = false;

  @property({ type: Boolean })
  [ListConfigProp.VIEW_ONLY]: ListConfigProps[ListConfigProp.VIEW_ONLY] =
    listConfigProps[ListConfigProp.VIEW_ONLY].default;

  @state() id: string = '';
  @state() name: string = '';
  @state() ready: boolean = false;
  @state() navigationIndex: number = 0;
  @state() themeManagerIsOpen: boolean = false;
  @state() confirmDeleteIsOpen: boolean = false;
  @state() filterIsOpen: boolean = false;
  @state() settingIsOpen: boolean = false;
  @state() sortIsOpen: boolean = false;
  @state() nameInFocus: boolean = false;
  @state() menusInFocus: boolean = false;

  @query('#config-selector') configSelector!: HTMLSelectElement;
  @query('.collapsable-menus') collapsableMenus!: HTMLDivElement;

  @state()
  get inSync(): boolean {
    if (!this.state.listConfig) {
      return true;
    }

    return this.name === this.state.listConfig.name;
  }

  @state() get classes(): Record<string, boolean> {
    return {
      'list-config': true,
      'config-mode': this.state.selectListConfigMode,
      'edit-mode': this.state.editListConfigMode,
      'view-only': this[ListConfigProp.VIEW_ONLY],
    };
  }

  @state() get carouselStyles(): CSSResult[] {
    const styles: CSSResult[] = [this.defaultModeStyles];
    if (this.state.editListConfigMode) {
      styles.push(this.editModeStyles);
    }
    if (this.state.selectListConfigMode) {
      styles.push(this.configModeStyles);
    }
    return styles;
  }

  connectedCallback(): void {
    super.connectedCallback();

    this.setup();
  }

  protected firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);

    window.addEventListener('click', (e: MouseEvent): void => {
      if (e.composedPath().includes(this.collapsableMenus)) {
        this.menusInFocus = true;
      } else {
        this.menusInFocus = false;
        if (!this.nameInFocus) {
          this.state.setEditListConfigMode(false);
        }
      }
    });
  }

  async setup(): Promise<void> {
    const listConfigs = this.state.listConfigs;
    if (this.state.hasFetchedListConfigs && !listConfigs.length) {
      await this.addConfig();
    }

    this.sync();
    this.ready = true;
  }

  enableEditMode(): void {
    if (this[ListConfigProp.VIEW_ONLY]) {
      return;
    }

    this.state.setEditListConfigMode(true);
  }

  handleNameChanged(e: InputChangedEvent): void {
    this.name = e.detail.value;
  }

  handleNameSubmitted(): void {
    this.blur();
    this.saveConfig();
    this.state.setEditListConfigMode(false);
  }

  handleNameBlurred(): void {
    this.nameInFocus = false;
    this.blur();
    this.saveConfig();
    setTimeout((): void => {
      if (this.menusInFocus) {
        return;
      }

      this.state.setEditListConfigMode(false);
    }, 200);
  }

  handleNameFocused(): void {
    this.nameInFocus = true;
  }

  async saveConfig(): Promise<void> {
    if (this.inSync || this.isSaving) {
      return;
    }

    this.isSaving = true;

    const result = await storage.saveListConfig({
      userId: '',
      id: this.id,
      name: this.name,
      filter: this.state.listFilter,
      sort: this.state.listSort,
      setting: this.state.listSetting,
      themes: this.state.listConfig.themes,
    });

    if (!result.isOk) {
      addToast(translate('failedToSaveListConfig'), NotificationType.ERROR);
      this.isSaving = false;
      return;
    }

    addToast(translate('listConfigSaved'), NotificationType.SUCCESS);
    this.state.setListConfigs(await storage.getListConfigs());
    this.isSaving = false;
  }

  async deleteConfig(): Promise<void> {
    await storage.deleteListConfig(this.id);
    addToast(translate('configDeleted'), NotificationType.INFO);
    const listConfigs = await storage.getListConfigs();
    if (listConfigs.length) {
      this.setListConfigId(listConfigs[0].id);
    }
    this.state.setListConfigs(listConfigs);
    this.sync();
  }

  async addConfig(): Promise<void> {
    const id = await storage.addListConfig();
    addToast(translate('configAdded'), NotificationType.SUCCESS);
    const listConfigs = await storage.getListConfigs();
    this.state.setListConfigs(listConfigs);
    this.setListConfigId(id);
    this.sync();
  }

  sync(_reset = false): void {
    if (!this.state.listConfig) {
      return;
    }

    this.id = this.state.listConfig.id;
    this.name = this.state.listConfig.name;
    this.navigationIndex = this.state.listConfigs.findIndex(
      config => config.id === this.id,
    );
  }

  setListConfigId(listConfigId: string): void {
    if (!this.state.listConfig) {
      return;
    }
    storage.saveActiveListConfigId(listConfigId);
    this.state.setListConfigId(listConfigId);
    this.id = this.state.listConfig.id;
    this.name = this.state.listConfig.name;
    this.dispatchEvent(new ListConfigChangedEvent({ listConfigId }));
  }

  carouselSlideChanged(e: CarouselSlideChangedEvent): void {
    this.state.setEditListConfigMode(false);
    this.state.setSelectListConfigMode(false);
    this.navigationIndex = e.detail.navigationIndex;
    const listConfigId = this.state.listConfigs[e.detail.slideIndex].id;
    this.setListConfigId(listConfigId);
  }

  showThemeManager(): void {
    this.themeManagerIsOpen = true;
  }

  hideThemeManager(): void {
    this.themeManagerIsOpen = false;
  }

  private handleFilterUpdated(_e: ListFilterUpdatedEvent): void {
    storage.updateListFilter(this.state.listConfigId, this.state.listFilter);
    this.filterIsOpen = false;
    this.dispatchEvent(new EntityListLoadEvent());
  }

  private handleSortUpdated(_e: ListSortUpdatedEvent): void {
    storage.updateListSort(this.state.listConfigId, this.state.listSort);
    this.sortIsOpen = false;
    this.dispatchEvent(new EntityListSyncEvent());
  }

  private handleSettingUpdated(_e: CustomEvent): void {
    this.dispatchEvent(new EntityListLoadEvent());
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

  showConfigDeleteConfirm(): void {
    this.confirmDeleteIsOpen = true;
  }

  updateThemes(e: ThemesUpdatedEvent): void {
    const themes = e.detail.themes;

    this.state.setThemes(themes);
  }

  saveThemes = (e: ThemesSavedEvent): void => {
    const themes = e.detail.themes;
    storage.updateListThemes(this.state.listConfig.id, themes);
    addToast(translate('themesSaved'), NotificationType.SUCCESS);
  };

  render(): TemplateResult {
    return html`<div class=${classMap(this.classes)}>
      <div class="carousel-wrapper">
        <ss-carousel
          infinite
          discrete
          showButtons
          height="180"
          width="100%"
          iconColor="var(--text-color, #000)"
          navigationIndex=${this.navigationIndex}
          @carousel-slide-changed=${this.carouselSlideChanged}
        >
          ${this.ready
            ? repeat(
                this.state.listConfigs,
                config => config.id,
                config =>
                  html`<div class="config-slide">
                    <div
                      class="close"
                      @click=${(e: MouseEvent): void => {
                        this.state.setSelectListConfigMode(false);
                        this.state.setEditListConfigMode(false);
                        e.stopPropagation();
                      }}
                    ></div>

                    <div class="name">
                      <ss-input
                        ?unsaved=${!this.inSync}
                        @input-changed=${this.handleNameChanged}
                        @input-focused=${this.handleNameFocused}
                        @input-blurred=${this.handleNameBlurred}
                        @input-submitted=${this.handleNameSubmitted}
                        type=${InputType.TEXT}
                        value=${config.name}
                        @click=${this.enableEditMode}
                      ></ss-input>
                    </div>

                    <div class="buttons">
                      <div class="buttons-inner">
                        <button @click=${this.addConfig}>
                          <ss-icon
                            name="add"
                            color="var(--input-text-color)"
                            size="16"
                          ></ss-icon>
                        </button>

                        <button @click=${this.showThemeManager}>
                          <ss-icon
                            name="theme"
                            color="var(--input-text-color)"
                            size="16"
                          ></ss-icon>
                        </button>

                        <button @click=${this.showConfigDeleteConfirm}>
                          <ss-icon
                            name="trash"
                            color="var(--input-text-color)"
                            size="16"
                          ></ss-icon>
                        </button>
                      </div>
                    </div>
                  </div>`,
              )
            : nothing}

          <style>
            ${this.carouselStyles}
          </style>
        </ss-carousel>
      </div>

      <div class="collapsable-menus">
        <ss-collapsable
          title=${translate('settings')}
          ?open=${this.settingIsOpen}
          @toggled=${this.toggleSetting}
        >
          <setting-form
            listConfigId=${this.state.listConfigId}
            @setting-updated=${this.handleSettingUpdated}
          ></setting-form>
        </ss-collapsable>

        <ss-collapsable
          title=${translate('filter')}
          ?open=${this.filterIsOpen}
          @toggled=${this.toggleFilter}
        >
          <div class="filter-body">
            <list-filter
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
      </div>

      <confirmation-modal
        ?open=${this.confirmDeleteIsOpen}
        message=${translate('confirmDeleteListConfig')}
        confirmText=${translate('delete')}
        cancelText=${translate('cancel')}
        @confirmation-accepted=${(): void => {
          this.deleteConfig();
          this.confirmDeleteIsOpen = false;
        }}
        @confirmation-declined=${(): void => {
          this.confirmDeleteIsOpen = false;
        }}
      ></confirmation-modal>

      <pop-up
        ?open=${this.themeManagerIsOpen}
        closeOnOutsideClick
        closeOnEsc
        closeButton
        @pop-up-closed=${this.hideThemeManager}
      >
        <theme-manager
          .open=${this.themeManagerIsOpen}
          .active=${this.state.listConfig.themes}
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
