import { ListFilter } from 'api-spec/models/List';

export const listFilterUpdatedEventName = 'list-filter-updated';

export type ListFilterUpdatedEventPayload = ListFilter;

export class ListFilterUpdatedEvent extends CustomEvent<ListFilterUpdatedEventPayload> {
  constructor(payload: ListFilterUpdatedEventPayload) {
    super(listFilterUpdatedEventName, {
      bubbles: true,
      composed: true,
      detail: payload,
    });
  }
}
