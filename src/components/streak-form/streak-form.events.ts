import { StreakContext } from 'api-spec/models/Fact';

export const streakContextChangedEventName = 'streak-context-changed';

export interface StreakContextChangedPayload {
  context: StreakContext;
}

export class StreakContextChangedEvent extends CustomEvent<StreakContextChangedPayload> {
  constructor(detail: StreakContextChangedPayload) {
    super(streakContextChangedEventName, { detail, bubbles: true, composed: true });
  }
}
