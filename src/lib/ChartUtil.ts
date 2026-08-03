import type { ChartData, ChartOptions } from 'chart.js';

import { ChartResponse } from 'api-spec/models/Statistic';

import { translate } from '@/lib/Localization';
import { applyFormatters } from '@/lib/Formatter';

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

export function buildChartOptions(response: ChartResponse): ChartOptions {
  const formattedPerDataset: (string[] | null)[] = response.datasets.map(
    dataset => {
      if (!dataset.formatters || dataset.formatters.length === 0) {
        return null;
      }
      return dataset.data.map(d => {
        const raw = d.value.value;
        if (raw == null) {
          return '';
        }
        return applyFormatters(raw, dataset.formatters);
      });
    },
  );

  const hasAnyFormatters = formattedPerDataset.some(f => f !== null);
  if (!hasAnyFormatters) {
    return {};
  }

  const firstFormattedDataset = response.datasets.find(
    ds => ds.formatters && ds.formatters.length > 0,
  );

  return {
    plugins: {
      tooltip: {
        callbacks: {
          label: context => {
            const formatted =
              formattedPerDataset[context.datasetIndex]?.[context.dataIndex];
            if (formatted === undefined) {
              return;
            }
            const label = context.dataset.label ?? '';
            return label ? `${label}: ${formatted}` : formatted;
          },
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: tickValue => {
            if (!firstFormattedDataset) {
              return tickValue;
            }
            return applyFormatters(tickValue, firstFormattedDataset.formatters);
          },
        },
      },
    },
  };
}
