import { html, css, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { Chart } from 'api-spec/models/Statistic';
import { translate } from '@/lib/Localization';
import { storage } from '@/lib/Storage';
import { addToast } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';

import { MobxLitElement } from '@adobe/lit-mobx';
import { themed } from '@/lib/Theme';

import '@/components/option-list-builder/option-list-builder';
import { OptionListBuilderItem } from '@/components/option-list-builder/option-list-builder.models';
import { OptionListUpdatedEvent } from '@/components/option-list-builder/option-list-builder.events';

import {
  WorkspaceChartManagerProp,
  workspaceChartManagerProps,
  WorkspaceChartManagerProps,
} from './workspace-chart-manager.models';
import { WorkspaceChartsChangedEvent } from './workspace-chart-manager.events';

@themed()
@customElement('workspace-chart-manager')
export class WorkspaceChartManager extends MobxLitElement {
  static styles = css`
    :host {
      display: block;
    }

    a {
      display: inline-block;
      margin-bottom: 1rem;
    }

    h3 {
      margin: 1rem 0 0.5rem;
    }
  `;

  @property({ type: Array })
  [WorkspaceChartManagerProp.CHARTS]: WorkspaceChartManagerProps[WorkspaceChartManagerProp.CHARTS] =
    workspaceChartManagerProps[WorkspaceChartManagerProp.CHARTS].default;

  @state()
  allCharts: Chart[] = [];

  connectedCallback(): void {
    super.connectedCallback();
    this.loadCharts();
  }

  async loadCharts(): Promise<void> {
    try {
      this.allCharts = await storage.getCharts();
    } catch {
      addToast(translate('failedToLoadCharts'), NotificationType.ERROR);
    }
  }

  private get availableCharts(): OptionListBuilderItem[] {
    return this.allCharts.map(chart => ({
      id: String(chart.id),
      label: chart.name,
    }));
  }

  private handleOptionListUpdated(e: OptionListUpdatedEvent): void {
    this.dispatchEvent(
      new WorkspaceChartsChangedEvent({
        charts: e.detail.selected.map(Number),
      }),
    );
  }

  render(): TemplateResult {
    return html`
      <a href="/chart">${translate('manageCharts')}</a>

      <option-list-builder
        .available=${this.availableCharts}
        .selected=${this[WorkspaceChartManagerProp.CHARTS].map(String)}
        emptyMessage=${translate('noWorkspaceCharts')}
        @option-list-updated=${this.handleOptionListUpdated}
      >
        <h3 slot="available-heading">${translate('availableCharts')}</h3>
        <h3 slot="selected-heading">${translate('workspaceCharts')}</h3>
      </option-list-builder>
    `;
  }
}
