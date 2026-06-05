import { html, css, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { ListFilterTimeType, ListFilterType } from 'api-spec/models/List';
import {
  ListFilterPreviewProp,
  listFilterPreviewProps,
  ListFilterPreviewProps,
} from './list-filter-preview.models';

import { translate } from '@/lib/Localization';
import { appState } from '@/state';
import { themed } from '@/lib/Theme';

@themed()
@customElement('list-filter-preview')
export class ListFilterPreview extends MobxLitElement {
  public state = appState;

  static styles = css`
    .list-filter-preview {
      font-style: italic;
      opacity: 0.75;
      font-size: 0.875rem;
    }
  `;

  @property({ type: Object })
  [ListFilterPreviewProp.LIST_FILTER]: ListFilterPreviewProps[ListFilterPreviewProp.LIST_FILTER] =
    listFilterPreviewProps[ListFilterPreviewProp.LIST_FILTER].default;

  private get summaryParts(): string[] {
    const filter = this[ListFilterPreviewProp.LIST_FILTER];
    if (!filter) {
      return [];
    }

    const parts: string[] = [];

    if (filter.includeAll) {
      parts.push(translate('filterPreview.allItems'));
    } else if (filter.includeTypes?.length) {
      const names = filter.includeTypes
        .map(id => this.state.entityConfigs.find(c => c.id === id)?.name ?? '')
        .filter(Boolean);
      if (names.length) {
        parts.push(`${names.join(' & ')} ${translate('filterPreview.items')}`);
      }
    }

    if (filter.published === true) {
      parts.push(translate('published'));
    } else if (filter.published === false) {
      parts.push(translate('unpublished'));
    } else {
      parts.push(translate('filterPreview.publishedOrUnpublished'));
    }

    if (filter.suggested === true) {
      parts.push(translate('suggested'));
    } else if (filter.suggested === false) {
      parts.push(translate('nonSuggested'));
    }

    if (filter.identified === true) {
      parts.push(translate('identified'));
    } else if (filter.identified === false) {
      parts.push(translate('nonIdentified'));
    }

    const containsOneOf =
      filter.tagging?.[ListFilterType.CONTAINS_ONE_OF] ?? [];
    const containsAllOf =
      filter.tagging?.[ListFilterType.CONTAINS_ALL_OF] ?? [];

    if (containsOneOf.length) {
      parts.push(
        `${translate('filterType.containsOneOf')}: ${containsOneOf.join(', ')}`,
      );
    }

    if (containsAllOf.length) {
      parts.push(
        `${translate('filterType.containsAllOf')}: ${containsAllOf.join(', ')}`,
      );
    }

    if (filter.time) {
      if (filter.time.type === ListFilterTimeType.EXACT_DATE) {
        parts.push(`${translate('filterPreview.on')} ${filter.time.date}`);
      } else if (filter.time.type === ListFilterTimeType.RANGE) {
        parts.push(
          `${translate('filterPreview.from')} ${filter.time.start} ${translate('filterPreview.to')} ${filter.time.end}`,
        );
      }
    }

    return parts;
  }

  render(): TemplateResult {
    const parts = this.summaryParts;
    const summary = parts.length
      ? parts.join(', ')
      : translate('filterPreview.noFilter');

    return html`<span class="list-filter-preview">${summary}</span>`;
  }
}
