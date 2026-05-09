import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

import {
  OptionSelectorProp,
  optionSelectorProps,
  OptionSelectorProps,
  SelectOption,
} from './option-selector.models';
import { OptionSelectorChangedEvent } from './option-selector.events';
import { themed } from '@/lib/Theme';

@themed()
@customElement('option-selector')
export class OptionSelector extends LitElement {
  static styles = css`
    .options {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .option {
      cursor: pointer;
      padding: 0.4rem 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      background: transparent;
      color: inherit;
      font: inherit;
      text-align: left;
      user-select: none;
      transition:
        background 0.15s,
        color 0.15s;
    }

    .option.selected {
      background: var(--primary-color, #3b82f6);
      color: var(--primary-text-color, #fff);
      border-color: var(--primary-color, #3b82f6);
    }

    .option:not(.selected):hover {
      background: var(--hover-bg, rgba(0, 0, 0, 0.06));
    }
  `;

  @property({ type: Array })
  [OptionSelectorProp.OPTIONS]: OptionSelectorProps[OptionSelectorProp.OPTIONS] =
    optionSelectorProps[OptionSelectorProp.OPTIONS].default;

  @property({ type: Boolean })
  [OptionSelectorProp.MULTIPLE]: OptionSelectorProps[OptionSelectorProp.MULTIPLE] =
    optionSelectorProps[OptionSelectorProp.MULTIPLE].default;

  @property({ type: Boolean })
  [OptionSelectorProp.REQUIRED]: OptionSelectorProps[OptionSelectorProp.REQUIRED] =
    optionSelectorProps[OptionSelectorProp.REQUIRED].default;

  @property({ type: Array })
  [OptionSelectorProp.SELECTED]: OptionSelectorProps[OptionSelectorProp.SELECTED] =
    optionSelectorProps[OptionSelectorProp.SELECTED].default;

  private handleOptionClick(option: SelectOption): void {
    const isSelected = this.selected.includes(option.value);
    let next: string[];

    if (this.multiple) {
      if (isSelected) {
        if (this.required && this.selected.length <= 1) {
          return;
        }
        next = this.selected.filter(v => v !== option.value);
      } else {
        next = [...this.selected, option.value];
      }
    } else {
      if (isSelected) {
        if (this.required) {
          return;
        }
        next = [];
      } else {
        next = [option.value];
      }
    }

    this.selected = next;
    this.dispatchEvent(new OptionSelectorChangedEvent({ selected: this.selected }));
  }

  render(): TemplateResult {
    return html`
      <div class="options">
        ${repeat(
          this.options,
          option => option.value,
          option => html`
            <button
              class=${classMap({
                option: true,
                selected: this.selected.includes(option.value),
              })}
              @click=${(): void => this.handleOptionClick(option)}
            >
              ${option.name}
            </button>
          `,
        )}
      </div>
    `;
  }
}
