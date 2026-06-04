import { html, css, nothing, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { MobxLitElement } from '@adobe/lit-mobx';
import type { ChartData } from 'chart.js';

import {
  Chart,
  ChartConfigType,
  ChartVersion,
} from 'api-spec/models/Statistic';

import { translate } from '@/lib/Localization';
import { appState } from '@/state';
import { storage } from '@/lib/Storage';
import { addToast } from '@/lib/Util';
import { convertResponseToChartData } from '@/lib/ChartUtil';
import { NotificationType } from '@ss/ui/components/notification-provider.models';
import { CollapsableToggledEvent } from '@ss/ui/components/ss-collapsable.events';
import { ConfirmationAcceptedEvent } from '@ss/ui/components/confirmation-modal.events';

import '@ss/ui/components/ss-collapsable';
import '@ss/ui/components/ss-button';
import '@ss/ui/components/confirmation-modal';
import '@/components/chart-js/chart-js';

@customElement('chart-list')
export class ChartList extends MobxLitElement {
  private appState = appState;

  @state() private savedCharts: Chart[] = [];
  @state() private savedChartDataMap: Map<number, ChartData> = new Map();
  @state() private confirmDeleteChartId: number | null = null;

  static styles = css`
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
    void this.loadCharts();
  }

  refresh(): void {
    void this.loadCharts();
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
      newMap.set(chart.id, convertResponseToChartData(result.value));
      this.savedChartDataMap = newMap;
    }
  }

  private handleDeleteChartRequested(id: number): void {
    this.confirmDeleteChartId = id;
  }

  private async handleDeleteChartConfirmed(): Promise<void> {
    const id = this.confirmDeleteChartId;
    this.confirmDeleteChartId = null;

    if (id === null) {
      return;
    }

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

  render(): TemplateResult {
    return html`
      <confirmation-modal
        message=${translate('confirmDeleteChart')}
        ?open=${this.confirmDeleteChartId !== null}
        @confirmation-accepted=${(_e: ConfirmationAcceptedEvent): Promise<void> =>
          this.handleDeleteChartConfirmed()}
        @confirmation-declined=${(): void => {
          this.confirmDeleteChartId = null;
        }}
      ></confirmation-modal>
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
                  @collapsable-toggled=${(e: CollapsableToggledEvent): void => {
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
                      @click=${(): void =>
                        this.handleDeleteChartRequested(chart.id)}
                      >${translate('deleteChart')}</ss-button
                    >
                  </div>
                </ss-collapsable>
              `,
            )}
      </div>
    `;
  }
}
