import {
  ListConfig,
  ListSort,
  ListFilter,
  ListSortDirection,
  ListSortNativeProperty,
} from 'api-spec/models/List';
import { api } from './Api';
import { StorageResult, StorageSchema, StorageSource } from '@/models/Storage';
import { Setting, Settings } from 'api-spec/models/Setting';
import {
  EntityCalculatedPropertyConfig,
  EntityConfig,
  EntityConfigUniqueConstraint,
  EntityPropertyConfig,
} from 'api-spec/models/Entity';
import { Entity } from 'api-spec/models';
import { translate } from './Localization';
import { ExportDataContents, NukedDataType } from 'api-spec/models/Data';
import { RequestBody } from '@/components/entity-form/entity-form.models';
import { BulkOperationPayload } from '@/components/bulk-manager/bulk-manager.models';
import { BulkOperation } from 'api-spec/models/Operation';
import {
  EntityListResult,
  PublicEntityListResult,
} from '@/components/entity-list/entity-list.models';
import {
  CreateAccountRequestBody,
  CreateAccountResponseBody,
  UpdateAccountRequestBody,
  UpdatePasswordRequestBody,
} from '@/components/account-form/account-form.models';
import {
  AccessPolicy,
  AccessPolicyGroup,
  AccessPolicyParty,
} from 'api-spec/models/Access';
import {
  MfaSetupResponseBody,
  MfaVerifySetupRequestBody,
} from '@/models/Identity';
import { Medal, MedalConfig } from 'api-spec/models/Medal';
import { Workspace } from 'api-spec/models/Workspace';
import { ThemeName } from '@/models/Page';
import { Chart, ChartRequest, ChartResponse } from 'api-spec/models/Statistic';
import { Fact, FactContext, FactResult, Streak, StreakContext, StreakResult } from 'api-spec/models/Fact';

export class NetworkStorage implements StorageSchema {
  isActive = true;
  storageSource = StorageSource.CLOUD;

  async getListConfigs(): Promise<ListConfig[]> {
    const result = await api.get<{ listConfigs: ListConfig[] }>('listConfig');

    if (result) {
      return Promise.resolve(result.response.listConfigs);
    }

    return Promise.reject();
  }

  async saveListConfig(
    listConfig: ListConfig,
  ): Promise<StorageResult<ListConfig>> {
    const result = await api.put<ListConfig, ListConfig>(
      `listConfig/${listConfig.id}`,
      listConfig,
    );

    if (result && result.isOk) {
      return {
        isOk: true,
        value: result.response,
      };
    }

    return {
      isOk: false,
      error: new Error('Failed to save list config'),
    };
  }

  async updateListSort(listConfigId: string, sort: ListSort): Promise<void> {
    await api.put<ListSort, null>(`listSort/${listConfigId}`, sort);
  }

  async updateListFilter(
    listConfigId: string,
    filter: ListFilter,
  ): Promise<void> {
    await api.put<ListFilter, null>(`listFilter/${listConfigId}`, filter);
  }

  async updateListThemes(
    listConfigId: string,
    themes: string[],
  ): Promise<void> {
    await api.put<string[], null>(`listThemes/${listConfigId}`, themes);
  }

  async addListConfig(): Promise<string> {
    const result = await api.post<{ name: string }, { id: string }>(
      'listConfig',
      {
        name: translate('configName'),
      },
    );

    if (result) {
      return result.response.id;
    }
    return '';
  }

  async deleteListConfig(id: string, deleteItems?: boolean): Promise<boolean> {
    const url = deleteItems
      ? `listConfig/${id}?deleteItems=1`
      : `listConfig/${id}`;
    const result = await api.delete<null>(url);

    if (result && result.isOk) {
      return true;
    }

    return false;
  }

  async getSettings(): Promise<{ user: Settings; system: Settings }> {
    const result = await api.get<{ user: Settings; system: Settings }>(
      'setting',
    );

    if (result && result.isOk) {
      return result.response;
    }

    return Promise.reject();
  }

  async saveSetting(
    setting: Setting,
    listConfigId?: string,
    isSystem?: boolean,
  ): Promise<boolean> {
    const url = listConfigId
      ? `setting/${listConfigId}`
      : isSystem
        ? 'setting?isSystem=true'
        : 'setting';
    const result = await api.put<Setting, Setting>(url, setting);

    if (result && result.isOk) {
      return true;
    }

    return false;
  }

  async addEntityConfig(
    entityConfig: EntityConfig,
  ): Promise<EntityConfig | null> {
    const result = await api.post<EntityConfig, EntityConfig>(
      'entityConfig',
      entityConfig,
    );

    if (result && result.isOk) {
      return result.response;
    }

    return null;
  }

  async updateEntityConfig(
    entityConfig: EntityConfig,
  ): Promise<EntityConfig | null> {
    const result = await api.put<EntityConfig, EntityConfig>(
      `entityConfig/${entityConfig.id}`,
      entityConfig,
    );

    if (result && result.isOk) {
      return result.response;
    }

    return null;
  }

  async getEntityConfigs(): Promise<EntityConfig[]> {
    const result = await api.get<{ entityConfigs: EntityConfig[] }>(
      'entityConfig',
    );

    if (result && result.isOk) {
      return Promise.resolve(result.response.entityConfigs);
    }

    return Promise.reject();
  }

  async deleteEntityConfig(id: number): Promise<boolean> {
    const result = await api.delete<null>(`entityConfig/${id}`);

    if (result && result.isOk) {
      return true;
    }

    return false;
  }

  async deletePropertyConfig(
    entityConfigId: number,
    id: number,
  ): Promise<boolean> {
    const result = await api.delete<null>(
      `propertyConfig/${entityConfigId}/${id}`,
    );

    if (result && result.isOk) {
      return true;
    }

    return false;
  }

  async addPropertyConfig(
    propertyConfig: EntityPropertyConfig,
    performDriftCheck: boolean = true,
  ): Promise<Entity.EntityPropertyConfig | null> {
    const {
      id: _id,
      entityConfigId: entityConfigId,
      ...payload
    } = propertyConfig;
    const timeZone = new Date().getTimezoneOffset();
    const result = await api.post<
      Omit<EntityPropertyConfig, 'id' | 'entityConfigId'> & {
        timeZone: number;
        performDriftCheck: boolean;
      },
      EntityPropertyConfig
    >(`propertyConfig/${entityConfigId}`, {
      ...payload,
      timeZone,
      performDriftCheck,
    });

    if (result && result.isOk) {
      return result.response;
    }

    return null;
  }

  async updatePropertyConfig(
    propertyConfig: EntityPropertyConfig,
    performDriftCheck: boolean = true,
  ): Promise<Entity.EntityPropertyConfig | null> {
    const { id, entityConfigId, ...payload } = propertyConfig;
    const timeZone = new Date().getTimezoneOffset();
    const result = await api.put<
      Omit<EntityPropertyConfig, 'id' | 'entityConfigId'> & {
        timeZone: number;
        performDriftCheck: boolean;
      },
      EntityPropertyConfig
    >(`propertyConfig/${entityConfigId}/${id}`, {
      ...payload,
      timeZone,
      performDriftCheck,
    });

    if (result && result.isOk) {
      return result.response;
    }

    return null;
  }

  async addCalculatedPropertyConfig(
    config: EntityCalculatedPropertyConfig,
  ): Promise<EntityCalculatedPropertyConfig | null> {
    const { name, prefix, suffix, hidden, calculation } = config;
    const result = await api.post<
      { name: string; prefix: string; suffix: string; hidden: boolean; calculation: EntityCalculatedPropertyConfig['calculation']; timeZone: number },
      EntityCalculatedPropertyConfig
    >(`propertyConfig/${config.entityConfigId}`, {
      name,
      prefix,
      suffix,
      hidden,
      calculation,
      timeZone: new Date().getTimezoneOffset(),
    });

    if (result && result.isOk) {
      return result.response;
    }

    return null;
  }

  async updateCalculatedPropertyConfig(
    config: EntityCalculatedPropertyConfig,
  ): Promise<EntityCalculatedPropertyConfig | null> {
    const { name, prefix, suffix, hidden, calculation } = config;
    const result = await api.put<
      { name: string; prefix: string; suffix: string; hidden: boolean; calculation: EntityCalculatedPropertyConfig['calculation']; timeZone: number },
      EntityCalculatedPropertyConfig
    >(`propertyConfig/${config.entityConfigId}/${config.id}`, {
      name,
      prefix,
      suffix,
      hidden,
      calculation,
      timeZone: new Date().getTimezoneOffset(),
    });

    if (result && result.isOk) {
      return result.response;
    }

    return null;
  }

  async setEntityPropertyOrder(
    entityConfigId: number,
    propertyConfigOrder: { id: number; order: number }[],
  ): Promise<boolean> {
    const result = await api.put<{ id: number; order: number }[], null>(
      `propertyConfigOrder/${entityConfigId}`,
      propertyConfigOrder,
    );

    if (result && result.isOk) {
      return true;
    }

    return false;
  }

  async exportEntities(
    entityConfigIds: number[],
    startDate?: string,
    endDate?: string,
  ): Promise<Entity.Entity[]> {
    const result = await api.post<
      { entityConfigIds: number[]; startDate?: string; endDate?: string },
      { entities: Entity.Entity[] }
    >('data/export', { entityConfigIds, startDate, endDate });

    if (result && result.isOk) {
      return result.response.entities;
    }
    return [];
  }

  async export(): Promise<ExportDataContents> {
    const result = await api.get<ExportDataContents>('data/export');
    if (result && result.isOk) {
      return result.response;
    }
    throw new Error('Cloud export failed');
  }

  async clearData(nukedDataTypes: NukedDataType[]): Promise<void> {
    for (const type of nukedDataTypes) {
      const result = await api.delete(`data/${type}`);

      if (!result || !result.isOk) {
        return Promise.reject();
      }
    }

    return Promise.resolve();
  }

  async import(data: ExportDataContents): Promise<boolean> {
    const result = await api.post<
      ExportDataContents & { timeZone: number },
      null
    >('data/import', { ...data, timeZone: new Date().getTimezoneOffset() });

    if (result && result.isOk) {
      return true;
    }
    return false;
  }

  async addEntity(payload: RequestBody): Promise<Entity.Entity | null> {
    const result = await api.post<RequestBody, Entity.Entity>(
      'entity',
      payload,
    );

    if (result && result.isOk) {
      return result.response;
    }
    return null;
  }

  async updateEntity(
    id: number,
    payload: RequestBody,
  ): Promise<Entity.Entity | null> {
    const result = await api.put<RequestBody, Entity.Entity>(
      `entity/${id}`,
      payload,
    );

    if (result && result.isOk) {
      return result.response;
    }
    return null;
  }

  async deleteEntity(id: number): Promise<boolean> {
    const result = await api.delete<null>(`entity/${id}`);

    if (result && result.isOk) {
      return true;
    }
    return false;
  }

  async getEntity(id: number): Promise<Entity.Entity | null> {
    const result = await api.get<Entity.Entity>(`entity/${id}`);

    if (result && result.isOk) {
      return result.response;
    }
    return null;
  }

  async getTags(tag: string): Promise<string[]> {
    const result = await api.get<{ tags: string[] }>(`tag/${tag}`);

    if (result && result.isOk) {
      return result.response.tags;
    }
    return [];
  }

  async bulkOperation(payload: BulkOperationPayload): Promise<boolean> {
    const result = await api.post<BulkOperationPayload, BulkOperation>(
      'operation',
      payload,
    );

    if (result && result.isOk) {
      return true;
    }
    return false;
  }

  async getPropertySuggestions(
    propertyConfigId: number,
    query: string,
  ): Promise<string[]> {
    const result = await api.get<{ suggestions: string[] }>(
      `propertySuggestion/${propertyConfigId}/${query}`,
    );

    if (result && result.isOk) {
      return result.response.suggestions;
    }
    return [];
  }

  async getEntities(
    start: number,
    perPage: number,
    listFilter: ListFilter,
    listSort: ListSort,
  ): Promise<StorageResult<EntityListResult>> {
    const sortIsDefault = (): boolean => {
      return (
        listSort.direction === ListSortDirection.DESC &&
        listSort.property === ListSortNativeProperty.CREATED_AT
      );
    };

    const getUrl = (more = false): string => {
      if (more) {
        start += perPage;
      }

      const queryParams = {
        perPage: `${perPage}`,
        ...(start > 0 ? { start: `${start}` } : {}),
        ...(!(listFilter.includeAll ?? true)
          ? { filter: JSON.stringify(listFilter) }
          : {}),
        ...(!sortIsDefault() ? { sort: JSON.stringify(listSort) } : {}),
      };

      const url = `entity${
        Object.keys(queryParams).length
          ? `?${new URLSearchParams(queryParams)}`
          : ''
      }`;

      return url;
    };

    const result = await api.get<{ entities: Entity.Entity[]; total: number }>(
      getUrl(),
    );

    if (result && result.isOk) {
      return {
        isOk: true,
        value: {
          entities: result.response.entities,
          total: result.response.total,
        },
      };
    }

    return { isOk: false, error: new Error('Failed to fetch entities') };
  }

  async getList(
    id: string,
    start: number,
    perPage: number,
  ): Promise<StorageResult<PublicEntityListResult>> {
    const queryParams = {
      perPage: `${perPage}`,
      ...(start > 0 ? { start: `${start}` } : {}),
    };

    const url = `list/${id}${
      Object.keys(queryParams).length
        ? `?${new URLSearchParams(queryParams)}`
        : ''
    }`;

    const result = await api.get<PublicEntityListResult>(url);

    if (result && result.isOk) {
      return {
        isOk: true,
        value: result.response,
      };
    }

    return { isOk: false, error: new Error('Failed to fetch list') };
  }

  async createAccount(
    username: string,
    password: string,
    firstName: string,
    lastName: string,
    ott: string,
  ): Promise<StorageResult<CreateAccountResponseBody>> {
    const result = await api.post<
      CreateAccountRequestBody,
      CreateAccountResponseBody
    >('user', {
      username,
      password,
      firstName,
      lastName,
      ott,
    });

    if (result && result.isOk) {
      return {
        isOk: true,
        value: result.response,
      };
    }

    return {
      isOk: false,
      error: new Error('Failed to create account'),
    };
  }

  async updateAccount(
    body: UpdateAccountRequestBody,
  ): Promise<StorageResult<void>> {
    const result = await api.put<UpdateAccountRequestBody, void>('user', body);

    if (result && result.isOk) {
      return { isOk: true, value: undefined };
    }

    return { isOk: false, error: new Error('Failed to update account') };
  }

  async updatePassword(
    body: UpdatePasswordRequestBody,
  ): Promise<StorageResult<void>> {
    const result = await api.put<UpdatePasswordRequestBody, void>('user', body);

    if (result && result.isOk) {
      return { isOk: true, value: undefined };
    }

    return { isOk: false, error: new Error('Failed to update password') };
  }

  async getParties(query: string): Promise<StorageResult<AccessPolicyParty[]>> {
    const result = await api.get<{ parties: AccessPolicyParty[] }>(
      `accessPolicyParty/${encodeURIComponent(query)}`,
    );

    if (result && result.isOk) {
      return {
        isOk: true,
        value: result.response.parties,
      };
    }

    return {
      isOk: false,
      error: new Error(translate('getPartiesError')),
    };
  }

  async getAccessPolicyGroups(): Promise<StorageResult<AccessPolicyGroup[]>> {
    const result = await api.get<{ groups: AccessPolicyGroup[] }>(
      'accessPolicyGroup',
    );

    if (result && result.isOk) {
      return { isOk: true, value: result.response.groups };
    }

    return {
      isOk: false,
      error: new Error(translate('getAccessPolicyGroupsError')),
    };
  }

  async createAccessPolicyGroup(
    name: string,
    users: string[],
  ): Promise<StorageResult<AccessPolicyGroup>> {
    const result = await api.post<
      { name: string; users: string[] },
      AccessPolicyGroup
    >('accessPolicyGroup', { name, users });

    if (result && result.isOk) {
      return { isOk: true, value: result.response };
    }

    return {
      isOk: false,
      error: new Error(translate('createAccessPolicyGroupError')),
    };
  }

  async updateAccessPolicyGroup(
    id: string,
    name: string,
    users: string[],
  ): Promise<StorageResult<AccessPolicyGroup>> {
    const result = await api.put<
      { name: string; users: string[] },
      AccessPolicyGroup
    >(`accessPolicyGroup/${id}`, { name, users });

    if (result && result.isOk) {
      return { isOk: true, value: result.response };
    }

    return {
      isOk: false,
      error: new Error(translate('updateAccessPolicyGroupError')),
    };
  }

  async deleteAccessPolicyGroup(id: string): Promise<boolean> {
    const result = await api.delete<null>(`accessPolicyGroup/${id}`);

    if (result && result.isOk) {
      return true;
    }

    return false;
  }

  async getAccessPolicies(): Promise<StorageResult<AccessPolicy[]>> {
    const result = await api.get<{ policies: AccessPolicy[] }>('accessPolicy');

    if (result && result.isOk) {
      return { isOk: true, value: result.response.policies };
    }

    return {
      isOk: false,
      error: new Error(translate('getAccessPoliciesError')),
    };
  }

  async createAccessPolicy(
    name: string,
    description: string,
    parties: AccessPolicyParty[],
  ): Promise<StorageResult<AccessPolicy>> {
    const result = await api.post<
      { name: string; description: string; parties: AccessPolicyParty[] },
      AccessPolicy
    >('accessPolicy', { name, description, parties });

    if (result && result.isOk) {
      return { isOk: true, value: result.response };
    }

    return {
      isOk: false,
      error: new Error(translate('createAccessPolicyError')),
    };
  }

  async updateAccessPolicy(
    id: number,
    name: string,
    description: string,
    parties: AccessPolicyParty[],
  ): Promise<StorageResult<AccessPolicy>> {
    const result = await api.put<
      { name: string; description: string; parties: AccessPolicyParty[] },
      AccessPolicy
    >(`accessPolicy/${id}`, { name, description, parties });

    if (result && result.isOk) {
      return { isOk: true, value: result.response };
    }

    return {
      isOk: false,
      error: new Error(translate('updateAccessPolicyError')),
    };
  }

  async deleteAccessPolicy(id: number): Promise<boolean> {
    const result = await api.delete<null>(`accessPolicy/${id}`);

    if (result && result.isOk) {
      return true;
    }

    return false;
  }

  async saveEntityAccessPolicy(
    entityId: number,
    viewAccessPolicyId: number,
    editAccessPolicyId: number,
  ): Promise<boolean> {
    const result = await api.put<
      { viewAccessPolicyId: number; editAccessPolicyId: number },
      null
    >(`entityAccessPolicy/${entityId}`, {
      viewAccessPolicyId,
      editAccessPolicyId,
    });

    if (result && result.isOk) {
      return true;
    }

    return false;
  }

  async saveListConfigAccessPolicy(
    listConfigId: string,
    viewAccessPolicyId: number,
    editAccessPolicyId: number,
  ): Promise<boolean> {
    const result = await api.put<
      { viewAccessPolicyId: number; editAccessPolicyId: number },
      null
    >(`listConfigAccessPolicy/${listConfigId}`, {
      viewAccessPolicyId,
      editAccessPolicyId,
    });

    if (result && result.isOk) {
      return true;
    }

    return false;
  }

  async saveEntityConfigAccessPolicy(
    entityConfigId: number,
    viewAccessPolicyId: number,
    editAccessPolicyId: number,
  ): Promise<boolean> {
    const result = await api.put<
      { viewAccessPolicyId: number; editAccessPolicyId: number },
      null
    >(`entityConfigAccessPolicy/${entityConfigId}`, {
      viewAccessPolicyId,
      editAccessPolicyId,
    });

    if (result && result.isOk) {
      return true;
    }

    return false;
  }

  async saveEntityConfigUniqueConstraints(
    entityConfigId: number,
    constraints: EntityConfigUniqueConstraint[],
  ): Promise<boolean> {
    const result = await api.put<EntityConfigUniqueConstraint[], null>(
      `uniqueConstraints/${entityConfigId}`,
      constraints,
    );
    return !!(result && result.isOk);
  }

  async getEntitySuggestions(filter: ListFilter): Promise<Entity.Entity[]> {
    const suggestionFilter = { ...filter, suggested: true, published: undefined };
    const queryParams = new URLSearchParams({
      filter: JSON.stringify(suggestionFilter),
    });
    const result = await api.get<{ entities: Entity.Entity[]; total: number }>(
      `entity?${queryParams}`,
    );

    if (result && result.isOk) {
      return result.response.entities;
    }
    return [];
  }

  async addEntitySuggestion(id: number): Promise<boolean> {
    const result = await api.put<
      { published: boolean; suggested: boolean },
      Entity.Entity
    >(`entity/${id}`, { published: true, suggested: false });

    if (result && result.isOk) {
      return true;
    }
    return false;
  }

  async getMfaSetup(): Promise<StorageResult<MfaSetupResponseBody>> {
    const result = await api.get<MfaSetupResponseBody>('mfaSetup');

    if (result && result.isOk) {
      return { isOk: true, value: result.response };
    }

    return { isOk: false, error: new Error('Failed to fetch MFA setup') };
  }

  async verifyMfaSetup(body: MfaVerifySetupRequestBody): Promise<StorageResult<void>> {
    const result = await api.post<MfaVerifySetupRequestBody, void>('mfaVerifySetup', body);

    if (result && result.isOk) {
      return { isOk: true, value: undefined };
    }

    return { isOk: false, error: new Error('Failed to verify MFA setup') };
  }

  async getMedals(): Promise<Medal[]> {
    const result = await api.get<{ medals: Medal[] }>('medal');

    if (result && result.isOk) {
      return Promise.resolve(result.response.medals);
    }

    return Promise.reject();
  }

  async getMedalConfigs(): Promise<MedalConfig[]> {
    const result = await api.get<{ medalConfigs: MedalConfig[] }>('medalConfig');

    if (result && result.isOk) {
      return Promise.resolve(result.response.medalConfigs);
    }

    return Promise.reject();
  }

  async getMedalConfig(id: number): Promise<MedalConfig | null> {
    const result = await api.get<MedalConfig>(`medalConfig/${id}`);

    if (result && result.isOk) {
      return result.response;
    }

    return null;
  }

  async createMedalConfig(
    body: Omit<MedalConfig, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<MedalConfig | null> {
    const result = await api.post<Omit<MedalConfig, 'id' | 'createdAt' | 'updatedAt'>, MedalConfig>(
      'medalConfig',
      body,
    );

    if (result && result.isOk) {
      return result.response;
    }

    return null;
  }

  async updateMedalConfig(
    id: number,
    body: Omit<MedalConfig, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<MedalConfig | null> {
    const result = await api.put<Omit<MedalConfig, 'id' | 'createdAt' | 'updatedAt'>, MedalConfig>(
      `medalConfig/${id}`,
      body,
    );

    if (result && result.isOk) {
      return result.response;
    }

    return null;
  }

  async deleteMedalConfig(id: number): Promise<boolean> {
    const result = await api.delete<null>(`medalConfig/${id}`);

    if (result && result.isOk) {
      return true;
    }

    return false;
  }

  async getWorkspaces(): Promise<Workspace[]> {
    const result = await api.get<{ workspaces: Workspace[] }>('workspace');

    if (result && result.isOk) {
      return Promise.resolve(result.response.workspaces);
    }

    return Promise.reject();
  }

  async createWorkspace(
    name: string,
    listConfigs: string[],
    color: string,
    showEverything: boolean,
    theme: ThemeName,
  ): Promise<StorageResult<Workspace>> {
    const result = await api.post<
      { name: string; listConfigs: string[]; color: string; showEverything: boolean; theme: ThemeName },
      Workspace
    >('workspace', { name, listConfigs, color, showEverything, theme });

    if (result && result.isOk) {
      return { isOk: true, value: result.response };
    }

    return { isOk: false, error: new Error('Failed to create workspace') };
  }

  async saveWorkspace(workspace: Workspace): Promise<StorageResult<Workspace>> {
    const result = await api.put<
      { name: string; listConfigs: string[]; color: string; showEverything: boolean; theme: string },
      Workspace
    >(`workspace/${workspace.id}`, {
      name: workspace.name,
      listConfigs: workspace.listConfigs,
      color: workspace.color,
      showEverything: workspace.showEverything,
      theme: workspace.theme,
    });

    if (result && result.isOk) {
      return { isOk: true, value: result.response };
    }

    return { isOk: false, error: new Error('Failed to save workspace') };
  }

  async deleteWorkspace(id: string): Promise<boolean> {
    const result = await api.delete<null>(`workspace/${id}`);

    if (result && result.isOk) {
      return true;
    }

    return false;
  }

  async createChart(
    request: ChartRequest,
  ): Promise<StorageResult<ChartResponse>> {
    const result = await api.post<ChartRequest, ChartResponse>('chart', request);

    if (result && result.isOk) {
      return { isOk: true, value: result.response };
    }

    return { isOk: false, error: new Error('Failed to create chart') };
  }

  async getCharts(): Promise<Chart[]> {
    const result = await api.get<{ charts: Chart[] }>('chart');

    if (result && result.isOk) {
      return result.response.charts;
    }

    return [];
  }

  async updateChart(
    id: number,
    request: ChartRequest,
  ): Promise<StorageResult<ChartResponse>> {
    const result = await api.put<ChartRequest, ChartResponse>(`chart/${id}`, request);

    if (result && result.isOk) {
      return { isOk: true, value: result.response };
    }

    return { isOk: false, error: new Error('Failed to update chart') };
  }

  async deleteChart(id: number): Promise<boolean> {
    const result = await api.delete<null>(`chart/${id}`);

    if (result && result.isOk) {
      return true;
    }

    return false;
  }

  async getStreaks(): Promise<{ streaks: Streak[]; results: StreakResult[] }> {
    const result = await api.get<{ streaks: Streak[]; results: StreakResult[] }>('streakRequest');

    if (result && result.isOk) {
      return result.response;
    }

    return { streaks: [], results: [] };
  }

  async createStreak(name: string, context: StreakContext): Promise<StorageResult<Streak>> {
    const result = await api.post<{ name: string; context: StreakContext }, { streak: Streak }>(
      'streakRequest',
      { name, context },
    );

    if (result && result.isOk) {
      return { isOk: true, value: result.response.streak };
    }

    return { isOk: false, error: new Error('Failed to create streak') };
  }

  async updateStreak(
    id: number,
    name: string | undefined,
    context: StreakContext | undefined,
  ): Promise<StorageResult<Streak>> {
    const result = await api.put<
      { name?: string; context?: StreakContext },
      { streak: Streak }
    >(`streakRequest/${id}`, { name, context });

    if (result && result.isOk) {
      return { isOk: true, value: result.response.streak };
    }

    return { isOk: false, error: new Error('Failed to update streak') };
  }

  async deleteStreak(id: number): Promise<boolean> {
    const result = await api.delete<null>(`streakRequest/${id}`);

    if (result && result.isOk) {
      return true;
    }

    return false;
  }

  async getFacts(): Promise<{ facts: Fact[]; results: FactResult[] }> {
    const result = await api.get<{ facts: Fact[]; results: FactResult[] }>('factRequest');

    if (result && result.isOk) {
      return result.response;
    }

    return { facts: [], results: [] };
  }

  async createFact(name: string, context: FactContext): Promise<StorageResult<Fact>> {
    const result = await api.post<{ name: string; context: FactContext }, { fact: Fact }>(
      'factRequest',
      { name, context },
    );

    if (result && result.isOk) {
      return { isOk: true, value: result.response.fact };
    }

    return { isOk: false, error: new Error('Failed to create fact') };
  }

  async updateFact(
    id: number,
    name: string | undefined,
    context: FactContext | undefined,
  ): Promise<StorageResult<Fact>> {
    const result = await api.put<
      { name?: string; context?: FactContext },
      { fact: Fact }
    >(`factRequest/${id}`, { name, context });

    if (result && result.isOk) {
      return { isOk: true, value: result.response.fact };
    }

    return { isOk: false, error: new Error('Failed to update fact') };
  }

  async deleteFact(id: number): Promise<boolean> {
    const result = await api.delete<null>(`factRequest/${id}`);

    if (result && result.isOk) {
      return true;
    }

    return false;
  }
}

export const networkStorage = new NetworkStorage();
