import { LitElement, css, html, nothing, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { translate } from '@/lib/Localization';
import { IconName } from '@/components/svg-icon/svg-icon.models';
import '@/components/svg-icon/svg-icon';

import { FactCardProp, FactCardProps, factCardProps } from './fact-card.models';

@customElement('fact-card')
export class FactCard extends LitElement {
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

    .stat-value {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.125rem;
    }

    .stat-label {
      font-size: 0.625rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .stat-number {
      font-size: 2.75rem;
      font-weight: 700;
      line-height: 1;
      color: var(--primary-color, #0066ff);
    }
  `;

  @property({ type: Object })
  [FactCardProp.FACT]: FactCardProps[FactCardProp.FACT] =
    factCardProps[FactCardProp.FACT].default;

  @property({ type: Object })
  [FactCardProp.RESULT]: FactCardProps[FactCardProp.RESULT] =
    factCardProps[FactCardProp.RESULT].default;

  render(): TemplateResult | typeof nothing {
    const fact = this[FactCardProp.FACT];
    const result = this[FactCardProp.RESULT];

    if (!fact) {
      return nothing;
    }

    const value = result?.value ?? 0;

    return html`
      <div class="card">
        <div class="icon-badge">
          <svg-icon .name=${IconName.CHARTS} .size=${22}></svg-icon>
        </div>
        <p class="name">${fact.name}</p>
        <div class="divider"></div>
        <div class="stat-value">
          <span class="stat-label">${translate('factValue')}</span>
          <span class="stat-number">${value}</span>
        </div>
      </div>
    `;
  }
}
