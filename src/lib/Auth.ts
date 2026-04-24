import { api } from '@/lib/Api';
import { storage } from '@/lib/Storage';
import { appState } from '@/state';
import { addToast } from '@/lib/Util';
import { translate } from '@/lib/Localization';
import { NotificationType } from '@ss/ui/components/notification-provider.models';
import { LoginRequestBody, LoginResponseBody } from '@/models/Identity';

export async function performLogin(
  username: string,
  password: string,
): Promise<boolean> {
  try {
    const result = await api.post<LoginRequestBody, LoginResponseBody>('login', {
      username,
      password,
    });

    if (result && result.status !== 401) {
      storage.setAuthToken(result.response.authToken);
      api.setAuthToken(result.response.authToken);
      appState.setAuthToken(result.response.authToken);
      appState.setForbidden(false);
      addToast(translate('youAreNowLoggedIn'), NotificationType.SUCCESS);
      return true;
    }

    addToast(
      translate('incorrectUsernameAndPasswordCombination'),
      NotificationType.ERROR,
    );
  } catch {
    addToast(
      translate('anErrorOccurredWhileLoggingIn'),
      NotificationType.ERROR,
    );
  }

  return false;
}
