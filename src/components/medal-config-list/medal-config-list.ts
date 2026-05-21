import { html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { MedalConfig } from 'api-spec/models/Medal';
import { translate } from '@/lib/Localization';
import { storage } from '@/lib/Storage';

import '@ss/ui/components/ss-button';
import '@/components/medal-config-form/medal-config-form';

import { ViewElement } from '@/lib/ViewElement';
import {
  MedalConfigDeletedEvent,
  MedalConfigUpdatedEvent,
} from '../medal-config-form/medal-config-form.events';
import { themed } from '@/lib/Theme';

const defaultMedalConfig: MedalConfig = {
  id: 0,
  name: '',
  description: '',
  series: '',
  recurrence: 0,
  prestige: 0,
  icon: '',
  createdAt: '',
  updatedAt: '',
  criteria: {},
};

@themed()
@customElement('medal-config-list')
export class MedalConfigList extends ViewElement {
  static styles = css`
    .no-medal-configs {
      font-style: italic;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .buttons {
      padding: 1rem;
    }
  `;

  @state()
  medalConfigs: MedalConfig[] = [];

  connectedCallback(): void {
    super.connectedCallback();
    this.loadMedalConfigs();
  }

  async loadMedalConfigs(): Promise<void> {
    const configs = await storage.getMedalConfigs();
    if (configs) {
      this.medalConfigs = configs;
    }
    this.ready = true;
  }

  addMedalConfig(): void {
    this.medalConfigs = [...this.medalConfigs, { ...defaultMedalConfig }];
  }

  handleMedalConfigDeleted(e: MedalConfigDeletedEvent): void {
    this.medalConfigs = this.medalConfigs.filter(config => config.id !== e.detail.id);
  }

  handleMedalConfigUpdated(e: MedalConfigUpdatedEvent, index: number): void {
    this.medalConfigs = this.medalConfigs.map((c, i) => (i === index ? e.detail : c));
  }

  render(): TemplateResult {
    return html`
      <div class="admin-dashboard box">
        ${this.medalConfigs.length > 0
          ? repeat(
              this.medalConfigs,
              config => config.id,
              (config, index) => html`
                <medal-config-form
                  medalConfigId=${config.id}
                  name=${config.name}
                  description=${config.description}
                  series=${config.series}
                  recurrence=${config.recurrence}
                  prestige=${config.prestige}
                  icon=${config.icon}
                  .criteria=${config.criteria}
                  ?open=${!config.id}
                  @medal-config-deleted=${this.handleMedalConfigDeleted}
                  @medal-config-updated=${(e: MedalConfigUpdatedEvent): void =>
                    this.handleMedalConfigUpdated(e, index)}
                ></medal-config-form>
              `,
            )
          : html`
              <div class="no-medal-configs">
                ${translate('noMedalConfigs')}
              </div>
            `}

        <div class="buttons">
          <ss-button @click=${this.addMedalConfig}>
            ${translate('addMedalConfig')}
          </ss-button>
        </div>
      </div>
    `;
  }
}
