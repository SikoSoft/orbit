import { css, html, nothing, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import '@ss/ui/components/ss-input';
import { DataType, ImageDataValue } from 'api-spec/models/Entity';
import { translate } from '@/lib/Localization';

import { InputChangedEvent } from '@ss/ui/components/ss-input.events';
import {
  ImageFieldProp,
  ImageFieldProps,
  imageFieldProps,
} from './image-field.models';
import { PropertyChangedEvent } from '../property-field/property-field.events';

import '@ss/ui/components/file-upload';
import { MobxLitElement } from '@adobe/lit-mobx';
import { appState } from '@/state';
import { FileUploadSuccessEvent } from '@ss/ui/components/file-upload.events';
import { addToast } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';

@customElement('image-field')
export class ImageField extends MobxLitElement {
  static styles = css`
    .preview {
      margin-bottom: 0.5rem;

      img {
        max-width: 100%;
        height: auto;
      }
    }

    .url-field {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;

      ss-input {
        flex-grow: 1;
      }

      ss-button::part(button) {
        cursor: pointer;
      }
    }
  `;

  private state = appState;

  @property({ type: Number })
  [ImageFieldProp.INSTANCE_ID]: ImageFieldProps[ImageFieldProp.INSTANCE_ID] =
    imageFieldProps[ImageFieldProp.INSTANCE_ID].default;

  @property({ type: Object })
  [ImageFieldProp.VALUE]: ImageFieldProps[ImageFieldProp.VALUE] =
    imageFieldProps[ImageFieldProp.VALUE].default;

  @property({ type: String })
  [ImageFieldProp.SRC]: ImageFieldProps[ImageFieldProp.SRC] =
    imageFieldProps[ImageFieldProp.SRC].default;

  @property({ type: String })
  [ImageFieldProp.ALT]: ImageFieldProps[ImageFieldProp.ALT] =
    imageFieldProps[ImageFieldProp.ALT].default;

  @property({ type: Number })
  [ImageFieldProp.PROPERTY_CONFIG_ID]: ImageFieldProps[ImageFieldProp.PROPERTY_CONFIG_ID] =
    imageFieldProps[ImageFieldProp.PROPERTY_CONFIG_ID].default;

  @property({ type: Number })
  [ImageFieldProp.ENTITY_CONFIG_ID]: ImageFieldProps[ImageFieldProp.ENTITY_CONFIG_ID] =
    imageFieldProps[ImageFieldProp.ENTITY_CONFIG_ID].default;

  @property({ type: String })
  [ImageFieldProp.UI_ID]: ImageFieldProps[ImageFieldProp.UI_ID] =
    imageFieldProps[ImageFieldProp.UI_ID].default;

  @state()
  private destImgPath: string = '';

  @state()
  popUpIsOpen: boolean = false;

  get uploadUrl(): string {
    return new URL(
      `file${this.destImgPath ? `/${this.destImgPath.replace(/^\/+|\/+$/g, '')}/` : ''}`,
      import.meta.env.APP_BASE_API_URL,
    ).toString();
  }

  protected handleValueChanged(value: ImageDataValue): void {
    this.dispatchEvent(
      new PropertyChangedEvent({
        uiId: this[ImageFieldProp.UI_ID],
        dataType: DataType.IMAGE,
        value,
      }),
    );
  }

  protected handleSrcChanged(e: InputChangedEvent): void {
    this.handleValueChanged({ src: e.detail.value, alt: this.alt });
  }

  protected handleAltChanged(e: InputChangedEvent): void {
    this.handleValueChanged({ src: this.src, alt: e.detail.value });
  }

  protected handleDestChanged(e: InputChangedEvent): void {
    this.destImgPath = e.detail.value;
  }

  fileUploadSuccess(e: FileUploadSuccessEvent): void {
    this.handleValueChanged({ src: e.detail.url, alt: this.alt });
    this.src = e.detail.url;
    addToast(translate('fileUploadSuccess'), NotificationType.SUCCESS);
    this.popUpIsOpen = false;
  }

  fileUploadFailed(): void {
    addToast(translate('fileUploadFailed'), NotificationType.ERROR);
  }

  focus(): void {
    const input = this.renderRoot.querySelector('ss-input');
    if (input) {
      (input as HTMLElement).focus();
    }
  }

  toggleUploadModal(): void {
    this.popUpIsOpen = !this.popUpIsOpen;
  }

  render(): TemplateResult {
    return html`
      ${this.src
        ? html`<div class="preview">
            <img src=${this.src} alt=${this.alt} />
          </div>`
        : nothing}

      <div class="url-field">
        <ss-input
          type="text"
          value=${this.src}
          placeholder=${translate('imageUrl')}
          @input-changed=${this.handleSrcChanged}
        ></ss-input>

        <ss-button tabindex="-1" @click=${this.toggleUploadModal}>
          <svg-icon name="upload" size="16"></svg-icon>
        </ss-button>
      </div>

      <ss-input
        type="text"
        value=${this.alt}
        placeholder=${translate('imageAltText')}
        @input-changed=${this.handleAltChanged}
      ></ss-input>

      <pop-up
        closeButton
        ?open=${this.popUpIsOpen}
        @pop-up-closed=${(): void => {
          this.popUpIsOpen = false;
        }}
      >
        <ss-input
          type="text"
          value=${this.destImgPath}
          placeholder=${translate('imageDestPath')}
          @input-changed=${this.handleDestChanged}
        ></ss-input>

        <file-upload
          endpointUrl=${this.uploadUrl}
          authToken=${this.state.authToken}
          @file-upload-success=${this.fileUploadSuccess}
          @file-upload-failed=${this.fileUploadFailed}
        ></file-upload>
      </pop-up>
    `;
  }
}
