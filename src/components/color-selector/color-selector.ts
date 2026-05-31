import { html, css, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { MobxLitElement } from '@adobe/lit-mobx';
import { themed } from '@/lib/Theme';

import {
  ColorSelectorProp,
  colorSelectorProps,
  ColorSelectorProps,
  CURATED_COLORS,
} from './color-selector.models';
import { ColorChangedEvent } from './color-selector.events';

@themed()
@customElement('color-selector')
export class ColorSelector extends MobxLitElement {
  static styles = css`
    :host {
      display: block;
      position: relative;
    }

    .trigger {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      padding: 0.4rem 0.75rem;
      border: 1px solid var(--border-color, #ccc);
      border-radius: 4px;
      background: var(--input-bg, #fff);
      width: fit-content;
    }

    .swatch {
      width: 20px;
      height: 20px;
      border-radius: 3px;
      border: 1px solid rgba(0, 0, 0, 0.15);
      flex-shrink: 0;
    }

    .swatch--empty {
      background: repeating-linear-gradient(
        45deg,
        #ccc,
        #ccc 2px,
        #fff 2px,
        #fff 8px
      );
    }

    .dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      z-index: 100;
      background: var(--surface-bg, #fff);
      border: 1px solid var(--border-color, #ccc);
      border-radius: 6px;
      padding: 0.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 0.4rem;
    }

    .color-option {
      width: 28px;
      height: 28px;
      border-radius: 4px;
      border: 2px solid transparent;
      cursor: pointer;
      transition: transform 0.1s, border-color 0.1s;
    }

    .color-option:hover {
      transform: scale(1.15);
    }

    .color-option--selected {
      border-color: var(--text-color, #333);
    }
  `;

  @property({ type: String })
  [ColorSelectorProp.VALUE]: ColorSelectorProps[ColorSelectorProp.VALUE] =
    colorSelectorProps[ColorSelectorProp.VALUE].default;

  @state()
  private isOpen: boolean = false;

  private handleTriggerClick(): void {
    this.isOpen = !this.isOpen;
  }

  private handleColorClick(color: string): void {
    this.isOpen = false;
    this.dispatchEvent(new ColorChangedEvent({ value: color }));
  }

  private handleOutsideClick = (e: MouseEvent): void => {
    if (!e.composedPath().includes(this)) {
      this.isOpen = false;
    }
  };

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('click', this.handleOutsideClick);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this.handleOutsideClick);
  }

  render(): TemplateResult {
    const selectedColor = this[ColorSelectorProp.VALUE];

    return html`
      <div class="trigger" @click=${this.handleTriggerClick}>
        <div
          class="swatch ${selectedColor ? '' : 'swatch--empty'}"
          style=${selectedColor ? `background:${selectedColor}` : ''}
        ></div>
        <span>${selectedColor || '—'}</span>
      </div>

      ${this.isOpen
        ? html`
            <div class="dropdown">
              ${repeat(
                CURATED_COLORS,
                color => color,
                color => html`
                  <div
                    class="color-option ${selectedColor === color ? 'color-option--selected' : ''}"
                    style="background:${color}"
                    title=${color}
                    @click=${(): void => this.handleColorClick(color)}
                  ></div>
                `,
              )}
            </div>
          `
        : ''}
    `;
  }
}
