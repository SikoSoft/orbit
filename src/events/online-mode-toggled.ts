export const onlineModeToggledEventName = 'online-mode-toggled';

export type OnlineModeToggledPayload = Record<string, never>;

export class OnlineModeToggledEvent extends CustomEvent<OnlineModeToggledPayload> {
  constructor(detail: OnlineModeToggledPayload) {
    super(onlineModeToggledEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}
