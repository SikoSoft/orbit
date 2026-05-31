export const colorChangedEventName = 'color-changed';

export interface ColorChangedPayload {
  value: string;
}

export class ColorChangedEvent extends CustomEvent<ColorChangedPayload> {
  constructor(detail: ColorChangedPayload) {
    super(colorChangedEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}
