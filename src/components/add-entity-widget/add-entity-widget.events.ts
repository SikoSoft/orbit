export const assistEntityAddedEventName = 'assist-entity-added';

export type AssistEntityAddedPayload = Record<string, never>;

export class AssistEntityAddedEvent extends CustomEvent<AssistEntityAddedPayload> {
  constructor(detail: AssistEntityAddedPayload) {
    super(assistEntityAddedEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}
