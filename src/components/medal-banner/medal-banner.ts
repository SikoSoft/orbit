import { html, css, TemplateResult, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import { Medal } from 'api-spec/models/Medal';
import { translate } from '@/lib/Localization';
import { MobxLitElement } from '@adobe/lit-mobx';

import {
  MedalBannerProp,
  MedalBannerProps,
  medalBannerProps,
} from './medal-banner.models';
import {
  MedalConfigWithProgress,
  getRingStyles,
  flattenCriteria,
  calculateProgress,
} from '@/components/medal-list/medal-list.models';

import '@/components/prestige-gem/prestige-gem';
import { themed } from '@/lib/Theme';

@themed()
@customElement('medal-banner')
export class MedalBanner extends MobxLitElement {
  static styles = css`
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

  @property({ type: Object })
  [MedalBannerProp.CONFIG]: MedalBannerProps[MedalBannerProp.CONFIG] =
    medalBannerProps[MedalBannerProp.CONFIG].default;

  @property({ type: Object })
  [MedalBannerProp.MEDAL]: MedalBannerProps[MedalBannerProp.MEDAL] =
    medalBannerProps[MedalBannerProp.MEDAL].default;

  @state()
  private progressOpen: boolean = false;

  private handleProgressToggle(): void {
    this.progressOpen = !this.progressOpen;
  }

  private renderFrame(
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

  private renderProgressBreakdown(
    config: MedalConfigWithProgress,
  ): TemplateResult {
    const factCriteria = flattenCriteria(config.criteria).filter(
      c => !config.streakRequests?.some(sr => sr.alias === c.fact),
    );
    const streakRequests = config.streakRequests ?? [];

    return html`
      <div class="progress-breakdown">
        ${repeat(
          factCriteria,
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
                <span class="criterion-values">${current} / ${target} (${pct}%)</span>
                <div class="criterion-bar-wrap">
                  <div class="criterion-bar" style="width: ${pct}%"></div>
                </div>
              </div>
            `;
          },
        )}
        ${repeat(
          streakRequests,
          sr => sr.alias,
          sr => {
            const progress = config.criteriaProgress?.find(
              p => p.alias === sr.alias,
            );
            const current =
              typeof progress?.value === 'number' ? progress.value : 0;
            const target = sr.context.length;
            const pct = Math.min(100, Math.round((current / target) * 100));
            const unitLabel = translate(
              `segmentationUnit.${sr.context.segmentUnit}`,
            ).toLowerCase();
            return html`
              <div class="criterion-row">
                <span class="criterion-label">${sr.alias}</span>
                <span class="criterion-values">
                  ${current} / ${target} ${unitLabel}s (${pct}%)
                </span>
                <div class="criterion-bar-wrap">
                  <div class="criterion-bar" style="width: ${pct}%"></div>
                </div>
              </div>
            `;
          },
        )}
      </div>
    `;
  }

  render(): TemplateResult {
    const config = this[MedalBannerProp.CONFIG];
    const medal: Medal | undefined = this[MedalBannerProp.MEDAL];
    const isEarned = medal !== undefined;
    const prestige = config.prestige ?? 1;

    return html`
      <div class="medal-card box ${isEarned ? '' : 'unearned'}">
        <div class="medal-card-row">
          ${this.renderFrame(config, isEarned)}
          <div class="medal-content">
            ${config.series
              ? html`<div class="medal-series">${config.series}</div>`
              : nothing}
            <div class="medal-name">${config.name ?? ''}</div>
            <div class="medal-description">${config.description ?? ''}</div>
            <div class="medal-meta">
              ${translate('prestige')} ${prestige}
              ${isEarned
                ? html` &bull; ${new Date(medal.awardedAt).toLocaleDateString()}`
                : nothing}
            </div>
            ${!isEarned
              ? html`
                  <button
                    class="progress-toggle"
                    @click=${this.handleProgressToggle}
                  >
                    ${this.progressOpen
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
        ${!isEarned && this.progressOpen
          ? this.renderProgressBreakdown(config)
          : nothing}
      </div>
    `;
  }
}
