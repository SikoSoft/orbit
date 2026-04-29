export enum PasswordFormField {
  PASSWORD = 'password',
  PASSWORD_REPEAT = 'passwordRepeat',
}

export type PasswordFormFieldName = `${PasswordFormField}`;

export enum PasswordValidationRule {
  PASSWORD_REQUIRED = 'passwordRequired',
  PASSWORDS_MUST_MATCH = 'passwordsMustMatch',
}

export const passwordValidationRuleFields: Partial<
  Record<PasswordValidationRule, PasswordFormFieldName[]>
> = {
  [PasswordValidationRule.PASSWORD_REQUIRED]: [PasswordFormField.PASSWORD],
  [PasswordValidationRule.PASSWORDS_MUST_MATCH]: [
    PasswordFormField.PASSWORD,
    PasswordFormField.PASSWORD_REPEAT,
  ],
};
