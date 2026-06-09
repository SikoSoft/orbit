import type { ChartData, ChartOptions, ChartType } from 'chart.js';

import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';

export enum ChartJsProp {
  TYPE = 'type',
  DATA = 'data',
  OPTIONS = 'options',
  LABEL = 'label',
  LOADING = 'loading',
}

export interface ChartJsProps extends PropTypes {
  [ChartJsProp.TYPE]: ChartType;
  [ChartJsProp.DATA]: ChartData;
  [ChartJsProp.OPTIONS]: ChartOptions;
  [ChartJsProp.LABEL]: string;
  [ChartJsProp.LOADING]: boolean;
}

export const chartJsProps: PropConfigMap<ChartJsProps> = {
  [ChartJsProp.TYPE]: {
    default: 'bar',
    control: {
      type: ControlType.SELECT,
      options: [
        'bar',
        'line',
        'pie',
        'doughnut',
        'radar',
        'polarArea',
        'bubble',
        'scatter',
      ],
    },
    description: 'The type of chart to render',
  },
  [ChartJsProp.DATA]: {
    default: { labels: [], datasets: [] },
    control: { type: ControlType.HIDDEN },
    description: 'Chart data including labels and datasets',
  },
  [ChartJsProp.OPTIONS]: {
    default: {},
    control: { type: ControlType.HIDDEN },
    description: 'Chart.js options for customizing appearance and behavior',
  },
  [ChartJsProp.LABEL]: {
    default: '',
    control: { type: ControlType.TEXT },
    description: 'Accessible aria-label for the chart canvas',
  },
  [ChartJsProp.LOADING]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Shows a loading spinner in place of the chart canvas',
  },
};
