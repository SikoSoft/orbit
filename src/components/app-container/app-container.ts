import { html, nothing, TemplateResult } from 'lit';
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
import { StorageSourceUpdatedEvent } from '@/events/storage-source-updated';

import '@/components/entity-form/entity-form';
import '@/components/entity-list/entity-list';
import '@/components/admin-dashboard/admin-dashboard';
import '@/components/floating-widget/floating-widget';
import '@/components/forbidden-notice/forbidden-notice';
import '@/components/bulk-manager/bulk-manager';
import '@/components/list-config/list-config';
import { delegatedStorageItemKeys } from '@/models/Storage';

export interface ViewChangedEvent extends CustomEvent {
  detail: PageView;
}

@themed()
@customElement('app-container')
export class AppContainer extends MobxLitElement {
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

    this.addEventListener('view-changed', (e: Event) => {
      this.handleViewChanged(e);
    });

    window.addEventListener('unload', () => {
      storage.setWindowScrollPosition(window.scrollX, window.scrollY);
    });

    window.addEventListener('view-ready', () => {
      const { x, y } = storage.getWindowScrollPosition();
      setTimeout(() => {
        window.scrollTo(x, y);
      }, 1);
    });

    this.restoreState();
  }

  setAuthToken(authToken: string): void {
    api.setAuthToken(authToken);
    this.state.setAuthToken(authToken);
  }

  private async restoreState(): Promise<void> {
    this.ready = false;
    try {
      this.state.setAssistEnabled(import.meta.env.APP_ENABLE_ASSIST === '1');

      if (this.state.authToken) {
        const listConfigs = await storage.getListConfigs();
        this.state.setListConfigs(listConfigs);

        const entityConfigs = await storage.getEntityConfigs();
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
      console.error('something went wrong during restore state', error);
    } finally {
      this.ready = true;
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

  private handleUserLoggedIn(): void {
    this.restoreState();
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

  private handleStorageSourceUpdated(e: StorageSourceUpdatedEvent): void {
    storage.resetDelegatedData();
    window.location.reload();
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
  }

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
        @invalid-session=${this.clearSession}
        @storage-source-updated=${this.handleStorageSourceUpdated}
      >
        ${this.ready ? this.routerView : nothing}
      </div>
    `;
  }
}
