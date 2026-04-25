import { EntityProperty } from 'api-spec/models/Entity';

export const entityItemUpdatedEventName = 'entity-item-updated';

export interface EntityItemUpdatedEventPayload {
  id: number;
  tags: string[];
  properties: EntityProperty[];
}

export class EntityItemUpdatedEvent extends CustomEvent<EntityItemUpdatedEventPayload> {
  constructor(payload: EntityItemUpdatedEventPayload) {
    super(entityItemUpdatedEventName, {
      bubbles: true,
      composed: true,
      detail: payload,
    });
  }
}

export const entityItemDeletedEventName = 'entity-item-deleted';

export interface EntityItemDeletedEventPayload {
  id: number;
}

export class EntityItemDeletedEvent extends CustomEvent<EntityItemDeletedEventPayload> {
  constructor(payload: EntityItemDeletedEventPayload) {
    super(entityItemDeletedEventName, {
      bubbles: true,
      composed: true,
      detail: payload,
    });
  }
}

export const entityItemCreatedEventName = 'entity-item-created';

export interface EntityItemCreatedEventPayload {
  id: number;
  viewAccessPolicyId: number;
  editAccessPolicyId: number;
}

export class EntityItemCreatedEvent extends CustomEvent<EntityItemCreatedEventPayload> {
  constructor(payload: EntityItemCreatedEventPayload) {
    super(entityItemCreatedEventName, {
      bubbles: true,
      composed: true,
      detail: payload,
    });
  }
}

export const entityItemCanceledEventName = 'entity-item-canceled';

export interface EntityItemCanceledEventPayload {
  id: number;
}

export class EntityItemCanceledEvent extends CustomEvent<EntityItemCanceledEventPayload> {
  constructor(payload: EntityItemCanceledEventPayload) {
    super(entityItemCanceledEventName, {
      bubbles: true,
      composed: true,
      detail: payload,
    });
  }
}
