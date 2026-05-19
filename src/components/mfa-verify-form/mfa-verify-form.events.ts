export const mfaVerifySucceededEventName = 'mfa-verify-succeeded';

export class MfaVerifySucceededEvent extends CustomEvent<Record<string, never>> {
  constructor() {
    super(mfaVerifySucceededEventName, {
      bubbles: true,
      composed: true,
      detail: {},
    });
  }
}
