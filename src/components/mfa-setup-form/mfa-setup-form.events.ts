export const mfaSetupConfirmedEventName = 'mfa-setup-confirmed';
export const mfaSetupCancelledEventName = 'mfa-setup-cancelled';

export class MfaSetupConfirmedEvent extends CustomEvent<Record<string, never>> {
  constructor() {
    super(mfaSetupConfirmedEventName, {
      bubbles: true,
      composed: true,
      detail: {},
    });
  }
}

export class MfaSetupCancelledEvent extends CustomEvent<Record<string, never>> {
  constructor() {
    super(mfaSetupCancelledEventName, {
      bubbles: true,
      composed: true,
      detail: {},
    });
  }
}
