import { FilterProperty } from 'api-spec/models/List';

export const filterPropertiesUpdatedEventName = 'filter-properties-updated';

export interface FilterPropertiesUpdatedEventPayload {
  filters: FilterProperty[];
}

export class FilterPropertiesUpdatedEvent extends CustomEvent<FilterPropertiesUpdatedEventPayload> {
  constructor(payload: FilterPropertiesUpdatedEventPayload) {
    super(filterPropertiesUpdatedEventName, {
      bubbles: false,
      composed: false,
      detail: payload,
    });
  }
}
