import { FormatterId } from 'api-spec/models/Formatter';

import { translate } from '@/lib/Localization';
import { registerFormatter } from '@/lib/FormatterRegistry';

registerFormatter(FormatterId.MS_TO_DURATION, {
  label: translate('formatter.msToDuration.label'),
  description: translate('formatter.msToDuration.description'),
  fn: value => {
    if (typeof value !== 'number') {
      return value;
    }
    const totalMinutes = Math.floor(value / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0 && minutes > 0) {
      return translate('formatter.msToDuration.hoursAndMinutes', {
        hours,
        minutes,
      });
    }
    if (hours > 0) {
      return translate('formatter.msToDuration.hoursOnly', { hours });
    }
    if (minutes > 0) {
      return translate('formatter.msToDuration.minutesOnly', { minutes });
    }
    const seconds = Math.floor((value % 60000) / 1000);
    return translate('formatter.msToDuration.secondsOnly', { seconds });
  },
});
