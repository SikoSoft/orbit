import { PropertyDataValue } from 'api-spec/models/Entity';

export const defaultValueChangedEventName = 'default-value-changed';

export interface DefaultValueChangedPayload {
  value: PropertyDataValue;
}

export class DefaultValueChangedEvent extends CustomEvent<DefaultValueChangedPayload> {
  constructor(payload: DefaultValueChangedPayload) {
    super(defaultValueChangedEventName, {
      bubbles: true,
      composed: true,
      detail: payload,
    });
  }
}
