import { Setting } from 'api-spec/models/Setting';
import { ListConfig, ListSort, ListFilter } from 'api-spec/models/List';
import { EntityConfig, EntityPropertyConfig } from 'api-spec/models/Entity';
import { Entity } from 'api-spec/models';
import { ExportDataContents, NukedDataType } from 'api-spec/models/Data';
import { AccessPolicyGroup, AccessPolicyParty } from 'api-spec/models/Access';
import { ThemeName } from './Page';
import { RequestBody } from '@/components/entity-form/entity-form.models';
import { BulkOperationPayload } from '@/components/bulk-manager/bulk-manager.models';
import { EntityListResult } from '@/components/entity-list/entity-list.models';
import { CreateAccountResponseBody } from '@/components/account-form/account-form.models';

export enum StorageItemKey {
  ACTIVE_LIST_FILTER_KEY = 'listFilter',
  LIST_FILTERS_KEY = 'listFilters',
  VIEW_KEY = 'view',
  ADVANCED_MODE_KEY = 'advancedMode',
  DEBUG_MODE_KEY = 'debugMode',
  LIST_CONFIGS_KEY = 'listConfigs',
  LIST_CONTEXT_MODE = 'listContextMode',
  LIST_CONTEXT = 'listContext',
  ACTIVE_LIST_CONFIG_ID = 'activeListConfigId',
  AUTH_TOKEN_KEY = 'authToken',
  VERSION = 'version',
  WINDOW_SCROLL_POSITION = 'windowScrollPosition',
  COLLAPSABLE_PANEL_STATE = 'collapsablePanelState',
  TAB_INDEX_STATE = 'tabIndexState',
  THEME = 'theme',
  STORAGE_SOURCE = 'storageSource',
  ASSIST_SAVE_IMAGE = 'assistSaveImage',
}

export const delegatedStorageItemKeys: StorageItemKey[] = [
  StorageItemKey.ACTIVE_LIST_FILTER_KEY,
  StorageItemKey.LIST_FILTERS_KEY,
  StorageItemKey.LIST_CONFIGS_KEY,
  StorageItemKey.LIST_CONTEXT_MODE,
  StorageItemKey.LIST_CONTEXT,
  StorageItemKey.ACTIVE_LIST_CONFIG_ID,
];

export enum StorageSource {
  CLOUD = 'cloud',
  DEVICE = 'device',
}

export type StorageOkResult<T> = {
  isOk: true;
  value: T;
};

export type StorageErrorResult = {
  isOk: false;
  error: Error;
};

export type StorageResult<T> = StorageOkResult<T> | StorageErrorResult;

export interface StorageSchema {
  isActive: boolean;
  storageSource?: StorageSource;
  setAuthToken?(authToken: string): void;
  getAuthToken?(): string;
  getListConfigs?(): Promise<ListConfig[]>;
  addListConfig?(): Promise<string>;
  deleteListConfig?(id: string): Promise<boolean>;
  saveListConfig?(listConfig: ListConfig): Promise<StorageResult<ListConfig>>;
  updateListSort?(listConfigId: string, sort: ListSort): Promise<void>;
  updateListFilter?(listConfigId: string, filter: ListFilter): Promise<void>;
  updateListThemes?(listConfigId: string, themes: string[]): Promise<void>;
  saveSetting?(listConfigId: string, setting: Setting): Promise<boolean>;
  updateEntityConfig?(
    entityConfig: EntityConfig,
  ): Promise<Entity.EntityConfig | null>;
  addEntityConfig?(
    entityConfig: EntityConfig,
  ): Promise<Entity.EntityConfig | null>;
  getEntityConfigs?(): Promise<EntityConfig[]>;
  deleteEntityConfig?(id: number): Promise<boolean>;
  deletePropertyConfig?(entityConfigId: number, id: number): Promise<boolean>;
  addPropertyConfig?(
    propertyConfig: EntityPropertyConfig,
  ): Promise<Entity.EntityPropertyConfig | null>;
  updatePropertyConfig?(
    propertyConfig: EntityPropertyConfig,
    performDriftCheck: boolean,
  ): Promise<Entity.EntityPropertyConfig | null>;
  setWindowScrollPosition?(x: number, y: number): void;
  getWindowScrollPosition?(): { x: number; y: number };
  getCollapsablePanelState?(): Record<string, boolean>;
  setCollapsablePanelState?(state: Record<string, boolean>): void;
  getTabState?(): Record<string, number>;
  setTabState?(state: Record<string, number>): void;
  setEntityPropertyOrder?(
    entityConfigId: number,
    propertyConfigOrder: { id: number; order: number }[],
  ): Promise<boolean>;
  exportEntities?(entityConfigIds: number[]): Promise<Entity.Entity[]>;
  import?(data: ExportDataContents): Promise<boolean>;
  clearData?(nukedDataTypes: NukedDataType[]): Promise<void>;
  setTheme?(theme: ThemeName): void;
  getTheme?(): ThemeName;
  addEntity?(entity: RequestBody): Promise<Entity.Entity | null>;
  updateEntity?(id: number, entity: RequestBody): Promise<Entity.Entity | null>;
  deleteEntity?(id: number): Promise<boolean>;
  getTags?(tag: string): Promise<string[]>;
  bulkOperation?(payload: BulkOperationPayload): Promise<boolean>;
  getPropertySuggestions?(
    propertyConfigId: number,
    query: string,
  ): Promise<string[]>;
  getEntities?(
    start: number,
    perPage: number,
    listFilter: ListFilter,
    listSort: ListSort,
  ): Promise<StorageResult<EntityListResult>>;
  getList?(
    id: string,
    start: number,
    perPage: number,
  ): Promise<StorageResult<EntityListResult>>;
  createUser?(
    username: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<StorageResult<CreateAccountResponseBody>>;
  setStorageSource?(source: StorageSource): void;
  getStorageSource?(): StorageSource | null;
  setAssistSaveImage?(enabled: boolean): void;
  getAssistSaveImage?(): boolean;
  getParties?(query: string): Promise<StorageResult<AccessPolicyParty[]>>;
  getAccessPolicyGroups?(): Promise<StorageResult<AccessPolicyGroup[]>>;
  createAccessPolicyGroup?(
    name: string,
    users: string[],
  ): Promise<StorageResult<AccessPolicyGroup>>;
  updateAccessPolicyGroup?(
    id: string,
    name: string,
    users: string[],
  ): Promise<StorageResult<AccessPolicyGroup>>;
  deleteAccessPolicyGroup?(id: string): Promise<boolean>;
}
