import { MedalConfig } from 'api-spec/models/Medal';

export const medalConfigUpdatedEventName = 'medal-config-updated';

export type MedalConfigUpdatedPayload = MedalConfig;

export class MedalConfigUpdatedEvent extends CustomEvent<MedalConfigUpdatedPayload> {
  constructor(detail: MedalConfigUpdatedPayload) {
    super(medalConfigUpdatedEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}

export const medalConfigDeletedEventName = 'medal-config-deleted';

export type MedalConfigDeletedPayload = { id: number };

export class MedalConfigDeletedEvent extends CustomEvent<MedalConfigDeletedPayload> {
  constructor(detail: MedalConfigDeletedPayload) {
    super(medalConfigDeletedEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}
