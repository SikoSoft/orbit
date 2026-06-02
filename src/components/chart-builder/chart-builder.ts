import { html, css, nothing, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import {
  ChartRequest,
  DataWindow,
  SegmentationType,
  SegmentationTimeUnit,
} from 'api-spec/models/Statistic';
import { FactContext, FactOperation } from 'api-spec/models/Fact';

import { translate } from '@/lib/Localization';
import { storage } from '@/lib/Storage';
import { defaultListFilter } from '@/state';
import { SelectChangedEvent } from '@ss/ui/components/ss-select.events';
import { InputChangedEvent } from '@ss/ui/components/ss-input.events';
import { DataPointUpdatedEvent } from '@/components/data-point-builder/data-point-builder.events';

import { ChartBuiltEvent } from './chart-builder.events';

import '@ss/ui/components/ss-select';
import '@ss/ui/components/ss-input';
import '@/components/data-point-builder/data-point-builder';

export enum DataWindowPreset {
  YEAR_TO_DATE = 'yearToDate',
  MONTH_TO_DATE = 'monthToDate',
  WEEK_TO_DATE = 'weekToDate',
  LAST_365_DAYS = 'last365Days',
  LAST_30_DAYS = 'last30Days',
  LAST_7_DAYS = 'last7Days',
  CUSTOM = 'custom',
}

@customElement('chart-builder')
export class ChartBuilder extends MobxLitElement {
  @state() private dataWindowPreset: DataWindowPreset =
    DataWindowPreset.LAST_30_DAYS;
  @state() private customStart = '';
  @state() private customEnd = '';
  @state() private segmentationType: SegmentationType = SegmentationType.TIME;
  @state() private segmentationUnit: SegmentationTimeUnit =
    SegmentationTimeUnit.DAY;
  @state() private dataPoints: FactContext[] = [
    { operation: FactOperation.ENTITY_COUNT, filter: structuredClone(defaultListFilter) },
  ];
  @state() private isLoading = false;
  @state() private errorMessage = '';

  static styles = css`
    .chart-builder {
      padding: 1rem;
    }

    .section {
      margin-bottom: 1.5rem;
    }

    .section h3 {
      margin: 0 0 0.75rem;
      font-size: 1rem;
    }

    .field {
      margin-bottom: 0.75rem;
    }

    .field label {
      display: block;
      margin-bottom: 0.25rem;
      font-size: 0.875rem;
    }

    .custom-dates {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-top: 0.75rem;
    }

    .segmentation-fields {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .data-point-item {
      margin-bottom: 0.75rem;
    }

    .data-point-header {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 0.25rem;
    }

    .btn {
      padding: 0.5rem 1rem;
      cursor: pointer;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: transparent;
      font-size: 0.875rem;
    }

    .btn-primary {
      background: var(--color-primary, #0066cc);
      color: white;
      border-color: var(--color-primary, #0066cc);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-danger {
      color: var(--color-danger, #cc0000);
      border-color: var(--color-danger, #cc0000);
    }

    .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
    }

    .actions {
      margin-top: 1rem;
    }

    .error {
      color: var(--color-danger, #cc0000);
      margin-top: 0.5rem;
      font-size: 0.875rem;
    }
  `;

  private getDataWindow(): DataWindow {
    const now = new Date();

    switch (this.dataWindowPreset) {
      case DataWindowPreset.YEAR_TO_DATE: {
        return { start: new Date(now.getFullYear(), 0, 1), end: now };
      }
      case DataWindowPreset.MONTH_TO_DATE: {
        return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
      }
      case DataWindowPreset.WEEK_TO_DATE: {
        const daysToMonday = now.getDay() === 0 ? 6 : now.getDay() - 1;
        const start = new Date(now);
        start.setDate(now.getDate() - daysToMonday);
        start.setHours(0, 0, 0, 0);
        return { start, end: now };
      }
      case DataWindowPreset.LAST_365_DAYS: {
        const start = new Date(now);
        start.setDate(now.getDate() - 365);
        return { start, end: now };
      }
      case DataWindowPreset.LAST_30_DAYS: {
        const start = new Date(now);
        start.setDate(now.getDate() - 30);
        return { start, end: now };
      }
      case DataWindowPreset.LAST_7_DAYS: {
        const start = new Date(now);
        start.setDate(now.getDate() - 7);
        return { start, end: now };
      }
      case DataWindowPreset.CUSTOM:
        return {
          start: new Date(this.customStart),
          end: new Date(this.customEnd),
        };
    }
  }

  private addDataPoint(): void {
    this.dataPoints = [
      ...this.dataPoints,
      { operation: FactOperation.ENTITY_COUNT, filter: structuredClone(defaultListFilter) },
    ];
  }

  private removeDataPoint(index: number): void {
    this.dataPoints = this.dataPoints.filter((_, i) => i !== index);
  }

  private handleDataPointUpdated(index: number, e: DataPointUpdatedEvent): void {
    e.stopPropagation();
    const updated = [...this.dataPoints];
    updated[index] = e.detail;
    this.dataPoints = updated;
  }

  private async handleGenerateChart(): Promise<void> {
    if (this.isLoading) {
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    const request: ChartRequest = {
      dataWindow: this.getDataWindow(),
      segmentation: {
        type: this.segmentationType,
        unit: this.segmentationUnit,
      },
      dataPoints: this.dataPoints,
    };

    const result = await storage.createChart?.(request);

    this.isLoading = false;

    if (!result || !result.isOk) {
      this.errorMessage = translate('failedToGenerateChart');
      return;
    }

    this.dispatchEvent(new ChartBuiltEvent(result.value));
  }

  private renderCustomDates(): TemplateResult {
    if (this.dataWindowPreset !== DataWindowPreset.CUSTOM) {
      return html`${nothing}`;
    }

    return html`
      <div class="custom-dates">
        <div class="field">
          <label>${translate('startDate')}</label>
          <ss-input
            type="datetime-local"
            value=${this.customStart}
            @input-changed=${(e: InputChangedEvent): void => {
              this.customStart = e.detail.value;
            }}
          ></ss-input>
        </div>
        <div class="field">
          <label>${translate('endDate')}</label>
          <ss-input
            type="datetime-local"
            value=${this.customEnd}
            @input-changed=${(e: InputChangedEvent): void => {
              this.customEnd = e.detail.value;
            }}
          ></ss-input>
        </div>
      </div>
    `;
  }

  render(): TemplateResult {
    return html`
      <div class="chart-builder">
        <section class="section">
          <h3>${translate('dataWindow')}</h3>
          <div class="field">
            <ss-select
              selected=${this.dataWindowPreset}
              .options=${Object.values(DataWindowPreset).map(v => ({
                value: v,
                label: translate(`dataWindowPreset.${v}`),
              }))}
              @select-changed=${(e: SelectChangedEvent<string>): void => {
                this.dataWindowPreset = e.detail.value as DataWindowPreset;
              }}
            ></ss-select>
          </div>
          ${this.renderCustomDates()}
        </section>

        <section class="section">
          <h3>${translate('segmentation')}</h3>
          <div class="segmentation-fields">
            <div class="field">
              <label>${translate('segmentationType')}</label>
              <ss-select
                selected=${this.segmentationType}
                .options=${Object.values(SegmentationType).map(v => ({
                  value: v,
                  label: translate(`segmentationType.${v}`),
                }))}
                @select-changed=${(e: SelectChangedEvent<string>): void => {
                  this.segmentationType = e.detail.value as SegmentationType;
                }}
              ></ss-select>
            </div>
            <div class="field">
              <label>${translate('segmentationUnit')}</label>
              <ss-select
                selected=${this.segmentationUnit}
                .options=${Object.values(SegmentationTimeUnit).map(v => ({
                  value: v,
                  label: translate(`segmentationUnit.${v}`),
                }))}
                @select-changed=${(e: SelectChangedEvent<string>): void => {
                  this.segmentationUnit = e.detail.value as SegmentationTimeUnit;
                }}
              ></ss-select>
            </div>
          </div>
        </section>

        <section class="section">
          <h3>${translate('dataPoints')}</h3>
          ${repeat(
            this.dataPoints,
            (_, i) => i,
            (dataPoint, i) => html`
              <div class="data-point-item">
                <div class="data-point-header">
                  <button
                    class="btn btn-danger btn-sm"
                    @click=${(): void => this.removeDataPoint(i)}
                  >
                    ${translate('removeDataPoint')}
                  </button>
                </div>
                <data-point-builder
                  .data-point=${dataPoint}
                  @data-point-updated=${(e: DataPointUpdatedEvent): void =>
                    this.handleDataPointUpdated(i, e)}
                ></data-point-builder>
              </div>
            `,
          )}
          <button class="btn" @click=${this.addDataPoint}>
            ${translate('addDataPoint')}
          </button>
        </section>

        <div class="actions">
          <button
            class="btn btn-primary"
            ?disabled=${this.isLoading}
            @click=${this.handleGenerateChart}
          >
            ${this.isLoading
              ? translate('generating')
              : translate('generateChart')}
          </button>
          ${this.errorMessage
            ? html`<div class="error">${this.errorMessage}</div>`
            : nothing}
        </div>
      </div>
    `;
  }
}
