export enum AccountFormField {
  USERNAME = 'username',
  PASSWORD = 'password',
  PASSWORD_REPEAT = 'passwordRepeat',
  FIRST_NAME = 'firstName',
  LAST_NAME = 'lastName',
}

export type AccountFormFieldName = `${AccountFormField}`;

export enum ValidationRule {
  USERNAME_REQUIRED = 'usernameRequired',
  PASSWORD_REQUIRED = 'passwordRequired',
  PASSWORDS_MUST_MATCH = 'passwordsMustMatch',
  FIRST_NAME_REQUIRED = 'firstNameRequired',
  LAST_NAME_REQUIRED = 'lastNameRequired',
}

export const validationRuleFields: Partial<
  Record<ValidationRule, AccountFormFieldName[]>
> = {
  [ValidationRule.USERNAME_REQUIRED]: [AccountFormField.USERNAME],
  [ValidationRule.PASSWORD_REQUIRED]: [AccountFormField.PASSWORD],
  [ValidationRule.PASSWORDS_MUST_MATCH]: [
    AccountFormField.PASSWORD,
    AccountFormField.PASSWORD_REPEAT,
  ],
  [ValidationRule.FIRST_NAME_REQUIRED]: [AccountFormField.FIRST_NAME],
  [ValidationRule.LAST_NAME_REQUIRED]: [AccountFormField.LAST_NAME],
};

export interface CreateAccountRequestBody {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  ott: string;
}

export interface CreateAccountResponseBody {
  id: string;
}

export interface UpdateAccountRequestBody {
  firstName: string;
  lastName: string;
  username: string;
}

export interface UpdatePasswordRequestBody {
  password: string;
}
