import { ChartConfigType, ChartResponse } from 'api-spec/models/Statistic';

export const chartBuiltEventName = 'chart-built';
export const chartGeneratingEventName = 'chart-generating';

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

export class ChartGeneratingEvent extends CustomEvent<Record<string, never>> {
  constructor() {
    super(chartGeneratingEventName, {
      bubbles: true,
      composed: true,
      detail: {},
    });
  }
}
