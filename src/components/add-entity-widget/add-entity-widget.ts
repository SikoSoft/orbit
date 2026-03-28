import { css, html, nothing, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { appState } from '@/state';
import { api } from '@/lib/Api';
import { themed } from '@/lib/Theme';

@themed()
@customElement('add-entity-widget')
export class AddEntityWidget extends MobxLitElement {
  private state = appState;

  @state() private uploading = false;
  @state() private hasCamera = false;
  @state() private showMenu = false;

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

    .trigger {
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
      await api.httpRequest('assist/entity', {
        method: 'post',
        body: formData,
      });
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

      ${this.showMenu
        ? html`
            <div class="backdrop" @click=${() => (this.showMenu = false)}></div>
            <div class="menu">
              <button
                class="menu-item"
                @click=${() => this.openFilePicker('camera')}
              >
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                  ></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
                Camera
              </button>
              <button
                class="menu-item"
                @click=${() => this.openFilePicker('storage')}
              >
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                  ></path>
                </svg>
                Storage
              </button>
            </div>
          `
        : nothing}

      <button
        class="trigger"
        title="Upload image"
        ?disabled=${this.uploading}
        @click=${this.handleTriggerClick}
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
    `;
  }
}
