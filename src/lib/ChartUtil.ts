import type { ChartData } from 'chart.js';

import { ChartResponse } from 'api-spec/models/Statistic';

import { translate } from '@/lib/Localization';

export function convertResponseToChartData(response: ChartResponse): ChartData {
  const segments = response.datasets[0]?.data.map(d => d.segment) ?? [];

  return {
    labels: segments,
    datasets: response.datasets.map(dataset => ({
      label: dataset.label || translate('chartData'),
      data: dataset.data.map(d =>
        typeof d.value.value === 'number' ? d.value.value : 0,
      ),
    })),
  };
}
