import { html, css, TemplateResult, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { Medal, MedalConfig } from 'api-spec/models/Medal';
import { translate } from '@/lib/Localization';
import { storage } from '@/lib/Storage';
import { ViewElement } from '@/lib/ViewElement';
import { themed } from '@/lib/Theme';

@themed()
@customElement('user-medal-list')
export class UserMedalList extends ViewElement {
  static styles = css`
    .no-medals {
      font-style: italic;
      padding: 1rem;
    }

    .medal-list {
      padding: 1rem;
    }

    .medal-item {
      padding: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .medal-icon {
      max-width: 64px;
      max-height: 64px;
      margin-right: 0.75rem;
    }

    .medal-name {
      font-weight: bold;
    }

    .medal-meta {
      font-size: 0.875rem;
      opacity: 0.75;
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

  renderIcon(config: MedalConfig): TemplateResult | typeof nothing {
    if (!config?.icon) {
      return nothing;
    }

    return html`<div class="medal-icon">
      <img class="medal-icon" src=${config.icon} alt=${config.name ?? ''} />
    </div>`;
  }

  render(): TemplateResult {
    if (this.medals.length === 0) {
      return html`<div class="no-medals">${translate('noMedals')}</div>`;
    }

    return html`
      <div class="medal-list box">
        ${repeat(
          this.medals,
          medal => medal.id,
          medal => {
            const config = this.medalConfigs.find(
              c => c.id === medal.medalConfigId,
            );
            return html`
              <div class="medal-item">
                ${config?.icon ? this.renderIcon(config) : nothing}
                <div class="medal-name">${config?.name ?? ''}</div>
                <div>${config?.description ?? ''}</div>
                <div class="medal-meta">
                  ${config?.series ?? ''} &bull; ${translate('prestige')}:
                  ${config?.prestige ?? 0} &bull;
                  ${new Date(medal.awardedAt).toLocaleDateString()}
                </div>
              </div>
            `;
          },
        )}
      </div>
    `;
  }
}
