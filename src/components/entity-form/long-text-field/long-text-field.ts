import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import '@ss/ui/components/ss-input';
import { DataType } from 'api-spec/models/Entity';
import {
  PropertyChangedEvent,
  PropertyChangedEventPayload,
} from '@/components/entity-form/property-field/property-field.events';
import {
  LongTextFieldProp,
  LongTextFieldProps,
  longTextFieldProps,
} from './long-text-field.models';
import { themed } from '@/lib/Theme';

@themed()
@customElement('long-text-field')
export class LongTextField extends LitElement {
  static styles = css`
    textarea {
      width: 100%;
      height: 100px;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      padding: var(--padding);
      font-size: var(--font-size);
      color: var(--text-color);
      background-color: var(--background-color);
      box-sizing: border-box;
      transition: height 0.2s ease;
    }

    textarea:focus {
      outline: none;
      border-color: var(--primary-color);
      height: 300px;
    }
  `;

  @property({ type: Number })
  [LongTextFieldProp.INSTANCE_ID]: LongTextFieldProps[LongTextFieldProp.INSTANCE_ID] =
    longTextFieldProps[LongTextFieldProp.INSTANCE_ID].default;

  @property({ type: String })
  [LongTextFieldProp.VALUE]: LongTextFieldProps[LongTextFieldProp.VALUE] =
    longTextFieldProps[LongTextFieldProp.VALUE].default;

  @property({ type: Number })
  [LongTextFieldProp.PROPERTY_CONFIG_ID]: LongTextFieldProps[LongTextFieldProp.PROPERTY_CONFIG_ID] =
    longTextFieldProps[LongTextFieldProp.PROPERTY_CONFIG_ID].default;

  @property({ type: Number })
  [LongTextFieldProp.ENTITY_CONFIG_ID]: LongTextFieldProps[LongTextFieldProp.ENTITY_CONFIG_ID] =
    longTextFieldProps[LongTextFieldProp.ENTITY_CONFIG_ID].default;

  @property({ type: String })
  [LongTextFieldProp.UI_ID]: LongTextFieldProps[LongTextFieldProp.UI_ID] =
    longTextFieldProps[LongTextFieldProp.UI_ID].default;

  @query('textarea')
  textareaElement: HTMLTextAreaElement | undefined;

  protected handleFocus(): void {
    this.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected handleKeyDown(e: KeyboardEvent): void {
    if (e.key !== 'Enter' || !this.textareaElement) {
      return;
    }

    const textarea = this.textareaElement;
    const cursorPos = textarea.selectionStart;
    const textBefore = textarea.value.substring(0, cursorPos);
    const lastNewlineIndex = textBefore.lastIndexOf('\n');
    const currentLine = textBefore.substring(lastNewlineIndex + 1);

    if (!currentLine.startsWith('- ')) {
      return;
    }

    e.preventDefault();

    const textAfter = textarea.value.substring(cursorPos);
    const insertion = '\n- ';
    textarea.value = textBefore + insertion + textAfter;

    const newCursorPos = cursorPos + insertion.length;
    textarea.setSelectionRange(newCursorPos, newCursorPos);

    this.handleInputChanged();
  }

  protected handleInputChanged(): void {
    if (!this.textareaElement) {
      return;
    }

    const value = this.textareaElement.value;

    const changedPayload: PropertyChangedEventPayload = {
      uiId: this[LongTextFieldProp.UI_ID],
      dataType: DataType.LONG_TEXT,
      value,
    };

    const changedEvent = new PropertyChangedEvent(changedPayload);
    this.dispatchEvent(changedEvent);
  }

  focus(): void {
    if (this.textareaElement) {
      this.textareaElement.focus();
    }
  }

  render(): TemplateResult {
    return html`
      <textarea
        @focus=${this.handleFocus}
        @keydown=${this.handleKeyDown}
        @input=${this.handleInputChanged}
        .value=${this[LongTextFieldProp.VALUE]}
      ></textarea>
    `;
  }
}
