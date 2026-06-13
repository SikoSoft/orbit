import { html, css, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { StreakRequest } from 'api-spec/models/Fact';

import { translate } from '@/lib/Localization';
import { InputChangedEvent } from '@ss/ui/components/ss-input.events';
import { themed } from '@/lib/Theme';

import {
  StreakRequestEditorProp,
  streakRequestEditorProps,
  StreakRequestEditorProps,
} from './streak-request-editor.models';
import { StreakRequestChangedEvent, StreakRequestRemovedEvent } from './streak-request-editor.events';
import { StreakContextChangedEvent } from '@/components/streak-form/streak-form.events';

import '@ss/ui/components/ss-input';
import '@ss/ui/components/ss-button';
import '@/components/streak-form/streak-form';

@themed()
@customElement('streak-request-editor')
export class StreakRequestEditor extends MobxLitElement {
  static styles = css`
    :host {
      display: block;
      border: 1px solid var(--color-border, #ccc);
      border-radius: 4px;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .row {
      display: flex;
      gap: 0.75rem;
      align-items: flex-end;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
    }

    .field {
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: 0.25rem;
      min-width: 8rem;
    }

    .field label {
      font-size: 0.8125rem;
      font-weight: bold;
    }
  `;

  @property({ type: Object })
  [StreakRequestEditorProp.STREAK_REQUEST]: StreakRequestEditorProps[StreakRequestEditorProp.STREAK_REQUEST] =
    streakRequestEditorProps[StreakRequestEditorProp.STREAK_REQUEST].default;

  @property({ type: Number })
  [StreakRequestEditorProp.INDEX]: StreakRequestEditorProps[StreakRequestEditorProp.INDEX] =
    streakRequestEditorProps[StreakRequestEditorProp.INDEX].default;

  private emit(streakRequest: StreakRequest): void {
    this.dispatchEvent(
      new StreakRequestChangedEvent({
        index: this[StreakRequestEditorProp.INDEX],
        streakRequest,
      }),
    );
  }

  render(): TemplateResult {
    const sr = this[StreakRequestEditorProp.STREAK_REQUEST];
    const idx = this[StreakRequestEditorProp.INDEX];

    return html`
      <div class="row">
        <div class="field">
          <label>${translate('alias')}</label>
          <ss-input
            .value=${sr.alias}
            @input-changed=${(e: InputChangedEvent): void => {
              this.emit({ ...sr, alias: e.detail.value });
            }}
          ></ss-input>
        </div>
        <ss-button
          negative
          @click=${(): void => {
            this.dispatchEvent(new StreakRequestRemovedEvent({ index: idx }));
          }}
        >${translate('remove')}</ss-button>
      </div>

      <streak-form
        .context=${sr.context}
        @streak-context-changed=${(e: StreakContextChangedEvent): void => {
          this.emit({ ...sr, context: e.detail.context });
        }}
      ></streak-form>
    `;
  }
}
