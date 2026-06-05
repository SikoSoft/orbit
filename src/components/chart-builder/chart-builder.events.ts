import { ChartConfigType, ChartResponse } from 'api-spec/models/Statistic';

export const chartBuiltEventName = 'chart-built';

export type ChartBuiltPayload = ChartResponse & {
  chartType: `${ChartConfigType}`;
  saved?: boolean;
  updated?: boolean;
};

export class ChartBuiltEvent extends CustomEvent<ChartBuiltPayload> {
  constructor(payload: ChartBuiltPayload) {
    super(chartBuiltEventName, {
      bubbles: true,
      composed: true,
      detail: payload,
    });
  }
}
