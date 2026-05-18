import { LitElement, css, html, TemplateResult } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { Chart } from 'chart.js/auto';
import type { ChartOptions, ChartType } from 'chart.js';

import { ChartJsProp, ChartJsProps, chartJsProps } from './chart-js.models';
import {
  ChartDestroyedEvent,
  ChartInitializedEvent,
  ChartUpdatedEvent,
} from './chart-js.events';

@customElement('chart-js')
export class ChartJsElement extends LitElement {
  @property({ type: String })
  [ChartJsProp.TYPE]: ChartJsProps[ChartJsProp.TYPE] =
    chartJsProps[ChartJsProp.TYPE].default;

  @property({ type: Object, attribute: false })
  [ChartJsProp.DATA]: ChartJsProps[ChartJsProp.DATA] =
    chartJsProps[ChartJsProp.DATA].default;

  @property({ type: Object, attribute: false })
  [ChartJsProp.OPTIONS]: ChartJsProps[ChartJsProp.OPTIONS] =
    chartJsProps[ChartJsProp.OPTIONS].default;

  @property({ type: String })
  [ChartJsProp.LABEL]: ChartJsProps[ChartJsProp.LABEL] =
    chartJsProps[ChartJsProp.LABEL].default;

  @query('canvas')
  private canvas!: HTMLCanvasElement;

  private chart: Chart | null = null;
  private skipNextUpdate = true;

  static styles = css`
    :host {
      display: block;
      position: relative;
      width: 100%;
      height: 100%;
    }

    canvas {
      display: block;
    }
  `;

  firstUpdated(): void {
    this.initChart();
  }

  updated(changedProperties: Map<PropertyKey, unknown>): void {
    if (this.skipNextUpdate) {
      this.skipNextUpdate = false;
      return;
    }

    if (!this.chart) {
      return;
    }

    if (changedProperties.has(ChartJsProp.TYPE)) {
      this.destroyChart();
      this.initChart();
      return;
    }

    let needsUpdate = false;

    if (changedProperties.has(ChartJsProp.DATA)) {
      this.chart.data = this.data;
      needsUpdate = true;
    }

    if (changedProperties.has(ChartJsProp.OPTIONS)) {
      this.chart.options = this.options as ChartOptions<ChartType>;
      needsUpdate = true;
    }

    if (needsUpdate) {
      this.chart.update();
      this.dispatchEvent(new ChartUpdatedEvent());
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.destroyChart();
  }

  private initChart(): void {
    if (!this.canvas) {
      return;
    }

    this.chart = new Chart(this.canvas, {
      type: this.type,
      data: this.data,
      options: this.options,
    });

    this.dispatchEvent(new ChartInitializedEvent(this.chart));
  }

  private destroyChart(): void {
    if (!this.chart) {
      return;
    }

    this.chart.destroy();
    this.chart = null;
    this.dispatchEvent(new ChartDestroyedEvent());
  }

  render(): TemplateResult {
    return html`<canvas aria-label=${this.label} role="img"></canvas>`;
  }
}
