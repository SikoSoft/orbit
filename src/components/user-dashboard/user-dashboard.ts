import { MobxLitElement } from '@adobe/lit-mobx';
import { css, html, nothing, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { ChartData } from 'chart.js';

import {
  Chart,
  ChartConfigType,
  ChartVersion,
} from 'api-spec/models/Statistic';
import { Fact, FactResult, Streak, StreakResult } from 'api-spec/models/Fact';

import '@/components/chart-js/chart-js';
import '@/components/dashboard-cards/dashboard-cards';
import '@/components/streak-card/streak-card';
import '@/components/fact-card/fact-card';

import { appState } from '@/state';
import { translate } from '@/lib/Localization';
import { storage } from '@/lib/Storage';
import {
  convertResponseToChartData,
  getChartDatasetLabel,
} from '@/lib/ChartUtil';
import { StorageSource } from '@/models/Storage';
import { IconName } from '@/components/svg-icon/svg-icon.models';
import { DashboardCard } from '@/components/dashboard-cards/dashboard-cards.models';

@customElement('user-dashboard')
export class UserDashboard extends MobxLitElement {
  private state = appState;

  @state() private savedCharts: Chart[] = [];
  @state() private chartDataMap: Map<number, ChartData> = new Map();
  @state() private loadingChartIds: Set<number> = new Set();
  @state() private streaks: Streak[] = [];
  @state() private streakResults: StreakResult[] = [];
  @state() private facts: Fact[] = [];
  @state() private factResults: FactResult[] = [];

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

    .streak-cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .fact-cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .charts-wrapper {
      position: relative;
      margin-top: 1rem;
    }

    .charts-wrapper.scrollable::before {
      content: '';
      position: absolute;
      top: 0;
      left: -2rem;
      bottom: 0;
      width: 2rem;
      background: linear-gradient(
        to left,
        transparent,
        var(--background-color, #fff)
      );
      pointer-events: none;
    }

    .charts-wrapper.scrollable::after {
      content: '';
      position: absolute;
      top: 0;
      right: -2rem;
      bottom: 0;
      width: 2rem;
      background: linear-gradient(
        to right,
        transparent,
        var(--background-color, #fff)
      );
      pointer-events: none;
    }

    .charts {
      display: flex;
      gap: 1.5rem;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      scroll-behavior: smooth;
    }

    .chart-container {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1.5rem;
      border: 2px solid var(--border-color, #ccc);
      border-radius: var(--border-radius, 0.5rem);
      background: var(--box-background-color, #fff);
      flex: 0 0 100%;
      width: 100%;
      box-sizing: border-box;
      scroll-snap-align: start;
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
      { label: translate('charts'), icon: IconName.CHARTS, url: '/chart' },
      { label: translate('streaks'), icon: IconName.LAYERS, url: '/streaks' },
      { label: translate('facts'), icon: IconName.CHARTS, url: '/facts' },
      { label: translate('admin'), icon: IconName.ADMIN, url: '/admin' },
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
    this.loadStreaks();
    this.loadFacts();
  }

  private async loadStreaks(): Promise<void> {
    const data = await storage.getStreaks();
    this.streaks = data.streaks;
    this.streakResults = data.results;
  }

  private getStreakResult(streakId: number): StreakResult | undefined {
    return this.streakResults.find(r => r.streakId === streakId);
  }

  private async loadFacts(): Promise<void> {
    const data = await storage.getFacts();
    this.facts = data.facts;
    this.factResults = data.results;
  }

  private getFactResult(factId: number): FactResult | undefined {
    return this.factResults.find(r => r.factId === factId);
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
      const label = getChartDatasetLabel(chart.config.dataPoints);
      newMap.set(chart.id, convertResponseToChartData(result.value, label));
      this.chartDataMap = newMap;
    }
  }

  private get visibleStreaks(): Streak[] {
    const ids = this.state.activeWorkspaceStreakIds;
    if (ids === null) {
      return this.streaks;
    }
    return this.streaks.filter(s => ids.includes(s.id));
  }

  private get visibleFacts(): Fact[] {
    const ids = this.state.activeWorkspaceFactIds;
    if (ids === null) {
      return this.facts;
    }
    return this.facts.filter(f => ids.includes(f.id));
  }

  private get visibleCharts(): Chart[] {
    const ids = this.state.activeWorkspaceChartIds;
    if (ids === null) {
      return this.savedCharts;
    }
    return ids
      .map(id => this.savedCharts.find(c => c.id === id))
      .filter((c): c is Chart => c !== undefined);
  }

  render(): TemplateResult {
    return html`
      <div class="user-dashboard">
        ${this.isCloudStorage && this.displayName
          ? html`<p class="welcome">
              ${translate('dashboard.welcome', { name: this.displayName })}
            </p>`
          : nothing}
        ${this.visibleStreaks.length > 0
          ? html`
              <div class="streak-cards">
                ${repeat(
                  this.visibleStreaks,
                  streak => streak.id,
                  streak => html`
                    <streak-card
                      .streak=${streak}
                      .result=${this.getStreakResult(streak.id) ?? null}
                    ></streak-card>
                  `,
                )}
              </div>
            `
          : nothing}
        ${this.visibleFacts.length > 0
          ? html`
              <div class="fact-cards">
                ${repeat(
                  this.visibleFacts,
                  fact => fact.id,
                  fact => html`
                    <fact-card
                      .fact=${fact}
                      .result=${this.getFactResult(fact.id) ?? null}
                    ></fact-card>
                  `,
                )}
              </div>
            `
          : nothing}
        <div
          class="charts-wrapper ${this.visibleCharts.length > 1
            ? 'scrollable'
            : ''}"
        >
          <div class="charts">
            ${repeat(
              this.visibleCharts,
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
                              .data=${this.chartDataMap.get(chart.id) ?? {
                                labels: [],
                                datasets: [],
                              }}
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

        <dashboard-cards .cards=${this.cards}></dashboard-cards>
      </div>
    `;
  }
}
