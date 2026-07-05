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
  dataPoints: FactContext[],
  context: DataPointLabelContext = { entityConfigs: [], propertyConfigs: [] },
): string {
  const first = dataPoints[0] as FactContext | undefined;
  if (!first?.operation) {
    return translate('chartData');
  }

  const resolver = labelResolvers[first.operation];
  if (resolver) {
    return (resolver as LabelResolver<FactContext>)(first, context);
  }

  return translate(`factOperation.${first.operation}`);
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
