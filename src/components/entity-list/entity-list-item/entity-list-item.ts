import { html, css, nothing, TemplateResult } from 'lit';
import { property, customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { NotificationType } from '@ss/ui/components/notification-provider.models';

import {
  EntityCalculatedPropertyConfig,
  EntityConfig,
  EntityProperty,
  EntityPropertyConfig,
} from 'api-spec/models/Entity';
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
import { storage } from '@/lib/Storage';
import { addToast } from '@/lib/Util';

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
import './entity-list-item-property/entity-list-item-property';
import './entity-list-item-tags/entity-list-item-tags';
import './entity-list-item-time/entity-list-item-time';

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

    .show-full,
    .show-edit {
      display: none;
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

  @property({ type: Boolean })
  [EntityListItemProp.ALLOW_COMMENTS]: EntityListItemProps[EntityListItemProp.ALLOW_COMMENTS] =
    entityListItemProps[EntityListItemProp.ALLOW_COMMENTS].default;

  @property({ type: String })
  [EntityListItemProp.OWNER_ID]: EntityListItemProps[EntityListItemProp.OWNER_ID] =
    entityListItemProps[EntityListItemProp.OWNER_ID].default;

  @state() mode: EntityListItemMode = EntityListItemMode.PREVIEW;
  @state() pointerDown: Date = new Date();
  @state() downTimeout: ReturnType<typeof setTimeout> | undefined = undefined;
  @state() downActivation: boolean = false;
  @state() confirmDeleteShown: boolean = false;
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
      suggestion: this.suggestion && !this.published,
    };
  }

  @state()
  get entityConfig(): EntityConfig | undefined {
    return this.state.entityConfigs.find(entity => {
      return entity.id === this.type;
    });
  }

  @state()
  get propertyConfigs():
    | (EntityPropertyConfig | EntityCalculatedPropertyConfig)[]
    | undefined {
    if (!this.entityConfig) {
      return undefined;
    }

    return this.entityConfig.properties;
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

  private async handleEditRequested(_e: EntityActionBarEditEvent): Promise<void> {
    this.mode = EntityListItemMode.EDIT;
    await this.updateComplete;
    this.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    return e
      .composedPath()
      .some(
        el =>
          el instanceof HTMLElement &&
          el.classList.contains('action-bar-container'),
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
        ${this.suggestion && !this.published
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
                ?allowComments=${this.allowComments}
                ownerId=${this.ownerId}
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
                    (property: EntityProperty) => property.id,
                    (property: EntityProperty) =>
                      html`<entity-list-item-property
                        .property=${property}
                        .propertyConfigs=${this.propertyConfigs ?? []}
                      ></entity-list-item-property>`,
                  )}
                </div>

                <entity-list-item-tags
                  .tags=${this.tags}
                ></entity-list-item-tags>

                <entity-list-item-time
                  createdAt=${this.createdAt}
                  updatedAt=${this.updatedAt}
                ></entity-list-item-time>
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
    `;
  }
}
