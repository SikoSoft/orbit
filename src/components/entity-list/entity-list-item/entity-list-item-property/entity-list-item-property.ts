import { html, css, nothing, TemplateResult } from 'lit';
import { property, customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { LitElement } from 'lit';
import { marked } from 'marked';
import { default as DOMPurify } from 'dompurify';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import {
  DataType,
  EntityCalculatedPropertyConfig,
  EntityPropertyConfig,
  ImageDataValue,
  PropertyDataValue,
} from 'api-spec/models/Entity';
import { Time } from '@/lib/Time';
import { translate } from '@/lib/Localization';
import { themed } from '@/lib/Theme';

import '@/components/svg-icon/svg/svg-close';

import {
  EntityListItemPropertyProp,
  EntityListItemPropertyProps,
  entityListItemPropertyProps,
} from './entity-list-item-property.models';

@themed()
@customElement('entity-list-item-property')
export class EntityListItemProperty extends LitElement {
  static styles = css`
    :host {
      --padding: 1rem;
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
  `;

  @property({ type: Object })
  [EntityListItemPropertyProp.PROPERTY]: EntityListItemPropertyProps[EntityListItemPropertyProp.PROPERTY] =
    entityListItemPropertyProps[EntityListItemPropertyProp.PROPERTY].default;

  @property({ type: Array })
  [EntityListItemPropertyProp.PROPERTY_CONFIGS]: EntityListItemPropertyProps[EntityListItemPropertyProp.PROPERTY_CONFIGS] =
    entityListItemPropertyProps[EntityListItemPropertyProp.PROPERTY_CONFIGS]
      .default;

  @state() private zoomedImage: ImageDataValue | null = null;

  private getPropertyConfig(
    propertyConfigId: number,
  ): EntityPropertyConfig | EntityCalculatedPropertyConfig | undefined {
    return this.propertyConfigs?.find(config => config.id === propertyConfigId);
  }

  private handleImageClick(e: Event, value: ImageDataValue): void {
    e.stopPropagation();
    this.zoomedImage = value;
  }

  private closeZoom(): void {
    this.zoomedImage = null;
  }

  private stopPropagation(e: Event): void {
    e.stopPropagation();
  }

  private renderImageProperty(
    propertyConfig: EntityPropertyConfig | EntityCalculatedPropertyConfig,
  ): TemplateResult | typeof nothing {
    if (propertyConfig.dataType !== DataType.IMAGE) {
      return nothing;
    }

    const value = this.property.value as ImageDataValue;

    return html`<span class="property image"
      ><img
        src=${value.src}
        alt=${value.alt}
        crossorigin="anonymous"
        @click=${(e: Event): void => this.handleImageClick(e, value)}
        @mousedown=${this.stopPropagation}
        @mouseup=${this.stopPropagation}
        @touchstart=${this.stopPropagation}
        @touchend=${this.stopPropagation}
    /></span>`;
  }

  private renderZoomOverlay(): TemplateResult | typeof nothing {
    if (!this.zoomedImage) {
      return nothing;
    }
    return html`
      <div class="image-zoom-overlay" @click=${this.closeZoom}>
        <div class="image-zoom-modal" @click=${this.stopPropagation}>
          <button
            class="image-zoom-close"
            aria-label=${translate('close')}
            @click=${this.closeZoom}
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
    `;
  }

  render(): TemplateResult | typeof nothing {
    const propertyConfig = this.getPropertyConfig(
      this.property.propertyConfigId,
    );
    if (!propertyConfig || propertyConfig.hidden) {
      return nothing;
    }

    if (propertyConfig.dataType === DataType.IMAGE) {
      return html`${this.renderImageProperty(propertyConfig)}${this.renderZoomOverlay()}`;
    }

    let value: PropertyDataValue | TemplateResult = propertyConfig.defaultValue;

    switch (propertyConfig.dataType) {
      case DataType.DATE:
        value = Time.formatDateTime(new Date(this.property.value as string));
        break;
      case DataType.INT:
        value = this.property.value as number;
        break;
      case DataType.LONG_TEXT:
        value = html`${unsafeHTML(
          DOMPurify.sanitize(
            marked.parse(this.property.value as string).toString(),
          ),
        )}`;
        break;
      default:
        value = this.property.value as string;
        break;
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
}
