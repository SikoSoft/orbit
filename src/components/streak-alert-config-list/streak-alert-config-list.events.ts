import { StreakAlertConfig } from 'api-spec/models/Fact';

export const alertsChangedEventName = 'alerts-changed';

export interface AlertsChangedPayload {
  alerts: StreakAlertConfig[];
}

export class AlertsChangedEvent extends CustomEvent<AlertsChangedPayload> {
  constructor(detail: AlertsChangedPayload) {
    super(alertsChangedEventName, { detail, bubbles: true, composed: true });
  }
}
