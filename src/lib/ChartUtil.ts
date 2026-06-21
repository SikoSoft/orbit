import type { ChartData } from 'chart.js';

import { ChartResponse } from 'api-spec/models/Statistic';
import { FactContext, FactOperation } from 'api-spec/models/Fact';

import { translate } from '@/lib/Localization';

export function getChartDatasetLabel(dataPoints: FactContext[]): string {
  const first = dataPoints[0] as FactContext | undefined;
  if (first?.operation === FactOperation.ANALYSIS_CLASSIFICATION) {
    return translate(`chart.analysisClassificationType.${first.analysisType}`);
  }
  if (first?.operation) {
    return translate(`factOperation.${first.operation}`);
  }
  return translate('chartData');
}

export function convertResponseToChartData(
  response: ChartResponse,
  label?: string,
): ChartData {
  return {
    labels: response.segmentedData.map(d => d.segment),
    datasets: [
      {
        label: label ?? translate('chartData'),
        data: response.segmentedData.map(d =>
          typeof d.value.value === 'number' ? d.value.value : 0,
        ),
      },
    ],
  };
}
