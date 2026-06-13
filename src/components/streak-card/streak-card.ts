import { LitElement, css, html, nothing, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { translate } from '@/lib/Localization';
import { IconName } from '@/components/svg-icon/svg-icon.models';
import '@/components/svg-icon/svg-icon';

import {
  StreakCardProp,
  StreakCardProps,
  streakCardProps,
} from './streak-card.models';

@customElement('streak-card')
export class StreakCard extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.5rem;
      padding: 1.5rem 1rem 1.25rem;
      border: 2px solid var(--border-color, #ccc);
      border-top: 3px solid var(--primary-color, #0066ff);
      border-radius: var(--border-radius, 0.5rem);
      background: var(--box-background-color, #fff);
      color: var(--box-text-color, var(--text-color, inherit));
    }

    .icon-badge {
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      background: color-mix(in srgb, var(--primary-color, #0066ff) 12%, transparent);
      border: 2px solid color-mix(in srgb, var(--primary-color, #0066ff) 35%, transparent);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary-color, #0066ff);
      margin-bottom: 0.25rem;
    }

    .name {
      font-size: 0.9375rem;
      font-weight: 600;
      margin: 0;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .divider {
      width: 2rem;
      height: 2px;
      background: color-mix(in srgb, var(--primary-color, #0066ff) 30%, transparent);
      border-radius: 1px;
      margin: 0.375rem 0;
    }

    .stat-current {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.125rem;
    }

    .stat-pb {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.125rem;
      opacity: 0.55;
      margin-top: 0.25rem;
    }

    .stat-label {
      font-size: 0.625rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .stat-value-current {
      font-size: 2.75rem;
      font-weight: 700;
      line-height: 1;
      color: var(--primary-color, #0066ff);
    }

    .stat-value-pb {
      font-size: 1.125rem;
      font-weight: 600;
      line-height: 1;
    }
  `;

  @property({ type: Object })
  [StreakCardProp.STREAK]: StreakCardProps[StreakCardProp.STREAK] =
    streakCardProps[StreakCardProp.STREAK].default;

  @property({ type: Object })
  [StreakCardProp.RESULT]: StreakCardProps[StreakCardProp.RESULT] =
    streakCardProps[StreakCardProp.RESULT].default;

  render(): TemplateResult | typeof nothing {
    const streak = this[StreakCardProp.STREAK];
    const result = this[StreakCardProp.RESULT];

    if (!streak) {
      return nothing;
    }

    const current = result?.current ?? 0;
    const longest = result?.longest ?? 0;

    return html`
      <div class="card">
        <div class="icon-badge">
          <svg-icon .name=${IconName.FIRE} .size=${22}></svg-icon>
        </div>
        <p class="name">${streak.name}</p>
        <div class="divider"></div>
        <div class="stat-current">
          <span class="stat-label">${translate('current')}</span>
          <span class="stat-value-current">${current}</span>
        </div>
        <div class="stat-pb">
          <span class="stat-label">${translate('pb')}</span>
          <span class="stat-value-pb">${longest}</span>
        </div>
      </div>
    `;
  }
}
