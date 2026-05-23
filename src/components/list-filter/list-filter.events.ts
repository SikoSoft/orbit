import { ListFilter as ListFilterModel } from 'api-spec/models/List';

export interface ExtendedListFilter extends ListFilterModel {
  published?: boolean;
  suggestion?: boolean;
}

export const listFilterUpdatedEventName = 'list-filter-updated';

export type ListFilterUpdatedEventPayload = ExtendedListFilter;

export class ListFilterUpdatedEvent extends CustomEvent<ListFilterUpdatedEventPayload> {
  constructor(payload: ListFilterUpdatedEventPayload) {
    super(listFilterUpdatedEventName, {
      bubbles: true,
      composed: true,
      detail: payload,
    });
  }
}
