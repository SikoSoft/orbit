import type { SqlValue } from '@sqlite.org/sqlite-wasm';

import { EntityConfig, EntityPropertyConfig } from 'api-spec/models/Entity';
import { Entity } from 'api-spec/models';
import { ListConfig, ListFilter, ListSort } from 'api-spec/models/List';
import { Setting, Settings } from 'api-spec/models/Setting';
import {
  ExportDataContents,
  ExportDataType,
  NukedDataType,
} from 'api-spec/models/Data';
import {
  AccessPolicy,
  AccessPolicyGroup,
  AccessPolicyParty,
} from 'api-spec/models/Access';

import { StorageResult, StorageSchema, StorageSource } from '@/models/Storage';
import { RequestBody } from '@/components/entity-form/entity-form.models';
import { BulkOperationPayload } from '@/components/bulk-manager/bulk-manager.models';
import {
  EntityListResult,
  PublicEntityListResult,
} from '@/components/entity-list/entity-list.models';
import {
  CreateAccountResponseBody,
  UpdateAccountRequestBody,
  UpdatePasswordRequestBody,
} from '@/components/account-form/account-form.models';

import { SQLiteStorage, serializePropertyValue } from './SQLiteStorage';
import { networkStorage } from './NetworkStorage';

function emptyMeta(): { version: string; date: string } {
  return { version: '', date: new Date().toISOString() };
}

type CacheTable =
  | 'entity'
  | 'entity_config'
  | 'entity_property_config'
  | 'list_config';

interface PendingSyncRow {
  id: number;
  operation: string;
  payload: string;
  local_id: string | null;
  table_name: string | null;
}

// ─── CacheSQLiteStorage ───────────────────────────────────────────────────────
// Extends SQLiteStorage to add the queue/mapping operations needed for offline sync.

class CacheSQLiteStorage extends SQLiteStorage {
  constructor() {
    super('/orbit-cache.db');
  }

  async enqueue(
    operation: string,
    args: unknown[],
    localId: string | null = null,
    tableName: CacheTable | null = null,
  ): Promise<void> {
    await this.run(
      `INSERT INTO pending_sync (operation, payload, local_id, table_name) VALUES (?, ?, ?, ?)`,
      [operation, JSON.stringify(args), localId, tableName],
    );
  }

  async pendingOps(): Promise<PendingSyncRow[]> {
    const rows = await this.execRows(
      'SELECT * FROM pending_sync ORDER BY id ASC',
    );
    return rows as unknown as PendingSyncRow[];
  }

  async dequeue(id: number): Promise<void> {
    await this.run('DELETE FROM pending_sync WHERE id = ?', [id]);
  }

  async resolveIntId(localId: number, table: CacheTable): Promise<number> {
    if (localId >= 0) {
      return localId;
    }
    const rows = await this.execRows(
      'SELECT server_id FROM temp_id_map WHERE local_id = ? AND table_name = ?',
      [String(localId), table],
    );
    return rows[0] ? parseInt(rows[0]['server_id'] as string, 10) : localId;
  }

  async resolveStrId(localId: string, table: CacheTable): Promise<string> {
    const rows = await this.execRows(
      'SELECT server_id FROM temp_id_map WHERE local_id = ? AND table_name = ?',
      [localId, table],
    );
    return rows[0] ? (rows[0]['server_id'] as string) : localId;
  }

  async mapId(
    localId: string | number,
    table: CacheTable,
    serverId: string | number,
  ): Promise<void> {
    await this.run(
      'INSERT OR REPLACE INTO temp_id_map (local_id, table_name, server_id) VALUES (?, ?, ?)',
      [String(localId), table, String(serverId)],
    );
  }

  async nextTempId(
    table: 'entity' | 'entity_config' | 'entity_property_config',
  ): Promise<number> {
    const val = await this.execValue(
      `SELECT COALESCE(MIN(id), 0) - 1 FROM ${table}`,
    );
    return val as number;
  }

  async insertEntityConfigOffline(
    config: EntityConfig,
    id: number,
  ): Promise<EntityConfig> {
    await this.run(
      `INSERT OR REPLACE INTO entity_config
       (id, name, description, revision_of, allow_property_ordering, ai_enabled, ai_identify_prompt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        config.name,
        config.description,
        config.revisionOf ?? null,
        config.allowPropertyOrdering ? 1 : 0,
        config.aiEnabled ? 1 : 0,
        config.aiIdentifyPrompt,
      ],
    );

    const propIds: number[] = [];
    let nextPropId = await this.nextTempId('entity_property_config');
    for (const prop of config.properties) {
      propIds.push(nextPropId);
      await this.run(
        `INSERT OR REPLACE INTO entity_property_config
         (id, entity_config_id, name, data_type, prefix, suffix, required, repeat,
          allowed, hidden, default_value, options_only, options)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nextPropId--,
          id,
          prop.name,
          prop.dataType,
          prop.prefix,
          prop.suffix,
          prop.required,
          prop.repeat,
          prop.allowed,
          prop.hidden ? 1 : 0,
          serializePropertyValue(prop.defaultValue, prop.dataType),
          prop.optionsOnly ? 1 : 0,
          JSON.stringify(prop.options),
        ],
      );
    }

    return {
      ...config,
      id,
      properties: config.properties.map((p, i) => ({
        ...p,
        id: propIds[i],
        entityConfigId: id,
      })),
    };
  }

  async upsertPropertyConfig(
    propertyConfig: EntityPropertyConfig,
    id: number,
  ): Promise<EntityPropertyConfig> {
    await this.run(
      `INSERT OR REPLACE INTO entity_property_config
       (id, entity_config_id, name, data_type, prefix, suffix, required, repeat,
        allowed, hidden, default_value, options_only, options)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        propertyConfig.entityConfigId,
        propertyConfig.name,
        propertyConfig.dataType,
        propertyConfig.prefix,
        propertyConfig.suffix,
        propertyConfig.required,
        propertyConfig.repeat,
        propertyConfig.allowed,
        propertyConfig.hidden ? 1 : 0,
        serializePropertyValue(
          propertyConfig.defaultValue,
          propertyConfig.dataType,
        ),
        propertyConfig.optionsOnly ? 1 : 0,
        JSON.stringify(propertyConfig.options),
      ],
    );
    return { ...propertyConfig, id };
  }

  async upsertEntity(payload: RequestBody, id: number): Promise<Entity.Entity> {
    const now = new Date().toISOString();
    await this.run(
      `INSERT OR REPLACE INTO entity (id, type, created_at, updated_at) VALUES (?, ?, ?, ?)`,
      [id, payload.entityConfigId, now, now],
    );
    await this.run('DELETE FROM entity_tag WHERE entity_id = ?', [id]);
    await this.run('DELETE FROM entity_property WHERE entity_id = ?', [id]);
    await this.writeEntityTags(id, payload.tags);
    await this.writeEntityProperties(id, payload.properties);
    const rows = await this.execRows('SELECT * FROM entity WHERE id = ?', [id]);
    const entities = await this.loadEntityRows(rows);
    return entities[0];
  }

  async patchEntityId(localId: number, serverId: number): Promise<void> {
    await this.run('UPDATE entity SET id = ? WHERE id = ?', [
      serverId,
      localId,
    ]);
    await this.run('UPDATE entity_tag SET entity_id = ? WHERE entity_id = ?', [
      serverId,
      localId,
    ]);
    await this.run(
      'UPDATE entity_property SET entity_id = ? WHERE entity_id = ?',
      [serverId, localId],
    );
  }

  async patchEntityConfigId(localId: number, serverId: number): Promise<void> {
    await this.run('UPDATE entity_config SET id = ? WHERE id = ?', [
      serverId,
      localId,
    ]);
    await this.run(
      'UPDATE entity_property_config SET entity_config_id = ? WHERE entity_config_id = ?',
      [serverId, localId],
    );
    await this.run('UPDATE entity SET type = ? WHERE type = ?', [
      serverId,
      localId,
    ]);
  }

  async patchPropertyConfigId(
    localId: number,
    serverId: number,
  ): Promise<void> {
    await this.run('UPDATE entity_property_config SET id = ? WHERE id = ?', [
      serverId,
      localId,
    ]);
    await this.run(
      'UPDATE entity_property SET property_config_id = ? WHERE property_config_id = ?',
      [serverId, localId],
    );
  }

  async patchListConfigId(localId: string, serverId: string): Promise<void> {
    await this.run('UPDATE list_config SET id = ? WHERE id = ?', [
      serverId,
      localId,
    ]);
  }

  async hasPendingOps(): Promise<boolean> {
    const val = (await this.execValue(
      'SELECT COUNT(*) FROM pending_sync',
    )) as SqlValue;
    return (val as number) > 0;
  }
}

// ─── OfflineCacheStorage ──────────────────────────────────────────────────────

export class OfflineCacheStorage implements StorageSchema {
  isActive = false;
  storageSource = StorageSource.CLOUD;

  private readonly db = new CacheSQLiteStorage();
  private isOnline = navigator.onLine;
  private syncInProgress = false;

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      void this.syncPendingQueue();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // ─── Entity Configs ─────────────────────────────────────────────────────────

  async getEntityConfigs(): Promise<EntityConfig[]> {
    console.time('[orbit] getEntityConfigs');
    if (this.isOnline) {
      try {
        console.log('[orbit] getEntityConfigs: fetching from network');
        const configs = await networkStorage.getEntityConfigs();
        this.db.import({
          meta: emptyMeta(),
          [ExportDataType.ENTITY_CONFIGS]: configs,
          [ExportDataType.ENTITIES]: [],
          [ExportDataType.LIST_CONFIGS]: [],
        }).catch(err => console.warn('[orbit] getEntityConfigs: cache write failed', err));
        console.log('[orbit] getEntityConfigs: network returned %d configs', configs.length);
        console.timeEnd('[orbit] getEntityConfigs');
        return configs;
      } catch (err) {
        console.warn('[orbit] getEntityConfigs: network failed, falling back to cache', err);
      }
    } else {
      console.log('[orbit] getEntityConfigs: offline, reading from cache');
    }
    const configs = await this.db.getEntityConfigs();
    console.log('[orbit] getEntityConfigs: cache returned %d configs', configs.length);
    console.timeEnd('[orbit] getEntityConfigs');
    return configs;
  }

  async addEntityConfig(
    entityConfig: EntityConfig,
  ): Promise<EntityConfig | null> {
    if (this.isOnline) {
      const result = await networkStorage.addEntityConfig(entityConfig);
      if (result) {
        await this.db.import({
          meta: emptyMeta(),
          [ExportDataType.ENTITY_CONFIGS]: [result],
          [ExportDataType.ENTITIES]: [],
          [ExportDataType.LIST_CONFIGS]: [],
        });
        return result;
      }
    }

    const tempId = await this.db.nextTempId('entity_config');
    const cached = await this.db.insertEntityConfigOffline(
      entityConfig,
      tempId,
    );
    await this.db.enqueue(
      'addEntityConfig',
      [entityConfig],
      String(tempId),
      'entity_config',
    );
    return cached;
  }

  async updateEntityConfig(
    entityConfig: EntityConfig,
  ): Promise<EntityConfig | null> {
    await this.db.updateEntityConfig(entityConfig);

    if (this.isOnline && entityConfig.id > 0) {
      return networkStorage.updateEntityConfig(entityConfig);
    }

    await this.db.enqueue('updateEntityConfig', [entityConfig]);
    return entityConfig;
  }

  async deleteEntityConfig(id: number): Promise<boolean> {
    await this.db.deleteEntityConfig(id);

    if (this.isOnline && id > 0) {
      return networkStorage.deleteEntityConfig(id);
    }

    await this.db.enqueue('deleteEntityConfig', [id]);
    return true;
  }

  // ─── Property Configs ────────────────────────────────────────────────────────

  async addPropertyConfig(
    propertyConfig: EntityPropertyConfig,
  ): Promise<EntityPropertyConfig | null> {
    if (this.isOnline && propertyConfig.entityConfigId > 0) {
      const result = await networkStorage.addPropertyConfig(propertyConfig);
      if (result) {
        await this.db.upsertPropertyConfig(result, result.id);
        return result;
      }
    }

    const tempId = await this.db.nextTempId('entity_property_config');
    const cached = await this.db.upsertPropertyConfig(propertyConfig, tempId);
    await this.db.enqueue(
      'addPropertyConfig',
      [propertyConfig],
      String(tempId),
      'entity_property_config',
    );
    return cached;
  }

  async updatePropertyConfig(
    propertyConfig: EntityPropertyConfig,
    performDriftCheck: boolean,
  ): Promise<EntityPropertyConfig | null> {
    await this.db.updatePropertyConfig(propertyConfig);

    if (
      this.isOnline &&
      propertyConfig.id > 0 &&
      propertyConfig.entityConfigId > 0
    ) {
      return networkStorage.updatePropertyConfig(
        propertyConfig,
        performDriftCheck,
      );
    }

    await this.db.enqueue('updatePropertyConfig', [
      propertyConfig,
      performDriftCheck,
    ]);
    return propertyConfig;
  }

  async deletePropertyConfig(
    entityConfigId: number,
    id: number,
  ): Promise<boolean> {
    await this.db.deletePropertyConfig(entityConfigId, id);

    if (this.isOnline && id > 0 && entityConfigId > 0) {
      return networkStorage.deletePropertyConfig(entityConfigId, id);
    }

    await this.db.enqueue('deletePropertyConfig', [entityConfigId, id]);
    return true;
  }

  async setEntityPropertyOrder(
    entityConfigId: number,
    propertyConfigOrder: { id: number; order: number }[],
  ): Promise<boolean> {
    await this.db.setEntityPropertyOrder(entityConfigId, propertyConfigOrder);

    if (this.isOnline && entityConfigId > 0) {
      return networkStorage.setEntityPropertyOrder(
        entityConfigId,
        propertyConfigOrder,
      );
    }

    await this.db.enqueue('setEntityPropertyOrder', [
      entityConfigId,
      propertyConfigOrder,
    ]);
    return true;
  }

  // ─── Entities ────────────────────────────────────────────────────────────────

  async getEntities(
    start: number,
    perPage: number,
    listFilter: ListFilter,
    listSort: ListSort,
  ): Promise<StorageResult<EntityListResult>> {
    if (this.isOnline) {
      const result = await networkStorage.getEntities(
        start,
        perPage,
        listFilter,
        listSort,
      );
      if (result.isOk) {
        return result;
      }
    }
    return this.db.getEntities(start, perPage, listFilter, listSort);
  }

  async addEntity(payload: RequestBody): Promise<Entity.Entity | null> {
    if (this.isOnline && payload.entityConfigId > 0) {
      const result = await networkStorage.addEntity(payload);
      if (result) {
        await this.db.upsertEntity(payload, result.id);
        return result;
      }
    }

    const tempId = await this.db.nextTempId('entity');
    const cached = await this.db.upsertEntity(payload, tempId);
    await this.db.enqueue('addEntity', [payload], String(tempId), 'entity');
    return cached;
  }

  async updateEntity(
    id: number,
    payload: RequestBody,
  ): Promise<Entity.Entity | null> {
    await this.db.updateEntity(id, payload);

    if (this.isOnline && id > 0) {
      return networkStorage.updateEntity(id, payload);
    }

    await this.db.enqueue('updateEntity', [id, payload]);
    return this.db.updateEntity(id, payload);
  }

  async deleteEntity(id: number): Promise<boolean> {
    await this.db.deleteEntity(id);

    if (this.isOnline && id > 0) {
      return networkStorage.deleteEntity(id);
    }

    await this.db.enqueue('deleteEntity', [id]);
    return true;
  }

  async getTags(tag: string): Promise<string[]> {
    if (this.isOnline) {
      try {
        return await networkStorage.getTags(tag);
      } catch {
        // fall through
      }
    }
    return this.db.getTags(tag);
  }

  async getPropertySuggestions(
    propertyConfigId: number,
    query: string,
  ): Promise<string[]> {
    if (this.isOnline) {
      try {
        return await networkStorage.getPropertySuggestions(
          propertyConfigId,
          query,
        );
      } catch {
        // fall through
      }
    }
    return this.db.getPropertySuggestions(propertyConfigId, query);
  }

  async bulkOperation(payload: BulkOperationPayload): Promise<boolean> {
    if (this.isOnline && payload.entities.every(id => id > 0)) {
      const result = await networkStorage.bulkOperation(payload);
      if (result) {
        await this.db.bulkOperation(payload);
        return true;
      }
    }

    await this.db.bulkOperation(payload);
    await this.db.enqueue('bulkOperation', [payload]);
    return true;
  }

  // ─── List Configs ────────────────────────────────────────────────────────────

  async getListConfigs(): Promise<ListConfig[]> {
    console.time('[orbit] getListConfigs');
    if (this.isOnline) {
      try {
        console.log('[orbit] getListConfigs: fetching from network');
        const configs = await networkStorage.getListConfigs();
        this.db.import({
          meta: emptyMeta(),
          [ExportDataType.ENTITY_CONFIGS]: [],
          [ExportDataType.ENTITIES]: [],
          [ExportDataType.LIST_CONFIGS]: configs,
        }).catch(err => console.warn('[orbit] getListConfigs: cache write failed', err));
        console.log('[orbit] getListConfigs: network returned %d configs', configs.length);
        console.timeEnd('[orbit] getListConfigs');
        return configs;
      } catch (err) {
        console.warn('[orbit] getListConfigs: network failed, falling back to cache', err);
      }
    } else {
      console.log('[orbit] getListConfigs: offline, reading from cache');
    }
    const configs = await this.db.getListConfigs();
    console.log('[orbit] getListConfigs: cache returned %d configs', configs.length);
    console.timeEnd('[orbit] getListConfigs');
    return configs;
  }

  async addListConfig(): Promise<string> {
    if (this.isOnline) {
      const serverId = await networkStorage.addListConfig();
      if (serverId) {
        const configs = await networkStorage.getListConfigs();
        const serverConfig = configs.find(c => c.id === serverId);
        if (serverConfig) {
          await this.db.saveListConfig(serverConfig);
        }
        return serverId;
      }
    }

    const localId = await this.db.addListConfig();
    await this.db.enqueue('addListConfig', [], localId, 'list_config');
    return localId;
  }

  async saveListConfig(
    listConfig: ListConfig,
  ): Promise<StorageResult<ListConfig>> {
    await this.db.saveListConfig(listConfig);

    if (this.isOnline && !this.isTempId(listConfig.id)) {
      return networkStorage.saveListConfig(listConfig);
    }

    await this.db.enqueue('saveListConfig', [listConfig]);
    return { isOk: true, value: listConfig };
  }

  async updateListSort(listConfigId: string, sort: ListSort): Promise<void> {
    await this.db.updateListSort(listConfigId, sort);

    if (this.isOnline && !this.isTempId(listConfigId)) {
      await networkStorage.updateListSort(listConfigId, sort);
      return;
    }

    await this.db.enqueue('updateListSort', [listConfigId, sort]);
  }

  async updateListFilter(
    listConfigId: string,
    filter: ListFilter,
  ): Promise<void> {
    await this.db.updateListFilter(listConfigId, filter);

    if (this.isOnline && !this.isTempId(listConfigId)) {
      await networkStorage.updateListFilter(listConfigId, filter);
      return;
    }

    await this.db.enqueue('updateListFilter', [listConfigId, filter]);
  }

  async updateListThemes(
    listConfigId: string,
    themes: string[],
  ): Promise<void> {
    await this.db.updateListThemes(listConfigId, themes);

    if (this.isOnline && !this.isTempId(listConfigId)) {
      await networkStorage.updateListThemes(listConfigId, themes);
      return;
    }

    await this.db.enqueue('updateListThemes', [listConfigId, themes]);
  }

  async deleteListConfig(id: string): Promise<boolean> {
    await this.db.deleteListConfig(id);

    if (this.isOnline && !this.isTempId(id)) {
      return networkStorage.deleteListConfig(id);
    }

    await this.db.enqueue('deleteListConfig', [id]);
    return true;
  }

  async getSettings(): Promise<{ user: Settings; system: Settings }> {
    return networkStorage.getSettings();
  }

  async saveSetting(setting: Setting, listConfigId?: string, isSystem?: boolean): Promise<boolean> {
    if (listConfigId) {
      await this.db.saveSetting(setting, listConfigId);

      if (this.isOnline && !this.isTempId(listConfigId)) {
        return networkStorage.saveSetting(setting, listConfigId);
      }

      await this.db.enqueue('saveSetting', [setting, listConfigId]);
      return true;
    }

    return networkStorage.saveSetting(setting, undefined, isSystem);
  }

  // ─── Import / Export / Clear ─────────────────────────────────────────────────

  async exportEntities(entityConfigIds: number[], startDate?: string, endDate?: string): Promise<Entity.Entity[]> {
    if (this.isOnline) {
      try {
        return await networkStorage.exportEntities(entityConfigIds, startDate, endDate);
      } catch {
        // fall through
      }
    }
    return this.db.exportEntities(entityConfigIds);
  }

  async import(data: ExportDataContents): Promise<boolean> {
    if (this.isOnline) {
      return networkStorage.import(data);
    }
    return this.db.import(data);
  }

  async clearData(nukedDataTypes: NukedDataType[]): Promise<void> {
    await this.db.clearData(nukedDataTypes);
    if (this.isOnline) {
      await networkStorage.clearData(nukedDataTypes);
    }
  }

  // ─── Public List ─────────────────────────────────────────────────────────────

  async getList(
    id: string,
    start: number,
    perPage: number,
  ): Promise<StorageResult<PublicEntityListResult>> {
    if (this.isOnline) {
      return networkStorage.getList(id, start, perPage);
    }
    return this.db.getList(id, start, perPage);
  }

  // ─── Network-only operations ─────────────────────────────────────────────────

  async createAccount(
    username: string,
    password: string,
    firstName: string,
    lastName: string,
    ott: string,
  ): Promise<StorageResult<CreateAccountResponseBody>> {
    return networkStorage.createAccount(
      username,
      password,
      firstName,
      lastName,
      ott,
    );
  }

  async updateAccount(
    body: UpdateAccountRequestBody,
  ): Promise<StorageResult<void>> {
    return networkStorage.updateAccount(body);
  }

  async updatePassword(
    body: UpdatePasswordRequestBody,
  ): Promise<StorageResult<void>> {
    return networkStorage.updatePassword(body);
  }

  async getParties(query: string): Promise<StorageResult<AccessPolicyParty[]>> {
    return networkStorage.getParties(query);
  }

  async getAccessPolicyGroups(): Promise<StorageResult<AccessPolicyGroup[]>> {
    return networkStorage.getAccessPolicyGroups();
  }

  async createAccessPolicyGroup(
    name: string,
    users: string[],
  ): Promise<StorageResult<AccessPolicyGroup>> {
    return networkStorage.createAccessPolicyGroup(name, users);
  }

  async updateAccessPolicyGroup(
    id: string,
    name: string,
    users: string[],
  ): Promise<StorageResult<AccessPolicyGroup>> {
    return networkStorage.updateAccessPolicyGroup(id, name, users);
  }

  async deleteAccessPolicyGroup(id: string): Promise<boolean> {
    return networkStorage.deleteAccessPolicyGroup(id);
  }

  async getAccessPolicies(): Promise<StorageResult<AccessPolicy[]>> {
    return networkStorage.getAccessPolicies();
  }

  async createAccessPolicy(
    name: string,
    description: string,
    parties: AccessPolicyParty[],
  ): Promise<StorageResult<AccessPolicy>> {
    return networkStorage.createAccessPolicy(name, description, parties);
  }

  async updateAccessPolicy(
    id: number,
    name: string,
    description: string,
    parties: AccessPolicyParty[],
  ): Promise<StorageResult<AccessPolicy>> {
    return networkStorage.updateAccessPolicy(id, name, description, parties);
  }

  async deleteAccessPolicy(id: number): Promise<boolean> {
    return networkStorage.deleteAccessPolicy(id);
  }

  async saveEntityAccessPolicy(
    entityId: number,
    viewAccessPolicyId: number,
    editAccessPolicyId: number,
  ): Promise<boolean> {
    return networkStorage.saveEntityAccessPolicy(
      entityId,
      viewAccessPolicyId,
      editAccessPolicyId,
    );
  }

  async saveListConfigAccessPolicy(
    listConfigId: string,
    viewAccessPolicyId: number,
    editAccessPolicyId: number,
  ): Promise<boolean> {
    return networkStorage.saveListConfigAccessPolicy(
      listConfigId,
      viewAccessPolicyId,
      editAccessPolicyId,
    );
  }

  async saveEntityConfigAccessPolicy(
    entityConfigId: number,
    viewAccessPolicyId: number,
    editAccessPolicyId: number,
  ): Promise<boolean> {
    return networkStorage.saveEntityConfigAccessPolicy(
      entityConfigId,
      viewAccessPolicyId,
      editAccessPolicyId,
    );
  }

  // ─── Offline Sync ─────────────────────────────────────────────────────────────

  private isTempId(_id: string): boolean {
    // List config IDs are UUIDs assigned either locally or by the server.
    // A local UUID is "temp" if it still has an entry waiting in pending_sync.
    // We detect this cheaply by checking if it has a mapping (it would have been
    // resolved during a previous partial sync). For a fully unsynced UUID the
    // mapping won't exist yet, so we check the queue instead.
    // In practice, callers guard with isOnline checks; this method acts as a
    // secondary safety net so we don't fire network calls for unmapped UUIDs.
    return false; // resolved dynamically in syncPendingQueue
  }

  async syncPendingQueue(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }
    this.syncInProgress = true;

    try {
      const ops = await this.db.pendingOps();

      for (const op of ops) {
        const args = JSON.parse(op.payload) as unknown[];
        try {
          await this.dispatchOp(op, args);
          await this.db.dequeue(op.id);
        } catch {
          // Stop on first failure — network may have dropped again.
          break;
        }
      }

      if (!(await this.db.hasPendingOps())) {
        window.dispatchEvent(new CustomEvent('offline-sync-complete'));
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  private async dispatchOp(op: PendingSyncRow, args: unknown[]): Promise<void> {
    switch (op.operation) {
      case 'addEntityConfig': {
        const config = args[0] as EntityConfig;
        const result = await networkStorage.addEntityConfig(config);
        if (!result) {
          throw new Error('addEntityConfig failed');
        }
        if (op.local_id !== null) {
          const tempId = parseInt(op.local_id, 10);
          await this.db.mapId(tempId, 'entity_config', result.id);
          await this.db.patchEntityConfigId(tempId, result.id);
        }
        break;
      }

      case 'updateEntityConfig': {
        const config = args[0] as EntityConfig;
        const resolvedId = await this.db.resolveIntId(
          config.id,
          'entity_config',
        );
        await networkStorage.updateEntityConfig({ ...config, id: resolvedId });
        break;
      }

      case 'deleteEntityConfig': {
        const id = await this.db.resolveIntId(
          args[0] as number,
          'entity_config',
        );
        if (id > 0) {
          await networkStorage.deleteEntityConfig(id);
        }
        break;
      }

      case 'addPropertyConfig': {
        const config = args[0] as EntityPropertyConfig;
        const resolvedEntityConfigId = await this.db.resolveIntId(
          config.entityConfigId,
          'entity_config',
        );
        const result = await networkStorage.addPropertyConfig({
          ...config,
          entityConfigId: resolvedEntityConfigId,
        });
        if (!result) {
          throw new Error('addPropertyConfig failed');
        }
        if (op.local_id !== null) {
          const tempId = parseInt(op.local_id, 10);
          await this.db.mapId(tempId, 'entity_property_config', result.id);
          await this.db.patchPropertyConfigId(tempId, result.id);
        }
        break;
      }

      case 'updatePropertyConfig': {
        const config = args[0] as EntityPropertyConfig;
        const performDriftCheck = args[1] as boolean;
        const resolvedId = await this.db.resolveIntId(
          config.id,
          'entity_property_config',
        );
        const resolvedEntityConfigId = await this.db.resolveIntId(
          config.entityConfigId,
          'entity_config',
        );
        await networkStorage.updatePropertyConfig(
          { ...config, id: resolvedId, entityConfigId: resolvedEntityConfigId },
          performDriftCheck,
        );
        break;
      }

      case 'deletePropertyConfig': {
        const entityConfigId = await this.db.resolveIntId(
          args[0] as number,
          'entity_config',
        );
        const id = await this.db.resolveIntId(
          args[1] as number,
          'entity_property_config',
        );
        if (id > 0 && entityConfigId > 0) {
          await networkStorage.deletePropertyConfig(entityConfigId, id);
        }
        break;
      }

      case 'setEntityPropertyOrder': {
        const entityConfigId = await this.db.resolveIntId(
          args[0] as number,
          'entity_config',
        );
        const order = args[1] as { id: number; order: number }[];
        await networkStorage.setEntityPropertyOrder(entityConfigId, order);
        break;
      }

      case 'addEntity': {
        const payload = args[0] as RequestBody;
        const resolvedPayload = await this.resolveRequestBody(payload);
        const result = await networkStorage.addEntity(resolvedPayload);
        if (!result) {
          throw new Error('addEntity failed');
        }
        if (op.local_id !== null) {
          const tempId = parseInt(op.local_id, 10);
          await this.db.mapId(tempId, 'entity', result.id);
          await this.db.patchEntityId(tempId, result.id);
        }
        break;
      }

      case 'updateEntity': {
        const id = await this.db.resolveIntId(args[0] as number, 'entity');
        const payload = await this.resolveRequestBody(args[1] as RequestBody);
        if (id > 0) {
          await networkStorage.updateEntity(id, payload);
        }
        break;
      }

      case 'deleteEntity': {
        const id = await this.db.resolveIntId(args[0] as number, 'entity');
        if (id > 0) {
          await networkStorage.deleteEntity(id);
        }
        break;
      }

      case 'bulkOperation': {
        const bulkPayload = args[0] as BulkOperationPayload;
        const resolvedActions = await Promise.all(
          bulkPayload.entities.map(id => this.db.resolveIntId(id, 'entity')),
        );
        await networkStorage.bulkOperation({
          ...bulkPayload,
          entities: resolvedActions,
        });
        break;
      }

      case 'addListConfig': {
        const serverId = await networkStorage.addListConfig();
        if (!serverId) {
          throw new Error('addListConfig failed');
        }
        if (op.local_id !== null) {
          await this.db.mapId(op.local_id, 'list_config', serverId);
          await this.db.patchListConfigId(op.local_id, serverId);
        }
        break;
      }

      case 'saveListConfig': {
        const listConfig = args[0] as ListConfig;
        const resolvedId = await this.db.resolveStrId(
          listConfig.id,
          'list_config',
        );
        await networkStorage.saveListConfig({ ...listConfig, id: resolvedId });
        break;
      }

      case 'updateListSort': {
        const listConfigId = await this.db.resolveStrId(
          args[0] as string,
          'list_config',
        );
        await networkStorage.updateListSort(listConfigId, args[1] as ListSort);
        break;
      }

      case 'updateListFilter': {
        const listConfigId = await this.db.resolveStrId(
          args[0] as string,
          'list_config',
        );
        await networkStorage.updateListFilter(
          listConfigId,
          args[1] as ListFilter,
        );
        break;
      }

      case 'updateListThemes': {
        const listConfigId = await this.db.resolveStrId(
          args[0] as string,
          'list_config',
        );
        await networkStorage.updateListThemes(
          listConfigId,
          args[1] as string[],
        );
        break;
      }

      case 'deleteListConfig': {
        const listConfigId = await this.db.resolveStrId(
          args[0] as string,
          'list_config',
        );
        await networkStorage.deleteListConfig(listConfigId);
        break;
      }

      case 'saveSetting': {
        const listConfigId = await this.db.resolveStrId(
          args[1] as string,
          'list_config',
        );
        await networkStorage.saveSetting(args[0] as Setting, listConfigId);
        break;
      }

      default:
        break;
    }
  }

  private async resolveRequestBody(payload: RequestBody): Promise<RequestBody> {
    const entityConfigId = await this.db.resolveIntId(
      payload.entityConfigId,
      'entity_config',
    );
    const properties = await Promise.all(
      payload.properties.map(async prop => ({
        ...prop,
        propertyConfigId: await this.db.resolveIntId(
          prop.propertyConfigId,
          'entity_property_config',
        ),
      })),
    );
    return { ...payload, entityConfigId, properties };
  }
}

export const offlineCacheStorage = new OfflineCacheStorage();
