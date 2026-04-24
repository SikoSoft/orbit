import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { FilterProperty } from 'api-spec/models/List';
import { translate } from '@/lib/Localization';

import {
  FilterPropertiesProp,
  FilterPropertiesProps,
  filterPropertiesProps,
} from './filter-properties.models';
import { FilterPropertiesUpdatedEvent } from './filter-properties.events';
import {
  FilterPropertyRemovedEvent,
  FilterPropertyUpdatedEvent,
} from './filter-property/filter-property.events';

import '@ss/ui/components/ss-button';
import '@/components/list-filter/filter-properties/filter-property/filter-property';
import { themed } from '@/lib/Theme';

@themed()
@customElement('filter-properties')
export class FilterProperties extends LitElement {
  static styles = css`
    fieldset {
      border-color: var(--border-color);
    }

    .property-filters {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
  `;

  @property({ type: Array })
  [FilterPropertiesProp.FILTERS]: FilterPropertiesProps[FilterPropertiesProp.FILTERS] =
    filterPropertiesProps[FilterPropertiesProp.FILTERS].default;

  @property({ type: Array })
  [FilterPropertiesProp.INCLUDE_TYPES]: FilterPropertiesProps[FilterPropertiesProp.INCLUDE_TYPES] =
    filterPropertiesProps[FilterPropertiesProp.INCLUDE_TYPES].default;

  private handleFilterUpdated(e: FilterPropertyUpdatedEvent): void {
    const { index, filter } = e.detail;
    const filters = this.filters.map((f, i) => (i === index ? filter : f));
    this.dispatchEvent(new FilterPropertiesUpdatedEvent({ filters }));
  }

  private handleFilterRemoved(e: FilterPropertyRemovedEvent): void {
    const { index } = e.detail;
    const filters = this.filters.filter((_, i) => i !== index);
    this.dispatchEvent(new FilterPropertiesUpdatedEvent({ filters }));
  }

  private handleAddFilter(): void {
    const filters: FilterProperty[] = [
      ...this.filters,
      { propertyId: 0, value: '' },
    ];
    this.dispatchEvent(new FilterPropertiesUpdatedEvent({ filters }));
  }

  render(): TemplateResult {
    return html`
      <fieldset>
        <legend>${translate('propertyFilters')}</legend>

        <div class="property-filters">
          ${repeat(
            this.filters,
            (filter, index) => `${filter.propertyId}/${index}`,
            (filter, index) => html`
              <filter-property
                .includeTypes=${this.includeTypes}
                index=${index}
                propertyConfigId=${filter.propertyId}
                .value=${filter.value}
                @filter-property-updated=${(
                  e: FilterPropertyUpdatedEvent,
                ): void => {
                  this.handleFilterUpdated(e);
                }}
                @filter-property-removed=${(
                  e: FilterPropertyRemovedEvent,
                ): void => {
                  this.handleFilterRemoved(e);
                }}
              ></filter-property>
            `,
          )}
        </div>

        <ss-button
          text=${translate('addPropertyFilter')}
          @click=${this.handleAddFilter}
        ></ss-button>
      </fieldset>
    `;
  }
}
