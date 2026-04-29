import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { translate } from '@/lib/Localization';
import { addToast } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';
import { InputType } from '@ss/ui/components/ss-input.models';

import '@ss/ui/components/ss-button';
import '@ss/ui/components/ss-input';

import {
  InputBlurredEvent,
  InputChangedEvent,
  InputSubmittedEvent,
} from '@ss/ui/components/ss-input.events';
import { PasswordUpdatedEvent } from './password-form.events';
import { themed } from '@/lib/Theme';
import { storage } from '@/lib/Storage';

import {
  PasswordFormField,
  PasswordFormFieldName,
  PasswordValidationRule,
  passwordValidationRuleFields,
} from './password-form.models';

@themed()
@customElement('password-form')
export class PasswordForm extends LitElement {
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

  @state() password: string = '';
  @state() passwordRepeat: string = '';
  @state() loading: boolean = false;
  @state() validationFailures: PasswordValidationRule[] = [];

  private touchedFields = new Set<PasswordFormFieldName>();

  private get validationErrors(): PasswordValidationRule[] {
    const failures: PasswordValidationRule[] = [];

    if (!this.password.length) {
      failures.push(PasswordValidationRule.PASSWORD_REQUIRED);
    } else if (this.password !== this.passwordRepeat) {
      failures.push(PasswordValidationRule.PASSWORDS_MUST_MATCH);
    }

    return failures;
  }

  private fieldHasError(fieldName: PasswordFormFieldName): boolean {
    return this.validationFailures.some(rule =>
      passwordValidationRuleFields[rule]?.includes(fieldName),
    );
  }

  private revalidateField(fieldName: PasswordFormFieldName): void {
    const rulesForField = (
      Object.entries(passwordValidationRuleFields) as [
        PasswordValidationRule,
        PasswordFormFieldName[],
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
    this.password = '';
    this.passwordRepeat = '';
    this.validationFailures = [];
    this.touchedFields.clear();
  }

  private handleFieldChanged(
    fieldName: PasswordFormFieldName,
    e: InputChangedEvent,
  ): void {
    this[fieldName] = e.detail.value;

    if (this.touchedFields.has(fieldName) || this.fieldHasError(fieldName)) {
      this.revalidateField(fieldName);
    }
  }

  private handleFieldBlurred(fieldName: PasswordFormFieldName): void {
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

    const result = await storage.updatePassword({ password: this.password });

    if (result.isOk) {
      addToast(translate('passwordUpdated'), NotificationType.SUCCESS);
      this.dispatchEvent(new PasswordUpdatedEvent());
      this.reset();
    } else {
      addToast(translate('passwordUpdateFailed'), NotificationType.ERROR);
    }

    this.loading = false;
  }

  private renderField(
    fieldName: PasswordFormFieldName,
    labelKey: string,
  ): TemplateResult {
    const hasError = this.fieldHasError(fieldName);
    return html`
      <div class="field ${hasError ? 'error' : ''}">
        <label for=${fieldName}>${translate(labelKey)}</label>
        <ss-input
          type=${InputType.PASSWORD}
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
        <h2>${translate('updatePassword')}</h2>

        <form class="form">
          <div class="field-group">
            ${this.renderField(PasswordFormField.PASSWORD, 'newPassword')}
            ${this.renderField(PasswordFormField.PASSWORD_REPEAT, 'confirmNewPassword')}
          </div>

          <div class="actions">
            <ss-button
              @click=${this.save}
              text=${translate('updatePassword')}
              ?loading=${this.loading}
            ></ss-button>
          </div>
        </form>
      </div>
    `;
  }
}
