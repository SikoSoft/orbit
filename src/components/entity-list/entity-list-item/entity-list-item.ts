import { html, css, nothing, TemplateResult } from 'lit';
import { property, customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { MobxLitElement } from '@adobe/lit-mobx';
import { marked } from 'marked';
import { default as DOMPurify } from 'dompurify';

import { NotificationType } from '@ss/ui/components/notification-provider.models';

import {
  DataType,
  EntityCalculatedPropertyConfig,
  EntityConfig,
  EntityProperty,
  EntityPropertyConfig,
  ImageDataValue,
  PropertyDataValue,
} from 'api-spec/models/Entity';
import { Time } from '@/lib/Time';
import {
  EntityListItemMode,
  EntityListItemProp,
  entityListItemProps,
  EntityListItemProps,
} from './entity-list-item.models';
import { appState } from '@/state';
import { translate } from '@/lib/Localization';
import { repeat } from 'lit/directives/repeat.js';
import { themed } from '@/lib/Theme';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { storage } from '@/lib/Storage';
import { addToast } from '@/lib/Util';

import '@/components/svg-icon/svg/svg-close';

import { PointerDownEvent } from '@/events/pointer-down';
import { PointerUpEvent } from '@/events/pointer-up';
import { PointerLongPressEvent } from '@/events/pointer-long-press';
import { EntitySuggestionAddedEvent } from '@/components/entity-suggestion/entity-suggestion.events';
import {
  EntityActionBarDeleteEvent,
  EntityActionBarEditEvent,
} from './entity-action-bar/entity-action-bar.events';
import { EntityItemDeletedEvent } from '@/components/entity-form/entity-form.events';

import '@ss/ui/components/ss-button';
import '@ss/ui/components/confirmation-modal';
import '@/components/entity-form/entity-form';
import './entity-action-bar/entity-action-bar';

const holdThreshold = 500;

@themed()
@customElement('entity-list-item')
export class EntityListItem extends MobxLitElement {
  private state = appState;

  static styles = css`
    :host {
      --padding: 1rem;
    }

    .debug-entity-type {
      background-color: #fdc;
    }

    .entity-list-item {
      position: relative;
      padding: 0.5rem;
      text-align: center;
      transition: all 0.2s;
      overflow: hidden;
      border: 1px solid transparent;

      &.selected {
        background-color: #fdc;
        color: #000;
        border: 1px solid #f85;
      }

      &.full,
      &.edit {
        border: 1px solid #444;
      }

      &.suggestion {
        opacity: 0.8;
        background-color: #efffdf;

        &.selected {
          background-color: #4caf50;
        }
      }
    }

    .time {
      color: #888;
      font-size: 0.9rem;
      display: flex;
      justify-content: center;
      padding: var(--padding);
      gap: 2rem;

      label {
        font-weight: lighter;
        opacity: 0.8;
        margin-right: 0.25rem;
      }
    }

    .show-full,
    .show-edit {
      display: none;
    }

    .property.image {
      img {
        max-width: 100%;
        cursor: zoom-in;
      }
    }

    .image-zoom-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .image-zoom-modal {
      position: relative;
      width: 90vw;
      height: 90vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .image-zoom-modal img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .image-zoom-close {
      position: absolute;
      top: -2.5rem;
      right: 0;
      background: none;
      border: none;
      color: #fff;
      cursor: pointer;
      padding: 0.25rem;
      display: flex;
      align-items: center;
      justify-content: center;

      svg-close {
        width: 2rem;
        height: 2rem;
      }
    }

    .property {
      padding: var(--padding);
      text-align: left;
      display: flex;
      justify-content: space-between;
      gap: 1rem;

      .property-name {
        font-weight: lighter;
        opacity: 0.8;
      }

      .property-value {
        font-weight: normal;
      }
    }

    .property-longtext .property-value {
      white-space: pre-wrap;

      ul,
      ol {
        margin: 0;

        li p {
          margin: 0;
        }
      }
    }

    .unpublished-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: bold;
      padding: 0.15rem 0.4rem;
      border-radius: 3px;
      background-color: color-mix(in srgb, currentColor 12%, transparent);
      opacity: 0.7;
      margin-bottom: 0.25rem;
    }

    .suggestion-badge {
      position: absolute;
      z-index: 1;
      top: 0.5rem;
      left: -1.5rem;
      text-transform: uppercase;
      font-weight: bold;
      background-color: #4caf50;
      padding: 0.25rem 2rem;
      transform: rotate(-45deg);
      font-size: 0.75rem;
      color: #efffdf;
    }

    .action-bar-container {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      border-top: 1px solid #ddd;
      background-color: rgba(255, 255, 255, 0.5);

      entity-action-bar {
        display: block;
      }
    }
  `;
  @property({ type: Number })
  [EntityListItemProp.TYPE]: EntityListItemProps[EntityListItemProp.TYPE] =
    entityListItemProps[EntityListItemProp.TYPE].default;

  @property({ type: Number })
  [EntityListItemProp.ENTITY_ID]: EntityListItemProps[EntityListItemProp.ENTITY_ID] =
    entityListItemProps[EntityListItemProp.ENTITY_ID].default;

  @property()
  [EntityListItemProp.CREATED_AT]: EntityListItemProps[EntityListItemProp.CREATED_AT] =
    entityListItemProps[EntityListItemProp.CREATED_AT].default;

  @property()
  [EntityListItemProp.UPDATED_AT]: EntityListItemProps[EntityListItemProp.UPDATED_AT] =
    entityListItemProps[EntityListItemProp.UPDATED_AT].default;

  @property({ type: Array })
  [EntityListItemProp.TAGS]: EntityListItemProps[EntityListItemProp.TAGS] =
    entityListItemProps[EntityListItemProp.TAGS].default;

  @property({ type: Boolean })
  [EntityListItemProp.SELECTED]: EntityListItemProps[EntityListItemProp.SELECTED] =
    entityListItemProps[EntityListItemProp.SELECTED].default;

  @property({ type: Array })
  [EntityListItemProp.PROPERTIES]: EntityListItemProps[EntityListItemProp.PROPERTIES] =
    entityListItemProps[EntityListItemProp.PROPERTIES].default;

  @property({ type: Boolean })
  [EntityListItemProp.DEBUG]: EntityListItemProps[EntityListItemProp.DEBUG] =
    entityListItemProps[EntityListItemProp.DEBUG].default;

  @property({ type: Boolean })
  [EntityListItemProp.PUBLIC_VIEW]: EntityListItemProps[EntityListItemProp.PUBLIC_VIEW] =
    entityListItemProps[EntityListItemProp.PUBLIC_VIEW].default;

  @property({ type: Number })
  [EntityListItemProp.VIEW_ACCESS_POLICY_ID]: EntityListItemProps[EntityListItemProp.VIEW_ACCESS_POLICY_ID] =
    entityListItemProps[EntityListItemProp.VIEW_ACCESS_POLICY_ID].default;

  @property({ type: Number })
  [EntityListItemProp.EDIT_ACCESS_POLICY_ID]: EntityListItemProps[EntityListItemProp.EDIT_ACCESS_POLICY_ID] =
    entityListItemProps[EntityListItemProp.EDIT_ACCESS_POLICY_ID].default;

  @property({ type: Boolean })
  [EntityListItemProp.PUBLISHED]: EntityListItemProps[EntityListItemProp.PUBLISHED] =
    entityListItemProps[EntityListItemProp.PUBLISHED].default;

  @property({ type: Boolean })
  [EntityListItemProp.SUGGESTION]: EntityListItemProps[EntityListItemProp.SUGGESTION] =
    entityListItemProps[EntityListItemProp.SUGGESTION].default;

  @state() mode: EntityListItemMode = EntityListItemMode.PREVIEW;
  @state() pointerDown: Date = new Date();
  @state() downTimeout: ReturnType<typeof setTimeout> | undefined = undefined;
  @state() downActivation: boolean = false;
  @state() confirmDeleteShown: boolean = false;
  @state() zoomedImage: ImageDataValue | null = null;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchMoved: boolean = false;

  @state() get classes(): Record<string, boolean> {
    return {
      'entity-list-item': true,
      selected: this.selected,
      public: this.publicView,
      preview: this.mode === EntityListItemMode.PREVIEW,
      full: this.mode === EntityListItemMode.FULL,
      edit: this.mode === EntityListItemMode.EDIT,
      unpublished: !this.published,
      suggestion: this.suggestion,
    };
  }

  @state()
  get entityConfig(): EntityConfig | undefined {
    return this.state.entityConfigs.find(entity => {
      return entity.id === this.type;
    });
  }

  @state()
  get propertyConfigs(): (EntityPropertyConfig | EntityCalculatedPropertyConfig)[] | undefined {
    if (!this.entityConfig) {
      return undefined;
    }

    return this.entityConfig.properties;
  }

  get readableCreatedAt(): string {
    const date = new Date(this.createdAt);
    return Time.formatDateTime(date);
  }

  get readableUpdatedAt(): string {
    const date = new Date(this.updatedAt);
    return Time.formatDateTime(date);
  }

  getReadableTime(timeString: string): string {
    const date = new Date(timeString);
    return Time.formatDateTime(date);
  }

  setMode(mode: EntityListItemMode): void {
    this.mode = mode;
  }

  override firstUpdated(): void {
    if (
      this.suggestion &&
      new URLSearchParams(window.location.search).get('addSuggestion') === '1'
    ) {
      void this.handleAddSuggestion();
    }
  }

  private async handleAddSuggestion(): Promise<void> {
    await storage.addEntitySuggestion(this.entityId);
    addToast(translate('itemHasBeenAdded'), NotificationType.INFO);
    this.mode = EntityListItemMode.PREVIEW;
    this.dispatchEvent(new EntitySuggestionAddedEvent({ id: this.entityId }));
  }

  private handleEditRequested(_e: EntityActionBarEditEvent): void {
    this.mode = EntityListItemMode.EDIT;
  }

  private handleDeleteRequested(_e: EntityActionBarDeleteEvent): void {
    this.confirmDeleteShown = true;
  }

  private async handleDeleteConfirmed(): Promise<void> {
    this.confirmDeleteShown = false;
    try {
      await storage.deleteEntity(this.entityId);
      addToast(translate('removed'), NotificationType.INFO);
    } catch (error) {
      console.error(`Error encountered when deleting entity: ${error}`);
    }
    this.dispatchEvent(new EntityItemDeletedEvent({ id: this.entityId }));
  }

  private handleMouseDown(e: Event): boolean {
    if (this.publicView || this.mode === EntityListItemMode.EDIT) {
      return false;
    }

    this.pointerDown = new Date();
    this.dispatchEvent(new PointerDownEvent({ time: this.pointerDown }));
    this.downTimeout = setTimeout(() => {
      const time = new Date();
      if (time.getTime() - this.pointerDown.getTime() > holdThreshold) {
        this.dispatchEvent(new PointerLongPressEvent({ time }));
        this.downActivation = true;
        return;
      }
    }, holdThreshold);
    e.preventDefault();
    return false;
  }

  private handleMouseUp(e: Event): boolean {
    if (this.publicView || this.mode === EntityListItemMode.EDIT) {
      return false;
    }

    if (!this.downActivation) {
      this.dispatchEvent(new PointerUpEvent({ time: new Date() }));
      if (!this.state.selectMode && this.mode === EntityListItemMode.PREVIEW) {
        this.mode = EntityListItemMode.FULL;
      }
    }
    this.downActivation = false;
    if (this.downTimeout) {
      clearTimeout(this.downTimeout);
    }

    e.preventDefault();
    return false;
  }

  private isEventFromActionBar(e: Event): boolean {
    return e.composedPath().some(
      el => el instanceof HTMLElement && el.classList.contains('action-bar-container'),
    );
  }

  private handleTouchStart(e: TouchEvent): void {
    if (this.mode === EntityListItemMode.EDIT) {
      return;
    }
    if (this.isEventFromActionBar(e)) {
      return;
    }
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
    this.touchMoved = false;
    this.pointerDown = new Date();
    this.dispatchEvent(new PointerDownEvent({ time: this.pointerDown }));
    this.downTimeout = setTimeout(() => {
      if (this.touchMoved) {
        return;
      }
      const time = new Date();
      if (time.getTime() - this.pointerDown.getTime() > holdThreshold) {
        this.dispatchEvent(new PointerLongPressEvent({ time }));
        this.downActivation = true;
      }
    }, holdThreshold);
  }

  private handleTouchMove(e: TouchEvent): void {
    if (this.mode === EntityListItemMode.EDIT) {
      return;
    }
    if (this.isEventFromActionBar(e)) {
      return;
    }
    const dx = e.touches[0].clientX - this.touchStartX;
    const dy = e.touches[0].clientY - this.touchStartY;
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      this.touchMoved = true;
      if (this.downTimeout) {
        clearTimeout(this.downTimeout);
        this.downTimeout = undefined;
      }
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    if (this.mode === EntityListItemMode.EDIT) {
      return;
    }
    if (this.isEventFromActionBar(e)) {
      return;
    }
    e.preventDefault();
    if (!this.touchMoved && !this.downActivation) {
      this.dispatchEvent(new PointerUpEvent({ time: new Date() }));
      if (!this.state.selectMode && this.mode === EntityListItemMode.PREVIEW) {
        this.mode = EntityListItemMode.FULL;
      }
    }
    this.downActivation = false;
    this.touchMoved = false;
    if (this.downTimeout) {
      clearTimeout(this.downTimeout);
      this.downTimeout = undefined;
    }
  }

  handleMouseEnter(): void {
    if (this.mode === EntityListItemMode.EDIT) {
      return;
    }

    this.mode = EntityListItemMode.FULL;
  }

  handleMouseLeave(): void {
    if (this.mode === EntityListItemMode.EDIT) {
      return;
    }

    this.mode = EntityListItemMode.PREVIEW;
  }

  private renderProperty(
    property: EntityProperty,
  ): TemplateResult | typeof nothing {
    const propertyConfig = this.getPropertyConfig(property.propertyConfigId);
    if (!propertyConfig || propertyConfig.hidden) {
      return nothing;
    }

    let value: PropertyDataValue | TemplateResult = propertyConfig.defaultValue;

    switch (propertyConfig.dataType) {
      case DataType.DATE:
        value = this.getReadableTime(property.value as string);
        break;
      case DataType.INT:
        value = property.value as number;
        break;
      case DataType.LONG_TEXT:
        value = html`${unsafeHTML(
          DOMPurify.sanitize(marked.parse(property.value as string).toString()),
        )}`;
        break;
      default:
        value = property.value as string;
        break;
    }

    if (propertyConfig.dataType === DataType.IMAGE) {
      return this.renderImageProperty(property);
    }

    return html`
      <div
        class=${classMap({
          property: true,
          [`property-${propertyConfig.dataType.toLowerCase()}`]: true,
          [`property--${propertyConfig.name.toLowerCase()}`]: true,
        })}
        data-name=${propertyConfig.name}
        data-value=${value}
        slot=${propertyConfig.name}
      >
        <span class="property-name">${propertyConfig.name}</span>
        <span class="property-value"
          >${propertyConfig.prefix
            ? html`<span class="property-prefix"
                >${propertyConfig.prefix}</span
              >`
            : nothing}${value}${propertyConfig.suffix
            ? html`<span class="property-suffix"
                >${propertyConfig.suffix}</span
              >`
            : nothing}</span
        >
      </div>
    `;
  }

  renderImageProperty(
    property: EntityProperty,
  ): TemplateResult | typeof nothing {
    const propertyConfig = this.getPropertyConfig(property.propertyConfigId);
    if (!propertyConfig || propertyConfig.dataType !== DataType.IMAGE) {
      return nothing;
    }

    const value = property.value as ImageDataValue;

    return html`<span class="property image"
      ><img
        src=${value.src}
        alt=${value.alt}
        crossorigin="anonymous"
        @click=${(e: Event): void => {
          e.stopPropagation();
          this.zoomedImage = value;
        }}
        @mousedown=${(e: Event): void => {
          e.stopPropagation();
        }}
        @mouseup=${(e: Event): void => {
          e.stopPropagation();
        }}
        @touchstart=${(e: Event): void => {
          e.stopPropagation();
        }}
        @touchend=${(e: Event): void => {
          e.stopPropagation();
        }}
      /></span
    >`;
  }

  getPropertyConfig(
    propertyConfigId: number,
  ): EntityPropertyConfig | EntityCalculatedPropertyConfig | undefined {
    if (!this.propertyConfigs) {
      return undefined;
    }

    return this.propertyConfigs.find(config => config.id === propertyConfigId);
  }

  showFull(): void {
    this.mode = EntityListItemMode.FULL;
  }

  showEdit(): void {
    this.mode = EntityListItemMode.EDIT;
  }

  render(): TemplateResult {
    return html`
      <div
        class=${classMap(this.classes)}
        @mouseenter=${this.handleMouseEnter}
        @mouseleave=${this.handleMouseLeave}
        @mousedown=${this.handleMouseDown}
        @mouseup=${this.handleMouseUp}
        @touchstart=${this.handleTouchStart}
        @touchmove=${this.handleTouchMove}
        @touchend=${this.handleTouchEnd}
      >
        ${this.suggestion
          ? html`<div class="suggestion-badge">${translate('auto')}</div>`
          : nothing}
        ${this.mode === EntityListItemMode.EDIT
          ? html`
              <entity-form
                @entity-item-updated=${(): void => {
                  this.mode = EntityListItemMode.PREVIEW;
                }}
                @entity-item-canceled=${(): void => {
                  this.mode = EntityListItemMode.PREVIEW;
                }}
                entityId=${this.entityId}
                viewAccessPolicyId=${this.viewAccessPolicyId}
                editAccessPolicyId=${this.editAccessPolicyId}
                type=${this.type}
                ?published=${this.published}
                .tags=${this.tags}
                .properties=${this.properties}
              ></entity-form>
            `
          : html`
              <div>
                ${this.state.debugMode
                  ? html` <div class="debug-entity-type">
                      ${this.entityConfig?.name || this.type}
                    </div>`
                  : nothing}
                ${!this.published && !this.suggestion
                  ? html`<div class="unpublished-badge">
                      ${translate('unpublished')}
                    </div>`
                  : nothing}
                <div class="show-full">
                  <ss-button @click=${this.showFull}
                    >${translate('showFull')}</ss-button
                  >
                </div>
                <div class="show-edit">
                  <ss-button @click=${this.showEdit}
                    >${translate('showEdit')}</ss-button
                  >
                </div>
                <div class="properties item-properties">
                  ${repeat(
                    this.properties,
                    property => property.id,
                    property => this.renderProperty(property),
                  )}
                </div>

                <div class="time">
                  <span class="created-at">
                    <label>${translate('createdAt')}</label>:
                    ${this.readableCreatedAt}
                  </span>
                  ${this.createdAt !== this.updatedAt
                    ? html`
                        <span class="updated-at"
                          ><label>${translate('updatedAt')}</label>:
                          ${this.readableUpdatedAt}</span
                        >
                      `
                    : nothing}
                </div>
              </div>
              ${this.mode === EntityListItemMode.FULL
                ? html`
                    <div class="action-bar-container">
                      <entity-action-bar
                        ?suggestion=${this.suggestion}
                        @entity-action-bar-add=${this.handleAddSuggestion}
                        @entity-action-bar-edit=${this.handleEditRequested}
                        @entity-action-bar-delete=${this.handleDeleteRequested}
                      ></entity-action-bar>
                    </div>
                  `
                : nothing}
            `}
      </div>
      <confirmation-modal
        @confirmation-accepted=${this.handleDeleteConfirmed}
        @confirmation-declined=${(): void => {
          this.confirmDeleteShown = false;
        }}
        message=${translate('confirmDeleteSuggestion')}
        ?open=${this.confirmDeleteShown}
      ></confirmation-modal>
      ${this.zoomedImage
        ? html`
            <div
              class="image-zoom-overlay"
              @click=${(): void => {
                this.zoomedImage = null;
              }}
            >
              <div
                class="image-zoom-modal"
                @click=${(e: Event): void => {
                  e.stopPropagation();
                }}
              >
                <button
                  class="image-zoom-close"
                  aria-label=${translate('close')}
                  @click=${(): void => {
                    this.zoomedImage = null;
                  }}
                >
                  <svg-close></svg-close>
                </button>
                <img
                  src=${this.zoomedImage.src}
                  alt=${this.zoomedImage.alt}
                  crossorigin="anonymous"
                />
              </div>
            </div>
          `
        : nothing}
    `;
  }
}
