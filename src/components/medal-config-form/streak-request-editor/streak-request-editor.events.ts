import { StreakRequest } from 'api-spec/models/Medal';

export const streakRequestChangedEventName = 'streak-request-changed';

export interface StreakRequestChangedPayload {
  index: number;
  streakRequest: StreakRequest;
}

export class StreakRequestChangedEvent extends CustomEvent<StreakRequestChangedPayload> {
  constructor(detail: StreakRequestChangedPayload) {
    super(streakRequestChangedEventName, { detail, bubbles: true, composed: true });
  }
}

export const streakRequestRemovedEventName = 'streak-request-removed';

export interface StreakRequestRemovedPayload {
  index: number;
}

export class StreakRequestRemovedEvent extends CustomEvent<StreakRequestRemovedPayload> {
  constructor(detail: StreakRequestRemovedPayload) {
    super(streakRequestRemovedEventName, { detail, bubbles: true, composed: true });
  }
}
