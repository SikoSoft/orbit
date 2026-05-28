import { action, makeObservable, observable, runInAction } from 'mobx';
import { initPersistedState, persisted } from '@/lib/persisted';

import {
  defaultSettings,
  Setting,
  SettingContextType,
  SettingName,
  Settings,
  settingsConfig,
} from 'api-spec/models/Setting';
import {
  EntityCalculatedPropertyConfig,
  EntityConfig,
  Entity,
  EntityPropertyConfig,
} from 'api-spec/models/Entity';
import {
  ListFilter,
  ListFilterType,
  ListFilterTimeType,
  TimeContext,
  ListSort,
  ListSortDirection,
  ListConfig,
  ListContext,
  ListContextType,
  ListContextUnit,
  ListSortNativeProperty,
} from 'api-spec/models/List';
import { defaultTheme, ThemeName } from './models/Page';
import { StorageItemKey, StorageSource } from './models/Storage';
import { User } from 'api-spec/models/Identity';
import { Workspace } from 'api-spec/models/Workspace';
import {
  subscribe,
  unsubscribe,
  getSubscription,
} from '@/lib/push-subscription';

export const defaultListFilter: ListFilter = {
  userIds: [],
  tagging: {
    [ListFilterType.CONTAINS_ALL_OF]: [],
    [ListFilterType.CONTAINS_ONE_OF]: [],
  },
  includeTypes: [],
  includeUntagged: true,
  includeAll: true,
  includeAllTagging: true,
  time: { type: ListFilterTimeType.ALL_TIME },
  properties: [],
};

export const defaultListSort: ListSort = {
  property: ListSortNativeProperty.CREATED_AT,
  direction: ListSortDirection.DESC,
};

export const defaultListContext: ListContext = {
  type: ListContextType.BEFORE,
  quantity: 1,
  unit: ListContextUnit.DAY,
};

export const defaultListConfig: ListConfig = {
  userId: '',
  id: 'default',
  name: 'Default',
  filter: structuredClone(defaultListFilter),
  sort: structuredClone(defaultListSort),
  setting: structuredClone(defaultSettings),
  themes: [],
  viewAccessPolicy: null,
  editAccessPolicy: null,
};

export class AppState {
  @observable
  public entityConfigs: EntityConfig[] = [];

  @observable
  public propertyConfigs: (EntityPropertyConfig | EntityCalculatedPropertyConfig)[] = [];

  @observable
  public listEntities: Entity[] = [];

  @observable
  public actionSuggestions: string[] = [];

  @observable
  public tagSuggestions: string[] = [];

  @observable
  public loading: boolean = false;

  @observable
  public listFilter: ListFilter = structuredClone(defaultListFilter);

  @observable
  public listSort: ListSort = structuredClone(defaultListSort);

  @observable
  public listSetting: Settings = defaultSettings;

  @observable
  public userSettings: Settings = defaultSettings;

  @observable
  public systemSettings: Settings = defaultSettings;

  @observable
  @persisted(StorageItemKey.ADVANCED_MODE_KEY, {
    parse: v => v === '1',
    serialize: v => (v ? '1' : '0'),
  })
  public advancedMode: boolean = false;

  @observable
  @persisted(StorageItemKey.DEBUG_MODE_KEY, {
    parse: v => v === '1',
    serialize: v => (v ? '1' : '0'),
  })
  public debugMode: boolean = false;

  @observable
  public selectMode: boolean = false;

  @observable
  public editListConfigMode: boolean = false;

  @observable
  public selectListConfigMode: boolean = false;

  @observable
  public selectedEntities: number[] = [];

  @observable
  public forbidden: boolean = false;

  @observable
  public authToken: string = '';

  @observable
  public lastListUrl: string = '';

  @observable
  public theme: ThemeName = defaultTheme;

  @observable
  public assistEnabled: boolean = false;

  @observable
  public listConfigId: string = '';

  @observable
  public listConfigs: ListConfig[] = [];

  @observable
  public hasFetchedListConfigs: boolean = false;

  @observable
  public workspaces: Workspace[] = [];

  @observable
  public hasFetchedWorkspaces: boolean = false;

  @observable
  public listContextMode: boolean = false;

  @observable
  public listContext: ListContext = structuredClone(defaultListContext);

  @observable
  @persisted(StorageItemKey.COLLAPSABLE_PANEL_STATE, { deep: true })
  public collapsablePanelState: Record<string, boolean> = {};

  @observable
  @persisted(StorageItemKey.TAB_INDEX_STATE, { deep: true })
  public tabState: Record<string, number> = {};

  @observable
  public entityPropertyInstances: Record<number, number> = {};

  @observable
  public widgetIsOpen: boolean = false;

  @observable
  public title: string = '';

  @observable
  @persisted(StorageItemKey.ASSIST_SAVE_IMAGE)
  public assistSaveImage: boolean = true;

  @observable
  public online: boolean = true; //typeof navigator !== 'undefined' && navigator.onLine;

  @observable
  public viewIsReady: boolean = false;

  @observable
  public isNative: boolean = false;

  @observable
  public storageSource: StorageSource = StorageSource.CLOUD;

  @observable
  public user: User | null = null;

  @observable
  public swRegistration: ServiceWorkerRegistration | null = null;

  @observable
  public subscription: PushSubscription | null = null;

  @observable
  public permissionState: NotificationPermission = 'default';

  get listConfig(): ListConfig {
    return (
      this.listConfigs.find(config => this.listConfigId === config.id) ||
      structuredClone(defaultListConfig)
    );
  }

  @action
  public setActionSuggestions(suggestions: string[]): void {
    this.actionSuggestions = suggestions;
  }

  @action
  public setTagSuggestions(suggestions: string[]): void {
    this.tagSuggestions = suggestions;
  }

  @action
  public addTagSuggestions(suggestions: string[]): void {
    this.tagSuggestions = [...this.tagSuggestions, ...suggestions];
  }

  @action
  public removeTagSuggestions(suggestions: string[]): void {
    this.tagSuggestions = [
      ...this.tagSuggestions.filter(tag => !suggestions.includes(tag)),
    ];
  }

  @action
  setLoading(state: boolean): void {
    this.loading = state;
  }

  @action
  setListFilterTagging(type: ListFilterType, tags: string[]): void {
    if (!this.listFilter.tagging) {
      this.listFilter.tagging = {
        [ListFilterType.CONTAINS_ALL_OF]: [],
        [ListFilterType.CONTAINS_ONE_OF]: [],
      };
    }
    this.listFilter.tagging[type] = tags;
  }

  @action
  setListFilterIncludeUntagged(state: boolean): void {
    this.listFilter.includeUntagged = state;
  }

  @action
  setListFilterIncludeAll(state: boolean): void {
    this.listFilter.includeAll = state;
  }

  @action
  setListFilterTime(time: TimeContext): void {
    this.listFilter.time = time;
  }

  @action
  setListFilter(filter: ListFilter): void {
    this.listFilter = filter;
  }

  @action
  setListSetting(setting: Settings): void {
    this.listSetting = setting;
  }

  @action
  setUserSettings(settings: Settings): void {
    this.userSettings = settings;
  }

  @action
  setSystemSettings(settings: Settings): void {
    this.systemSettings = settings;
  }

  @action
  setListConfigId(id: string): void {
    if (this.listConfigId && this.listConfig) {
      this.removeTagSuggestions(
        this.listConfig.filter.tagging?.[ListFilterType.CONTAINS_ALL_OF] ?? [],
      );
    }
    this.listConfigId = id;
    if (this.listConfigId && this.listConfig) {
      this.setListFilter(this.listConfig.filter);
      this.setListSort(this.listConfig.sort);
      this.setListSetting(this.listConfig.setting);
    }
  }

  @action
  setListConfigs(listConfigs: ListConfig[]): void {
    this.listConfigs = listConfigs;
    this.hasFetchedListConfigs = true;
  }

  @action
  setWorkspaces(workspaces: Workspace[]): void {
    this.workspaces = workspaces;
    this.hasFetchedWorkspaces = true;
  }

  @action
  upsertWorkspace(workspace: Workspace): void {
    this.workspaces = [
      ...this.workspaces.filter(w => w.id !== workspace.id),
      workspace,
    ];
  }

  @action
  removeWorkspace(id: string): void {
    this.workspaces = this.workspaces.filter(w => w.id !== id);
  }

  @action
  addListConfig(listConfig: ListConfig): void {
    this.listConfigs = [
      ...this.listConfigs.filter(config => config.id !== listConfig.id),
      listConfig,
    ];
  }

  @action
  setAdvancedMode(state: boolean): void {
    this.advancedMode = state;
  }

  @action
  setDebugMode(state: boolean): void {
    this.debugMode = state;
  }

  @action
  setEditListConfigMode(state: boolean): void {
    this.editListConfigMode = state;
  }

  @action
  setSelectListConfigMode(state: boolean): void {
    this.selectListConfigMode = state;
  }

  @action
  setListSort(sort: ListSort): void {
    this.listSort = sort;
  }

  @action
  setSelectMode(state: boolean): void {
    this.selectMode = state;
  }

  @action
  setSelectedEntities(entityIds: number[]): void {
    this.selectedEntities = entityIds;
  }

  @action
  addEntityToSelection(entityId: number): void {
    this.selectedEntities = [
      ...this.selectedEntities.filter(id => id !== entityId),
      entityId,
    ];
    this.selectMode = true;
  }

  @action
  removeEntityFromSelection(entityId: number): void {
    this.selectedEntities = [
      ...this.selectedEntities.filter(id => id !== entityId),
    ];
    this.selectMode = this.selectedEntities.length > 0;
  }

  @action
  toggleEntitySelection(entityId: number): void {
    this.selectedEntities.includes(entityId)
      ? this.removeEntityFromSelection(entityId)
      : this.addEntityToSelection(entityId);
  }

  @action
  toggleSelectAll(): void {
    this.selectedEntities = this.listEntities.reduce(
      (a, b) => (this.selectedEntities.includes(b.id) ? [...a] : [...a, b.id]),
      [] as number[],
    );
  }

  @action
  setListContextMode(mode: boolean): void {
    this.listContextMode = mode;
  }

  @action
  setListContext(context: ListContext): void {
    this.listContext = context;
  }

  @action
  setSetting(setting: Setting): void {
    const updatedSetting = {
      ...this.listConfig.setting,
      [setting.name]: setting.value,
    };
    this.listSetting = updatedSetting;
    this.listConfigs = this.listConfigs.map(config =>
      config.id === this.listConfigId
        ? { ...config, setting: updatedSetting }
        : config,
    );
  }

  @action
  setForbidden(mode: boolean): void {
    this.forbidden = mode;
  }

  @action
  setAuthToken(authToken: string): void {
    this.authToken = authToken;
  }

  @action
  setLastListUrl(url: string): void {
    this.lastListUrl = url;
  }

  @action
  setListEntities(entities: Entity[]): void {
    this.listEntities = entities;
  }

  @action
  setEntityConfigs(entityConfigs: EntityConfig[]): void {
    this.entityConfigs = entityConfigs;
    this.propertyConfigs = entityConfigs.flatMap(config => config.properties);
  }

  @action
  setCollapsablePanelState(panelName: string, state: boolean): void {
    this.collapsablePanelState[panelName] = state;
  }

  @action
  setCollapsableState(state: Record<string, boolean>): void {
    this.collapsablePanelState = state;
  }

  @action
  setTabPaneState(paneId: string, index: number): void {
    this.tabState[paneId] = index;
  }

  setTabState(state: Record<string, number>): void {
    this.tabState = state;
  }

  @action
  setEntityPropertyInstance(
    propertyConfigId: number,
    instanceId: number,
  ): void {
    this.entityPropertyInstances[propertyConfigId] = instanceId;
  }

  @action
  setTheme(theme: ThemeName): void {
    if (!Object.values(ThemeName).includes(theme)) {
      this.theme = defaultTheme;
      return;
    }

    this.theme = theme;
  }

  @action
  setWidgetIsOpen(isOpen: boolean): void {
    this.widgetIsOpen = isOpen;
  }

  @action
  setThemes(themes: string[]): void {
    const updatedConfig = {
      ...this.listConfig,
      themes,
    };
    this.listConfigs = this.listConfigs.map(config =>
      config.id === updatedConfig.id ? updatedConfig : config,
    );
  }

  @action
  setTitle(title: string): void {
    this.title = `${title} - Orbit`;
  }

  @action
  setAssistEnabled(enabled: boolean): void {
    this.assistEnabled = enabled;
  }

  @action
  setAssistSaveImage(enabled: boolean): void {
    this.assistSaveImage = enabled;
  }

  @action
  setOnline(online: boolean): void {
    this.online = online;
  }

  @action
  setViewReady(ready: boolean): void {
    this.viewIsReady = ready;
  }

  @action
  setIsNative(isNative: boolean): void {
    this.isNative = isNative;
  }

  @action
  setStorageSource(source: StorageSource): void {
    this.storageSource = source;
  }

  @action
  setUser(user: User | null): void {
    this.user = user;
  }

  @action
  setSwRegistration(reg: ServiceWorkerRegistration | null): void {
    this.swRegistration = reg;
  }

  @action
  setSubscription(sub: PushSubscription | null): void {
    this.subscription = sub;
  }

  @action
  setPermissionState(state: NotificationPermission): void {
    this.permissionState = state;
  }

  get notificationsSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  @action
  async enableNotifications(): Promise<void> {
    if (!this.swRegistration) {
      return;
    }
    await subscribe(this.swRegistration);
    const sub = await getSubscription(this.swRegistration);
    runInAction(() => {
      this.subscription = sub;
      this.permissionState = Notification.permission;
    });
  }

  @action
  async disableNotifications(): Promise<void> {
    if (!this.swRegistration || !this.subscription) {
      return;
    }
    await unsubscribe(this.swRegistration);
    runInAction(() => {
      this.subscription = null;
      this.permissionState = Notification.permission;
    });
  }

  hasRole(role: string): boolean {
    return !!this.user?.roles?.includes(role);
  }

  getSetting<T>(name: SettingName): T | undefined {
    const setting = settingsConfig[name];
    if (!setting) {
      return undefined;
    }

    for (const context of setting.context) {
      if (
        context === SettingContextType.LIST &&
        this.listSetting[name] !== undefined
      ) {
        return this.listSetting[name] as T;
      }
      if (
        context === SettingContextType.USER &&
        this.userSettings[name] !== undefined
      ) {
        return this.userSettings[name] as T;
      }
      if (
        context === SettingContextType.APP &&
        this.systemSettings[name] !== undefined
      ) {
        return this.systemSettings[name] as T;
      }
    }

    return setting.defaultValue as T;
  }

  constructor() {
    makeObservable(this);
    initPersistedState(this);
  }
}

export const appState = new AppState();
