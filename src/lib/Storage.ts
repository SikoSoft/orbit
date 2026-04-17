import { v4 as uuidv4 } from 'uuid';
import {
  ListConfig,
  ListContext,
  ListFilter,
  ListSort,
} from 'api-spec/models/List';
import { networkStorage } from './NetworkStorage';
import { sqliteStorage } from './SQLiteStorage';
import {
  defaultListContext,
  defaultListFilter,
  defaultListSort,
} from '@/state';
import {
  PageView,
  ThemeName,
  defaultPageView,
  defaultTheme,
} from '@/models/Page';
import {
  delegatedStorageItemKeys,
  StorageItemKey,
  StorageResult,
  StorageSchema,
  StorageSource,
} from '@/models/Storage';
import { Setting } from 'api-spec/models/Setting';
import { EntityConfig, EntityPropertyConfig } from 'api-spec/models/Entity';
import { Entity } from 'api-spec/models';
import { translate } from './Localization';
import { ExportDataContents, NukedDataType } from 'api-spec/models/Data';
import { RequestBody } from '@/components/entity-form/entity-form.models';
import { BulkOperationPayload } from '@/components/bulk-manager/bulk-manager.models';
import {
  EntityListResult,
  PublicEntityListResult,
} from '@/components/entity-list/entity-list.models';
import { CreateAccountResponseBody } from '@/components/account-form/account-form.models';
import {
  AccessPolicy,
  AccessPolicyGroup,
  AccessPolicyParty,
} from 'api-spec/models/Access';

export interface SavedListFilter {
  filter: ListFilter;
  id: string;
  name: string;
}

const storageDelegates: StorageSchema[] = [networkStorage, sqliteStorage];
for (let i = 0; i < storageDelegates.length; i++) {
  storageDelegates[i].isActive =
    storageDelegates[i].storageSource ===
    localStorage.getItem(StorageItemKey.STORAGE_SOURCE);
}

function delegateSource(): MethodDecorator {
  return function (
    _target: unknown,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalValue = descriptor.value;
    descriptor.value = function (...args: unknown[]): unknown {
      const key =
        typeof propertyKey === 'symbol' ? propertyKey.toString() : propertyKey;
      for (const storageDelegate of storageDelegates.filter(
        delegate => delegate.isActive,
      )) {
        const delegateMethods = Object.getOwnPropertyNames(
          Object.getPrototypeOf(storageDelegate),
        );
        if (delegateMethods.includes(key)) {
          const methodName = propertyKey as keyof StorageSchema;
          const method = storageDelegate[methodName];
          if (!method || typeof method !== 'function') {
            continue;
          }
          return (method as (...a: unknown[]) => unknown).apply(
            storageDelegate,
            args,
          );
        }
      }
      return originalValue?.apply(this, args);
    };
    return descriptor;
  };
}

export class Storage implements StorageSchema {
  isActive = true;

  clear(): void {
    for (const key of Object.values(StorageItemKey).filter(
      key => key !== StorageItemKey.STORAGE_SOURCE,
    )) {
      localStorage.removeItem(key);
    }
  }

  setStorageSource(source: StorageSource): void {
    storageDelegates.forEach(delegate => {
      delegate.isActive = delegate.storageSource === source;
    });

    if (!Object.values(StorageSource).includes(source)) {
      localStorage.setItem(StorageItemKey.STORAGE_SOURCE, StorageSource.CLOUD);
      return;
    }

    localStorage.setItem(StorageItemKey.STORAGE_SOURCE, source);
  }

  resetDelegatedData(): void {
    for (const key of delegatedStorageItemKeys) {
      localStorage.removeItem(key);
    }
  }

  async saveFilter(filter: ListFilter, name: string): Promise<void> {
    const savedFilters = this.getSavedFilters();
    const id = await this.digestMessage(JSON.stringify(filter));
    localStorage.setItem(
      StorageItemKey.LIST_FILTERS_KEY,
      JSON.stringify([
        ...savedFilters.filter(filter => filter.id !== id),
        { filter, id, name },
      ]),
    );
  }

  getSavedFilters(): SavedListFilter[] {
    let filters: SavedListFilter[] = [];
    try {
      const storedFilters = localStorage.getItem(
        StorageItemKey.LIST_FILTERS_KEY,
      );
      if (storedFilters) {
        filters = JSON.parse(storedFilters) as SavedListFilter[];
      }
    } catch (error) {
      console.error(
        `Encountered an error while trying to load filters from storage: ${JSON.stringify(
          error,
        )}`,
      );
    }

    return filters;
  }

  deleteSavedFilter(id: string): void {
    const savedFilters = this.getSavedFilters();
    localStorage.setItem(
      StorageItemKey.LIST_FILTERS_KEY,
      JSON.stringify([...savedFilters.filter(filter => filter.id !== id)]),
    );
  }

  saveActiveFilter(filter: ListFilter): void {
    localStorage.setItem(
      StorageItemKey.ACTIVE_LIST_FILTER_KEY,
      JSON.stringify(filter),
    );
  }

  saveView(view: PageView): void {
    localStorage.setItem(StorageItemKey.VIEW_KEY, view);
  }

  getSavedView(): PageView {
    let view: PageView = defaultPageView;
    try {
      const storedView = localStorage.getItem(StorageItemKey.VIEW_KEY);
      if (storedView) {
        view = storedView as PageView;
      }
    } catch (error) {
      console.error(
        `Encountered an error while trying to load view: ${JSON.stringify(
          error,
        )}`,
      );
    }

    return view;
  }

  saveAdvancedMode(state: boolean): void {
    localStorage.setItem(StorageItemKey.ADVANCED_MODE_KEY, state ? '1' : '0');
  }

  saveDebugMode(state: boolean): void {
    localStorage.setItem(StorageItemKey.DEBUG_MODE_KEY, state ? '1' : '0');
  }

  getAdvancedMode(): boolean {
    let advancedMode = false;
    try {
      const storedAdvancedMode = localStorage.getItem(
        StorageItemKey.ADVANCED_MODE_KEY,
      );
      if (storedAdvancedMode) {
        advancedMode = storedAdvancedMode === '1';
      }
    } catch (error) {
      console.error(
        `Encountered an error while trying to advanced mode: ${JSON.stringify(
          error,
        )}`,
      );
    }
    return advancedMode;
  }

  getDebugMode(): boolean {
    let debugMode = false;
    try {
      const storedDebugMode = localStorage.getItem(
        StorageItemKey.DEBUG_MODE_KEY,
      );
      if (storedDebugMode) {
        debugMode = storedDebugMode === '1';
      }
    } catch (error) {
      console.error(
        `Encountered an error while trying to debug mode: ${JSON.stringify(
          error,
        )}`,
      );
    }
    return debugMode;
  }

  async digestMessage(message: string): Promise<string> {
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(message),
    );
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return hashHex;
  }

  @delegateSource()
  async getListConfigs(): Promise<ListConfig[]> {
    let listConfigs: ListConfig[] = [];
    try {
      const storedListConfigs = localStorage.getItem(
        StorageItemKey.LIST_CONFIGS_KEY,
      );
      if (storedListConfigs) {
        listConfigs = JSON.parse(storedListConfigs) as ListConfig[];
      }
    } catch (error) {
      console.error(
        `Encountered an error while trying to load list configurations from storage: ${JSON.stringify(
          error,
        )}`,
      );
    }

    return Promise.resolve(listConfigs);
  }

  @delegateSource()
  async updateListSort(_listConfigId: string, _sort: ListSort): Promise<void> {
    Promise.resolve(null);
    return;
  }

  @delegateSource()
  async updateListFilter(
    _listConfigId: string,
    _filter: ListFilter,
  ): Promise<void> {
    Promise.resolve(null);
    return;
  }

  @delegateSource()
  async updateListThemes(
    _listConfigId: string,
    _themes: string[],
  ): Promise<void> {
    Promise.resolve(null);
    return;
  }

  @delegateSource()
  async saveListConfig(
    listConfig: ListConfig,
  ): Promise<StorageResult<ListConfig>> {
    const listConfigs = await this.getListConfigs();

    localStorage.setItem(
      StorageItemKey.LIST_CONFIGS_KEY,
      JSON.stringify(
        listConfigs.map(config =>
          listConfig.id === config.id ? listConfig : config,
        ),
      ),
    );

    return { isOk: true, value: listConfig };
  }

  @delegateSource()
  async addListConfig(): Promise<string> {
    const id = uuidv4();
    const listConfig = {
      id,
      name: translate('configName'),
      filter: defaultListFilter,
      sort: defaultListSort,
    };
    const listConfigs = await this.getListConfigs();
    localStorage.setItem(
      StorageItemKey.LIST_CONFIGS_KEY,
      JSON.stringify([...listConfigs, listConfig]),
    );
    return id;
  }

  @delegateSource()
  async deleteListConfig(id: string): Promise<boolean> {
    const listConfigs = await this.getListConfigs();
    localStorage.setItem(
      StorageItemKey.LIST_CONFIGS_KEY,
      JSON.stringify(listConfigs.filter(config => id !== config.id)),
    );

    return Promise.resolve(true);
  }

  saveListContextMode(mode: boolean): void {
    localStorage.setItem(StorageItemKey.LIST_CONTEXT_MODE, mode ? '1' : '0');
  }

  getListContextMode(): boolean {
    let mode = false;
    try {
      const storedMode = localStorage.getItem(StorageItemKey.LIST_CONTEXT_MODE);
      if (storedMode) {
        mode = storedMode === '1' ? true : false;
      }
    } catch (error) {
      console.error(
        `Encountered an error while trying to load list context mode from storage: ${JSON.stringify(
          error,
        )}`,
      );
    }

    return mode;
  }

  saveListContext(listContext: ListContext): void {
    localStorage.setItem(
      StorageItemKey.LIST_CONTEXT,
      JSON.stringify(listContext),
    );
  }

  getListContext(): ListContext {
    let listContext: ListContext = defaultListContext;
    try {
      const storedListContext = localStorage.getItem(
        StorageItemKey.LIST_CONTEXT,
      );
      if (storedListContext) {
        listContext = JSON.parse(storedListContext);
      }
    } catch (error) {
      console.error(
        `Encountered an error while trying to load list context from storage: ${JSON.stringify(
          error,
        )}`,
      );
    }

    return listContext;
  }

  saveActiveListConfigId(id: string): void {
    localStorage.setItem(StorageItemKey.ACTIVE_LIST_CONFIG_ID, id);
  }

  getActiveListConfigId(): string {
    let listConfigId: string = '';
    try {
      const storedListConfigId = localStorage.getItem(
        StorageItemKey.ACTIVE_LIST_CONFIG_ID,
      );
      if (storedListConfigId) {
        listConfigId = storedListConfigId;
      }
    } catch (error) {
      console.error(
        `Encountered an error while trying to load active list config ID from storage: ${JSON.stringify(
          error,
        )}`,
      );
    }

    return listConfigId;
  }

  setAuthToken(authToken: string): void {
    localStorage.setItem(StorageItemKey.AUTH_TOKEN_KEY, authToken);
  }

  getAuthToken(): string {
    let authToken = '';
    try {
      const storedAuthToken = localStorage.getItem(
        StorageItemKey.AUTH_TOKEN_KEY,
      );
      if (storedAuthToken) {
        authToken = storedAuthToken;
      }
    } catch (error) {
      console.error(
        `Encountered an error while trying to get authToken: ${JSON.stringify(
          error,
        )}`,
      );
    }

    return authToken;
  }

  @delegateSource()
  async saveSetting(
    _listConfigId: string,
    _setting: Setting,
  ): Promise<boolean> {
    return Promise.resolve(true);
  }

  setWindowScrollPosition(x: number, y: number): void {
    localStorage.setItem(
      StorageItemKey.WINDOW_SCROLL_POSITION,
      JSON.stringify({ x, y }),
    );
  }

  getWindowScrollPosition(): { x: number; y: number } {
    let position = { x: 0, y: 0 };
    try {
      const storedPosition = localStorage.getItem(
        StorageItemKey.WINDOW_SCROLL_POSITION,
      );
      if (storedPosition) {
        position = JSON.parse(storedPosition);
      }
    } catch (error) {
      console.error(
        `Encountered an error while trying to load window scroll position from storage: ${JSON.stringify(
          error,
        )}`,
      );
    }

    return position;
  }

  getCollapsablePanelState(): Record<string, boolean> {
    let state: Record<string, boolean> = {};
    try {
      const storedState = localStorage.getItem(
        StorageItemKey.COLLAPSABLE_PANEL_STATE,
      );
      if (storedState) {
        state = JSON.parse(storedState);
      }
    } catch (error) {
      console.error(
        `Encountered an error while trying to load collapsable panel state from storage: ${JSON.stringify(
          error,
        )}`,
      );
    }

    return state;
  }

  setCollapsablePanelState(state: Record<string, boolean>): void {
    localStorage.setItem(
      StorageItemKey.COLLAPSABLE_PANEL_STATE,
      JSON.stringify(state),
    );
  }

  getTabState(): Record<string, number> {
    let state: Record<string, number> = {};
    try {
      const storedState = localStorage.getItem(StorageItemKey.TAB_INDEX_STATE);
      if (storedState) {
        state = JSON.parse(storedState);
      }
    } catch (error) {
      console.error(
        `Encountered an error while trying to load tab state from storage: ${JSON.stringify(
          error,
        )}`,
      );
    }

    return state;
  }

  setTabState(state: Record<string, number>): void {
    localStorage.setItem(StorageItemKey.TAB_INDEX_STATE, JSON.stringify(state));
  }

  getStorageSource(): StorageSource | null {
    let source: StorageSource | null = null;
    try {
      const storedSource = localStorage.getItem(StorageItemKey.STORAGE_SOURCE);
      if (
        storedSource &&
        Object.values(StorageSource).includes(storedSource as StorageSource)
      ) {
        source = storedSource as StorageSource;
      }
    } catch (error) {
      console.error(
        `Encountered an error while trying to load storage source from storage: ${JSON.stringify(
          error,
        )}`,
      );
    }

    return source;
  }

  setAssistSaveImage(enabled: boolean): void {
    localStorage.setItem(
      StorageItemKey.ASSIST_SAVE_IMAGE,
      JSON.stringify(enabled),
    );
  }

  getAssistSaveImage(): boolean {
    let enabled = false;
    try {
      const storedValue = localStorage.getItem(
        StorageItemKey.ASSIST_SAVE_IMAGE,
      );
      if (storedValue) {
        enabled = JSON.parse(storedValue);
      }
    } catch (error) {
      console.error(
        `Encountered an error while trying to load assist save image setting from storage: ${JSON.stringify(
          error,
        )}`,
      );
    }

    return enabled;
  }

  @delegateSource()
  async addEntityConfig(
    _entityConfig: EntityConfig,
  ): Promise<Entity.EntityConfig | null> {
    return Promise.resolve(null);
  }

  @delegateSource()
  async updateEntityConfig(
    _entityConfig: EntityConfig,
  ): Promise<Entity.EntityConfig | null> {
    return Promise.resolve(null);
  }

  @delegateSource()
  async getEntityConfigs(): Promise<EntityConfig[]> {
    return Promise.resolve([]);
  }

  @delegateSource()
  async deleteEntityConfig(_id: number): Promise<boolean> {
    return Promise.resolve(true);
  }

  @delegateSource()
  async deletePropertyConfig(
    _entityConfigId: number,
    _id: number,
  ): Promise<boolean> {
    return Promise.resolve(true);
  }

  @delegateSource()
  async addPropertyConfig(
    _propertyConfig: EntityPropertyConfig,
  ): Promise<Entity.EntityPropertyConfig | null> {
    return Promise.resolve(null);
  }

  @delegateSource()
  async updatePropertyConfig(
    _propertyConfig: EntityPropertyConfig,
    _performDriftCheck: boolean,
  ): Promise<Entity.EntityPropertyConfig | null> {
    return Promise.resolve(null);
  }

  @delegateSource()
  async setEntityPropertyOrder(
    _entityConfigId: number,
    _propertyConfigOrder: { id: number; order: number }[],
  ): Promise<boolean> {
    return Promise.resolve(true);
  }

  @delegateSource()
  async exportEntities(_entityConfigIds: number[]): Promise<Entity.Entity[]> {
    return Promise.resolve([]);
  }

  @delegateSource()
  async clearData(_nukedDataTypes: NukedDataType[]): Promise<void> {
    return Promise.resolve();
  }

  @delegateSource()
  async import(_data: ExportDataContents): Promise<boolean> {
    return Promise.resolve(true);
  }

  setTheme(theme: ThemeName): void {
    if (!Object.values(ThemeName).includes(theme)) {
      localStorage.setItem(StorageItemKey.THEME, defaultTheme);
      return;
    }

    localStorage.setItem(StorageItemKey.THEME, theme);
  }

  getTheme(): ThemeName {
    let theme: ThemeName = defaultTheme;
    try {
      const storedTheme = localStorage.getItem(StorageItemKey.THEME);
      if (
        storedTheme &&
        Object.values(ThemeName).includes(storedTheme as ThemeName)
      ) {
        theme = storedTheme as ThemeName;
      }
    } catch (error) {
      console.error(
        `Encountered an error while trying to load theme from storage: ${JSON.stringify(
          error,
        )}`,
      );
    }

    return theme;
  }

  @delegateSource()
  async addEntity(_entity: RequestBody): Promise<Entity.Entity | null> {
    return Promise.resolve(null);
  }

  @delegateSource()
  async updateEntity(
    _id: number,
    _entity: RequestBody,
  ): Promise<Entity.Entity | null> {
    return Promise.resolve(null);
  }

  @delegateSource()
  async deleteEntity(_id: number): Promise<boolean> {
    return Promise.resolve(true);
  }

  @delegateSource()
  async getTags(_tag: string): Promise<string[]> {
    return Promise.resolve([]);
  }

  @delegateSource()
  async bulkOperation(_payload: BulkOperationPayload): Promise<boolean> {
    return Promise.resolve(true);
  }

  @delegateSource()
  async getPropertySuggestions(
    _propertyConfigId: number,
    _query: string,
  ): Promise<string[]> {
    return Promise.resolve([]);
  }

  @delegateSource()
  async getEntities(
    _start: number,
    _perPage: number,
    _listFilter: ListFilter,
    _listSort: ListSort,
  ): Promise<StorageResult<EntityListResult>> {
    return Promise.resolve({ isOk: true, value: { entities: [], total: 0 } });
  }

  @delegateSource()
  async getList(
    _id: string,
    _start: number,
    _perPage: number,
  ): Promise<StorageResult<PublicEntityListResult>> {
    return Promise.resolve({
      isOk: true,
      value: {
        entities: [],
        total: 0,
        listConfig: {} as ListConfig,
        entityConfigs: [] as EntityConfig[],
      },
    });
  }

  @delegateSource()
  async createAccount(
    _username: string,
    _password: string,
    _firstName: string,
    _lastName: string,
  ): Promise<StorageResult<CreateAccountResponseBody>> {
    return Promise.resolve({
      isOk: false,
      error: new Error('Not implemented'),
    });
  }

  @delegateSource()
  async getParties(
    _query: string,
  ): Promise<StorageResult<AccessPolicyParty[]>> {
    return Promise.resolve({ isOk: true, value: [] });
  }

  @delegateSource()
  async getAccessPolicyGroups(): Promise<StorageResult<AccessPolicyGroup[]>> {
    return Promise.resolve({ isOk: true, value: [] });
  }

  @delegateSource()
  async createAccessPolicyGroup(
    _name: string,
    _users: string[],
  ): Promise<StorageResult<AccessPolicyGroup>> {
    return Promise.resolve({ isOk: false, error: new Error('Not implemented') });
  }

  @delegateSource()
  async updateAccessPolicyGroup(
    _id: string,
    _name: string,
    _users: string[],
  ): Promise<StorageResult<AccessPolicyGroup>> {
    return Promise.resolve({ isOk: false, error: new Error('Not implemented') });
  }

  @delegateSource()
  async deleteAccessPolicyGroup(_id: string): Promise<boolean> {
    return Promise.resolve(false);
  }

  @delegateSource()
  async getAccessPolicies(): Promise<StorageResult<AccessPolicy[]>> {
    return Promise.resolve({ isOk: true, value: [] });
  }

  @delegateSource()
  async createAccessPolicy(
    _name: string,
    _description: string,
    _parties: AccessPolicyParty[],
  ): Promise<StorageResult<AccessPolicy>> {
    return Promise.resolve({ isOk: false, error: new Error('Not implemented') });
  }

  @delegateSource()
  async updateAccessPolicy(
    _id: number,
    _name: string,
    _description: string,
    _parties: AccessPolicyParty[],
  ): Promise<StorageResult<AccessPolicy>> {
    return Promise.resolve({ isOk: false, error: new Error('Not implemented') });
  }

  @delegateSource()
  async deleteAccessPolicy(_id: number): Promise<boolean> {
    return Promise.resolve(false);
  }
}

export const storage = new Storage();
