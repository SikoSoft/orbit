import { html, css, TemplateResult, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { Medal } from 'api-spec/models/Medal';
import { translate } from '@/lib/Localization';
import { storage } from '@/lib/Storage';
import { ViewElement } from '@/lib/ViewElement';
import { themed } from '@/lib/Theme';

import {
  MedalConfigWithProgress,
  MedalDisplayItem,
  SortField,
  SortDir,
  StatusFilter,
  PRESTIGE_LEVELS,
  SORT_FIELDS,
  STATUS_FILTERS,
} from './medal-list.models';

import '@/components/prestige-gem/prestige-gem';
import '@/components/medal-banner/medal-banner';

@themed()
@customElement('medal-list')
export class MedalList extends ViewElement {
  static styles = css`
    .no-medals {
      font-style: italic;
      padding: 1rem;
    }

    .controls {
      padding: 1rem 1rem 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .filter-row {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      flex-wrap: wrap;
    }

    .row-label {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      opacity: 0.5;
      min-width: 48px;
    }

    .prestige-btn {
      width: 28px;
      height: 28px;
      border: 2px solid transparent;
      border-radius: 6px;
      background: none;
      cursor: pointer;
      padding: 2px;
      opacity: 0.3;
      transition:
        opacity 0.15s,
        border-color 0.15s;
    }

    .prestige-btn:hover {
      opacity: 0.65;
    }

    .prestige-btn.active {
      opacity: 1;
      border-color: var(--primary-color, #888);
    }

    .series-select {
      font-size: 0.85rem;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      border: 1px solid rgba(128, 128, 128, 0.3);
      background: transparent;
      color: inherit;
      cursor: pointer;
    }

    .sort-btn {
      font-size: 0.78rem;
      padding: 0.2rem 0.55rem;
      border-radius: 4px;
      border: 1px solid transparent;
      background: none;
      color: inherit;
      cursor: pointer;
      opacity: 0.5;
      transition:
        opacity 0.15s,
        border-color 0.15s;
    }

    .sort-btn:hover {
      opacity: 0.85;
    }

    .sort-btn.active {
      opacity: 1;
      border-color: var(--primary-color, #888);
    }

    .status-btn {
      font-size: 0.78rem;
      padding: 0.2rem 0.55rem;
      border-radius: 4px;
      border: 1px solid transparent;
      background: none;
      color: inherit;
      cursor: pointer;
      opacity: 0.5;
      transition:
        opacity 0.15s,
        border-color 0.15s;
    }

    .status-btn:hover {
      opacity: 0.85;
    }

    .status-btn.active {
      opacity: 1;
      border-color: var(--primary-color, #888);
    }

    .medal-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1rem;
      padding: 1rem;
    }
  `;

  @state()
  medals: Medal[] = [];

  @state()
  medalConfigs: MedalConfigWithProgress[] = [];

  @state()
  filterPrestige: number[] = [];

  @state()
  filterSeries: string = '';

  @state()
  filterStatus: StatusFilter = 'all';

  @state()
  sortBy: SortField = 'name';

  @state()
  sortDir: SortDir = 'asc';

  connectedCallback(): void {
    super.connectedCallback();
    this.loadData();
  }

  async loadData(): Promise<void> {
    const [medals, configs] = await Promise.all([
      storage.getMedals(),
      storage.getMedalConfigs(),
    ]);
    this.medals = medals;
    this.medalConfigs = configs as MedalConfigWithProgress[];
    this.ready = true;
  }

  get allEntries(): MedalDisplayItem[] {
    return this.medalConfigs.map(config => ({
      config,
      medal: this.medals.find(m => m.medalConfigId === config.id),
    }));
  }

  get availableSeries(): string[] {
    const seriesSet = new Set<string>();
    this.medalConfigs.forEach(config => {
      if (config.series) {
        seriesSet.add(config.series);
      }
    });
    return Array.from(seriesSet).sort();
  }

  get filteredAndSortedEntries(): MedalDisplayItem[] {
    let result = this.allEntries;

    if (this.filterStatus === 'earned') {
      result = result.filter(item => item.medal !== undefined);
    } else if (this.filterStatus === 'inProgress') {
      result = result.filter(item => item.medal === undefined);
    }

    if (this.filterPrestige.length > 0) {
      result = result.filter(item =>
        this.filterPrestige.includes(item.config.prestige),
      );
    }

    if (this.filterSeries) {
      result = result.filter(item => item.config.series === this.filterSeries);
    }

    return [...result].sort((a, b) => {
      let cmp = 0;
      if (this.sortBy === 'name') {
        cmp = (a.config.name ?? '').localeCompare(b.config.name ?? '');
      } else if (this.sortBy === 'prestige') {
        cmp = (a.config.prestige ?? 0) - (b.config.prestige ?? 0);
      } else {
        const timeA = a.medal ? new Date(a.medal.awardedAt).getTime() : -1;
        const timeB = b.medal ? new Date(b.medal.awardedAt).getTime() : -1;
        cmp = timeA - timeB;
      }
      return this.sortDir === 'asc' ? cmp : -cmp;
    });
  }

  private togglePrestige(level: number): void {
    if (this.filterPrestige.includes(level)) {
      this.filterPrestige = this.filterPrestige.filter(p => p !== level);
    } else {
      this.filterPrestige = [...this.filterPrestige, level];
    }
  }

  private handleSeriesChange(e: Event): void {
    this.filterSeries = (e.target as HTMLSelectElement).value;
  }

  private handleSort(field: SortField): void {
    if (this.sortBy === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDir = 'asc';
    }
  }

  private getSortFieldLabel(field: SortField): string {
    if (field === 'name') {
      return translate('name');
    }
    if (field === 'prestige') {
      return translate('prestige');
    }
    return translate('dateAwarded');
  }

  private getStatusFilterLabel(status: StatusFilter): string {
    if (status === 'earned') {
      return translate('earned');
    }
    if (status === 'inProgress') {
      return translate('inProgress');
    }
    return translate('allStatuses');
  }

  private handleTogglePrestige(level: number): void {
    this.togglePrestige(level);
  }

  private handleStatusFilter(s: StatusFilter): void {
    this.filterStatus = s;
  }

  private handleSortField(f: SortField): void {
    this.handleSort(f);
  }

  private renderControls(): TemplateResult {
    const series = this.availableSeries;
    return html`
      <div class="controls">
        <div class="filter-row">
          <span class="row-label">${translate('status')}</span>
          ${repeat(
            STATUS_FILTERS,
            s => s,
            s => html`
              <button
                class="status-btn ${this.filterStatus === s ? 'active' : ''}"
                @click=${(): void => {
                  this.handleStatusFilter(s);
                }}
              >
                ${this.getStatusFilterLabel(s)}
              </button>
            `,
          )}
        </div>
        <div class="filter-row">
          <span class="row-label">${translate('prestige')}</span>
          ${repeat(
            PRESTIGE_LEVELS,
            p => p,
            p => html`
              <button
                class="prestige-btn ${this.filterPrestige.includes(p)
                  ? 'active'
                  : ''}"
                title="${translate('prestige')} ${p}"
                @click=${(): void => {
                  this.handleTogglePrestige(p);
                }}
              >
                <prestige-gem prestige=${p}></prestige-gem>
              </button>
            `,
          )}
        </div>
        ${series.length > 0
          ? html`
              <div class="filter-row">
                <span class="row-label">${translate('series')}</span>
                <select
                  class="series-select"
                  @change=${this.handleSeriesChange}
                >
                  <option value="">${translate('allSeries')}</option>
                  ${repeat(
                    series,
                    s => s,
                    s => html`
                      <option value=${s} ?selected=${this.filterSeries === s}>
                        ${s}
                      </option>
                    `,
                  )}
                </select>
              </div>
            `
          : nothing}
        <div class="filter-row">
          <span class="row-label">${translate('sort')}</span>
          ${repeat(
            SORT_FIELDS,
            f => f,
            f => html`
              <button
                class="sort-btn ${this.sortBy === f ? 'active' : ''}"
                @click=${(): void => {
                  this.handleSortField(f);
                }}
              >
                ${this.getSortFieldLabel(f)}${this.sortBy === f
                  ? this.sortDir === 'asc'
                    ? ' ↑'
                    : ' ↓'
                  : ''}
              </button>
            `,
          )}
        </div>
      </div>
    `;
  }

  render(): TemplateResult {
    if (this.medalConfigs.length === 0) {
      return html`<div class="no-medals">
        ${translate('noMedalsAvailable')}
      </div>`;
    }

    const entries = this.filteredAndSortedEntries;

    return html`
      ${this.renderControls()}
      ${entries.length === 0
        ? html`<div class="no-medals">${translate('noMedalsMatchFilter')}</div>`
        : html`
            <div class="medal-grid">
              ${repeat(
                entries,
                item => item.config.id,
                item =>
                  html`<medal-banner
                    .config=${item.config}
                    .medal=${item.medal}
                  ></medal-banner>`,
              )}
            </div>
          `}
    `;
  }
}
