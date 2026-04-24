import { FilterProperty } from 'api-spec/models/List';

export const filterPropertyUpdatedEventName = 'filter-property-updated';

export interface FilterPropertyUpdatedEventPayload {
  index: number;
  filter: FilterProperty;
}

export class FilterPropertyUpdatedEvent extends CustomEvent<FilterPropertyUpdatedEventPayload> {
  constructor(payload: FilterPropertyUpdatedEventPayload) {
    super(filterPropertyUpdatedEventName, {
      bubbles: false,
      composed: false,
      detail: payload,
    });
  }
}

export const filterPropertyRemovedEventName = 'filter-property-removed';

export interface FilterPropertyRemovedEventPayload {
  index: number;
}

export class FilterPropertyRemovedEvent extends CustomEvent<FilterPropertyRemovedEventPayload> {
  constructor(payload: FilterPropertyRemovedEventPayload) {
    super(filterPropertyRemovedEventName, {
      bubbles: false,
      composed: false,
      detail: payload,
    });
  }
}
