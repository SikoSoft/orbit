import { html, css, TemplateResult, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  Medal,
  MedalConfig,
  Criterion,
  Criteria,
} from 'api-spec/models/Medal';
import { translate } from '@/lib/Localization';
import { storage } from '@/lib/Storage';
import { ViewElement } from '@/lib/ViewElement';
import { themed } from '@/lib/Theme';

import '@/components/prestige-gem/prestige-gem';

interface CriteriaProgress {
  alias: string;
  value: string | number | boolean;
}

interface MedalConfigWithProgress extends MedalConfig {
  criteriaProgress?: CriteriaProgress[];
}

interface MedalDisplayItem {
  config: MedalConfigWithProgress;
  medal: Medal | undefined;
}

type RingStyles = Record<string, string>;
type SortField = 'name' | 'prestige' | 'dateAwarded';
type SortDir = 'asc' | 'desc';
type StatusFilter = 'all' | 'earned' | 'inProgress';

const PRESTIGE_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const SORT_FIELDS: SortField[] = ['name', 'prestige', 'dateAwarded'];
const STATUS_FILTERS: StatusFilter[] = ['all', 'earned', 'inProgress'];

function getRingStyles(prestige: number): RingStyles {
  if (prestige <= 2) {
    return {
      '--ring-a': '#f5c870',
      '--ring-b': '#7b3f10',
      '--ring-c': '#c07820',
      '--ring-glow': 'rgba(176,104,32,0.65)',
    };
  }
  if (prestige <= 4) {
    return {
      '--ring-a': '#eeeeee',
      '--ring-b': '#606060',
      '--ring-c': '#b0b0b0',
      '--ring-glow': 'rgba(120,120,120,0.45)',
    };
  }
  if (prestige <= 6) {
    return {
      '--ring-a': '#fff580',
      '--ring-b': '#886000',
      '--ring-c': '#c8a800',
      '--ring-glow': 'rgba(200,168,0,0.65)',
    };
  }
  if (prestige <= 9) {
    return {
      '--ring-a': '#c8f0ff',
      '--ring-b': '#1070a0',
      '--ring-c': '#60c8e8',
      '--ring-glow': 'rgba(24,128,176,0.65)',
    };
  }
  return {
    '--ring-a': '#f0e8ff',
    '--ring-b': '#503880',
    '--ring-c': '#b8a0d8',
    '--ring-glow': 'rgba(110,90,180,0.55)',
  };
}

function flattenCriteria(criteria: Criterion | Criteria): Criterion[] {
  if ('fact' in criteria) {
    return [criteria as Criterion];
  }
  const c = criteria as Criteria;
  const children = [...(c.all ?? []), ...(c.any ?? [])];
  return children.flatMap(flattenCriteria);
}

function calculateProgress(config: MedalConfigWithProgress): number {
  if (!config.criteriaProgress || config.criteriaProgress.length === 0) {
    return 0;
  }

  const criteria = flattenCriteria(config.criteria);
  if (criteria.length === 0) {
    return 0;
  }

  let totalProgress = 0;
  let count = 0;

  for (const criterion of criteria) {
    const progressEntry = config.criteriaProgress.find(
      p => p.alias === criterion.fact,
    );
    if (!progressEntry) {
      continue;
    }
    const current =
      typeof progressEntry.value === 'number' ? progressEntry.value : 0;
    const target =
      typeof criterion.value === 'number' && criterion.value > 0
        ? criterion.value
        : 1;
    totalProgress += Math.min(1, current / target);
    count++;
  }

  return count > 0 ? totalProgress / count : 0;
}

@themed()
@customElement('user-medal-list')
export class UserMedalList extends ViewElement {
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

    .medal-card {
      display: flex;
      flex-direction: column;
      padding: 1rem;
      position: relative;
      border-radius: 12px;
      overflow: hidden;
    }

    .medal-card.unearned {
      opacity: 0.8;
    }

    .medal-frame {
      position: relative;
      width: 88px;
      height: 88px;
      min-width: 88px;
      border-radius: 50%;
      padding: 6px;
      box-sizing: border-box;
      background: linear-gradient(
        135deg,
        var(--ring-a) 0%,
        var(--ring-b) 40%,
        var(--ring-c) 60%,
        var(--ring-b) 80%,
        var(--ring-a) 100%
      );
      box-shadow:
        0 4px 18px var(--ring-glow),
        inset 0 1px 0 rgba(255, 255, 255, 0.25);
    }

    .medal-frame::after {
      content: '';
      position: absolute;
      top: 4px;
      left: 16px;
      width: 30px;
      height: 26px;
      background: radial-gradient(
        ellipse,
        rgba(255, 255, 255, 0.58) 0%,
        rgba(255, 255, 255, 0) 100%
      );
      border-radius: 50%;
      pointer-events: none;
    }

    .medal-icon-inner {
      position: relative;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      overflow: hidden;
      background: #10101a;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .medal-icon-inner img {
      width: 78%;
      height: 78%;
      object-fit: contain;
    }

    .medal-progress-fill {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      background: rgba(255, 255, 255, 0.3);
      pointer-events: none;
      transition: height 0.4s ease;
    }

    .medal-progress-label {
      position: absolute;
      bottom: 6px;
      left: 0;
      width: 100%;
      text-align: center;
      font-size: 0.65rem;
      font-weight: 800;
      color: #fff;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
      pointer-events: none;
      line-height: 1;
    }

    .medal-content {
      flex: 1;
      min-width: 0;
    }

    .medal-series {
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--primary-color);
      margin-bottom: 0.2rem;
    }

    .medal-name {
      font-weight: 700;
      font-size: 1rem;
      line-height: 1.25;
    }

    .medal-description {
      font-size: 0.82rem;
      opacity: 0.72;
      margin-top: 0.25rem;
      line-height: 1.4;
    }

    .medal-meta {
      font-size: 0.7rem;
      opacity: 0.5;
      margin-top: 0.5rem;
    }

    .medal-gem {
      position: absolute;
      top: 0.6rem;
      right: 0.6rem;
      width: 22px;
      height: 22px;
    }

    prestige-gem {
      display: block;
      width: 100%;
      height: 100%;
    }

    .medal-card-row {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .progress-toggle {
      display: inline-block;
      font-size: 0.75rem;
      color: var(--primary-color, #888);
      background: none;
      border: none;
      padding: 0;
      margin-top: 0.35rem;
      cursor: pointer;
      text-decoration: underline;
      text-underline-offset: 2px;
      opacity: 0.85;
    }

    .progress-toggle:hover {
      opacity: 1;
    }

    .progress-breakdown {
      margin-top: 0.75rem;
      padding-top: 0.65rem;
      border-top: 1px solid rgba(128, 128, 128, 0.2);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .criterion-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 0.2rem 0.5rem;
      align-items: center;
    }

    .criterion-label {
      font-size: 0.75rem;
      opacity: 0.8;
      grid-column: 1;
    }

    .criterion-values {
      font-size: 0.72rem;
      opacity: 0.65;
      text-align: right;
      grid-column: 2;
      white-space: nowrap;
    }

    .criterion-bar-wrap {
      grid-column: 1 / -1;
      height: 4px;
      background: rgba(128, 128, 128, 0.18);
      border-radius: 2px;
      overflow: hidden;
    }

    .criterion-bar {
      height: 100%;
      background: var(--primary-color, #888);
      border-radius: 2px;
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

  @state()
  progressOpenIds: Set<number> = new Set();

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

  private toggleProgress(id: number): void {
    const next = new Set(this.progressOpenIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.progressOpenIds = next;
  }

  private renderProgressBreakdown(
    config: MedalConfigWithProgress,
  ): TemplateResult {
    const criteria = flattenCriteria(config.criteria);
    return html`
      <div class="progress-breakdown">
        ${repeat(
          criteria,
          c => c.fact,
          c => {
            const progress = config.criteriaProgress?.find(
              p => p.alias === c.fact,
            );
            const current =
              typeof progress?.value === 'number' ? progress.value : 0;
            const target =
              typeof c.value === 'number' && c.value > 0 ? c.value : 1;
            const pct = Math.min(100, Math.round((current / target) * 100));
            return html`
              <div class="criterion-row">
                <span class="criterion-label">${c.fact}</span>
                <span class="criterion-values"
                  >${current} / ${target} (${pct}%)</span
                >
                <div class="criterion-bar-wrap">
                  <div
                    class="criterion-bar"
                    style="width: ${pct}%"
                  ></div>
                </div>
              </div>
            `;
          },
        )}
      </div>
    `;
  }

  renderFrame(
    config: MedalConfigWithProgress,
    isEarned: boolean,
  ): TemplateResult {
    const prestige = config?.prestige ?? 1;
    const progress = isEarned ? 1 : calculateProgress(config);
    const progressPct = Math.round(progress * 100);

    return html`
      <div class="medal-frame" style=${styleMap(getRingStyles(prestige))}>
        <div class="medal-icon-inner">
          ${config?.icon
            ? html`<img
                src=${config.icon}
                alt=${config.name ?? ''}
                crossorigin="anonymous"
              />`
            : nothing}
          ${!isEarned
            ? html`
                <div
                  class="medal-progress-fill"
                  style="height: ${progressPct}%"
                ></div>
                <div class="medal-progress-label">${progressPct}%</div>
              `
            : nothing}
        </div>
      </div>
    `;
  }

  renderControls(): TemplateResult {
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
                  this.filterStatus = s;
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
                  this.togglePrestige(p);
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
                  @change=${(e: Event): void => {
                    this.handleSeriesChange(e);
                  }}
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
                  this.handleSort(f);
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
                item => {
                  const { config, medal } = item;
                  const isEarned = medal !== undefined;
                  const prestige = config.prestige ?? 1;
                  const isProgressOpen = this.progressOpenIds.has(config.id);
                  return html`
                    <div
                      class="medal-card box ${isEarned ? '' : 'unearned'}"
                    >
                      <div class="medal-card-row">
                        ${this.renderFrame(config, isEarned)}
                        <div class="medal-content">
                          ${config.series
                            ? html`<div class="medal-series">
                                ${config.series}
                              </div>`
                            : nothing}
                          <div class="medal-name">${config.name ?? ''}</div>
                          <div class="medal-description">
                            ${config.description ?? ''}
                          </div>
                          <div class="medal-meta">
                            ${translate('prestige')} ${prestige}
                            ${isEarned
                              ? html` &bull;
                                  ${new Date(
                                    medal.awardedAt,
                                  ).toLocaleDateString()}`
                              : nothing}
                          </div>
                          ${!isEarned
                            ? html`
                                <button
                                  class="progress-toggle"
                                  @click=${(): void => {
                                    this.toggleProgress(config.id);
                                  }}
                                >
                                  ${isProgressOpen
                                    ? translate('hideProgress')
                                    : translate('showProgress')}
                                </button>
                              `
                            : nothing}
                        </div>
                        <div class="medal-gem">
                          <prestige-gem prestige=${prestige}></prestige-gem>
                        </div>
                      </div>
                      ${!isEarned && isProgressOpen
                        ? this.renderProgressBreakdown(config)
                        : nothing}
                    </div>
                  `;
                },
              )}
            </div>
          `}
    `;
  }
}
