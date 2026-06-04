import type { ChartData } from 'chart.js';

import { ChartResponse } from 'api-spec/models/Statistic';

import { translate } from '@/lib/Localization';

export function convertResponseToChartData(response: ChartResponse): ChartData {
  return {
    labels: response.segmentedData.map(d => d.segment),
    datasets: [
      {
        label: translate('chartData'),
        data: response.segmentedData.map(d =>
          typeof d.value.value === 'number' ? d.value.value : 0,
        ),
      },
    ],
  };
}
