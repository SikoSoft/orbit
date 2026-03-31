import { css, html, nothing, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { translate } from '@/lib/Localization';
import { themed } from '@/lib/Theme';
import { StorageItemKey, StorageSource } from '@/models/Storage';
import { storage } from '@/lib/Storage';

@themed()
@customElement('storage-source-prompt')
export class StorageSourcePrompt extends MobxLitElement {
  @state() private visible = false;

  static styles = css`
    .prompt {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2rem;
      background-color: var(--background-color);
      padding: 2rem;
    }

    .heading {
      text-align: center;
    }

    .heading h1 {
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .heading p {
      margin: 0;
      font-size: 0.9375rem;
      color: var(--text-secondary-color, var(--text-color));
      opacity: 0.7;
    }

    .options {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      justify-content: center;
    }

    .option {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      width: 10rem;
      padding: 1.75rem 1.25rem;
      border-radius: 1rem;
      border: 1px solid var(--box-border-color);
      background-color: var(--box-background-color);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      transition:
        transform 0.15s,
        box-shadow 0.15s,
        border-color 0.15s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        border-color: var(--text-color);
      }

      &:active {
        transform: translateY(0);
      }
    }

    .option svg {
      width: 2.5rem;
      height: 2.5rem;
      stroke: var(--text-color);
      fill: none;
      stroke-width: 1.5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .option-label {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .option-description {
      font-size: 0.8125rem;
      color: var(--text-color);
      opacity: 0.6;
      text-align: center;
      line-height: 1.4;
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.visible = !storage.getStorageSource();
  }

  private select(source: StorageSource): void {
    storage.setStorageSource(source);
    this.visible = false;
  }

  render(): TemplateResult | typeof nothing {
    if (!this.visible) {
      return nothing;
    }

    return html`
      <div class="prompt">
        <div class="heading">
          <h1>${translate('storageSourcePrompt.heading')}</h1>
          <p>${translate('storageSourcePrompt.subheading')}</p>
        </div>

        <div class="options">
          <button
            class="option"
            @click=${(): void => this.select(StorageSource.DEVICE)}
          >
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            <span class="option-label"
              >${translate('storageSourcePrompt.device')}</span
            >
            <span class="option-description"
              >${translate('storageSourcePrompt.deviceDescription')}</span
            >
          </button>

          <button
            class="option"
            @click=${(): void => this.select(StorageSource.CLOUD)}
          >
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
            </svg>
            <span class="option-label"
              >${translate('storageSourcePrompt.cloud')}</span
            >
            <span class="option-description"
              >${translate('storageSourcePrompt.cloudDescription')}</span
            >
          </button>
        </div>
      </div>
    `;
  }
}
