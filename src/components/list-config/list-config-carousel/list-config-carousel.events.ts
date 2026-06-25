export const addConfigRequestedEventName = 'add-config-requested';

export class AddConfigRequestedEvent extends CustomEvent<Record<string, never>> {
  constructor() {
    super(addConfigRequestedEventName, {
      bubbles: true,
      composed: true,
      detail: {},
    });
  }
}

export const themeManagerRequestedEventName = 'theme-manager-requested';

export class ThemeManagerRequestedEvent extends CustomEvent<Record<string, never>> {
  constructor() {
    super(themeManagerRequestedEventName, {
      bubbles: true,
      composed: true,
      detail: {},
    });
  }
}

export const deleteConfigRequestedEventName = 'delete-config-requested';

export class DeleteConfigRequestedEvent extends CustomEvent<Record<string, never>> {
  constructor() {
    super(deleteConfigRequestedEventName, {
      bubbles: true,
      composed: true,
      detail: {},
    });
  }
}

export const configNameSaveRequestedEventName = 'config-name-save-requested';

export interface ConfigNameSaveRequestedEventPayload {
  name: string;
}

export class ConfigNameSaveRequestedEvent extends CustomEvent<ConfigNameSaveRequestedEventPayload> {
  constructor(payload: ConfigNameSaveRequestedEventPayload) {
    super(configNameSaveRequestedEventName, {
      bubbles: true,
      composed: true,
      detail: payload,
    });
  }
}

export const configNameFocusedEventName = 'config-name-focused';

export class ConfigNameFocusedEvent extends CustomEvent<Record<string, never>> {
  constructor() {
    super(configNameFocusedEventName, {
      bubbles: true,
      composed: true,
      detail: {},
    });
  }
}

export const configNameBlurredEventName = 'config-name-blurred';

export class ConfigNameBlurredEvent extends CustomEvent<Record<string, never>> {
  constructor() {
    super(configNameBlurredEventName, {
      bubbles: true,
      composed: true,
      detail: {},
    });
  }
}

export const configNameSubmittedEventName = 'config-name-submitted';

export class ConfigNameSubmittedEvent extends CustomEvent<Record<string, never>> {
  constructor() {
    super(configNameSubmittedEventName, {
      bubbles: true,
      composed: true,
      detail: {},
    });
  }
}
