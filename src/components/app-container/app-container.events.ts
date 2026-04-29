export const appReadyEventName = 'app-ready';

export type AppReadyPayload = Record<string, never>;

export class AppReadyEvent extends CustomEvent<AppReadyPayload> {
  constructor(detail: AppReadyPayload) {
    super(appReadyEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}

export const viewReadyEventName = 'view-ready';

export type ViewReadyPayload = Record<string, never>;

export class ViewReadyEvent extends CustomEvent<ViewReadyPayload> {
  constructor(detail: ViewReadyPayload) {
    super(viewReadyEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}

export const invalidSession = 'invalid-session';

export type InvalidSessionPayload = Record<string, never>;

export class InvalidSessionEvent extends CustomEvent<InvalidSessionPayload> {
  constructor(detail: InvalidSessionPayload) {
    super(invalidSession, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}
