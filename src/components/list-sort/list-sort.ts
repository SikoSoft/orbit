import { MobxLitElement } from '@adobe/lit-mobx';
import { css, html, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import {
  ListSortCustomProperty,
  ListSortDirection,
  ListSortNativeProperty,
  ListSortProperty,
} from 'api-spec/models/List';
import { appState } from '@/state';
import { translate } from '@/lib/Localization';

import { SelectChangedEvent } from '@ss/ui/components/ss-select.events';
import { ListSortUpdatedEvent } from './list-sort.events';

import '@ss/ui/components/ss-select';

import { EntityConfig } from 'api-spec/models/Entity';
import { themed } from '@/lib/Theme';

@themed()
@customElement('list-sort')
export class ListSort extends MobxLitElement {
  static styles = css`
    .box {
      padding: 1rem;
    }
  `;

  private state = appState;

  isCustomSort(property: ListSortProperty): property is ListSortCustomProperty {
    return (
      property && (property as ListSortCustomProperty).propertyId !== undefined
    );
  }

  @state()
  get selectedProperty(): string {
    const property = this.state.listSort.property;
    if (this.isCustomSort(property)) {
      return `custom.${property.propertyId}`;
    }

    return `native.${property}`;
  }

  get availableSortProperties(): ListSortCustomProperty[] {
    return this.state.entityConfigs
      .filter(config => this.state.listFilter.includeTypes.includes(config.id))
      .reduce((acc: ListSortCustomProperty[], config: EntityConfig) => {
        const customProps = config.properties.map(prop => ({
          propertyId: prop.id,
          dataType: prop.dataType,
        }));
        return [...acc, ...customProps];
      }, [] as ListSortCustomProperty[]);
  }

  private handlePropertyChanged(e: SelectChangedEvent<string>): void {
    let property: ListSortProperty;

    if (e.detail.value.startsWith('native.')) {
      property = e.detail.value.replace(
        'native.',
        '',
      ) as ListSortNativeProperty;
    } else {
      const propertyId = parseInt(e.detail.value.replace('custom.', ''), 10);
      const propertyConfig = this.state.propertyConfigs.find(
        prop => prop.id === propertyId,
      );
      if (!propertyConfig) {
        console.warn(`Property config not found for id ${propertyId}`);
        return;
      }
      const dataType = propertyConfig.dataType;
      property = { propertyId, dataType } as ListSortCustomProperty;
    }

    const sort = {
      property,
      direction: this.state.listSort.direction,
    };
    this.state.setListSort(sort);
    this.dispatchEvent(new ListSortUpdatedEvent({ sort }));
  }

  private handleDirectionChanged(e: SelectChangedEvent<string>): void {
    const direction = e.detail.value as ListSortDirection;
    const sort = {
      property: this.state.listSort.property,
      direction,
    };
    this.state.setListSort(sort);
    this.dispatchEvent(new ListSortUpdatedEvent({ sort }));
  }

  getPropertyLabel(propertyId: number): string {
    const propertyConfig = this.state.propertyConfigs.find(
      prop => prop.id === propertyId,
    );
    return propertyConfig ? propertyConfig.name : `Property ${propertyId}`;
  }

  render(): TemplateResult {
    return html`
      <div class="box">
        <div>${translate('sortBy')}</div>

        <div>
          <ss-select
            selected=${this.selectedProperty}
            @select-changed=${(e: SelectChangedEvent<string>): void => {
              this.handlePropertyChanged(e);
            }}
            .options=${[
              ...Object.values(ListSortNativeProperty).map(type => ({
                value: `native.${type}`,
                label: translate(`sortProperty.${type}`),
              })),
              ...this.availableSortProperties.map(customProp => ({
                value: `custom.${customProp.propertyId}`,
                label: this.getPropertyLabel(customProp.propertyId),
              })),
            ]}
          >
          </ss-select>

          <ss-select
            selected=${this.state.listSort.direction}
            @select-changed=${(e: SelectChangedEvent<string>): void => {
              this.handleDirectionChanged(e);
            }}
            .options=${Object.values(ListSortDirection).map(type => ({
              value: type,
              label: translate(`sortDirection.${type}`),
            }))}
          >
          </ss-select>
        </div>
      </div>
    `;
  }
}
