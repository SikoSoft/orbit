import { html, css, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { Streak } from 'api-spec/models/Fact';
import { translate } from '@/lib/Localization';
import { storage } from '@/lib/Storage';
import { addToast } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';

import { MobxLitElement } from '@adobe/lit-mobx';
import { themed } from '@/lib/Theme';

import '@/components/option-list-builder/option-list-builder';
import { OptionListBuilderItem } from '@/components/option-list-builder/option-list-builder.models';
import { OptionListUpdatedEvent } from '@/components/option-list-builder/option-list-builder.events';

import {
  WorkspaceStreakManagerProp,
  workspaceStreakManagerProps,
  WorkspaceStreakManagerProps,
} from './workspace-streak-manager.models';
import { WorkspaceStreaksChangedEvent } from './workspace-streak-manager.events';

@themed()
@customElement('workspace-streak-manager')
export class WorkspaceStreakManager extends MobxLitElement {
  static styles = css`
    :host {
      display: block;
    }

    a {
      display: inline-block;
      margin-bottom: 1rem;
    }

    h3 {
      margin: 1rem 0 0.5rem;
    }
  `;

  @property({ type: Array })
  [WorkspaceStreakManagerProp.STREAKS]: WorkspaceStreakManagerProps[WorkspaceStreakManagerProp.STREAKS] =
    workspaceStreakManagerProps[WorkspaceStreakManagerProp.STREAKS].default;

  @state()
  allStreaks: Streak[] = [];

  connectedCallback(): void {
    super.connectedCallback();
    this.loadStreaks();
  }

  async loadStreaks(): Promise<void> {
    try {
      const { streaks } = await storage.getStreaks();
      this.allStreaks = streaks;
    } catch {
      addToast(translate('failedToLoadStreaks'), NotificationType.ERROR);
    }
  }

  private get availableStreaks(): OptionListBuilderItem[] {
    return this.allStreaks.map(streak => ({
      id: String(streak.id),
      label: streak.name,
    }));
  }

  private handleOptionListUpdated(e: OptionListUpdatedEvent): void {
    this.dispatchEvent(
      new WorkspaceStreaksChangedEvent({
        streaks: e.detail.selected.map(Number),
      }),
    );
  }

  render(): TemplateResult {
    return html`
      <a href="/streaks">${translate('manageStreaks')}</a>

      <option-list-builder
        .available=${this.availableStreaks}
        .selected=${this[WorkspaceStreakManagerProp.STREAKS].map(String)}
        emptyMessage=${translate('noWorkspaceStreaks')}
        @option-list-updated=${this.handleOptionListUpdated}
      >
        <h3 slot="available-heading">${translate('availableStreaks')}</h3>
        <h3 slot="selected-heading">${translate('workspaceStreaks')}</h3>
      </option-list-builder>
    `;
  }
}
