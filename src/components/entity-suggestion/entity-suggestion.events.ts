export const entitySuggestionAddedEventName = 'entity-suggestion-added';

export class EntitySuggestionAddedEvent extends CustomEvent<{ id: number }> {
  constructor(detail: { id: number }) {
    super(entitySuggestionAddedEventName, {
      bubbles: true,
      composed: true,
      detail,
    });
  }
}
