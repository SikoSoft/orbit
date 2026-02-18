import { action, makeObservable, observable } from 'mobx';

import { defaultSettings, Setting, Settings } from 'api-spec/models/Setting';
import {
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

export const defaultListFilter: ListFilter = {
  tagging: {
    [ListFilterType.CONTAINS_ALL_OF]: [],
    [ListFilterType.CONTAINS_ONE_OF]: [],
  },
  includeTypes: [],
  includeUntagged: true,
  includeAll: true,
  includeAllTagging: true,
  time: { type: ListFilterTimeType.ALL_TIME },
  text: [],
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
};

export class AppState {
  @observable
  public entityConfigs: EntityConfig[] = [];

  @observable
  public propertyConfigs: EntityPropertyConfig[] = [];

  @observable
  public listItems: Entity[] = [];

  @observable
  public listEntities: Entity[] = [];

  @observable
  public contextListItems: Record<number, Entity[]> = [];

  @observable
  public contextListEntities: Record<number, Entity[]> = {};

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
  public advancedMode: boolean = false;

  @observable
  public debugMode: boolean = false;

  @observable
  public selectMode: boolean = false;

  @observable
  public editListConfigMode: boolean = false;

  @observable
  public selectListConfigMode: boolean = false;

  @observable
  public selectedActions: number[] = [];

  @observable
  public forbidden: boolean = false;

  @observable
  public authToken: string = '';

  @observable
  public lastListUrl: string = '';

  @observable
  public theme: ThemeName = defaultTheme;

  get listConfig(): ListConfig {
    return (
      this.listConfigs.find(config => this.listConfigId === config.id) ||
      structuredClone(defaultListConfig)
    );
  }

  @observable
  public listConfigId: string = '';

  @observable
  public listConfigs: ListConfig[] = [];

  @observable
  public hasFetchedListConfigs: boolean = false;

  @observable
  public listContextMode: boolean = false;

  @observable
  public listContext: ListContext = structuredClone(defaultListContext);

  @observable
  public collapsablePanelState: Record<string, boolean> = {};

  @observable
  public tabState: Record<string, number> = {};

  @observable
  public entityPropertyInstances: Record<number, number> = {};

  @observable
  public widgetIsOpen: boolean = false;

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
  setListConfigId(id: string): void {
    if (this.listConfigId && this.listConfig) {
      this.removeTagSuggestions(
        this.listConfig.filter.tagging[ListFilterType.CONTAINS_ALL_OF],
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
  setSelectedActions(actionIds: number[]): void {
    this.selectedActions = actionIds;
  }

  @action
  addActionToSelection(actionId: number): void {
    this.selectedActions = [
      ...this.selectedActions.filter(id => id !== actionId),
      actionId,
    ];
    this.selectMode = true;
  }

  @action
  removeActionFromSelection(actionId: number): void {
    this.selectedActions = [
      ...this.selectedActions.filter(id => id !== actionId),
    ];
    this.selectMode = this.selectedActions.length > 0;
  }

  @action
  toggleActionSelection(actionId: number): void {
    this.selectedActions.includes(actionId)
      ? this.removeActionFromSelection(actionId)
      : this.addActionToSelection(actionId);
  }

  @action
  setListItems(items: Entity[]): void {
    this.listItems = items;
  }

  @action
  setContextListItems(items: Record<number, Entity[]>): void {
    this.contextListItems = items;
  }

  @action
  toggleSelectAll(): void {
    this.selectedActions = this.listItems.reduce(
      (a, b) => (this.selectedActions.includes(b.id) ? [...a] : [...a, b.id]),
      [] as number[],
    );
  }

  @action
  selectAll(): void {
    this.selectedActions = this.listItems.map(item => item.id);
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
    this.listSetting = {
      ...this.listSetting,
      [setting.name]: setting.value,
    };
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
  setContextListEntities(entities: Record<number, Entity[]>): void {
    this.contextListEntities = entities;
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

  constructor() {
    makeObservable(this);
  }
}

export const appState = new AppState();
