export const passwordUpdatedEventName = 'password-updated';

export interface PasswordUpdatedEventPayload {
  success: true;
}

export class PasswordUpdatedEvent extends CustomEvent<PasswordUpdatedEventPayload> {
  constructor() {
    super(passwordUpdatedEventName, {
      bubbles: true,
      composed: true,
      detail: { success: true },
    });
  }
}
