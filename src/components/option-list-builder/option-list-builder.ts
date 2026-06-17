import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { classMap } from 'lit/directives/class-map.js';

import '@ss/ui/components/sortable-list';
import '@ss/ui/components/sortable-item';
import '@ss/ui/components/ss-icon';
import { SortUpdatedEvent } from '@ss/ui/components/sortable-list.events';

import {
  OptionListBuilderItem,
  OptionListBuilderProp,
  optionListBuilderProps,
  OptionListBuilderProps,
} from './option-list-builder.models';
import { OptionListUpdatedEvent } from './option-list-builder.events';

@customElement('option-list-builder')
export class OptionListBuilder extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    ul {
      list-style: none;
      padding: 0;
    }

    ul li {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.25rem 0;
    }

    ul li.active {
      opacity: 0.5;
      pointer-events: none;
    }

    ul li.active ss-icon {
      display: none;
    }

    ss-icon {
      cursor: pointer;
    }

    .empty {
      font-style: italic;
    }
  `;

  @property({ type: Array })
  [OptionListBuilderProp.AVAILABLE]: OptionListBuilderProps[OptionListBuilderProp.AVAILABLE] =
    optionListBuilderProps[OptionListBuilderProp.AVAILABLE].default;

  @property({ type: Array })
  [OptionListBuilderProp.SELECTED]: OptionListBuilderProps[OptionListBuilderProp.SELECTED] =
    optionListBuilderProps[OptionListBuilderProp.SELECTED].default;

  @property({ type: String })
  [OptionListBuilderProp.EMPTY_MESSAGE]: OptionListBuilderProps[OptionListBuilderProp.EMPTY_MESSAGE] =
    optionListBuilderProps[OptionListBuilderProp.EMPTY_MESSAGE].default;

  private get selectedItems(): OptionListBuilderItem[] {
    return this[OptionListBuilderProp.SELECTED]
      .map(id =>
        this[OptionListBuilderProp.AVAILABLE].find(item => item.id === id),
      )
      .filter((item): item is OptionListBuilderItem => item !== undefined);
  }

  private addOption(id: string): void {
    this.dispatchEvent(
      new OptionListUpdatedEvent({
        selected: [...this[OptionListBuilderProp.SELECTED], id],
      }),
    );
  }

  private removeOption(id: string): void {
    this.dispatchEvent(
      new OptionListUpdatedEvent({
        selected: this[OptionListBuilderProp.SELECTED].filter(
          selectedId => selectedId !== id,
        ),
      }),
    );
  }

  private handleSortUpdated(e: SortUpdatedEvent): void {
    this.dispatchEvent(
      new OptionListUpdatedEvent({
        selected: e.detail.sortedIds,
      }),
    );
  }

  render(): TemplateResult {
    return html`
      <slot name="available-heading"></slot>
      <ul class="available">
        ${repeat(
          this[OptionListBuilderProp.AVAILABLE],
          item => item.id,
          item =>
            html`<li
              class=${classMap({
                active: this[OptionListBuilderProp.SELECTED].includes(
                  item.id,
                ),
              })}
            >
              <span>${item.label}</span>
              <ss-icon
                name="add"
                size="16"
                @click=${(): void => this.addOption(item.id)}
              ></ss-icon>
            </li>`,
        )}
      </ul>

      <slot name="selected-heading"></slot>
      ${this.selectedItems.length > 0
        ? html`
            <sortable-list @sort-updated=${this.handleSortUpdated}>
              ${this.selectedItems.map(
                item =>
                  html`<sortable-item id=${item.id}>
                    <span>${item.label}</span>
                    <ss-icon
                      name="trash"
                      size="16"
                      @click=${(): void => this.removeOption(item.id)}
                    ></ss-icon>
                  </sortable-item>`,
              )}
            </sortable-list>
          `
        : html`<p class="empty">
            ${this[OptionListBuilderProp.EMPTY_MESSAGE]}
          </p>`}
    `;
  }
}
