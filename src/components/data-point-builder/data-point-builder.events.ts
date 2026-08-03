import { FormattedDataPointRequest } from 'api-spec/models/Statistic';

export const dataPointUpdatedEventName = 'data-point-updated';

export type DataPointUpdatedPayload = FormattedDataPointRequest;

export class DataPointUpdatedEvent extends CustomEvent<DataPointUpdatedPayload> {
  constructor(payload: DataPointUpdatedPayload) {
    super(dataPointUpdatedEventName, {
      bubbles: true,
      composed: true,
      detail: payload,
    });
  }
}
