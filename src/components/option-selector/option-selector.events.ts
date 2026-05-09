export const optionSelectorChangedEventName = 'option-selector-changed';

export interface OptionSelectorChangedEventPayload {
  selected: string[];
}

export class OptionSelectorChangedEvent extends CustomEvent<OptionSelectorChangedEventPayload> {
  constructor(payload: OptionSelectorChangedEventPayload) {
    super(optionSelectorChangedEventName, {
      bubbles: true,
      composed: true,
      detail: payload,
    });
  }
}
