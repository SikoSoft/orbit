import { MobxLitElement } from '@adobe/lit-mobx';
import { css, html, nothing, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { ChartData } from 'chart.js';

import {
  Chart,
  ChartConfigType,
  ChartResponse,
  ChartVersion,
} from 'api-spec/models/Statistic';

import '@/components/chart-js/chart-js';
import '@/components/dashboard-cards/dashboard-cards';

import { appState } from '@/state';
import { translate } from '@/lib/Localization';
import { storage } from '@/lib/Storage';
import { StorageSource } from '@/models/Storage';
import { IconName } from '@/components/svg-icon/svg-icon.models';
import { DashboardCard } from '@/components/dashboard-cards/dashboard-cards.models';

@customElement('user-dashboard')
export class UserDashboard extends MobxLitElement {
  private state = appState;

  @state() private savedCharts: Chart[] = [];
  @state() private chartDataMap: Map<number, ChartData> = new Map();
  @state() private loadingChartIds: Set<number> = new Set();

  static styles = css`
    .user-dashboard {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .welcome {
      font-size: 1.5rem;
    }

    dashboard-cards {
      margin-top: 1rem;
    }

    .charts {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-top: 1rem;
    }

    .chart-container {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1.5rem;
      border: 2px solid var(--border-color, #ccc);
      border-radius: var(--border-radius, 0.5rem);
      background: var(--box-background-color, #fff);
    }

    .chart-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--box-text-color, var(--text-color, inherit));
    }

    .chart-wrapper {
      position: relative;
      height: 280px;
    }
  `;

  private get cards(): DashboardCard[] {
    return [
      { label: translate('account'), icon: IconName.ACCOUNT, url: 'account' },
      { label: translate('password'), icon: IconName.LOCK, url: 'password' },
      { label: translate('access'), icon: IconName.KEY, url: 'access' },
      {
        label: translate('settings'),
        icon: IconName.SETTINGS,
        url: 'settings',
      },
      {
        label: translate('workspaces'),
        icon: IconName.FOLDER,
        url: 'workspace',
      },
      { label: translate('admin'), icon: IconName.ADMIN, url: '/admin' },
      { label: translate('charts'), icon: IconName.CHARTS, url: '/chart' },
    ];
  }

  private get isCloudStorage(): boolean {
    return this.state.storageSource === StorageSource.CLOUD;
  }

  private get displayName(): string {
    if (!this.state.user) {
      return '';
    }
    const { firstName, lastName, username } = this.state.user;
    const fullName = [firstName, lastName].filter(Boolean).join(' ');
    return fullName || username;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.loadCharts();
  }

  private async loadCharts(): Promise<void> {
    this.savedCharts = await storage.getCharts();
    await Promise.all(this.savedCharts.map(chart => this.loadChartData(chart)));
  }

  private async loadChartData(chart: Chart): Promise<void> {
    this.loadingChartIds = new Set([...this.loadingChartIds, chart.id]);
    const result = await storage.createChart?.({
      config: chart.config,
      save: false,
    });
    const newIds = new Set(this.loadingChartIds);
    newIds.delete(chart.id);
    this.loadingChartIds = newIds;
    if (result?.isOk) {
      const newMap = new Map(this.chartDataMap);
      newMap.set(chart.id, this.convertResponseToChartData(result.value));
      this.chartDataMap = newMap;
    }
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
    return html`
      <div class="user-dashboard">
        ${this.isCloudStorage && this.displayName
          ? html`<p class="welcome">
              ${translate('dashboard.welcome', { name: this.displayName })}
            </p>`
          : nothing}
        <dashboard-cards .cards=${this.cards}></dashboard-cards>

        <div class="charts">
          ${repeat(
            this.savedCharts,
            chart => chart.id,
            chart => {
              const isLoading = this.loadingChartIds.has(chart.id);
              return html`
                <div class="chart-container">
                  <h3 class="chart-title">${chart.name}</h3>
                  ${isLoading || this.chartDataMap.has(chart.id)
                    ? html`
                        <div class="chart-wrapper">
                          <chart-js
                            type=${chart.config.version === ChartVersion.V2
                              ? chart.config.type
                              : ChartConfigType.LINE}
                            .data=${this.chartDataMap.get(chart.id) ??
                            { labels: [], datasets: [] }}
                            ?loading=${isLoading}
                            label=${chart.name}
                          ></chart-js>
                        </div>
                      `
                    : nothing}
                </div>
              `;
            },
          )}
        </div>
      </div>
    `;
  }
}
