import { EntityCalculatedPropertyConfig, EntityPropertyConfig } from 'api-spec/models/Entity';
import { RevisionProblems } from 'api-spec/models/Revision';

export const propertyConfigUpdatedEventName = 'property-config-updated';

export type PropertyConfigUpdatedPayload = EntityPropertyConfig | EntityCalculatedPropertyConfig;

export class PropertyConfigUpdatedEvent extends CustomEvent<PropertyConfigUpdatedPayload> {
  constructor(detail: PropertyConfigUpdatedPayload) {
    super(propertyConfigUpdatedEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}

export const propertyConfigAddedEventName = 'property-config-added';

export type PropertyConfigAddedPayload = EntityPropertyConfig | EntityCalculatedPropertyConfig;

export class PropertyConfigAddedEvent extends CustomEvent<PropertyConfigAddedPayload> {
  constructor(detail: PropertyConfigAddedPayload) {
    super(propertyConfigAddedEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}

export const propertyConfigDeletedEventName = 'property-config-deleted';

export type PropertyConfigDeletedPayload = number;

export class PropertyConfigDeletedEvent extends CustomEvent<PropertyConfigDeletedPayload> {
  constructor(detail: PropertyConfigDeletedPayload) {
    super(propertyConfigDeletedEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}

export const propertyConfigBreakingChangeDetectedEventName =
  'property-config-breaking-change-detected';

export type PropertyConfigBreakingChangeDetectedPayload = {
  uiId: string;
  propertyConfig: EntityPropertyConfig;
  problems: RevisionProblems;
};

export class PropertyConfigBreakingChangeDetectedEvent extends CustomEvent<PropertyConfigBreakingChangeDetectedPayload> {
  constructor(detail: PropertyConfigBreakingChangeDetectedPayload) {
    super(propertyConfigBreakingChangeDetectedEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}

export const propertyConfigBreakingChangesResolvedEventName =
  'property-config-breaking-changes-resolved';

export type PropertyConfigBreakingChangesResolvedPayload = {
  uiId: string;
  propertyConfig: EntityPropertyConfig;
};

export class PropertyConfigBreakingChangesResolvedEvent extends CustomEvent<PropertyConfigBreakingChangesResolvedPayload> {
  constructor(detail: PropertyConfigBreakingChangesResolvedPayload) {
    super(propertyConfigBreakingChangesResolvedEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}
