export const entityFormPropertiesChangedEventName =
  'entity-form-properties-changed';

export interface EntityFormPropertiesChangedEventPayload {
  instancesHash: string;
  sortedIds: string[];
  isInitial: boolean;
}

export class EntityFormPropertiesChangedEvent extends CustomEvent<EntityFormPropertiesChangedEventPayload> {
  constructor(payload: EntityFormPropertiesChangedEventPayload) {
    super(entityFormPropertiesChangedEventName, {
      bubbles: true,
      composed: true,
      detail: payload,
    });
  }
}

export const entityFormPropertySubmittedEventName =
  'entity-form-property-submitted';

export class EntityFormPropertySubmittedEvent extends CustomEvent<Record<string, never>> {
  constructor() {
    super(entityFormPropertySubmittedEventName, {
      bubbles: true,
      composed: true,
      detail: {},
    });
  }
}
