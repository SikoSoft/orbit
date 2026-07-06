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

  private get filter(): ListFilterPreviewProps[ListFilterPreviewProp.LIST_FILTER] {
    return this[ListFilterPreviewProp.LIST_FILTER];
  }

  private get typePart(): string[] {
    if (!this.filter) {
      return [];
    }
    if (this.filter.includeAll) {
      return [translate('filterPreview.allItems')];
    }
    if (this.filter.includeTypes?.length) {
      const names = this.filter.includeTypes
        .map(id => this.state.entityConfigs.find(c => c.id === id)?.name ?? '')
        .filter(Boolean);
      if (names.length) {
        return [`${names.join(' & ')} ${translate('filterPreview.items')}`];
      }
    }
    return [];
  }

  private get publishedPart(): string[] {
    if (!this.filter) {
      return [];
    }
    if (this.filter.published === true) {
      return [translate('published')];
    }
    if (this.filter.published === false) {
      return [translate('unpublished')];
    }
    return [];
  }

  private get suggestedPart(): string[] {
    if (!this.filter) {
      return [];
    }
    if (this.filter.suggested === true) {
      return [translate('suggested')];
    }
    if (this.filter.suggested === false) {
      return [translate('nonSuggested')];
    }
    return [];
  }

  private get identifiedPart(): string[] {
    if (!this.filter) {
      return [];
    }
    if (this.filter.identified === true) {
      return [translate('identified')];
    }
    if (this.filter.identified === false) {
      return [translate('nonIdentified')];
    }
    return [];
  }

  private formatTagsOneOf(tags: string[]): string {
    const prefix = translate('filterPreview.tagsContain');
    if (tags.length === 1) {
      return `${prefix} ${tags[0]}`;
    }
    const last = tags[tags.length - 1];
    const rest = tags.slice(0, -1).join(', ');
    return `${prefix} ${translate('filterPreview.either')} ${rest} ${translate('filterPreview.or')} ${last}`;
  }

  private formatTagsAllOf(tags: string[]): string {
    const prefix = translate('filterPreview.tagsContain');
    if (tags.length === 1) {
      return `${prefix} ${tags[0]}`;
    }
    const last = tags[tags.length - 1];
    const rest = tags.slice(0, -1).join(', ');
    return `${prefix} ${rest} ${translate('filterPreview.and')} ${last}`;
  }

  private get taggingParts(): string[] {
    if (!this.filter) {
      return [];
    }
    const parts: string[] = [];
    const containsOneOf =
      this.filter.tagging?.[ListFilterType.CONTAINS_ONE_OF] ?? [];
    const containsAllOf =
      this.filter.tagging?.[ListFilterType.CONTAINS_ALL_OF] ?? [];
    if (containsOneOf.length) {
      parts.push(this.formatTagsOneOf(containsOneOf));
    }
    if (containsAllOf.length) {
      parts.push(this.formatTagsAllOf(containsAllOf));
    }
    return parts;
  }

  private get timePart(): string[] {
    if (!this.filter?.time) {
      return [];
    }
    if (this.filter.time.type === ListFilterTimeType.EXACT_DATE) {
      return [`${translate('filterPreview.on')} ${this.filter.time.date}`];
    }
    if (this.filter.time.type === ListFilterTimeType.RANGE) {
      return [
        `${translate('filterPreview.from')} ${this.filter.time.start} ${translate('filterPreview.to')} ${this.filter.time.end}`,
      ];
    }
    return [];
  }

  private get propertyParts(): string[] {
    if (!this.filter) {
      return [];
    }
    const parts: string[] = [];
    for (const propertyFilter of this.filter.properties ?? []) {
      if (!propertyFilter.propertyId) {
        continue;
      }
      const propertyConfig = this.state.propertyConfigs.find(
        c => c.id === propertyFilter.propertyId,
      );
      if (!propertyConfig) {
        continue;
      }
      const value = propertyFilter.value;
      if (value === null || value === undefined || value === '') {
        continue;
      }
      const operationLabel = translate(`textType.${propertyFilter.operation}`);
      const displayValue =
        typeof value === 'object' ? translate('image') : String(value);
      parts.push(`${propertyConfig.name} ${operationLabel} ${displayValue}`);
    }
    return parts;
  }

  private get summaryParts(): string[] {
    if (!this.filter) {
      return [];
    }
    return [
      ...this.typePart,
      ...this.publishedPart,
      ...this.suggestedPart,
      ...this.identifiedPart,
      ...this.taggingParts,
      ...this.timePart,
      ...this.propertyParts,
    ];
  }

  render(): TemplateResult {
    const parts = this.summaryParts;
    const summary = parts.length
      ? parts.join(', ')
      : translate('filterPreview.noFilter');

    return html`<span class="list-filter-preview">${summary}</span>`;
  }
}
