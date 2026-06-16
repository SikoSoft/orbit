import { FactContext } from 'api-spec/models/Fact';

export const factContextChangedEventName = 'fact-context-changed';

export interface FactContextChangedPayload {
  context: FactContext;
}

export class FactContextChangedEvent extends CustomEvent<FactContextChangedPayload> {
  constructor(detail: FactContextChangedPayload) {
    super(factContextChangedEventName, { detail, bubbles: true, composed: true });
  }
}
