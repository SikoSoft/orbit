export interface LoginRequestBody {
  username: string;
  password: string;
}

export interface LoginSuccessBody {
  authToken: string;
  userId: string;
  username: string;
  roles: string[];
}

export interface LoginMfaRequiredBody {
  pendingMfaToken: string;
}

export type LoginResponseBody = LoginSuccessBody | LoginMfaRequiredBody;

export interface MfaVerifyRequestBody {
  pendingMfaToken: string;
  code: string;
}

export interface MfaSetupResponseBody {
  secret: string;
  uri: string;
}

export interface MfaVerifySetupRequestBody {
  secret: string;
  code: string;
}
