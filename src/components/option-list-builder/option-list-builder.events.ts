export const optionListUpdatedEventName = 'option-list-updated';

export interface OptionListUpdatedPayload {
  selected: string[];
}

export class OptionListUpdatedEvent extends CustomEvent<OptionListUpdatedPayload> {
  constructor(detail: OptionListUpdatedPayload) {
    super(optionListUpdatedEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}
