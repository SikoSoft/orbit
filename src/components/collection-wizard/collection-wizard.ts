import { css, html, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { translate } from '@/lib/Localization';
import { storage } from '@/lib/Storage';
import { addToast } from '@/lib/Util';
import { navigate } from '@/lib/Router';
import { appState } from '@/state';
import { NotificationType } from '@ss/ui/components/notification-provider.models';
import { ExportDataContents } from 'api-spec/models/Data';
import { DataType } from 'api-spec/models/Entity';
import { ListConfig } from 'api-spec/models/List';
import { defaultSettings } from 'api-spec/models/Setting';

import collectionsData from '@/lib/data/wizard/collections.json';

interface CollectionOption {
  id: number;
  name: string;
  description: string;
  icon: string;
}

const collectionIcons: Record<number, string> = {
  1: '🃏',
  2: '🪙',
  3: '📚',
  4: '💿',
  5: '🤖',
  6: '🎮',
  7: '📮',
  8: '⌚',
  9: '👟',
  10: '🎨',
};

const collectionOptions: CollectionOption[] = collectionsData.entityConfig.map(
  ec => ({
    id: ec.id,
    name: ec.name,
    description: ec.description,
    icon: collectionIcons[ec.id] ?? '📦',
  }),
);

@customElement('collection-wizard')
export class CollectionWizard extends MobxLitElement {
  private state = appState;

  static styles = css`
    :host {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 500;
      background-color: var(--background-color, #fff);
      overflow-y: auto;
    }

    .wizard {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100%;
      padding: 3rem 1.5rem;
      box-sizing: border-box;
    }

    .header {
      text-align: center;
      margin-bottom: 2.5rem;
    }

    h1 {
      font-size: 2rem;
      margin: 0 0 0.5rem;
      color: var(--text-color, #111);
    }

    .subtitle {
      color: var(--muted-text-color, #666);
      font-size: 1rem;
      margin: 0;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 1rem;
      width: 100%;
      max-width: 720px;
    }

    .card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1.5rem 1rem;
      border: 1px solid var(--border-color, #ddd);
      border-radius: 0.5rem;
      background-color: var(--box-background-color, #fafafa);
      cursor: pointer;
      text-align: center;
      transition: border-color 0.15s, box-shadow 0.15s, opacity 0.15s;

      &:hover {
        border-color: var(--accent-color, #555);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      &.loading {
        opacity: 0.5;
        pointer-events: none;
      }
    }

    .icon {
      font-size: 2.5rem;
      line-height: 1;
    }

    .name {
      font-weight: 600;
      font-size: 0.95rem;
      color: var(--text-color, #111);
    }

    .description {
      font-size: 0.75rem;
      color: var(--muted-text-color, #666);
      line-height: 1.4;
    }

    .skip {
      margin-top: 2rem;
    }
  `;

  @state()
  private isLoading: boolean = false;

  private async handleSelectCollection(id: number): Promise<void> {
    if (this.isLoading) {
      return;
    }

    const entityConfig = collectionsData.entityConfig.find(ec => ec.id === id);
    const listConfig = collectionsData.listConfig.find(lc =>
      lc.filter.includeTypes.includes(id),
    );

    if (!entityConfig || !listConfig) {
      addToast(translate('collectionWizard.notFound'), NotificationType.ERROR);
      return;
    }

    const importPayload: ExportDataContents = {
      meta: { version: '1', date: new Date().toISOString() },
      entityConfigs: [
        {
          id: entityConfig.id,
          name: entityConfig.name,
          description: entityConfig.description,
          revisionOf: entityConfig.revisionOf,
          allowPropertyOrdering: entityConfig.allowPropertyOrdering,
          aiEnabled: entityConfig.aiEnabled,
          aiIdentifyPrompt: entityConfig.aiIdentifyPrompt,
          properties: entityConfig.properties.map(p => ({
            id: p.id,
            name: p.name,
            dataType: p.dataType as DataType,
            defaultValue: p.defaultValue,
            required: p.required,
            repeat: p.repeat,
            allowed: p.allowed,
            hidden: p.hidden,
            prefix: p.prefix,
            suffix: p.suffix,
          })),
        },
      ],
      entities: [],
      listConfigs: [
        {
          ...(listConfig as unknown as ListConfig),
          setting: { ...defaultSettings, ...listConfig.setting },
        },
      ],
    };

    this.isLoading = true;
    try {
      const result = await storage.import(importPayload);

      if (!result) {
        addToast(translate('collectionWizard.importFailed'), NotificationType.ERROR);
        return;
      }

      const [entityConfigs, listConfigs] = await Promise.all([
        storage.getEntityConfigs(),
        storage.getListConfigs(),
      ]);

      this.state.setEntityConfigs(entityConfigs);
      this.state.setListConfigs(listConfigs);

      const newListConfig = listConfigs.find(lc =>
        lc.filter.includeTypes?.includes(id),
      );

      if (newListConfig) {
        storage.saveActiveListConfigId(newListConfig.id);
        this.state.setListConfigId(newListConfig.id);
      }

      addToast(translate('collectionWizard.importSuccess'), NotificationType.SUCCESS);
      navigate('/entities');
    } catch (error) {
      console.error('Collection wizard import error:', error);
      addToast(translate('collectionWizard.importFailed'), NotificationType.ERROR);
    } finally {
      this.isLoading = false;
    }
  }

  private handleSkip(): void {
    navigate('/');
  }

  render(): TemplateResult {
    return html`
      <div class="wizard">
        <div class="header">
          <h1>${translate('collectionWizard.heading')}</h1>
          <p class="subtitle">${translate('collectionWizard.subheading')}</p>
        </div>

        <div class="grid">
          ${collectionOptions.map(
            option => html`
              <div
                class="card ${this.isLoading ? 'loading' : ''}"
                @click=${(): Promise<void> => this.handleSelectCollection(option.id)}
              >
                <span class="icon">${option.icon}</span>
                <span class="name">${option.name}</span>
                <span class="description">${option.description}</span>
              </div>
            `,
          )}
        </div>

        <div class="skip">
          <ss-button variant="ghost" @click=${this.handleSkip}>
            ${translate('collectionWizard.skip')}
          </ss-button>
        </div>
      </div>
    `;
  }
}
