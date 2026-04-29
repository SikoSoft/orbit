export enum PasswordFormField {
  CURRENT_PASSWORD = 'currentPassword',
  PASSWORD = 'password',
  PASSWORD_REPEAT = 'passwordRepeat',
}

export type PasswordFormFieldName = `${PasswordFormField}`;

export enum PasswordValidationRule {
  CURRENT_PASSWORD_REQUIRED = 'currentPasswordRequired',
  PASSWORD_REQUIRED = 'passwordRequired',
  PASSWORDS_MUST_MATCH = 'passwordsMustMatch',
}

export const passwordValidationRuleFields: Partial<
  Record<PasswordValidationRule, PasswordFormFieldName[]>
> = {
  [PasswordValidationRule.CURRENT_PASSWORD_REQUIRED]: [
    PasswordFormField.CURRENT_PASSWORD,
  ],
  [PasswordValidationRule.PASSWORD_REQUIRED]: [PasswordFormField.PASSWORD],
  [PasswordValidationRule.PASSWORDS_MUST_MATCH]: [
    PasswordFormField.PASSWORD,
    PasswordFormField.PASSWORD_REPEAT,
  ],
};
