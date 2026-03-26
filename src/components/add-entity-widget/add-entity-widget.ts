import { css, html, TemplateResult } from 'lit';
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
  `;

  private handleTriggerClick(): void {
    const input =
      this.renderRoot.querySelector<HTMLInputElement>('input[type="file"]');
    input?.click();
  }

  private async handleFileSelected(e: Event): Promise<void> {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    this.uploading = true;
    try {
      // TODO: replace with real endpoint once API is defined
      // Do not set Content-Type — browser must set multipart/form-data with boundary automatically
      await api.httpRequest('assist/entity', {
        method: 'post',
        body: formData,
      });
    } finally {
      this.uploading = false;
      input.value = '';
    }
  }

  render(): TemplateResult {
    return html`
      <input type="file" accept="image/*" @change=${this.handleFileSelected} />

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
