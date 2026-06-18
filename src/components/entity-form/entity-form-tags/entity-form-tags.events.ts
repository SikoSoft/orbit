export const entityFormTagsUpdatedEventName = 'entity-form-tags-updated';

export interface EntityFormTagsUpdatedEventPayload {
  tags: string[];
}

export class EntityFormTagsUpdatedEvent extends CustomEvent<EntityFormTagsUpdatedEventPayload> {
  constructor(payload: EntityFormTagsUpdatedEventPayload) {
    super(entityFormTagsUpdatedEventName, {
      bubbles: true,
      composed: true,
      detail: payload,
    });
  }
}
