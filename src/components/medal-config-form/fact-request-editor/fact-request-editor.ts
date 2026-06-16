import { html, css, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { FactRequest } from 'api-spec/models/Fact';

import { translate } from '@/lib/Localization';
import { InputChangedEvent } from '@ss/ui/components/ss-input.events';
import { themed } from '@/lib/Theme';

import {
  FactRequestEditorProp,
  factRequestEditorProps,
  FactRequestEditorProps,
} from './fact-request-editor.models';
import { FactRequestChangedEvent, FactRequestRemovedEvent } from './fact-request-editor.events';
import { FactContextChangedEvent } from '@/components/fact-form/fact-form.events';

import '@ss/ui/components/ss-input';
import '@ss/ui/components/ss-button';
import '@/components/fact-form/fact-form';

@themed()
@customElement('fact-request-editor')
export class FactRequestEditor extends MobxLitElement {
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
  [FactRequestEditorProp.FACT_REQUEST]: FactRequestEditorProps[FactRequestEditorProp.FACT_REQUEST] =
    factRequestEditorProps[FactRequestEditorProp.FACT_REQUEST].default;

  @property({ type: Number })
  [FactRequestEditorProp.INDEX]: FactRequestEditorProps[FactRequestEditorProp.INDEX] =
    factRequestEditorProps[FactRequestEditorProp.INDEX].default;

  private emit(factRequest: FactRequest): void {
    this.dispatchEvent(
      new FactRequestChangedEvent({
        index: this[FactRequestEditorProp.INDEX],
        factRequest,
      }),
    );
  }

  render(): TemplateResult {
    const fr = this[FactRequestEditorProp.FACT_REQUEST];
    const idx = this[FactRequestEditorProp.INDEX];

    return html`
      <div class="row">
        <div class="field">
          <label>${translate('alias')}</label>
          <ss-input
            .value=${fr.alias}
            @input-changed=${(e: InputChangedEvent): void => {
              this.emit({ ...fr, alias: e.detail.value });
            }}
          ></ss-input>
        </div>
        <ss-button
          negative
          @click=${(): void => {
            this.dispatchEvent(new FactRequestRemovedEvent({ index: idx }));
          }}
        >${translate('remove')}</ss-button>
      </div>

      <fact-form
        .context=${fr.context}
        @fact-context-changed=${(e: FactContextChangedEvent): void => {
          this.emit({ ...fr, context: e.detail.context });
        }}
      ></fact-form>
    `;
  }
}
