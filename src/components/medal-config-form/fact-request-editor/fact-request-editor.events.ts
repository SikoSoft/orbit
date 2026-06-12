import { FactRequest } from 'api-spec/models/Fact';

export const factRequestChangedEventName = 'fact-request-changed';

export interface FactRequestChangedPayload {
  index: number;
  factRequest: FactRequest;
}

export class FactRequestChangedEvent extends CustomEvent<FactRequestChangedPayload> {
  constructor(detail: FactRequestChangedPayload) {
    super(factRequestChangedEventName, { detail, bubbles: true, composed: true });
  }
}

export const factRequestRemovedEventName = 'fact-request-removed';

export interface FactRequestRemovedPayload {
  index: number;
}

export class FactRequestRemovedEvent extends CustomEvent<FactRequestRemovedPayload> {
  constructor(detail: FactRequestRemovedPayload) {
    super(factRequestRemovedEventName, { detail, bubbles: true, composed: true });
  }
}
