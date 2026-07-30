import {
  EntityCalculatedPropertyConfig,
  EntityPropertyConfig,
  PropertyDataValue,
} from 'api-spec/models/Entity';
import { dataTypeSupportsFormatter } from 'api-spec/lib/Formatter';

import { applyFormatters } from '@/lib/Formatter';

export function getFormattedValue(
  value: PropertyDataValue,
  config: EntityPropertyConfig | EntityCalculatedPropertyConfig,
): PropertyDataValue {
  console.log('getFormattedValue', value, JSON.stringify(config));
  if (value == null) {
    return value;
  }
  if (!config.formatters || config.formatters.length === 0) {
    return value;
  }
  if (!dataTypeSupportsFormatter(config.dataType)) {
    console.log(
      'getFormattedValue: data type does not support formatters',
      config.dataType,
    );
    return value;
  }
  return applyFormatters(value, config.formatters);
}
