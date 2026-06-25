import { MobxLitElement } from '@adobe/lit-mobx';
import { reaction } from 'mobx';
import {
  css,
  CSSResult,
  html,
  nothing,
  TemplateResult,
} from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { translate } from '@/lib/Localization';
import { appState } from '@/state';
import { storage } from '@/lib/Storage';
import { InputType } from '@ss/ui/components/ss-input.models';
import { Access } from '@/lib/Access';

import '@ss/ui/components/ss-input';
import '@ss/ui/components/ss-icon';
import '@ss/ui/components/ss-carousel';

import { InputChangedEvent } from '@ss/ui/components/ss-input.events';
import { CarouselSlideChangedEvent } from '@ss/ui/components/ss-carousel.events';
import { ListConfigChangedEvent } from '../list-config.events';
import {
  AddConfigRequestedEvent,
  ConfigNameBlurredEvent,
  ConfigNameFocusedEvent,
  ConfigNameSaveRequestedEvent,
  ConfigNameSubmittedEvent,
  DeleteConfigRequestedEvent,
  ThemeManagerRequestedEvent,
} from './list-config-carousel.events';
import {
  ListConfigCarouselProp,
  listConfigCarouselProps,
  ListConfigCarouselProps,
} from './list-config-carousel.models';

@customElement('list-config-carousel')
export class ListConfigCarousel extends MobxLitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1rem;
      position: relative;
      touch-action: none;
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

    :host([viewOnly]) .name,
    :host([viewOnly]) .name:hover {
      ss-input::part(input) {
        cursor: default;
        border-color: transparent;
        background-color: transparent;
        pointer-events: none;
      }
    }

    .everything-slide .name,
    .everything-slide .name:hover {
      ss-input::part(input) {
        cursor: default;
        border-color: transparent;
        background-color: transparent;
        pointer-events: none;
      }
    }

    .managed-indicator {
      margin-top: 0.5rem;
      text-align: center;
      font-size: 0.8rem;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      background-color: color-mix(in srgb, currentColor 10%, transparent);
      border: 1px solid color-mix(in srgb, currentColor 20%, transparent);
      opacity: 0.8;
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

  private appState = appState;

  @property({ type: Boolean })
  [ListConfigCarouselProp.VIEW_ONLY]: ListConfigCarouselProps[ListConfigCarouselProp.VIEW_ONLY] =
    listConfigCarouselProps[ListConfigCarouselProp.VIEW_ONLY].default;

  @state() name: string = '';
  @state() navigationIndex: number = 0;
  @state() ready: boolean = false;

  @state()
  get canEdit(): boolean {
    if (this[ListConfigCarouselProp.VIEW_ONLY] || !this.appState.user?.id) {
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
    if (this[ListConfigCarouselProp.VIEW_ONLY] || !this.appState.user?.id) {
      return false;
    }
    return this.appState.listConfig.userId === this.appState.user.id;
  }

  @state()
  get inSync(): boolean {
    if (!this.appState.listConfig) {
      return true;
    }
    return this.name === this.appState.listConfig.name;
  }

  @state()
  get isManagedExternally(): boolean {
    if (!this.appState.user?.id || !this.appState.listConfig?.userId) {
      return false;
    }
    return this.appState.listConfig.userId !== this.appState.user.id;
  }

  @state()
  get showEverythingSlide(): boolean {
    if (this[ListConfigCarouselProp.VIEW_ONLY]) {
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
  get carouselStyles(): CSSResult[] {
    const styles: CSSResult[] = [this.defaultModeStyles];
    if (this.appState.editListConfigMode) {
      styles.push(this.editModeStyles);
    }
    if (this.appState.selectListConfigMode) {
      styles.push(this.configModeStyles);
    }
    return styles;
  }

  connectedCallback(): void {
    super.connectedCallback();

    reaction(
      () => this.appState.listConfigId,
      () => {
        this.sync();
      },
    );

    reaction(
      () => this.appState.listConfig?.name,
      name => {
        if (name !== undefined) {
          this.name = name;
        }
      },
    );

    this.sync();
    this.ready = true;
  }

  sync(): void {
    if (!this[ListConfigCarouselProp.VIEW_ONLY] && !this.appState.listConfigId) {
      this.appState.setTitle(translate('everything'));
      this.name = translate('everything');
      this.navigationIndex = 0;
      return;
    }

    const config = this.appState.filteredListConfigs.find(
      c => c.id === this.appState.listConfigId,
    );
    if (!config) {
      return;
    }

    this.appState.setTitle(config.name);
    this.name = config.name;
    this.navigationIndex =
      this.appState.filteredListConfigs.findIndex(c => c.id === config.id) +
      (this.showEverythingSlide ? 1 : 0);
  }

  enableEditMode(): void {
    if (!this.canEdit) {
      return;
    }
    this.appState.setEditListConfigMode(true);
  }

  handleNameChanged(e: InputChangedEvent): void {
    this.name = e.detail.value;
  }

  handleNameFocused(): void {
    this.dispatchEvent(new ConfigNameFocusedEvent());
  }

  handleNameBlurred(): void {
    this.blur();
    if (!this.inSync) {
      this.dispatchEvent(new ConfigNameSaveRequestedEvent({ name: this.name }));
    }
    this.dispatchEvent(new ConfigNameBlurredEvent());
  }

  handleNameSubmitted(): void {
    this.blur();
    if (!this.inSync) {
      this.dispatchEvent(new ConfigNameSaveRequestedEvent({ name: this.name }));
    }
    this.dispatchEvent(new ConfigNameSubmittedEvent());
  }

  setListConfigId(listConfigId: string): void {
    storage.saveActiveListConfigId(listConfigId);
    this.appState.setListConfigId(listConfigId);
    this.dispatchEvent(new ListConfigChangedEvent({ listConfigId }));
  }

  carouselSlideChanged(e: CarouselSlideChangedEvent): void {
    if (!this[ListConfigCarouselProp.VIEW_ONLY]) {
      if (this.showEverythingSlide && e.detail.slideIndex === 0) {
        if (this.appState.listConfigId === '') {
          return;
        }
        this.appState.setEditListConfigMode(false);
        this.appState.setSelectListConfigMode(false);
        this.navigationIndex = e.detail.navigationIndex;
        this.setListConfigId('');
        return;
      }
      const offset = this.showEverythingSlide ? 1 : 0;
      const newListConfigId =
        this.appState.filteredListConfigs[e.detail.slideIndex - offset]?.id;
      if (!newListConfigId || newListConfigId === this.appState.listConfigId) {
        return;
      }
      this.appState.setEditListConfigMode(false);
      this.appState.setSelectListConfigMode(false);
      this.navigationIndex = e.detail.navigationIndex;
      this.setListConfigId(newListConfigId);
      return;
    }

    const newListConfigId =
      this.appState.filteredListConfigs[e.detail.slideIndex]?.id;
    if (!newListConfigId || newListConfigId === this.appState.listConfigId) {
      return;
    }
    this.appState.setEditListConfigMode(false);
    this.appState.setSelectListConfigMode(false);
    this.navigationIndex = e.detail.navigationIndex;
    this.setListConfigId(newListConfigId);
  }

  private handleConfigCloseClick(e: MouseEvent): void {
    this.appState.setSelectListConfigMode(false);
    this.appState.setEditListConfigMode(false);
    e.stopPropagation();
  }

  render(): TemplateResult {
    return html`
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
          ? html`
              ${this.showEverythingSlide
                ? html`<div class="config-slide everything-slide">
                    <div class="name">
                      <ss-input
                        type=${InputType.TEXT}
                        value=${translate('everything')}
                      ></ss-input>
                    </div>
                  </div>`
                : nothing}
              ${repeat(
                this.appState.filteredListConfigs,
                config => config.id,
                config =>
                  html`<div class="config-slide">
                    <div
                      class="close"
                      @click=${(e: MouseEvent): void =>
                        this.handleConfigCloseClick(e)}
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

                    ${this.appState.user?.id &&
                    config.userId &&
                    config.userId !== this.appState.user.id
                      ? html`<div class="managed-indicator">
                          ${translate('managedByExternalParty')}
                        </div>`
                      : nothing}

                    <div class="buttons">
                      <div class="buttons-inner">
                        <button
                          @click=${(): void => {
                            this.dispatchEvent(new AddConfigRequestedEvent());
                          }}
                        >
                          <ss-icon
                            name="add"
                            color="var(--input-text-color)"
                            size="16"
                          ></ss-icon>
                        </button>

                        <button
                          @click=${(): void => {
                            this.dispatchEvent(
                              new ThemeManagerRequestedEvent(),
                            );
                          }}
                        >
                          <ss-icon
                            name="theme"
                            color="var(--input-text-color)"
                            size="16"
                          ></ss-icon>
                        </button>

                        ${this.canDelete
                          ? html`
                              <button
                                @click=${(): void => {
                                  this.dispatchEvent(
                                    new DeleteConfigRequestedEvent(),
                                  );
                                }}
                              >
                                <ss-icon
                                  name="trash"
                                  color="var(--input-text-color)"
                                  size="16"
                                ></ss-icon>
                              </button>
                            `
                          : nothing}
                      </div>
                    </div>
                  </div>`,
              )}
            `
          : nothing}

        <style>
          ${this.carouselStyles}
        </style>
      </ss-carousel>
    `;
  }
}
