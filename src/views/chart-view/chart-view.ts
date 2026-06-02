import { html, css, nothing, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { ChartData } from 'chart.js';

import { ChartResponse } from 'api-spec/models/Statistic';

import { translate } from '@/lib/Localization';
import { ViewElement } from '@/lib/ViewElement';
import { appState } from '@/state';
import { ChartBuiltEvent } from '@/components/chart-builder/chart-builder.events';

import '@/components/user-header/user-header';
import '@/components/login-form/login-form';
import '@/components/chart-builder/chart-builder';
import '@/components/chart-js/chart-js';

@customElement('chart-view')
export class ChartView extends ViewElement {
  private appState = appState;

  @state() private chartData: ChartData = { labels: [], datasets: [] };
  @state() private hasChart = false;

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

  private convertResponseToChartData(response: ChartResponse): ChartData {
    return {
      labels: response.segmentedData.map(d => d.segment),
      datasets: [
        {
          label: translate('chartData'),
          data: response.segmentedData.map(d =>
            typeof d.value.value === 'number' ? d.value.value : 0,
          ),
        },
      ],
    };
  }

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
          @chart-built=${(e: ChartBuiltEvent): void => {
            this.chartData = this.convertResponseToChartData(e.detail);
            this.hasChart = true;
          }}
        ></chart-builder>
        ${this.hasChart
          ? html`
              <div class="chart-container">
                <chart-js
                  .data=${this.chartData}
                  label=${translate('chartLabel')}
                ></chart-js>
              </div>
            `
          : nothing}
      </div>
    `;
  }
}
