import { Streak } from 'api-spec/models/Fact';

export const streakSavedEventName = 'streak-saved';

export interface StreakSavedPayload {
  streak: Streak;
}

export class StreakSavedEvent extends CustomEvent<StreakSavedPayload> {
  constructor(detail: StreakSavedPayload) {
    super(streakSavedEventName, { detail, bubbles: true, composed: true });
  }
}
