import { LitElement, css, html, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import '@/components/svg-icon/svg-icon';

import {
  DashboardCard,
  DashboardCardsProp,
  DashboardCardsProps,
  dashboardCardsProps,
} from './dashboard-cards.models';

@customElement('dashboard-cards')
export class DashboardCards extends LitElement {
  static styles = css`
    .cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
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

    .card-icon {
      width: 3rem;
      height: 3rem;
    }

    .card-label {
      font-size: 1.1rem;
      font-weight: 600;
    }
  `;

  @property({ type: Array })
  [DashboardCardsProp.CARDS]: DashboardCardsProps[DashboardCardsProp.CARDS] =
    dashboardCardsProps[DashboardCardsProp.CARDS].default;

  render(): TemplateResult {
    return html`
      <div class="cards">
        ${repeat(
          this[DashboardCardsProp.CARDS],
          card => card.url,
          (card: DashboardCard) => html`
            <a href=${card.url} class="card">
              <svg-icon
                class="card-icon"
                .name=${card.icon}
                .size=${48}
              ></svg-icon>
              <span class="card-label">${card.label}</span>
            </a>
          `,
        )}
      </div>
    `;
  }
}
