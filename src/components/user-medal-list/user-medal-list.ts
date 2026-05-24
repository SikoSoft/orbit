import { html, css, TemplateResult, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import { Medal, MedalConfig } from 'api-spec/models/Medal';
import { translate } from '@/lib/Localization';
import { storage } from '@/lib/Storage';
import { ViewElement } from '@/lib/ViewElement';
import { themed } from '@/lib/Theme';

import '@/components/prestige-gem/prestige-gem';

type RingStyles = Record<string, string>;

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

@themed()
@customElement('user-medal-list')
export class UserMedalList extends ViewElement {
  static styles = css`
    .no-medals {
      font-style: italic;
      padding: 1rem;
    }

    .medal-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1rem;
      padding: 1rem;
    }

    .medal-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      position: relative;
      border-radius: 12px;
      overflow: hidden;
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
  `;

  @state()
  medals: Medal[] = [];

  @state()
  medalConfigs: MedalConfig[] = [];

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
    this.medalConfigs = configs;
    this.ready = true;
  }

  renderFrame(config: MedalConfig | undefined): TemplateResult {
    const prestige = config?.prestige ?? 1;
    return html`
      <div class="medal-frame" style=${styleMap(getRingStyles(prestige))}>
        <div class="medal-icon-inner">
          ${config?.icon
            ? html`<img src=${config.icon} alt=${config.name ?? ''} />`
            : nothing}
        </div>
      </div>
    `;
  }

  render(): TemplateResult {
    if (this.medals.length === 0) {
      return html`<div class="no-medals">${translate('noMedals')}</div>`;
    }

    return html`
      <div class="medal-grid">
        ${repeat(
          this.medals,
          medal => medal.id,
          medal => {
            const config = this.medalConfigs.find(
              c => c.id === medal.medalConfigId,
            );
            const prestige = config?.prestige ?? 1;
            return html`
              <div class="medal-card box">
                ${this.renderFrame(config)}
                <div class="medal-content">
                  ${config?.series
                    ? html`<div class="medal-series">${config.series}</div>`
                    : nothing}
                  <div class="medal-name">${config?.name ?? ''}</div>
                  <div class="medal-description">
                    ${config?.description ?? ''}
                  </div>
                  <div class="medal-meta">
                    ${translate('prestige')} ${prestige} &bull;
                    ${new Date(medal.awardedAt).toLocaleDateString()}
                  </div>
                </div>
                <div class="medal-gem">
                  <prestige-gem prestige=${prestige}></prestige-gem>
                </div>
              </div>
            `;
          },
        )}
      </div>
    `;
  }
}
