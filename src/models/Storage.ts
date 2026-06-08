import { Setting, Settings } from 'api-spec/models/Setting';
import { Medal, MedalConfig } from 'api-spec/models/Medal';
import { Workspace } from 'api-spec/models/Workspace';
import { Chart, ChartRequest, ChartResponse } from 'api-spec/models/Statistic';
import { ListConfig, ListSort, ListFilter } from 'api-spec/models/List';
import {
  EntityCalculatedPropertyConfig,
  EntityConfig,
  EntityConfigUniqueConstraint,
  EntityPropertyConfig,
} from 'api-spec/models/Entity';
import { Entity } from 'api-spec/models';
import { ExportDataContents, NukedDataType } from 'api-spec/models/Data';
import {
  AccessPolicy,
  AccessPolicyGroup,
  AccessPolicyParty,
} from 'api-spec/models/Access';
import { ThemeName } from './Page';
import { RequestBody } from '@/components/entity-form/entity-form.models';
import { BulkOperationPayload } from '@/components/bulk-manager/bulk-manager.models';
import { EntityListResult } from '@/components/entity-list/entity-list.models';
import {
  CreateAccountResponseBody,
  UpdateAccountRequestBody,
  UpdatePasswordRequestBody,
} from '@/components/account-form/account-form.models';
import {
  MfaSetupResponseBody,
  MfaVerifySetupRequestBody,
} from '@/models/Identity';

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
  ACTIVE_WORKSPACE_ID = 'activeWorkspaceId',
  ACTIVE_WORKSPACE_COLOR = 'activeWorkspaceColor',
  ACTIVE_WORKSPACE_THEME = 'activeWorkspaceTheme',
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
  deleteListConfig?(id: string, deleteItems?: boolean): Promise<boolean>;
  saveListConfig?(listConfig: ListConfig): Promise<StorageResult<ListConfig>>;
  updateListSort?(listConfigId: string, sort: ListSort): Promise<void>;
  updateListFilter?(listConfigId: string, filter: ListFilter): Promise<void>;
  updateListThemes?(listConfigId: string, themes: string[]): Promise<void>;
  getSettings?(): Promise<{ user: Settings; system: Settings }>;
  saveSetting?(setting: Setting, listConfigId?: string, isSystem?: boolean): Promise<boolean>;
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
  addCalculatedPropertyConfig?(
    config: EntityCalculatedPropertyConfig,
  ): Promise<EntityCalculatedPropertyConfig | null>;
  updateCalculatedPropertyConfig?(
    config: EntityCalculatedPropertyConfig,
  ): Promise<EntityCalculatedPropertyConfig | null>;
  setWindowScrollPosition?(x: number, y: number): void;
  getWindowScrollPosition?(): { x: number; y: number };
  setEntityPropertyOrder?(
    entityConfigId: number,
    propertyConfigOrder: { id: number; order: number }[],
  ): Promise<boolean>;
  exportEntities?(entityConfigIds: number[], startDate?: string, endDate?: string): Promise<Entity.Entity[]>;
  export?(): Promise<ExportDataContents>;
  import?(data: ExportDataContents): Promise<boolean>;
  clearData?(nukedDataTypes: NukedDataType[]): Promise<void>;
  setTheme?(theme: ThemeName): void;
  getTheme?(): ThemeName;
  addEntity?(entity: RequestBody): Promise<Entity.Entity | null>;
  updateEntity?(id: number, entity: RequestBody): Promise<Entity.Entity | null>;
  deleteEntity?(id: number): Promise<boolean>;
  getEntity?(id: number): Promise<Entity.Entity | null>;
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
    ott: string,
  ): Promise<StorageResult<CreateAccountResponseBody>>;
  updateAccount?(
    body: UpdateAccountRequestBody,
  ): Promise<StorageResult<void>>;
  updatePassword?(
    body: UpdatePasswordRequestBody,
  ): Promise<StorageResult<void>>;
  setStorageSource?(source: StorageSource): void;
  getStorageSource?(): StorageSource | null;
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
  getAccessPolicies?(): Promise<StorageResult<AccessPolicy[]>>;
  createAccessPolicy?(
    name: string,
    description: string,
    parties: AccessPolicyParty[],
  ): Promise<StorageResult<AccessPolicy>>;
  updateAccessPolicy?(
    id: number,
    name: string,
    description: string,
    parties: AccessPolicyParty[],
  ): Promise<StorageResult<AccessPolicy>>;
  deleteAccessPolicy?(id: number): Promise<boolean>;
  saveEntityAccessList?(
    entityId: number,
    accessListId: number,
  ): Promise<boolean>;
  saveListConfigAccessPolicy?(
    listConfigId: string,
    viewAccessPolicyId: number,
    editAccessPolicyId: number,
  ): Promise<boolean>;
  saveEntityConfigAccessPolicy?(
    entityConfigId: number,
    viewAccessPolicyId: number,
    editAccessPolicyId: number,
  ): Promise<boolean>;
  getEntitySuggestions?(filter: ListFilter): Promise<Entity.Entity[]>;
  addEntitySuggestion?(id: number): Promise<boolean>;
  getMfaSetup?(): Promise<StorageResult<MfaSetupResponseBody>>;
  verifyMfaSetup?(body: MfaVerifySetupRequestBody): Promise<StorageResult<void>>;
  getMedals?(): Promise<Medal[]>;
  getMedalConfigs?(): Promise<MedalConfig[]>;
  getMedalConfig?(id: number): Promise<MedalConfig | null>;
  createMedalConfig?(body: Omit<MedalConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<MedalConfig | null>;
  updateMedalConfig?(id: number, body: Omit<MedalConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<MedalConfig | null>;
  deleteMedalConfig?(id: number): Promise<boolean>;
  saveEntityConfigUniqueConstraints?(
    entityConfigId: number,
    constraints: EntityConfigUniqueConstraint[],
  ): Promise<boolean>;
  getWorkspaces?(): Promise<Workspace[]>;
  createWorkspace?(name: string, listConfigs: string[], color: string, showEverything: boolean, theme: ThemeName): Promise<StorageResult<Workspace>>;
  saveWorkspace?(workspace: Workspace): Promise<StorageResult<Workspace>>;
  deleteWorkspace?(id: string): Promise<boolean>;
  getActiveWorkspaceId?(): string;
  setActiveWorkspaceId?(id: string): void;
  getActiveWorkspaceTheme?(): ThemeName;
  setActiveWorkspaceTheme?(theme: ThemeName): void;
  createChart?(request: ChartRequest): Promise<StorageResult<ChartResponse>>;
  updateChart?(id: number, request: ChartRequest): Promise<StorageResult<ChartResponse>>;
  getCharts?(): Promise<Chart[]>;
  deleteChart?(id: number): Promise<boolean>;
}
