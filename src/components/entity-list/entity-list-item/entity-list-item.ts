import { html, css, nothing, TemplateResult } from 'lit';
import { property, customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { MobxLitElement } from '@adobe/lit-mobx';
import { marked } from 'marked';
import { default as DOMPurify } from 'dompurify';

import {
  DataType,
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

import { PointerDownEvent } from '@/events/pointer-down';
import { PointerUpEvent } from '@/events/pointer-up';
import { PointerLongPressEvent } from '@/events/pointer-long-press';

import '@/components/entity-form/entity-form';
import { translate } from '@/lib/Localization';
import { repeat } from 'lit/directives/repeat.js';
import { themed } from '@/lib/Theme';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

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
      padding: 0.5rem;
      text-align: center;
      transition: all 0.2s;

      &.selected {
        background-color: #fdc;
        color: #000;
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

  @state() mode: EntityListItemMode = EntityListItemMode.PREVIEW;
  @state() pointerDown: Date = new Date();
  @state() downTimeout: ReturnType<typeof setTimeout> | undefined = undefined;
  @state() downActivation: boolean = false;
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
    };
  }

  @state()
  get entityConfig(): EntityConfig | undefined {
    return this.state.entityConfigs.find(entity => {
      return entity.id === this.type;
    });
  }

  @state()
  get propertyConfigs(): EntityPropertyConfig[] | undefined {
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

  private handleMouseDown(e: Event): boolean {
    if (this.publicView) {
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
    if (this.publicView) {
      return false;
    }

    if (!this.downActivation) {
      this.dispatchEvent(new PointerUpEvent({ time: new Date() }));
    }
    this.downActivation = false;
    if (this.downTimeout) {
      clearTimeout(this.downTimeout);
    }

    e.preventDefault();
    return false;
  }

  private handleTouchStart(e: TouchEvent): void {
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
    e.preventDefault();
    if (!this.touchMoved && !this.downActivation) {
      this.dispatchEvent(new PointerUpEvent({ time: new Date() }));
    }
    this.downActivation = false;
    this.touchMoved = false;
    if (this.downTimeout) {
      clearTimeout(this.downTimeout);
      this.downTimeout = undefined;
    }
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

    return html` <span class="property image"
      ><img src=${value.src} alt=${value.alt} crossorigin="anonymous"
    /></span>`;
  }

  getPropertyConfig(
    propertyConfigId: number,
  ): EntityPropertyConfig | undefined {
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
      <div class=${classMap(this.classes)}>
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
              <div
                @mousedown=${this.handleMouseDown}
                @mouseup=${this.handleMouseUp}
                @touchstart=${this.handleTouchStart}
                @touchmove=${this.handleTouchMove}
                @touchend=${this.handleTouchEnd}
              >
                ${this.state.debugMode
                  ? html` <div class="debug-entity-type">
                      ${this.entityConfig?.name || this.type}
                    </div>`
                  : nothing}
                ${!this.published
                  ? html`<div class="unpublished-badge">${translate('unpublished')}</div>`
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
                <div class="properties">
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
            `}
      </div>
    `;
  }
}
