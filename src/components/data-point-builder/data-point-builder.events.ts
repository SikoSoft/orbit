import { FactContext } from 'api-spec/models/Fact';

export const dataPointUpdatedEventName = 'data-point-updated';

export type DataPointUpdatedPayload = FactContext;

export class DataPointUpdatedEvent extends CustomEvent<DataPointUpdatedPayload> {
  constructor(payload: DataPointUpdatedPayload) {
    super(dataPointUpdatedEventName, {
      bubbles: true,
      composed: true,
      detail: payload,
    });
  }
}
