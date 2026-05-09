export const entityActionBarAddEventName = 'entity-action-bar-add';

export class EntityActionBarAddEvent extends CustomEvent<Record<string, never>> {
  constructor() {
    super(entityActionBarAddEventName, {
      bubbles: true,
      composed: true,
      detail: {},
    });
  }
}

export const entityActionBarEditEventName = 'entity-action-bar-edit';

export class EntityActionBarEditEvent extends CustomEvent<Record<string, never>> {
  constructor() {
    super(entityActionBarEditEventName, {
      bubbles: true,
      composed: true,
      detail: {},
    });
  }
}
