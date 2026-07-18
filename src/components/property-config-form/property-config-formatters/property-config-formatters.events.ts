export const formattersChangedEventName = 'formatters-changed';

export interface FormattersChangedPayload {
  formatters: string[];
}

export class FormattersChangedEvent extends CustomEvent<FormattersChangedPayload> {
  constructor(detail: FormattersChangedPayload) {
    super(formattersChangedEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}
