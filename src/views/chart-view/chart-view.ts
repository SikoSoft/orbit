import { html, css, nothing, TemplateResult } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import type { ChartData } from 'chart.js';

import { ChartConfigType } from 'api-spec/models/Statistic';

import { translate } from '@/lib/Localization';
import { ViewElement } from '@/lib/ViewElement';
import { appState } from '@/state';
import { convertResponseToChartData } from '@/lib/ChartUtil';
import {
  ChartBuiltEvent,
  ChartGeneratingEvent,
} from '@/components/chart-builder/chart-builder.events';
import { ChartList } from '@/components/chart-list/chart-list';

import '@/components/user-header/user-header';
import '@/components/login-form/login-form';
import '@/components/chart-builder/chart-builder';
import '@/components/chart-js/chart-js';
import '@/components/chart-list/chart-list';

@customElement('chart-view')
export class ChartView extends ViewElement {
  private appState = appState;

  @state() private chartData: ChartData = { labels: [], datasets: [] };
  @state() private chartType: `${ChartConfigType}` = ChartConfigType.LINE;
  @state() private hasChart = false;
  @state() private isChartLoading = false;

  @query('chart-list') private chartList: ChartList | undefined;

  static styles = css`
    .view-content {
      margin-top: 1rem;
      padding: 0 1rem;
    }

    .chart-container {
      margin-top: 1.5rem;
      height: 400px;
    }
  `;

  render(): TemplateResult {
    if (!this.appState.authToken) {
      return html`
        <user-header></user-header>
        <div class="view-content"><login-form></login-form></div>
      `;
    }

    return html`
      <user-header></user-header>
      <div class="view-content">
        <chart-builder
          @chart-generating=${(_e: ChartGeneratingEvent): void => {
            this.isChartLoading = true;
          }}
          @chart-built=${(e: ChartBuiltEvent): void => {
            this.isChartLoading = false;
            const firstOp = e.detail.dataPoints[0]?.operation;
            const label =
              e.detail.chartName ??
              (firstOp
                ? translate(`factOperation.${firstOp}`)
                : undefined);
            this.chartData = convertResponseToChartData(e.detail, label);
            this.chartType = e.detail.chartType;
            this.hasChart = true;
            if (e.detail.saved) {
              this.chartList?.refresh();
            }
          }}
        ></chart-builder>
        ${this.isChartLoading || this.hasChart
          ? html`
              <div class="chart-container">
                <chart-js
                  type=${this.chartType}
                  .data=${this.chartData}
                  ?loading=${this.isChartLoading}
                  label=${translate('chartLabel')}
                ></chart-js>
              </div>
            `
          : nothing}
        <chart-list></chart-list>
      </div>
    `;
  }
}
