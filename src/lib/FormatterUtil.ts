import {
  EntityCalculatedPropertyConfig,
  EntityPropertyConfig,
  PropertyDataValue,
} from 'api-spec/models/Entity';
import {
  applyFormatters,
  dataTypeSupportsFormatter,
} from 'api-spec/lib/Formatter';

export function getFormattedValue(
  value: PropertyDataValue,
  config: EntityPropertyConfig | EntityCalculatedPropertyConfig,
): PropertyDataValue {
  if (value == null) {
    return value;
  }
  if (!config.formatters || config.formatters.length === 0) {
    return value;
  }
  if (!dataTypeSupportsFormatter(config.dataType)) {
    return value;
  }
  return applyFormatters(value, config.formatters);
}
