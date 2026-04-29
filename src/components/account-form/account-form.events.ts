export const accountCreatedEventName = 'account-created';

export interface AccountCreatedEventPayload {
  id: string;
}

export class AccountCreatedEvent extends CustomEvent<AccountCreatedEventPayload> {
  constructor(payload: AccountCreatedEventPayload) {
    super(accountCreatedEventName, {
      bubbles: true,
      composed: true,
      detail: payload,
    });
  }
}

export const accountUpdatedEventName = 'account-updated';

export interface AccountUpdatedEventPayload {
  firstName: string;
  lastName: string;
  username: string;
}

export class AccountUpdatedEvent extends CustomEvent<AccountUpdatedEventPayload> {
  constructor(payload: AccountUpdatedEventPayload) {
    super(accountUpdatedEventName, {
      bubbles: true,
      composed: true,
      detail: payload,
    });
  }
}
