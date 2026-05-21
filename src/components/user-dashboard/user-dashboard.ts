import { MobxLitElement } from '@adobe/lit-mobx';
import { css, html, nothing, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import type { ChartData, ChartOptions } from 'chart.js';

import '@/components/chart-js/chart-js';
import '@/components/dashboard-cards/dashboard-cards';

import { appState } from '@/state';
import { translate } from '@/lib/Localization';
import { StorageSource } from '@/models/Storage';
import { IconName } from '@/components/svg-icon/svg-icon.models';
import { DashboardCard } from '@/components/dashboard-cards/dashboard-cards.models';

const CHART_COLORS = [
  'rgba(54, 162, 235, 0.8)',
  'rgba(255, 99, 132, 0.8)',
  'rgba(75, 192, 192, 0.8)',
  'rgba(255, 205, 86, 0.8)',
  'rgba(153, 102, 255, 0.8)',
];

const CHART_BORDERS = [
  'rgba(54, 162, 235, 1)',
  'rgba(255, 99, 132, 1)',
  'rgba(75, 192, 192, 1)',
  'rgba(255, 205, 86, 1)',
  'rgba(153, 102, 255, 1)',
];

@customElement('user-dashboard')
export class UserDashboard extends MobxLitElement {
  private state = appState;

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

  private get barChartData(): ChartData {
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Items Added',
          data: [12, 19, 8, 15, 22, 17],
          backgroundColor: CHART_COLORS[0],
          borderColor: CHART_BORDERS[0],
          borderWidth: 1,
        },
      ],
    };
  }

  private get barChartOptions(): ChartOptions<'bar'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 5 },
        },
      },
    };
  }

  private get scatterChartData(): ChartData {
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Items Added',
          data: [12, 19, 8, 15, 22, 17],
          backgroundColor: CHART_COLORS[0],
          borderColor: CHART_BORDERS[0],
          borderWidth: 1,
        },
      ],
    };
  }

  private get scatterChartOptions(): ChartOptions<'bar'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 5 },
        },
      },
    };
  }

  private get pieChartData(): ChartData {
    return {
      labels: ['Work', 'Personal', 'Learning', 'Shopping', 'Health'],
      datasets: [
        {
          data: [35, 25, 20, 12, 8],
          backgroundColor: CHART_COLORS,
          borderColor: CHART_BORDERS,
          borderWidth: 1,
        },
      ],
    };
  }

  private get pieChartOptions(): ChartOptions<'pie'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
      },
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
          <div class="chart-container">
            <h3 class="chart-title">${translate('dashboard.scatterChart')}</h3>
            <div class="chart-wrapper">
              <chart-js
                type="scatter"
                .data=${this.scatterChartData}
                .options=${this.scatterChartOptions}
                label=${translate('dashboard.scatterChart')}
              ></chart-js>
            </div>
          </div>

          <div class="chart-container">
            <h3 class="chart-title">${translate('dashboard.activityChart')}</h3>
            <div class="chart-wrapper">
              <chart-js
                type="bar"
                .data=${this.barChartData}
                .options=${this.barChartOptions}
                label=${translate('dashboard.activityChart')}
              ></chart-js>
            </div>
          </div>

          <div class="chart-container">
            <h3 class="chart-title">${translate('dashboard.categoryChart')}</h3>
            <div class="chart-wrapper">
              <chart-js
                type="pie"
                .data=${this.pieChartData}
                .options=${this.pieChartOptions}
                label=${translate('dashboard.categoryChart')}
              ></chart-js>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
