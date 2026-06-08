import { html, css, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { StreakRequest, EvalOperator } from 'api-spec/models/Medal';
import { AnalysisClassificationType, AnalysisClassificationFactContext } from 'api-spec/models/Fact';
import { SegmentationTimeUnit } from 'api-spec/models/Statistic';

import { translate } from '@/lib/Localization';
import { SelectChangedEvent } from '@ss/ui/components/ss-select.events';
import { InputChangedEvent } from '@ss/ui/components/ss-input.events';
import { themed } from '@/lib/Theme';

import {
  StreakRequestEditorProp,
  streakRequestEditorProps,
  StreakRequestEditorProps,
} from './streak-request-editor.models';
import { StreakRequestChangedEvent, StreakRequestRemovedEvent } from './streak-request-editor.events';

import '@ss/ui/components/ss-input';
import '@ss/ui/components/ss-select';
import '@ss/ui/components/ss-button';

const segmentUnitOptions = Object.values(SegmentationTimeUnit).map(v => ({
  value: v,
  label: translate(`segmentationUnit.${v}`),
}));

const evalOperatorOptions: { value: EvalOperator; label: string }[] = [
  { value: '==', label: '== (equals)' },
  { value: '!=', label: '!= (not equals)' },
  { value: '>', label: '> (greater than)' },
  { value: '>=', label: '>= (greater than or equal)' },
  { value: '<', label: '< (less than)' },
  { value: '<=', label: '<= (less than or equal)' },
  { value: 'contains', label: 'contains' },
];

const analysisTypeOptions = Object.values(AnalysisClassificationType).map(v => ({
  value: v,
  label: translate(`analysisType.${v}`),
}));

const booleanOptions = [
  { value: 'true', label: translate('true') },
  { value: 'false', label: translate('false') },
];

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

    .inner-context {
      border-top: 1px solid var(--color-border, #eee);
      padding-top: 0.75rem;
      margin-top: 0.25rem;
    }

    .section-label {
      font-size: 0.8125rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
      opacity: 0.7;
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
    const innerContext = sr.innerContext as AnalysisClassificationFactContext;

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
        <div class="field">
          <label>${translate('segmentUnit')}</label>
          <ss-select
            .options=${segmentUnitOptions}
            .selected=${sr.segmentUnit}
            @select-changed=${(e: SelectChangedEvent<SegmentationTimeUnit>): void => {
              this.emit({ ...sr, segmentUnit: e.detail.value });
            }}
          ></ss-select>
        </div>
        <div class="field">
          <label>${translate('streakLength')}</label>
          <ss-input
            .value=${String(sr.length)}
            @input-changed=${(e: InputChangedEvent): void => {
              this.emit({ ...sr, length: Math.max(1, Number(e.detail.value) || 1) });
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

      <div class="inner-context">
        <div class="section-label">${translate('innerContext')}</div>
        <div class="row">
          <div class="field">
            <label>${translate('analysisType')}</label>
            <ss-select
              .options=${analysisTypeOptions}
              .selected=${innerContext.analysisType}
              @select-changed=${(e: SelectChangedEvent<AnalysisClassificationType>): void => {
                const updated: AnalysisClassificationFactContext = { ...innerContext, analysisType: e.detail.value };
                this.emit({ ...sr, innerContext: updated });
              }}
            ></ss-select>
          </div>
          <div class="field">
            <label>${translate('innerOperator')}</label>
            <ss-select
              .options=${evalOperatorOptions}
              .selected=${sr.innerOperator}
              @select-changed=${(e: SelectChangedEvent<EvalOperator>): void => {
                this.emit({ ...sr, innerOperator: e.detail.value });
              }}
            ></ss-select>
          </div>
          <div class="field">
            <label>${translate('innerValue')}</label>
            <ss-select
              .options=${booleanOptions}
              .selected=${String(sr.innerValue)}
              @select-changed=${(e: SelectChangedEvent<string>): void => {
                this.emit({ ...sr, innerValue: e.detail.value === 'true' });
              }}
            ></ss-select>
          </div>
        </div>
      </div>
    `;
  }
}
