import { html, css, nothing, TemplateResult } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import type { ChartData } from 'chart.js';

import { ChartConfig, ChartConfigType } from 'api-spec/models/Statistic';

import { translate } from '@/lib/Localization';
import { ViewElement } from '@/lib/ViewElement';
import { appState } from '@/state';
import {
  convertResponseToChartData,
  getChartDatasetLabel,
} from '@/lib/ChartUtil';
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
  @state() private initialChartConfig: ChartConfig | undefined;
  @state() private initialChartName = '';

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

  connectedCallback(): void {
    super.connectedCallback();
    const params = new URLSearchParams(window.location.search);
    const configParam = params.get('config');
    if (configParam) {
      try {
        this.initialChartConfig = JSON.parse(configParam) as ChartConfig;
      } catch {
        this.initialChartConfig = undefined;
      }
    }
    this.initialChartName = params.get('name') ?? '';
  }

  private handleChartBuilt(e: ChartBuiltEvent): void {
    this.isChartLoading = false;
    const label =
      e.detail.chartName ?? getChartDatasetLabel(e.detail.dataPoints);
    this.chartData = convertResponseToChartData(e.detail, label);
    this.chartType = e.detail.chartType;
    this.hasChart = true;
    if (e.detail.saved) {
      this.chartList?.refresh();
    }
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
          .initialConfig=${this.initialChartConfig}
          initialName=${this.initialChartName}
          @chart-generating=${(_e: ChartGeneratingEvent): void => {
            this.isChartLoading = true;
          }}
          @chart-built=${(e: ChartBuiltEvent): void =>
            this.handleChartBuilt(e)}
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
