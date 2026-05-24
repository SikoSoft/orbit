import { MedalConfig } from 'api-spec/models/Medal';

export const medalConfigCopiedEventName = 'medal-config-copied';

export type MedalConfigCopiedPayload = Omit<MedalConfig, 'id' | 'createdAt' | 'updatedAt'>;

export class MedalConfigCopiedEvent extends CustomEvent<MedalConfigCopiedPayload> {
  constructor(detail: MedalConfigCopiedPayload) {
    super(medalConfigCopiedEventName, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}

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
