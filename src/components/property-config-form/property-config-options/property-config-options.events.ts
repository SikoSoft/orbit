export const optionsChangedEventName = 'options-changed';

export interface OptionsChangedPayload {
  options: string[];
}

export class OptionsChangedEvent extends CustomEvent<OptionsChangedPayload> {
  constructor(payload: OptionsChangedPayload) {
    super(optionsChangedEventName, {
      bubbles: true,
      composed: true,
      detail: payload,
    });
  }
}
