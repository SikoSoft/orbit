import { html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { MedalConfig } from 'api-spec/models/Medal';
import { addToast } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';
import { translate } from '@/lib/Localization';
import { storage } from '@/lib/Storage';

import '@ss/ui/components/ss-button';
import '@/components/medal-config-form/medal-config-form';

import { ViewElement } from '@/lib/ViewElement';
import {
  MedalConfigCopiedEvent,
  MedalConfigDeletedEvent,
  MedalConfigUpdatedEvent,
} from '../medal-config-form/medal-config-form.events';
import { themed } from '@/lib/Theme';
import { CollapsableToggledEvent } from '@ss/ui/components/ss-collapsable.events';
import { appState } from '@/state';

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
  factRequests: [],
  streakRequests: [],
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

  private appState = appState;

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

  private generateUniqueName(name: string): string {
    const existingNames = this.medalConfigs.map(c => c.name);
    let counter = 2;
    let candidate = `${name} ${counter}`;
    while (existingNames.includes(candidate)) {
      counter++;
      candidate = `${name} ${counter}`;
    }
    return candidate;
  }

  async handleMedalConfigCopied(e: MedalConfigCopiedEvent): Promise<void> {
    const uniqueName = this.generateUniqueName(e.detail.name);
    const result = await storage.createMedalConfig({ ...e.detail, name: uniqueName });

    if (!result) {
      addToast(translate('failedToCopyMedalConfig'), NotificationType.ERROR);
      return;
    }

    this.dispatchEvent(
      new CollapsableToggledEvent({
        isOpen: true,
        panelId: `medalConfigForm-${result.id}`,
      }),
    );

    this.medalConfigs = [...this.medalConfigs, result];

    await this.updateComplete;

    const forms = this.shadowRoot?.querySelectorAll('medal-config-form');
    if (forms && forms.length > 0) {
      forms[forms.length - 1].scrollIntoView({ behavior: 'smooth' });
    }

    addToast(translate('medalConfigCopied'), NotificationType.SUCCESS);
  }

  handleMedalConfigUpdated(e: MedalConfigUpdatedEvent, index: number): void {
    this.dispatchEvent(
      new CollapsableToggledEvent({
        isOpen: true,
        panelId: `medalConfigForm-${e.detail.id}`,
      }),
    );
    this.medalConfigs = this.medalConfigs.map((c, i) => (i === index ? e.detail : c));
  }

  isPanelOpen(id: number): boolean {
    if (!id) {
      return true;
    }

    return this.appState.collapsablePanelState[`medalConfigForm-${id}`] || false;
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
                  .factRequests=${config.factRequests}
                  .streakRequests=${config.streakRequests ?? []}
                  ?open=${this.isPanelOpen(config.id)}
                  @medal-config-copied=${this.handleMedalConfigCopied}
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
