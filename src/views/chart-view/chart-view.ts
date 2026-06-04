import { html, css, nothing, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { ChartData } from 'chart.js';

import {
  Chart,
  ChartConfigType,
  ChartResponse,
  ChartVersion,
} from 'api-spec/models/Statistic';

import { translate } from '@/lib/Localization';
import { ViewElement } from '@/lib/ViewElement';
import { appState } from '@/state';
import { storage } from '@/lib/Storage';
import { addToast } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';
import { CollapsableToggledEvent } from '@ss/ui/components/ss-collapsable.events';
import { ChartBuiltEvent } from '@/components/chart-builder/chart-builder.events';

import '@ss/ui/components/ss-collapsable';
import '@ss/ui/components/ss-button';
import '@/components/user-header/user-header';
import '@/components/login-form/login-form';
import '@/components/chart-builder/chart-builder';
import '@/components/chart-js/chart-js';

@customElement('chart-view')
export class ChartView extends ViewElement {
  private appState = appState;

  @state() private chartData: ChartData = { labels: [], datasets: [] };
  @state() private chartType: `${ChartConfigType}` = ChartConfigType.LINE;
  @state() private hasChart = false;
  @state() private savedCharts: Chart[] = [];
  @state() private savedChartDataMap: Map<number, ChartData> = new Map();

  static styles = css`
    .view-content {
      margin-top: 1rem;
      padding: 0 1rem;
    }

    .chart-container {
      margin-top: 1.5rem;
      height: 400px;
    }

    .saved-charts {
      margin-top: 2rem;
    }

    .saved-charts-heading {
      font-size: 1.1rem;
      font-weight: bold;
      margin-bottom: 0.75rem;
    }

    .no-saved-charts {
      font-style: italic;
      padding: 0.5rem 0;
    }

    .chart-actions {
      padding: 0.75rem 0;
    }

    .saved-chart-name {
      font-weight: bold;
      margin-bottom: 0.5rem;
    }

    .saved-chart-container {
      height: 300px;
      margin-bottom: 0.75rem;
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.loadCharts();
  }

  private async loadCharts(): Promise<void> {
    this.savedCharts = await storage.getCharts();
    await Promise.all(this.savedCharts.map(chart => this.loadChartData(chart)));
  }

  private async loadChartData(chart: Chart): Promise<void> {
    const result = await storage.createChart?.({
      config: chart.config,
      save: false,
    });
    if (result?.isOk) {
      const newMap = new Map(this.savedChartDataMap);
      newMap.set(chart.id, this.convertResponseToChartData(result.value));
      this.savedChartDataMap = newMap;
    }
  }

  private async handleDeleteChart(id: number): Promise<void> {
    const success = await storage.deleteChart(id);

    if (!success) {
      addToast(translate('failedToDeleteChart'), NotificationType.ERROR);
      return;
    }

    this.savedCharts = this.savedCharts.filter(c => c.id !== id);
    addToast(translate('chartDeleted'), NotificationType.SUCCESS);
  }

  private isPanelOpen(id: number): boolean {
    return this.appState.collapsablePanelState[`savedChart-${id}`] || false;
  }

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
            this.chartType = e.detail.chartType;
            this.hasChart = true;
          }}
        ></chart-builder>
        ${this.hasChart
          ? html`
              <div class="chart-container">
                <chart-js
                  type=${this.chartType}
                  .data=${this.chartData}
                  label=${translate('chartLabel')}
                ></chart-js>
              </div>
            `
          : nothing}
        <div class="saved-charts">
          <div class="saved-charts-heading">${translate('savedCharts')}</div>
          ${this.savedCharts.length === 0
            ? html`<div class="no-saved-charts">
                ${translate('noSavedCharts')}
              </div>`
            : repeat(
                this.savedCharts,
                chart => chart.id,
                chart => html`
                  <ss-collapsable
                    title=${chart.name}
                    panelId=${'savedChart-' + chart.id}
                    ?open=${this.isPanelOpen(chart.id)}
                    @collapsable-toggled=${(
                      e: CollapsableToggledEvent,
                    ): void => {
                      this.dispatchEvent(new CollapsableToggledEvent(e.detail));
                    }}
                  >
                    <div class="saved-chart-name">${chart.name}</div>
                    ${this.savedChartDataMap.has(chart.id)
                      ? html`
                          <div class="saved-chart-container">
                            <chart-js
                              type=${chart.config.version === ChartVersion.V2
                                ? chart.config.type
                                : ChartConfigType.LINE}
                              .data=${this.savedChartDataMap.get(chart.id)!}
                              label=${chart.name}
                            ></chart-js>
                          </div>
                        `
                      : nothing}
                    <div class="chart-actions">
                      <ss-button
                        @click=${(): Promise<void> =>
                          this.handleDeleteChart(chart.id)}
                        >${translate('deleteChart')}</ss-button
                      >
                    </div>
                  </ss-collapsable>
                `,
              )}
        </div>
      </div>
    `;
  }
}
