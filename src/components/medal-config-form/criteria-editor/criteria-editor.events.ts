import { Criterion, Criteria } from 'api-spec/models/Medal';

export const criteriaChangedEventName = 'criteria-changed';

export interface CriteriaChangedPayload {
  criteria: Criterion | Criteria;
}

export class CriteriaChangedEvent extends CustomEvent<CriteriaChangedPayload> {
  constructor(detail: CriteriaChangedPayload) {
    super(criteriaChangedEventName, { detail, bubbles: true, composed: true });
  }
}
