import { api } from '@/lib/Api';
import { storage } from '@/lib/Storage';
import { appState } from '@/state';
import { addToast } from '@/lib/Util';
import { translate } from '@/lib/Localization';
import { NotificationType } from '@ss/ui/components/notification-provider.models';
import {
  LoginRequestBody,
  LoginSuccessBody,
  LoginMfaRequiredBody,
  MfaVerifyRequestBody,
} from '@/models/Identity';

function applyLoginSuccess(body: LoginSuccessBody): void {
  storage.setAuthToken(body.authToken);
  api.setAuthToken(body.authToken);
  appState.setAuthToken(body.authToken);
  appState.setForbidden(false);
}

export async function performLogout(): Promise<boolean> {
  const result = await api.get<unknown>('logout');
  if (result) {
    storage.setAuthToken('');
    api.setAuthToken('');
    appState.setAuthToken('');
    appState.setForbidden(true);
    addToast(translate('youAreNowLoggedOut'), NotificationType.INFO);
    return true;
  }
  return false;
}

export type LoginResult =
  | { type: 'success' }
  | { type: 'mfaRequired'; pendingMfaToken: string }
  | { type: 'error' };

export async function performLogin(
  username: string,
  password: string,
): Promise<LoginResult> {
  try {
    const result = await api.post<LoginRequestBody, LoginSuccessBody | LoginMfaRequiredBody>('login', {
      username,
      password,
    });

    if (!result) {
      addToast(translate('anErrorOccurredWhileLoggingIn'), NotificationType.ERROR);
      return { type: 'error' };
    }

    if (result.status === 202) {
      const body = result.response as LoginMfaRequiredBody;
      return { type: 'mfaRequired', pendingMfaToken: body.pendingMfaToken };
    }

    if (result.status === 200) {
      applyLoginSuccess(result.response as LoginSuccessBody);
      addToast(translate('youAreNowLoggedIn'), NotificationType.SUCCESS);
      return { type: 'success' };
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

  return { type: 'error' };
}

export async function performMfaVerify(
  pendingMfaToken: string,
  code: string,
): Promise<boolean> {
  try {
    const result = await api.post<MfaVerifyRequestBody, LoginSuccessBody>(
      'mfaVerify',
      { pendingMfaToken, code },
    );

    if (result && result.status === 200) {
      applyLoginSuccess(result.response);
      addToast(translate('youAreNowLoggedIn'), NotificationType.SUCCESS);
      return true;
    }

    addToast(translate('mfa.invalidCode'), NotificationType.ERROR);
  } catch {
    addToast(translate('anErrorOccurredWhileLoggingIn'), NotificationType.ERROR);
  }

  return false;
}
