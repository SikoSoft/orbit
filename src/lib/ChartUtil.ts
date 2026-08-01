import type { ChartData } from 'chart.js';

import { ChartResponse } from 'api-spec/models/Statistic';
import {
  FactContext,
  FactOperation,
  EntityCountFactContext,
  PropertySumFactContext,
  AnalysisClassificationFactContext,
} from 'api-spec/models/Fact';
import {
  EntityConfig,
  EntityPropertyConfig,
  EntityCalculatedPropertyConfig,
} from 'api-spec/models/Entity';

import { translate } from '@/lib/Localization';

export interface DataPointLabelContext {
  entityConfigs: EntityConfig[];
  propertyConfigs: (EntityPropertyConfig | EntityCalculatedPropertyConfig)[];
}

type LabelResolver<T extends FactContext> = (
  dataPoint: T,
  context: DataPointLabelContext,
) => string;

const labelResolvers: Partial<{
  [K in FactOperation]: LabelResolver<Extract<FactContext, { operation: K }>>;
}> = {
  [FactOperation.ENTITY_COUNT]: (
    dataPoint: EntityCountFactContext,
    context: DataPointLabelContext,
  ): string => {
    const typeId = dataPoint.filter.includeTypes?.[0];
    if (typeId !== undefined) {
      const entityConfig = context.entityConfigs.find(c => c.id === typeId);
      if (entityConfig) {
        return entityConfig.name;
      }
    }
    return translate(`factOperation.${FactOperation.ENTITY_COUNT}`);
  },

  [FactOperation.PROPERTY_SUM]: (
    dataPoint: PropertySumFactContext,
    context: DataPointLabelContext,
  ): string => {
    const propertyConfig = context.propertyConfigs.find(
      c => c.id === dataPoint.propertyConfigId,
    );
    return propertyConfig
      ? propertyConfig.name
      : translate(`factOperation.${FactOperation.PROPERTY_SUM}`);
  },

  [FactOperation.ANALYSIS_CLASSIFICATION]: (
    dataPoint: AnalysisClassificationFactContext,
  ): string =>
    translate(`chart.analysisClassificationType.${dataPoint.analysisType}`),
};

export function getChartDatasetLabel(
  dataPoint: FactContext,
  context: DataPointLabelContext = { entityConfigs: [], propertyConfigs: [] },
): string {
  if (!dataPoint?.operation) {
    return translate('chartData');
  }

  const resolver = labelResolvers[dataPoint.operation];
  if (resolver) {
    return (resolver as LabelResolver<FactContext>)(dataPoint, context);
  }

  return translate(`factOperation.${dataPoint.operation}`);
}

export function convertResponseToChartData(
  response: ChartResponse,
  dataPoints: FactContext[],
  context: DataPointLabelContext = { entityConfigs: [], propertyConfigs: [] },
): ChartData {
  const segments = response.datasets[0]?.data.map(d => d.segment) ?? [];

  return {
    labels: segments,
    datasets: response.datasets.map((dataset, i) => ({
      label: getChartDatasetLabel(dataPoints[i], context),
      data: dataset.data.map(d =>
        typeof d.value.value === 'number' ? d.value.value : 0,
      ),
    })),
  };
}
