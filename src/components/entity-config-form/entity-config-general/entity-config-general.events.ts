import { ExtendedEntityConfig } from '../entity-config-form.models';

export const entityConfigGeneralConfigChangedEventName =
  'entity-config-general-config-changed';

export type EntityConfigGeneralConfigChangedPayload = ExtendedEntityConfig;

export class EntityConfigGeneralConfigChangedEvent extends CustomEvent<EntityConfigGeneralConfigChangedPayload> {
  constructor(detail: EntityConfigGeneralConfigChangedPayload) {
    super(entityConfigGeneralConfigChangedEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}

export const entityConfigGeneralSaveNewRevisionToggledEventName =
  'entity-config-general-save-new-revision-toggled';

export type EntityConfigGeneralSaveNewRevisionToggledPayload = {
  value: boolean;
};

export class EntityConfigGeneralSaveNewRevisionToggledEvent extends CustomEvent<EntityConfigGeneralSaveNewRevisionToggledPayload> {
  constructor(detail: EntityConfigGeneralSaveNewRevisionToggledPayload) {
    super(entityConfigGeneralSaveNewRevisionToggledEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}

export const entityConfigGeneralSaveRequestedEventName =
  'entity-config-general-save-requested';

export class EntityConfigGeneralSaveRequestedEvent extends CustomEvent<Record<string, never>> {
  constructor() {
    super(entityConfigGeneralSaveRequestedEventName, {
      detail: {},
      bubbles: true,
      composed: true,
    });
  }
}

export const entityConfigGeneralDeleteRequestedEventName =
  'entity-config-general-delete-requested';

export class EntityConfigGeneralDeleteRequestedEvent extends CustomEvent<Record<string, never>> {
  constructor() {
    super(entityConfigGeneralDeleteRequestedEventName, {
      detail: {},
      bubbles: true,
      composed: true,
    });
  }
}
