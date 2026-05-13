import { css, html, nothing, TemplateResult } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';

import { SettingName } from 'api-spec/models/Setting';

import '@/components/entity-list/entity-list';
import '@/components/list-config/list-config';
import '@/components/public-entity-list/public-entity-list';
import '@/components/user-header/user-header';
import '@/components/bulk-manager/bulk-manager';

import { appState } from '@/state';
import { storage } from '@/lib/Storage';
import { navigate, routerState } from '@/lib/Router';
import { ViewElement } from '@/lib/ViewElement';
import { EntityList } from '@/components/entity-list/entity-list';
import { PublicEntityList } from '@/components/public-entity-list/public-entity-list';
import { listReadEventName } from '@/components/public-entity-list/public-entity-list.events';
import {
  listConfigChangedEventName,
  ListConfigChangedEvent,
} from '@/components/list-config/list-config.events';

@customElement('list-view')
export class ListView extends ViewElement {
  static styles = [
    css`
      .view-content {
        margin-top: 1rem;
      }
    `,
  ];

  private appState = appState;

  @state() listReady = false;

  @query('entity-list')
  entityList: EntityList | undefined;

  @query('public-entity-list')
  publicEntityList: PublicEntityList | undefined;

  constructor() {
    super();
    this.addEventListener(listReadEventName, () => {
      this.listReady = true;
    });
    this.addEventListener(listConfigChangedEventName, (e: Event) => {
      const event = e as ListConfigChangedEvent;
      history.replaceState({}, '', '/list/' + event.detail.listConfigId);
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (this.isLoggedIn()) {
      this.initAuthenticated();
    }
  }

  sync(reset: boolean): void {
    if (this.isLoggedIn()) {
      this.entityList?.sync(reset);
    } else {
      this.publicEntityList?.sync(reset);
    }
  }

  private isLoggedIn(): boolean {
    return storage.getAuthToken() !== '';
  }

  private initAuthenticated(): void {
    const id = routerState.params['id'] || '';

    if (!id) {
      const defaultId = this.appState.getSetting<string>(
        SettingName.DEFAULT_LIST_CONFIG,
      );
      const defaultConfig =
        defaultId && this.appState.listConfigs.find(c => c.id === defaultId);
      const targetId = defaultConfig
        ? defaultConfig.id
        : this.appState.listConfigs[0]?.id;

      if (targetId) {
        navigate('/list/' + targetId);
      }
      return;
    }

    const matchingConfig = this.appState.listConfigs.find(c => c.id === id);
    if (matchingConfig && matchingConfig.id !== this.appState.listConfigId) {
      this.appState.setListConfigId(id);
      storage.saveActiveListConfigId(id);
    }
  }

  render(): TemplateResult {
    if (!this.isLoggedIn()) {
      return html`
        ${this.listReady
          ? html`<list-config viewOnly></list-config>`
          : nothing}
        <public-entity-list publicView></public-entity-list>
      `;
    }

    return html`
      <user-header></user-header>
      <bulk-manager></bulk-manager>
      <div class="view-content">
        <entity-list></entity-list>
      </div>
    `;
  }
}
