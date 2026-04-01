import { css, html, nothing, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { MobxLitElement } from '@adobe/lit-mobx';
import { ListConfig } from 'api-spec/lib/ListConfig';
import { appState } from '@/state';
import { api } from '@/lib/Api';
import { themed } from '@/lib/Theme';
import { translate } from '@/lib/Localization';
import { ToggleChangedEvent } from '@ss/ui/components/ss-toggle.events';
import { AssistResponse } from './add-entity-widget.models';
import '@ss/ui/components/pop-up';
import '@ss/ui/components/ss-toggle';
import { storage } from '@/lib/Storage';

@themed()
@customElement('add-entity-widget')
export class AddEntityWidget extends MobxLitElement {
  private state = appState;

  @state() private uploading = false;
  @state() private hasCamera = false;
  @state() private showMenu = false;
  @state() private expanded = false;
  @state() private showOptions = false;

  private longPressTimer: ReturnType<typeof setTimeout> | null = null;

  static styles = css`
    :host {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 500;
    }

    input[type='file'] {
      display: none;
    }

    /*
     * .widget wraps the trigger and the tray. It sizes to the trigger (3.5rem
     * square). The tray is absolutely positioned behind the trigger and slides
     * down on hover / long-press so its bottom half becomes visible.
     */
    .widget {
      position: relative;
      display: inline-block;
    }

    /*
     * The tray is a full circle the same size as the trigger. It starts
     * behind the trigger but invisible (opacity: 0). On expansion it slides
     * up 1.75rem (half its height) so the top half peeks out above the
     * trigger. The button is positioned at the top of the tray so it lands
     * in the visible portion after the slide.
     */
    .tray {
      position: absolute;
      top: 0;
      left: 0;
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 50%;
      background-color: var(--box-background-color);
      border: 1px solid var(--box-border-color);
      z-index: 0;
      opacity: 0;
      pointer-events: none;
      transform: translateY(0);
      transition:
        transform 0.2s ease,
        opacity 0.2s ease;
      overflow: hidden;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 0.3rem;
    }

    .widget.expanded .tray {
      transform: translateY(-1.75rem);
      opacity: 1;
      pointer-events: auto;
    }

    .trigger {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 50%;
      background-color: var(--box-background-color);
      border: 1px solid var(--box-border-color);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      cursor: pointer;
      transition:
        transform 0.15s,
        box-shadow 0.15s;

      &:hover {
        transform: scale(1.08);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      }

      &:active {
        transform: scale(0.96);
      }

      svg {
        width: 1.5rem;
        height: 1.5rem;
        stroke: var(--text-color);
        fill: none;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      &[disabled] {
        cursor: default;
        pointer-events: none;
        opacity: 0.7;

        &:hover {
          transform: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
      }
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .spinner {
      width: 1.5rem;
      height: 1.5rem;
      animation: spin 0.8s linear infinite;

      circle {
        fill: none;
        stroke: var(--text-color);
        stroke-width: 2;
        stroke-linecap: round;
        stroke-dasharray: 40;
        stroke-dashoffset: 12;
      }
    }

    .backdrop {
      position: fixed;
      inset: 0;
      z-index: -1;
    }

    .menu {
      position: absolute;
      bottom: calc(100% + 0.75rem);
      right: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      background-color: var(--box-background-color);
      border: 1px solid var(--box-border-color);
      border-radius: 0.75rem;
      padding: 0.5rem;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      z-index: 2;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.5rem 0.75rem;
      border-radius: 0.5rem;
      border: none;
      background: none;
      color: var(--text-color);
      font-size: 0.875rem;
      white-space: nowrap;
      cursor: pointer;
      transition: background-color 0.1s;

      &:hover {
        background-color: var(--box-border-color);
      }

      svg {
        width: 1.25rem;
        height: 1.25rem;
        stroke: var(--text-color);
        fill: none;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
        flex-shrink: 0;
      }
    }

    .options-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
      border: none;
      background: none;
      cursor: pointer;
      padding: 0;

      svg {
        width: 1rem;
        height: 1rem;
        stroke: var(--text-color);
        fill: none;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      &:hover {
        background-color: var(--box-border-color);
      }
    }

    .options-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.25rem 0;
      font-size: 0.875rem;
      color: var(--text-color);
    }

    .options-row ss-toggle {
      transform: scale(0.5);
      transform-origin: right center;
      flex-shrink: 0;
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.detectCamera();
  }

  private async detectCamera(): Promise<void> {
    if (
      !navigator.mediaDevices?.enumerateDevices ||
      navigator.maxTouchPoints < 1
    ) {
      return;
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    this.hasCamera = devices.some(d => d.kind === 'videoinput');
  }

  private handleMouseEnter(): void {
    this.expanded = true;
  }

  private handleMouseLeave(): void {
    this.expanded = false;
  }

  private handleTouchStart(): void {
    this.longPressTimer = setTimeout(() => {
      this.expanded = true;
    }, 500);
  }

  private handleTouchEnd(): void {
    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private handleTriggerClick(): void {
    if (this.hasCamera) {
      this.showMenu = !this.showMenu;
    } else {
      this.openFilePicker('storage');
    }
  }

  private openFilePicker(source: 'camera' | 'storage'): void {
    this.showMenu = false;
    const input = this.renderRoot.querySelector<HTMLInputElement>(
      `input[data-source="${source}"]`,
    );
    input?.click();
  }

  private handleOptionsClick(e: Event): void {
    e.stopPropagation();
    this.showOptions = true;
  }

  private handlePopUpClosed(): void {
    this.showOptions = false;
  }

  private handleIncludeImageChanged(e: ToggleChangedEvent): void {
    this.state.setAssistSaveImage(e.detail.on);
    storage.setAssistSaveImage(e.detail.on);
  }

  private async handleFileSelected(e: Event): Promise<void> {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    this.uploading = true;
    try {
      const result = await api.httpRequest<AssistResponse>('assist/entity', {
        method: 'post',
        body: formData,
      });

      if (result && result.isOk) {
        const { entity } = result.response;

        for (const listConfig of this.state.listConfigs) {
          if (ListConfig.entitySatisfiesFilter(entity, listConfig.filter)) {
            this.state.setListConfigId(listConfig.id);
            break;
          }
        }
        this.state.setListItems([entity, ...this.state.listItems]);
      }
    } finally {
      this.uploading = false;
      input.value = '';
    }
  }

  render(): TemplateResult | typeof nothing {
    if (!this.state.debugMode) {
      return nothing;
    }

    return html`
      <input
        type="file"
        accept="image/*"
        data-source="storage"
        @change=${this.handleFileSelected}
      />
      <input
        type="file"
        accept="image/*"
        capture="environment"
        data-source="camera"
        @change=${this.handleFileSelected}
      />

      <div
        class=${classMap({ widget: true, expanded: this.expanded })}
        @mouseenter=${this.handleMouseEnter}
        @mouseleave=${this.handleMouseLeave}
        @touchstart=${this.handleTouchStart}
        @touchend=${this.handleTouchEnd}
        @touchcancel=${this.handleTouchEnd}
      >
        <div class="tray">
          <button
            class="options-btn"
            title=${translate('addEntityWidget.options')}
            @click=${this.handleOptionsClick}
          >
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="3"></circle>
              <path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
              ></path>
            </svg>
          </button>
        </div>

        ${this.showMenu
          ? html`
              <div
                class="backdrop"
                @click=${(): boolean => (this.showMenu = false)}
              ></div>
              <div class="menu">
                <button
                  class="menu-item"
                  @click=${(): void => this.openFilePicker('camera')}
                >
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                    ></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                  ${translate('addEntityWidget.camera')}
                </button>
                <button
                  class="menu-item"
                  @click=${(): void => this.openFilePicker('storage')}
                >
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                    ></path>
                  </svg>
                  ${translate('addEntityWidget.storage')}
                </button>
              </div>
            `
          : nothing}

        <button
          class="trigger"
          title=${translate('addEntityWidget.uploadImage')}
          ?disabled=${this.uploading}
          @click=${(): void => this.handleTriggerClick()}
        >
          ${this.uploading
            ? html`<svg
                class="spinner"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10"></circle>
              </svg>`
            : html`<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>`}
        </button>
      </div>

      <pop-up
        ?open=${this.showOptions}
        closeButton
        closeOnOutsideClick
        closeOnEsc
        @pop-up-closed=${this.handlePopUpClosed}
      >
        <div class="options-row">
          <span>${translate('addEntityWidget.includeImage')}</span>
          <ss-toggle
            ?on=${this.state.assistSaveImage}
            @toggle-changed=${this.handleIncludeImageChanged}
          ></ss-toggle>
        </div>
      </pop-up>
    `;
  }
}
