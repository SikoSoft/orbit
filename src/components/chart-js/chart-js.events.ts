import type { Chart } from 'chart.js';

export const chartInitializedEventName = 'chart-initialized';
export const chartUpdatedEventName = 'chart-updated';
export const chartDestroyedEventName = 'chart-destroyed';

export interface ChartInitializedEventPayload {
  chart: Chart;
}

export class ChartInitializedEvent extends CustomEvent<ChartInitializedEventPayload> {
  constructor(chart: Chart) {
    super(chartInitializedEventName, {
      bubbles: true,
      composed: true,
      detail: { chart },
    });
  }
}

export class ChartUpdatedEvent extends CustomEvent<Record<string, never>> {
  constructor() {
    super(chartUpdatedEventName, {
      bubbles: true,
      composed: true,
      detail: {},
    });
  }
}

export class ChartDestroyedEvent extends CustomEvent<Record<string, never>> {
  constructor() {
    super(chartDestroyedEventName, {
      bubbles: true,
      composed: true,
      detail: {},
    });
  }
}
