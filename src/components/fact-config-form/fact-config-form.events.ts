import { Fact } from 'api-spec/models/Fact';

export const factSavedEventName = 'fact-saved';

export interface FactSavedPayload {
  fact: Fact;
}

export class FactSavedEvent extends CustomEvent<FactSavedPayload> {
  constructor(detail: FactSavedPayload) {
    super(factSavedEventName, { detail, bubbles: true, composed: true });
  }
}
