import { html, css, TemplateResult, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { ListFilter } from 'api-spec/models/List';
import {
  ListFilterControlProp,
  listFilterControlProps,
  ListFilterControlProps,
} from './list-filter-control.models';

import { translate } from '@/lib/Localization';
import { ListFilterUpdatedEvent } from '@/components/list-filter/list-filter.events';
import { themed } from '@/lib/Theme';

import '@ss/ui/components/ss-button';
import '@ss/ui/components/pop-up';
import '@/components/list-filter/list-filter';
import '@/components/list-filter-preview/list-filter-preview';

@themed()
@customElement('list-filter-control')
export class ListFilterControl extends MobxLitElement {
  static styles = css`
    .list-filter-control {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
  `;

  @property({ type: Object })
  [ListFilterControlProp.LIST_FILTER]: ListFilterControlProps[ListFilterControlProp.LIST_FILTER] =
    listFilterControlProps[ListFilterControlProp.LIST_FILTER].default;

  @property({ type: Boolean })
  [ListFilterControlProp.SHOW_ALL]: ListFilterControlProps[ListFilterControlProp.SHOW_ALL] =
    listFilterControlProps[ListFilterControlProp.SHOW_ALL].default;

  @property({ type: Boolean })
  [ListFilterControlProp.SHOW_TYPES]: ListFilterControlProps[ListFilterControlProp.SHOW_TYPES] =
    listFilterControlProps[ListFilterControlProp.SHOW_TYPES].default;

  @property({ type: Boolean })
  [ListFilterControlProp.SHOW_PROPERTIES]: ListFilterControlProps[ListFilterControlProp.SHOW_PROPERTIES] =
    listFilterControlProps[ListFilterControlProp.SHOW_PROPERTIES].default;

  @property({ type: Boolean })
  [ListFilterControlProp.SHOW_PUBLISHED]: ListFilterControlProps[ListFilterControlProp.SHOW_PUBLISHED] =
    listFilterControlProps[ListFilterControlProp.SHOW_PUBLISHED].default;

  @property({ type: Boolean })
  [ListFilterControlProp.SHOW_SUGGESTED]: ListFilterControlProps[ListFilterControlProp.SHOW_SUGGESTED] =
    listFilterControlProps[ListFilterControlProp.SHOW_SUGGESTED].default;

  @property({ type: Boolean })
  [ListFilterControlProp.SHOW_IDENTIFIED]: ListFilterControlProps[ListFilterControlProp.SHOW_IDENTIFIED] =
    listFilterControlProps[ListFilterControlProp.SHOW_IDENTIFIED].default;

  @property({ type: Boolean })
  [ListFilterControlProp.SHOW_TAGGING]: ListFilterControlProps[ListFilterControlProp.SHOW_TAGGING] =
    listFilterControlProps[ListFilterControlProp.SHOW_TAGGING].default;

  @property({ type: Boolean })
  [ListFilterControlProp.SHOW_TIME]: ListFilterControlProps[ListFilterControlProp.SHOW_TIME] =
    listFilterControlProps[ListFilterControlProp.SHOW_TIME].default;

  @state() private isOpen: boolean = false;
  @state() private currentFilter: ListFilter | undefined;

  connectedCallback(): void {
    super.connectedCallback();
    this.currentFilter = this[ListFilterControlProp.LIST_FILTER];
  }

  updated(changedProperties: PropertyValues): void {
    if (changedProperties.has(ListFilterControlProp.LIST_FILTER)) {
      this.currentFilter = this[ListFilterControlProp.LIST_FILTER];
    }
  }

  private handleOpenClick(): void {
    this.isOpen = true;
  }

  private handlePopUpClosed(): void {
    this.isOpen = false;
  }

  private handleFilterUpdated(e: ListFilterUpdatedEvent): void {
    this.currentFilter = e.detail;
    this.isOpen = false;
  }

  render(): TemplateResult {
    return html`
      <div class="list-filter-control">
        <ss-button
          @click=${this.handleOpenClick}
          text=${translate('listFilter')}
        ></ss-button>
        <list-filter-preview
          .listFilter=${this.currentFilter}
        ></list-filter-preview>
      </div>
      <pop-up
        ?open=${this.isOpen}
        closeButton
        closeOnOutsideClick
        closeOnEsc
        @pop-up-closed=${this.handlePopUpClosed}
      >
        <list-filter
          ?showAll=${this[ListFilterControlProp.SHOW_ALL]}
          ?showTypes=${this[ListFilterControlProp.SHOW_TYPES]}
          ?showProperties=${this[ListFilterControlProp.SHOW_PROPERTIES]}
          ?showPublished=${this[ListFilterControlProp.SHOW_PUBLISHED]}
          ?showSuggested=${this[ListFilterControlProp.SHOW_SUGGESTED]}
          ?showIdentified=${this[ListFilterControlProp.SHOW_IDENTIFIED]}
          ?showTagging=${this[ListFilterControlProp.SHOW_TAGGING]}
          ?showTime=${this[ListFilterControlProp.SHOW_TIME]}
          .listFilter=${this.currentFilter}
          @list-filter-updated=${this.handleFilterUpdated}
        ></list-filter>
      </pop-up>
    `;
  }
}
