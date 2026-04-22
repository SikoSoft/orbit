import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { translate } from '@/lib/Localization';
import { addToast } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';

import {
  AccountFormField,
  AccountFormFieldName,
  ValidationRule,
  validationRuleFields,
} from './account-form.models';
import { InputType } from '@ss/ui/components/ss-input.models';

import '@ss/ui/components/ss-button';
import '@ss/ui/components/ss-input';
import '@ss/ui/components/ss-select';

import {
  InputBlurredEvent,
  InputChangedEvent,
  InputSubmittedEvent,
} from '@ss/ui/components/ss-input.events';
import { AccountCreatedEvent } from './account-form.events';
import { themed } from '@/lib/Theme';
import { storage } from '@/lib/Storage';

@themed()
@customElement('account-form')
export class AccountForm extends LitElement {
  static styles = css`
    h2 {
      margin: 0;
      font-size: 1.5rem;
      text-align: center;
      padding: 2rem;
      opacity: 0.5;
    }

    .form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding: 1.5rem;
      max-width: 400px;
      margin: 0 auto;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .field-group {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    label {
      font-size: 0.875rem;
      font-weight: bold;
      color: var(--label-color, var(--text-secondary, #555));
    }

    .actions {
      padding-top: 0.5rem;
    }

    ss-input::part(input) {
      padding: 0.75rem;
    }

    ss-button::part(button) {
      font-weight: bold;
      padding: 0.75rem;
      font-size: 1.25rem;
    }

    .field.error label {
      color: var(--color-error, #c0392b);
    }

    .field.error ss-input {
      --input-unsaved-border-color: var(--color-error, #c0392b);
      --ssui-input-border-color: var(--color-error, #c0392b);
    }
  `;

  @state() username: string = '';
  @state() password: string = '';
  @state() passwordRepeat: string = '';
  @state() firstName: string = '';
  @state() lastName: string = '';
  @state() loading: boolean = false;
  @state() validationFailures: ValidationRule[] = [];

  private touchedFields = new Set<AccountFormFieldName>();

  private get validationErrors(): ValidationRule[] {
    const failures: ValidationRule[] = [];

    if (!this.firstName.length) {
      failures.push(ValidationRule.FIRST_NAME_REQUIRED);
    }
    if (!this.lastName.length) {
      failures.push(ValidationRule.LAST_NAME_REQUIRED);
    }
    if (!this.username.length) {
      failures.push(ValidationRule.USERNAME_REQUIRED);
    }
    if (!this.password.length) {
      failures.push(ValidationRule.PASSWORD_REQUIRED);
    } else if (this.password !== this.passwordRepeat) {
      failures.push(ValidationRule.PASSWORDS_MUST_MATCH);
    }

    return failures;
  }

  private fieldHasError(fieldName: AccountFormFieldName): boolean {
    return this.validationFailures.some(rule =>
      validationRuleFields[rule]?.includes(fieldName),
    );
  }

  private revalidateField(fieldName: AccountFormFieldName): void {
    const rulesForField = (
      Object.entries(validationRuleFields) as [
        ValidationRule,
        AccountFormFieldName[],
      ][]
    )
      .filter(([, fields]) => fields.includes(fieldName))
      .map(([rule]) => rule);

    const currentErrors = this.validationErrors;
    let updated = [...this.validationFailures];

    for (const rule of rulesForField) {
      if (currentErrors.includes(rule)) {
        if (!updated.includes(rule)) {
          updated.push(rule);
        }
      } else {
        updated = updated.filter(r => r !== rule);
      }
    }

    this.validationFailures = updated;
  }

  private reset(): void {
    this.username = '';
    this.password = '';
    this.passwordRepeat = '';
    this.firstName = '';
    this.lastName = '';
    this.validationFailures = [];
    this.touchedFields.clear();
  }

  private handleFieldChanged(
    fieldName: AccountFormFieldName,
    e: InputChangedEvent,
  ): void {
    this[fieldName] = e.detail.value;

    if (this.touchedFields.has(fieldName) || this.fieldHasError(fieldName)) {
      this.revalidateField(fieldName);
    }
  }

  private handleFieldBlurred(fieldName: AccountFormFieldName): void {
    this.touchedFields.add(fieldName);
    this.revalidateField(fieldName);
  }

  private handleFieldSubmitted(_e: InputSubmittedEvent): void {
    this.save();
  }

  private async save(): Promise<void> {
    const failures = this.validationErrors;

    if (failures.length > 0) {
      this.validationFailures = failures;
      failures.forEach(rule => {
        addToast(translate(rule), NotificationType.ERROR);
      });
      return;
    }

    this.validationFailures = [];
    this.loading = true;
    const result = await storage.createAccount(
      this.username,
      this.password,
      this.firstName,
      this.lastName,
    );

    if (result.isOk) {
      this.dispatchEvent(new AccountCreatedEvent({ id: result.value.id }));
      this.reset();
    }

    this.loading = false;
  }

  private renderField(
    fieldName: AccountFormFieldName,
    labelKey: string,
    type: InputType = InputType.TEXT,
  ): TemplateResult {
    const hasError = this.fieldHasError(fieldName);
    return html`
      <div class="field ${hasError ? 'error' : ''}">
        <label for=${fieldName}>${translate(labelKey)}</label>
        <ss-input
          type=${type}
          id=${fieldName}
          placeholder=${translate(labelKey)}
          ?unsaved=${hasError}
          @input-submitted=${this.handleFieldSubmitted}
          @input-changed=${(e: InputChangedEvent): void => {
            this.handleFieldChanged(fieldName, e);
          }}
          @input-blurred=${(_e: InputBlurredEvent): void => {
            this.handleFieldBlurred(fieldName);
          }}
          value=${this[fieldName]}
        ></ss-input>
      </div>
    `;
  }

  render(): TemplateResult {
    return html`
      <div class="box">
        <h2>${translate('createAccount')}</h2>

        <form class="form">
          <div class="field-group">
            ${this.renderField(AccountFormField.FIRST_NAME, 'firstName')}
            ${this.renderField(AccountFormField.LAST_NAME, 'lastName')}
          </div>

          <div class="field-group">
            ${this.renderField(AccountFormField.USERNAME, 'username')}
          </div>

          <div class="field-group">
            ${this.renderField(
              AccountFormField.PASSWORD,
              'password',
              InputType.PASSWORD,
            )}
            ${this.renderField(
              AccountFormField.PASSWORD_REPEAT,
              'confirmPassword',
              InputType.PASSWORD,
            )}
          </div>

          <div class="actions">
            <ss-button
              @click=${this.save}
              text=${translate('signUp')}
              ?loading=${this.loading}
            ></ss-button>
          </div>
        </form>
      </div>
    `;
  }
}
