import { MobxLitElement } from '@adobe/lit-mobx';
import { css, html, nothing, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import type { ChartData, ChartOptions } from 'chart.js';

import '@/components/svg-icon/svg/svg-account';
import '@/components/svg-icon/svg/svg-key';
import '@/components/svg-icon/svg/svg-lock';
import '@/components/svg-icon/svg/svg-settings';
import '@/components/svg-icon/svg/svg-database';
import '@/components/svg-icon/svg/svg-layers';
import '@/components/chart-js/chart-js';

import { appState } from '@/state';
import { translate } from '@/lib/Localization';
import { StorageSource } from '@/models/Storage';

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

    .cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-top: 1rem;
    }

    .card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 2.5rem 1.5rem;
      border: 2px solid var(--border-color, #ccc);
      border-radius: var(--border-radius, 0.5rem);
      background: var(--box-background-color, #fff);
      text-decoration: none;
      color: var(--box-text-color, var(--text-color, inherit));
      cursor: pointer;
      transition:
        background 0.15s ease,
        border-color 0.15s ease;
    }

    .card:hover {
      background: var(--background-hover-color, #f5f5f5);
      border-color: var(--primary-color, #0066ff);
    }

    .card svg-account,
    .card svg-key,
    .card svg-lock,
    .card svg-settings,
    .card svg-database,
    .card svg-layers {
      width: 3rem;
      height: 3rem;
    }

    .card-label {
      font-size: 1.1rem;
      font-weight: 600;
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
        <div class="cards">
          <a href="account" class="card">
            <svg-account></svg-account>
            <span class="card-label">${translate('account')}</span>
          </a>

          <a href="password" class="card">
            <svg-lock></svg-lock>
            <span class="card-label">${translate('password')}</span>
          </a>

          <a href="access" class="card">
            <svg-key></svg-key>
            <span class="card-label">${translate('access')}</span>
          </a>

          <a href="settings" class="card">
            <svg-settings></svg-settings>
            <span class="card-label">${translate('settings')}</span>
          </a>

          <a href="admin/data" class="card">
            <svg-database></svg-database>
            <span class="card-label">${translate('dataManager')}</span>
          </a>

          <a href="admin/entityConfig" class="card">
            <svg-layers></svg-layers>
            <span class="card-label">${translate('entityConfig')}</span>
          </a>
        </div>

        <div class="charts">
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
