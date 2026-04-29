import { css, html, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { PageView, defaultPageView } from '@/models/Page';
import { storage } from '@/lib/Storage';
import { appState } from '@/state';
import { ViewElement } from '@/lib/ViewElement';
import { api } from '@/lib/Api';
import { setupRouter } from '@/lib/Router';
import { themed } from '@/lib/Theme';
import { Router } from '@/models/Router';
import { routes } from '@/routes';

import { OperationPerformedEvent } from '@/components/bulk-manager/bulk-manager.events';
import { ListConfigChangedEvent } from '@/components/list-config/list-config.events';
import { CollapsableToggledEvent } from '@ss/ui/components/ss-collapsable.events';
import { TabIndexChangedEvent } from '@ss/ui/components/tab-container.events';
import { UserLoggedOutEvent } from '@/events/user-logged-out';
import {
  NetworkApiRequestFailedEvent,
  networkApiRequestFailedEventName,
} from '@/events/network-api-request-failed';
import { AppReadyEvent } from '@/components/app-container/app-container.events';
import { translate } from '@/lib/Localization';

import '@/components/entity-form/entity-form';
import '@/components/entity-list/entity-list';
import '@/components/admin-dashboard/admin-dashboard';
import '@/components/floating-widget/floating-widget';
import '@/components/forbidden-notice/forbidden-notice';
import '@/components/bulk-manager/bulk-manager';
import '@/components/list-config/list-config';
import '@/components/svg-icon/svg/svg-spinner';
import { Introspection } from 'api-spec/models/Introspection';
import { StorageSource } from '@/models/Storage';
import { AssistEntityAddedEvent } from '../add-entity-widget/add-entity-widget.events';

export interface ViewChangedEvent extends CustomEvent {
  detail: PageView;
}

@themed()
@customElement('app-container')
export class AppContainer extends MobxLitElement {
  static styles = css`
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 4rem 0;
    }

    svg-spinner {
      width: 36px;
      height: 36px;
      color: var(--text-color, #333);
    }
  `;
  public state = appState;
  private appRouter?: Router;
  private routerView: HTMLDivElement | null = null;

  @state() view: PageView = defaultPageView;
  @state() ready: boolean = false;

  @state()
  get viewComponent(): ViewElement | null {
    if (!this.routerView) {
      return null;
    }
    return this.routerView.querySelector<ViewElement>('*');
  }

  constructor() {
    super();

    this.routerView = document.createElement('div');
  }

  connectedCallback(): void {
    super.connectedCallback();

    this.setAuthToken(storage.getAuthToken());

    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    window.addEventListener(
      'offline-sync-complete',
      this.handleOfflineSyncComplete,
    );
    window.addEventListener(
      networkApiRequestFailedEventName,
      this.handleNetworkApiRequestFailed as EventListener,
    );

    this.addEventListener('view-changed', (e: Event) => {
      this.handleViewChanged(e);
    });

    window.addEventListener('unload', () => {
      storage.setWindowScrollPosition(window.scrollX, window.scrollY);
    });

    window.addEventListener('view-ready', () => {
      this.state.setViewReady(true);
      const { x, y } = storage.getWindowScrollPosition();
      setTimeout(() => {
        window.scrollTo(x, y);
      }, 1);
    });

    this.restoreState();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    window.removeEventListener(
      'offline-sync-complete',
      this.handleOfflineSyncComplete,
    );
    window.removeEventListener(
      networkApiRequestFailedEventName,
      this.handleNetworkApiRequestFailed as EventListener,
    );
  }

  private handleOnline = (): void => {
    this.state.setOnline(true);
  };

  private handleOfflineSyncComplete = (): void => {
    void this.restoreState().then(() => {
      this.viewComponent?.sync(true);
    });
  };

  private handleOffline = (): void => {
    this.state.setOnline(false);
  };

  private handleNetworkApiRequestFailed = (e: Event): void => {
    const event = e as NetworkApiRequestFailedEvent;
    if (event.detail.type === 'offline' || event.detail.type === 'network') {
      console.warn('Network API request failed, setting app state to offline');
      this.state.setOnline(false);
    }
  };

  setAuthToken(authToken: string): void {
    api.setAuthToken(authToken);
    this.state.setAuthToken(authToken);
  }

  protected updated(
    changedProperties: Map<string | symbol, unknown>,
  ): void {
    if (changedProperties.has('ready') && this.ready) {
      console.log('[orbit] app-container: ready, dispatching app-ready');
      this.dispatchEvent(new AppReadyEvent({}));
    }
  }

  private async restoreState(): Promise<void> {
    console.time('[orbit] restoreState');
    this.ready = false;
    try {
      this.state.setAssistEnabled(import.meta.env.APP_ENABLE_ASSIST === '1');

      const storageSource = storage.getStorageSource();
      if (storageSource) {
        this.state.setStorageSource(storageSource);
      }

      console.log('[orbit] restoreState: storageSource=%s authToken=%s', storageSource, !!this.state.authToken);

      if (
        this.state.storageSource === StorageSource.DEVICE ||
        this.state.authToken
      ) {
        console.time('[orbit] restoreState:fetchConfigs');
        const [listConfigs, entityConfigs] = await Promise.all([
          storage.getListConfigs(),
          storage.getEntityConfigs(),
        ]);
        console.timeEnd('[orbit] restoreState:fetchConfigs');
        console.log('[orbit] restoreState: got %d listConfigs, %d entityConfigs', listConfigs.length, entityConfigs.length);

        this.state.setListConfigs(listConfigs);
        this.state.setEntityConfigs(entityConfigs);

        const listConfigId = storage.getActiveListConfigId();
        this.state.setListConfigId(listConfigId);
      }

      if (!this.state.listConfigId && this.state.listConfigs.length) {
        this.state.setListConfigId(this.state.listConfigs[0].id);
      }

      this.state.setListContextMode(storage.getListContextMode());
      this.state.setListContext(storage.getListContext());

      this.state.setAdvancedMode(storage.getAdvancedMode());
      this.state.setDebugMode(storage.getDebugMode());
      this.state.setAssistSaveImage(storage.getAssistSaveImage());
      this.state.setCollapsableState(storage.getCollapsablePanelState());
      this.state.setTabState(storage.getTabState());

      this.state.setTheme(storage.getTheme());

      const view = storage.getSavedView();

      if (view) {
        this.view = view;
      }
    } catch (error) {
      console.error('[orbit] restoreState: error', error);
    } finally {
      this.ready = true;
      console.timeEnd('[orbit] restoreState');
    }
  }

  private handleViewChanged(e: Event): void {
    const event = e as CustomEvent;
    this.view = event.detail;
    storage.saveView(this.view);
  }

  private handleOperationPerformed(_e: OperationPerformedEvent): void {
    if (!this.viewComponent) {
      return;
    }

    this.viewComponent.sync(false);
  }

  private handleListConfigChanged(_e: ListConfigChangedEvent): void {
    if (!this.viewComponent) {
      return;
    }

    this.viewComponent.sync(true);
  }

  private handleAssistEntityAdded(_e: AssistEntityAddedEvent): void {
    if (!this.viewComponent) {
      return;
    }

    this.viewComponent.sync(true);
  }

  private async handleUserLoggedIn(): Promise<void> {
    await this.restoreState();
    this.syncUserData();
  }

  private async syncUserData(): Promise<void> {
    const introspectionResult = await api.get<{ introspection: Introspection }>(
      'user/introspect',
    );

    if (
      introspectionResult &&
      introspectionResult.isOk &&
      introspectionResult.response.introspection.isLoggedIn
    ) {
      const user = introspectionResult.response.introspection.user;
      this.state.setUser(user);
    }
  }

  private handleCollapsableToggled(e: CollapsableToggledEvent): void {
    const { isOpen, panelId } = e.detail;
    this.state.setCollapsablePanelState(panelId, isOpen);
    storage.setCollapsablePanelState(this.state.collapsablePanelState);
  }

  private handleTabChanged(e: TabIndexChangedEvent): void {
    const { index, paneId } = e.detail;
    this.state.setTabPaneState(paneId, index);
    storage.setTabState(this.state.tabState);
  }

  private async handleStorageSourceUpdated(): Promise<void> {
    storage.resetDelegatedData();
    await this.restoreState();

    if (this.viewComponent) {
      this.viewComponent.sync(true);
    }
  }

  protected firstUpdated(): void {
    if (!this.routerView) {
      return;
    }

    this.appRouter = setupRouter(
      this.routerView,
      routes,
      import.meta.env.BASE_URL || '/',
    );

    if (!this.state.user && this.state.authToken) {
      this.syncUserData();
    }
  }

  private handleUserLoggedOut = (): void => {
    storage.clear();
  };

  clearSession = (): void => {
    this.dispatchEvent(new UserLoggedOutEvent({}));
    this.setAuthToken('');
    storage.setAuthToken('');
  };

  render(): TemplateResult {
    return html`
      <div
        class="app-container"
        @tab-index-changed=${this.handleTabChanged}
        @collapsable-toggled=${this.handleCollapsableToggled}
        @list-config-changed=${this.handleListConfigChanged}
        @operation-performed=${this.handleOperationPerformed}
        @user-logged-in=${this.handleUserLoggedIn}
        @user-logged-out=${this.handleUserLoggedOut}
        @invalid-session=${this.clearSession}
        @storage-source-updated=${this.handleStorageSourceUpdated}
        @assist-entity-added=${this.handleOperationPerformed}
      >
        ${this.ready
          ? this.routerView
          : html`<div class="loading" aria-label=${translate('initializing')}><svg-spinner></svg-spinner></div>`}
      </div>
    `;
  }
}
