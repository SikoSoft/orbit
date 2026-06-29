import {
  EntityCalculatedPropertyConfig,
  EntityPropertyConfig,
} from 'api-spec/models/Entity';
import { RevisionProblems } from 'api-spec/models/Revision';

export const entityConfigPropertiesChangedEventName =
  'entity-config-properties-changed';

export type EntityConfigPropertiesChangedPayload = (
  | EntityPropertyConfig
  | EntityCalculatedPropertyConfig
)[];

export class EntityConfigPropertiesChangedEvent extends CustomEvent<EntityConfigPropertiesChangedPayload> {
  constructor(detail: EntityConfigPropertiesChangedPayload) {
    super(entityConfigPropertiesChangedEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}

export const entityConfigPropertiesBreakingChangesUpdatedEventName =
  'entity-config-properties-breaking-changes-updated';

export type EntityConfigPropertiesBreakingChangesUpdatedPayload = {
  hasBreakingChanges: boolean;
};

export class EntityConfigPropertiesBreakingChangesUpdatedEvent extends CustomEvent<EntityConfigPropertiesBreakingChangesUpdatedPayload> {
  constructor(
    detail: EntityConfigPropertiesBreakingChangesUpdatedPayload,
  ) {
    super(entityConfigPropertiesBreakingChangesUpdatedEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}

export const entityConfigPropertiesBreakingChangeDetectedEventName =
  'entity-config-properties-breaking-change-detected';

export type EntityConfigPropertiesBreakingChangeDetectedPayload = {
  index: number;
  problems: RevisionProblems;
};

export class EntityConfigPropertiesBreakingChangeDetectedEvent extends CustomEvent<EntityConfigPropertiesBreakingChangeDetectedPayload> {
  constructor(
    detail: EntityConfigPropertiesBreakingChangeDetectedPayload,
  ) {
    super(entityConfigPropertiesBreakingChangeDetectedEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}
