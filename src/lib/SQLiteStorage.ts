import { v4 as uuidv4 } from 'uuid';
import type { BindableValue, SqlValue } from '@sqlite.org/sqlite-wasm';

import {
  DataType,
  Entity,
  EntityConfig,
  EntityProperty,
  EntityPropertyConfig,
  ImageDataValue,
  PropertyDataValue,
} from 'api-spec/models/Entity';
import {
  ListConfig,
  ListFilter,
  ListFilterTimeType,
  ListFilterType,
  ListSort,
  ListSortDirection,
  ListSortNativeProperty,
  ListSortCustomProperty,
  defaultListFilter,
  defaultListSort,
} from 'api-spec/models/List';
import { Setting, Settings, defaultSettings } from 'api-spec/models/Setting';
import {
  ExportDataContents,
  ExportDataType,
  NukedDataType,
} from 'api-spec/models/Data';

import { StorageResult, StorageSchema, StorageSource } from '@/models/Storage';
import { RequestBody } from '@/components/entity-form/entity-form.models';
import { BulkOperationPayload } from '@/components/bulk-manager/bulk-manager.models';
import {
  EntityListResult,
  PublicEntityListResult,
} from '@/components/entity-list/entity-list.models';
import { CreateAccountResponseBody } from '@/components/account-form/account-form.models';
import { OperationType } from 'api-spec/models/Operation';
import {
  AccessPolicy,
  AccessPolicyGroup,
  AccessPolicyParty,
} from 'api-spec/models/Access';
import { translate } from './Localization';

export function serializePropertyValue(
  value: PropertyDataValue,
  dataType: DataType,
): string {
  if (dataType === DataType.IMAGE) {
    return JSON.stringify(value);
  }
  if (dataType === DataType.DATE) {
    if (value === null || value === undefined) {
      return '';
    }
    return value instanceof Date ? value.toISOString() : String(value);
  }
  if (dataType === DataType.BOOLEAN) {
    return value ? '1' : '0';
  }
  return String(value ?? '');
}

function deserializePropertyValue(
  raw: string,
  dataType: DataType,
): PropertyDataValue {
  if (dataType === DataType.IMAGE) {
    try {
      return JSON.parse(raw) as ImageDataValue;
    } catch {
      return { src: '', alt: '' };
    }
  }
  if (dataType === DataType.DATE) {
    return raw ? new Date(raw) : null;
  }
  if (dataType === DataType.BOOLEAN) {
    return raw === '1';
  }
  if (dataType === DataType.INT) {
    return parseInt(raw, 10);
  }
  return raw;
}

function rowToEntityConfig(row: Record<string, unknown>): EntityConfig {
  return {
    id: row['id'] as number,
    userId: '',
    name: row['name'] as string,
    description: row['description'] as string,
    revisionOf: (row['revision_of'] as number | null) ?? null,
    allowPropertyOrdering: row['allow_property_ordering'] === 1,
    aiEnabled: row['ai_enabled'] === 1,
    aiIdentifyPrompt: (row['ai_identify_prompt'] as string | null) ?? '',
    public: row['public'] === 1,
    viewAccessPolicy: null,
    editAccessPolicy: null,
    properties: [],
  };
}

function rowToEntityPropertyConfig(
  row: Record<string, unknown>,
): EntityPropertyConfig {
  const dataType = row['data_type'] as DataType;
  const defaultValue = deserializePropertyValue(
    row['default_value'] as string,
    dataType,
  );
  return {
    id: row['id'] as number,
    entityConfigId: row['entity_config_id'] as number,
    userId: '',
    name: row['name'] as string,
    dataType,
    prefix: row['prefix'] as string,
    suffix: row['suffix'] as string,
    required: row['required'] as number,
    repeat: row['repeat'] as number,
    allowed: row['allowed'] as number,
    hidden: row['hidden'] === 1,
    defaultValue,
    optionsOnly: row['options_only'] === 1,
    options: JSON.parse(
      (row['options'] as string | null) ?? '[]',
    ) as PropertyDataValue[],
  } as EntityPropertyConfig;
}

function rowToEntityProperty(row: Record<string, unknown>): EntityProperty {
  const dataType = row['data_type'] as DataType;
  return {
    id: row['id'] as number,
    propertyConfigId: row['property_config_id'] as number,
    value: deserializePropertyValue(row['value'] as string, dataType),
    order: row['sort_order'] as number,
  };
}

export class SQLiteStorage implements StorageSchema {
  isActive = false;
  storageSource = StorageSource.DEVICE;

  protected worker: Worker;
  protected pending = new Map<
    string,
    { resolve: (v: unknown) => void; reject: (e: Error) => void }
  >();

  constructor(private dbPath: string = '/orbit.db') {
    this.worker = new Worker(new URL('./sqlite.worker.ts', import.meta.url), {
      type: 'module',
    });
    this.worker.onmessage = (e: MessageEvent): void => {
      const { id, result, error } = e.data as {
        id: string;
        result: unknown;
        error?: string;
      };
      const p = this.pending.get(id);
      if (!p) {
        return;
      }
      this.pending.delete(id);
      if (error !== undefined) {
        p.reject(new Error(error));
      } else {
        p.resolve(result);
      }
    };

    const initId = uuidv4();
    new Promise<void>((resolve, reject) => {
      this.pending.set(initId, {
        resolve: resolve as (v: unknown) => void,
        reject,
      });
    }).catch(() => {});
    this.worker.postMessage({
      id: initId,
      type: 'init',
      dbPath: this.dbPath,
      sql: '',
    });
  }

  protected send<T>(
    type: string,
    sql: string,
    bind: BindableValue[] = [],
  ): Promise<T> {
    const id = uuidv4();
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: resolve as (v: unknown) => void,
        reject,
      });
      this.worker.postMessage({ id, type, sql, bind });
    });
  }

  protected execRows(
    sql: string,
    bind: BindableValue[] = [],
  ): Promise<Record<string, SqlValue>[]> {
    return this.send<Record<string, SqlValue>[]>('exec_rows', sql, bind);
  }

  protected execValue(
    sql: string,
    bind: BindableValue[] = [],
  ): Promise<SqlValue> {
    return this.send<SqlValue>('exec_value', sql, bind);
  }

  protected run(sql: string, bind: BindableValue[] = []): Promise<void> {
    return this.send<void>('run', sql, bind);
  }

  // ─── Entity Configs ───────────────────────────────────────────────────────

  async getEntityConfigs(): Promise<EntityConfig[]> {
    const configRows = await this.execRows('SELECT * FROM entity_config');
    const propRows = await this.execRows(
      'SELECT * FROM entity_property_config ORDER BY id ASC',
    );

    return configRows.map(row => {
      const config = rowToEntityConfig(row);
      config.properties = propRows
        .filter(p => p['entity_config_id'] === config.id)
        .map(rowToEntityPropertyConfig);
      return config;
    });
  }

  async addEntityConfig(
    entityConfig: EntityConfig,
  ): Promise<EntityConfig | null> {
    await this.run(
      `INSERT INTO entity_config (name, description, revision_of, allow_property_ordering, ai_enabled, ai_identify_prompt, public)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        entityConfig.name,
        entityConfig.description,
        entityConfig.revisionOf ?? null,
        entityConfig.allowPropertyOrdering ? 1 : 0,
        entityConfig.aiEnabled ? 1 : 0,
        entityConfig.aiIdentifyPrompt,
        entityConfig.public ? 1 : 0,
      ],
    );

    const id = (await this.execValue('SELECT last_insert_rowid()')) as number;

    for (const prop of entityConfig.properties) {
      await this.run(
        `INSERT INTO entity_property_config
         (id, entity_config_id, name, data_type, prefix, suffix, required, repeat, allowed, hidden, default_value, options_only, options)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          prop.id || null,
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

    const configs = await this.getEntityConfigs();
    return configs.find(c => c.id === id) ?? null;
  }

  async updateEntityConfig(
    entityConfig: EntityConfig,
  ): Promise<EntityConfig | null> {
    await this.run(
      `UPDATE entity_config
       SET name = ?, description = ?, revision_of = ?, allow_property_ordering = ?, ai_enabled = ?, ai_identify_prompt = ?, public = ?
       WHERE id = ?`,
      [
        entityConfig.name,
        entityConfig.description,
        entityConfig.revisionOf ?? null,
        entityConfig.allowPropertyOrdering ? 1 : 0,
        entityConfig.aiEnabled ? 1 : 0,
        entityConfig.aiIdentifyPrompt,
        entityConfig.public ? 1 : 0,
        entityConfig.id,
      ],
    );

    const configs = await this.getEntityConfigs();
    return configs.find(c => c.id === entityConfig.id) ?? null;
  }

  async deleteEntityConfig(id: number): Promise<boolean> {
    const propConfigIds = (
      await this.execRows(
        'SELECT id FROM entity_property_config WHERE entity_config_id = ?',
        [id],
      )
    ).map(r => r['id'] as number);

    for (const propConfigId of propConfigIds) {
      await this.run(
        'DELETE FROM entity_property WHERE property_config_id = ?',
        [propConfigId],
      );
    }

    await this.run(
      'DELETE FROM entity_property_config WHERE entity_config_id = ?',
      [id],
    );
    await this.run('DELETE FROM entity WHERE type = ?', [id]);
    await this.run('DELETE FROM entity_config WHERE id = ?', [id]);

    return true;
  }

  // ─── Property Configs ─────────────────────────────────────────────────────

  async addPropertyConfig(
    propertyConfig: EntityPropertyConfig,
  ): Promise<EntityPropertyConfig | null> {
    await this.run(
      `INSERT INTO entity_property_config
       (entity_config_id, name, data_type, prefix, suffix, required, repeat, allowed, hidden, default_value, options_only, options)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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

    const id = (await this.execValue('SELECT last_insert_rowid()')) as number;
    const rows = await this.execRows(
      'SELECT * FROM entity_property_config WHERE id = ?',
      [id],
    );

    return rows[0] ? rowToEntityPropertyConfig(rows[0]) : null;
  }

  async updatePropertyConfig(
    propertyConfig: EntityPropertyConfig,
  ): Promise<EntityPropertyConfig | null> {
    await this.run(
      `UPDATE entity_property_config
       SET name = ?, data_type = ?, prefix = ?, suffix = ?, required = ?,
           repeat = ?, allowed = ?, hidden = ?, default_value = ?,
           options_only = ?, options = ?
       WHERE id = ?`,
      [
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
        propertyConfig.id,
      ],
    );

    const rows = await this.execRows(
      'SELECT * FROM entity_property_config WHERE id = ?',
      [propertyConfig.id],
    );

    return rows[0] ? rowToEntityPropertyConfig(rows[0]) : null;
  }

  async deletePropertyConfig(
    _entityConfigId: number,
    id: number,
  ): Promise<boolean> {
    await this.run('DELETE FROM entity_property WHERE property_config_id = ?', [
      id,
    ]);
    await this.run('DELETE FROM entity_property_config WHERE id = ?', [id]);

    return true;
  }

  async setEntityPropertyOrder(
    entityConfigId: number,
    propertyConfigOrder: { id: number; order: number }[],
  ): Promise<boolean> {
    for (const { id, order } of propertyConfigOrder) {
      await this.run(
        `UPDATE entity_property
         SET sort_order = ?
         WHERE entity_id IN (SELECT id FROM entity WHERE type = ?)
         AND property_config_id = ?`,
        [order, entityConfigId, id],
      );
    }

    return true;
  }

  // ─── Entities ─────────────────────────────────────────────────────────────

  protected async loadEntityRows(
    entityRows: Record<string, unknown>[],
  ): Promise<Entity[]> {
    if (entityRows.length === 0) {
      return [];
    }

    const ids = entityRows.map(r => r['id'] as number);
    const placeholders = ids.map(() => '?').join(',');

    const tagRows = await this.execRows(
      `SELECT entity_id, tag FROM entity_tag WHERE entity_id IN (${placeholders})`,
      ids,
    );

    const propRows = await this.execRows(
      `SELECT * FROM entity_property WHERE entity_id IN (${placeholders}) ORDER BY sort_order ASC`,
      ids,
    );

    return entityRows.map(row => {
      const id = row['id'] as number;
      return {
        id,
        type: row['type'] as number,
        createdAt: row['created_at'] as string,
        updatedAt: row['updated_at'] as string,
        viewAccessPolicyId: 0,
        editAccessPolicyId: 0,
        tags: tagRows
          .filter(t => t['entity_id'] === id)
          .map(t => t['tag'] as string),
        properties: propRows
          .filter(p => p['entity_id'] === id)
          .map(rowToEntityProperty),
      };
    });
  }

  async getEntities(
    start: number,
    perPage: number,
    listFilter: ListFilter,
    listSort: ListSort,
  ): Promise<StorageResult<EntityListResult>> {
    const conditions: string[] = [];
    const bindings: BindableValue[] = [];

    if (!listFilter.includeAll) {
      // Type filter
      if (listFilter.includeTypes.length > 0) {
        const ph = listFilter.includeTypes.map(() => '?').join(',');
        conditions.push(`e.type IN (${ph})`);
        bindings.push(...listFilter.includeTypes);
      }

      // Time filter
      const { time } = listFilter;
      if (time.type === ListFilterTimeType.EXACT_DATE) {
        conditions.push(`date(e.created_at) = date(?)`);
        bindings.push(time.date);
      } else if (time.type === ListFilterTimeType.RANGE) {
        conditions.push(`e.created_at >= ? AND e.created_at <= ?`);
        bindings.push(time.start, time.end);
      }

      // Text filters
      for (const textCtx of listFilter.text) {
        const { type, subStr } = textCtx;
        let pattern: string;
        if (type === 'contains') {
          pattern = `%${subStr}%`;
        } else if (type === 'startsWith') {
          pattern = `${subStr}%`;
        } else if (type === 'endsWith') {
          pattern = `%${subStr}`;
        } else {
          pattern = subStr;
        }
        const op = type === 'equals' ? '=' : 'LIKE';
        conditions.push(`
          (EXISTS (SELECT 1 FROM entity_tag et WHERE et.entity_id = e.id AND et.tag ${op} ?)
          OR EXISTS (SELECT 1 FROM entity_property ep WHERE ep.entity_id = e.id AND ep.value ${op} ?))
        `);
        bindings.push(pattern, pattern);
      }

      // Tag filters
      if (!listFilter.includeAllTagging) {
        const allOfTags =
          listFilter.tagging[ListFilterType.CONTAINS_ALL_OF] ?? [];
        const oneOfTags =
          listFilter.tagging[ListFilterType.CONTAINS_ONE_OF] ?? [];
        const hasTagConditions = allOfTags.length > 0 || oneOfTags.length > 0;

        if (hasTagConditions || !listFilter.includeUntagged) {
          const tagParts: string[] = [];

          if (hasTagConditions) {
            const matchedParts: string[] = [];

            for (const tag of allOfTags) {
              matchedParts.push(
                `EXISTS (SELECT 1 FROM entity_tag et WHERE et.entity_id = e.id AND et.tag = ?)`,
              );
              bindings.push(tag);
            }

            if (oneOfTags.length > 0) {
              const ph = oneOfTags.map(() => '?').join(',');
              matchedParts.push(
                `EXISTS (SELECT 1 FROM entity_tag et WHERE et.entity_id = e.id AND et.tag IN (${ph}))`,
              );
              bindings.push(...oneOfTags);
            }

            tagParts.push(`(${matchedParts.join(' AND ')})`);
          }

          if (listFilter.includeUntagged) {
            tagParts.push(
              `NOT EXISTS (SELECT 1 FROM entity_tag et WHERE et.entity_id = e.id)`,
            );
          }

          if (tagParts.length > 0) {
            conditions.push(`(${tagParts.join(' OR ')})`);
          }
        }
      }
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Sorting
    let orderClause: string;
    let joinClause = '';

    if (
      typeof listSort.property === 'string' &&
      (listSort.property === ListSortNativeProperty.CREATED_AT ||
        listSort.property === ListSortNativeProperty.UPDATED_AT)
    ) {
      const col =
        listSort.property === ListSortNativeProperty.CREATED_AT
          ? 'e.created_at'
          : 'e.updated_at';
      orderClause = `ORDER BY ${col} ${listSort.direction === ListSortDirection.ASC ? 'ASC' : 'DESC'}`;
    } else {
      const customProp = listSort.property as ListSortCustomProperty;
      joinClause = `LEFT JOIN entity_property ep_sort
                    ON ep_sort.entity_id = e.id
                    AND ep_sort.property_config_id = ${customProp.propertyId}`;
      orderClause = `ORDER BY ep_sort.value ${listSort.direction === ListSortDirection.ASC ? 'ASC' : 'DESC'}`;
    }

    const countSql = `SELECT COUNT(DISTINCT e.id) FROM entity e ${joinClause} ${whereClause}`;
    const total = (await this.execValue(countSql, bindings)) as number;

    const rowSql = `
      SELECT DISTINCT e.id, e.type, e.created_at, e.updated_at
      FROM entity e
      ${joinClause}
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;

    const entityRows = await this.execRows(rowSql, [
      ...bindings,
      perPage,
      start,
    ]);

    const entities = await this.loadEntityRows(entityRows);

    return { isOk: true, value: { entities, total } };
  }

  async addEntity(payload: RequestBody): Promise<Entity | null> {
    const now = new Date().toISOString();

    await this.run(
      `INSERT INTO entity (type, created_at, updated_at) VALUES (?, ?, ?)`,
      [payload.entityConfigId, now, now],
    );

    const id = (await this.execValue('SELECT last_insert_rowid()')) as number;

    await this.writeEntityTags(id, payload.tags);
    await this.writeEntityProperties(id, payload.properties);

    const rows = await this.execRows('SELECT * FROM entity WHERE id = ?', [id]);
    return (await this.loadEntityRows(rows))[0] ?? null;
  }

  async updateEntity(id: number, payload: RequestBody): Promise<Entity | null> {
    const now = new Date().toISOString();

    await this.run(`UPDATE entity SET type = ?, updated_at = ? WHERE id = ?`, [
      payload.entityConfigId,
      now,
      id,
    ]);

    await this.run('DELETE FROM entity_tag WHERE entity_id = ?', [id]);
    await this.run('DELETE FROM entity_property WHERE entity_id = ?', [id]);

    await this.writeEntityTags(id, payload.tags);
    await this.writeEntityProperties(id, payload.properties);

    const rows = await this.execRows('SELECT * FROM entity WHERE id = ?', [id]);
    return (await this.loadEntityRows(rows))[0] ?? null;
  }

  async deleteEntity(id: number): Promise<boolean> {
    await this.run('DELETE FROM entity_tag WHERE entity_id = ?', [id]);
    await this.run('DELETE FROM entity_property WHERE entity_id = ?', [id]);
    await this.run('DELETE FROM entity WHERE id = ?', [id]);

    return true;
  }

  protected async writeEntityTags(
    entityId: number,
    tags: string[],
  ): Promise<void> {
    for (const tag of tags) {
      await this.run(
        'INSERT OR IGNORE INTO entity_tag (entity_id, tag) VALUES (?, ?)',
        [entityId, tag],
      );
    }
  }

  protected async writeEntityProperties(
    entityId: number,
    properties: EntityProperty[],
  ): Promise<void> {
    for (const prop of properties) {
      const propConfigRows = await this.execRows(
        'SELECT data_type FROM entity_property_config WHERE id = ?',
        [prop.propertyConfigId],
      );
      const dataType =
        (propConfigRows[0]?.['data_type'] as DataType) ?? DataType.SHORT_TEXT;

      await this.run(
        `INSERT INTO entity_property (entity_id, property_config_id, data_type, value, sort_order)
         VALUES (?, ?, ?, ?, ?)`,
        [
          entityId,
          prop.propertyConfigId,
          dataType,
          serializePropertyValue(prop.value, dataType),
          prop.order,
        ],
      );
    }
  }

  // ─── Tags & Suggestions ───────────────────────────────────────────────────

  async getTags(tag: string): Promise<string[]> {
    const rows = await this.execRows(
      `SELECT DISTINCT tag FROM entity_tag WHERE tag LIKE ? ORDER BY tag ASC LIMIT 20`,
      [`%${tag}%`],
    );
    return rows.map(r => r['tag'] as string);
  }

  async getPropertySuggestions(
    propertyConfigId: number,
    query: string,
  ): Promise<string[]> {
    const rows = await this.execRows(
      `SELECT DISTINCT value FROM entity_property
       WHERE property_config_id = ? AND value LIKE ?
       ORDER BY value ASC LIMIT 20`,
      [propertyConfigId, `%${query}%`],
    );
    return rows.map(r => r['value'] as string);
  }

  // ─── List Configs ─────────────────────────────────────────────────────────

  async getListConfigs(): Promise<ListConfig[]> {
    const rows = await this.execRows('SELECT * FROM list_config');
    return rows.map(row => this.rowToListConfig(row));
  }

  async addListConfig(): Promise<string> {
    const id = uuidv4();

    await this.run(
      `INSERT INTO list_config (id, name, filter, sort, setting, themes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        translate('configName'),
        JSON.stringify(defaultListFilter),
        JSON.stringify(defaultListSort),
        JSON.stringify(defaultSettings),
        JSON.stringify([]),
      ],
    );

    return id;
  }

  async saveListConfig(
    listConfig: ListConfig,
  ): Promise<StorageResult<ListConfig>> {
    await this.run(
      `INSERT INTO list_config (id, name, filter, sort, setting, themes)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name    = excluded.name,
         filter  = excluded.filter,
         sort    = excluded.sort,
         setting = excluded.setting,
         themes  = excluded.themes`,
      [
        listConfig.id,
        listConfig.name,
        JSON.stringify(listConfig.filter),
        JSON.stringify(listConfig.sort),
        JSON.stringify(listConfig.setting),
        JSON.stringify(listConfig.themes),
      ],
    );

    return { isOk: true, value: listConfig };
  }

  async updateListSort(listConfigId: string, sort: ListSort): Promise<void> {
    await this.run('UPDATE list_config SET sort = ? WHERE id = ?', [
      JSON.stringify(sort),
      listConfigId,
    ]);
  }

  async updateListFilter(
    listConfigId: string,
    filter: ListFilter,
  ): Promise<void> {
    await this.run('UPDATE list_config SET filter = ? WHERE id = ?', [
      JSON.stringify(filter),
      listConfigId,
    ]);
  }

  async updateListThemes(
    listConfigId: string,
    themes: string[],
  ): Promise<void> {
    await this.run('UPDATE list_config SET themes = ? WHERE id = ?', [
      JSON.stringify(themes),
      listConfigId,
    ]);
  }

  async deleteListConfig(id: string): Promise<boolean> {
    await this.run('DELETE FROM list_config WHERE id = ?', [id]);
    return true;
  }

  async saveSetting(listConfigId: string, setting: Setting): Promise<boolean> {
    const rows = await this.execRows(
      'SELECT setting FROM list_config WHERE id = ?',
      [listConfigId],
    );

    if (!rows[0]) {
      return false;
    }

    const current: Settings = JSON.parse(rows[0]['setting'] as string);
    const updated: Settings = { ...current, [setting.name]: setting.value };

    await this.run('UPDATE list_config SET setting = ? WHERE id = ?', [
      JSON.stringify(updated),
      listConfigId,
    ]);

    return true;
  }

  private rowToListConfig(row: Record<string, unknown>): ListConfig {
    return {
      id: row['id'] as string,
      userId: '',
      name: row['name'] as string,
      filter: JSON.parse(row['filter'] as string) as ListFilter,
      sort: JSON.parse(row['sort'] as string) as ListSort,
      setting: JSON.parse(row['setting'] as string) as Settings,
      themes: JSON.parse(row['themes'] as string) as string[],
      viewAccessPolicy: null,
      editAccessPolicy: null,
    };
  }

  // ─── Bulk Operations ──────────────────────────────────────────────────────

  async bulkOperation(payload: BulkOperationPayload): Promise<boolean> {
    const { operation, actions } = payload;

    if (operation.type === OperationType.DELETE) {
      for (const id of actions) {
        await this.deleteEntity(id);
      }
      return true;
    }

    for (const entityId of actions) {
      if (operation.type === OperationType.REPLACE_TAGS) {
        await this.run('DELETE FROM entity_tag WHERE entity_id = ?', [
          entityId,
        ]);
        await this.writeEntityTags(entityId, operation.tags);
      } else if (operation.type === OperationType.ADD_TAGS) {
        await this.writeEntityTags(entityId, operation.tags);
      } else if (operation.type === OperationType.REMOVE_TAGS) {
        for (const tag of operation.tags) {
          await this.run(
            'DELETE FROM entity_tag WHERE entity_id = ? AND tag = ?',
            [entityId, tag],
          );
        }
      }
    }

    return true;
  }

  // ─── Import / Export / Nuke ───────────────────────────────────────────────

  async exportEntities(entityConfigIds: number[]): Promise<Entity[]> {
    const ph = entityConfigIds.map(() => '?').join(',');
    const entityRows = await this.execRows(
      `SELECT * FROM entity WHERE type IN (${ph})`,
      entityConfigIds,
    );

    return this.loadEntityRows(entityRows);
  }

  async export(): Promise<ExportDataContents> {
    try {
      const entityConfigs = await this.getEntityConfigs();
      const entityRows = await this.execRows('SELECT * FROM entity');
      const entities = await this.loadEntityRows(entityRows);
      const listConfigs = await this.getListConfigs();
      return {
        meta: { version: '1', date: new Date().toISOString() },
        [ExportDataType.ENTITY_CONFIGS]: entityConfigs.map(
          ({ userId: _, properties, ...rest }) => ({
            ...rest,
            properties: properties.map(({ userId: __, ...propRest }) => propRest),
          }),
        ),
        [ExportDataType.ENTITIES]: entities,
        [ExportDataType.LIST_CONFIGS]: listConfigs,
      };
    } catch (error) {
      throw new Error(
        `Device export failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async import(data: ExportDataContents): Promise<boolean> {
    for (const config of data[ExportDataType.ENTITY_CONFIGS]) {
      await this.run(
        `INSERT OR REPLACE INTO entity_config (id, name, description, revision_of, allow_property_ordering, ai_enabled, ai_identify_prompt, public)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          config.id,
          config.name,
          config.description,
          config.revisionOf ?? null,
          config.allowPropertyOrdering ? 1 : 0,
          config.aiEnabled ? 1 : 0,
          config.aiIdentifyPrompt,
          config.public ? 1 : 0,
        ],
      );

      for (const prop of config.properties) {
        await this.run(
          `INSERT OR REPLACE INTO entity_property_config
           (id, entity_config_id, name, data_type, prefix, suffix, required, repeat, allowed, hidden, default_value, options_only, options)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            prop.id,
            config.id,
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
    }

    for (const entity of data[ExportDataType.ENTITIES]) {
      await this.run(
        `INSERT OR REPLACE INTO entity (id, type, created_at, updated_at)
         VALUES (?, ?, ?, ?)`,
        [entity.id, entity.type, entity.createdAt, entity.updatedAt],
      );

      await this.run('DELETE FROM entity_tag WHERE entity_id = ?', [entity.id]);
      await this.writeEntityTags(entity.id, entity.tags);

      await this.run('DELETE FROM entity_property WHERE entity_id = ?', [
        entity.id,
      ]);
      await this.writeEntityProperties(entity.id, entity.properties);
    }

    for (const listConfig of data[ExportDataType.LIST_CONFIGS]) {
      await this.saveListConfig(listConfig);
    }

    return true;
  }

  async clearData(nukedDataTypes: NukedDataType[]): Promise<void> {
    for (const type of nukedDataTypes) {
      if (type === NukedDataType.ENTITIES) {
        await this.run('DELETE FROM entity_tag');
        await this.run('DELETE FROM entity_property');
        await this.run('DELETE FROM entity');
      } else if (type === NukedDataType.ENTITY_CONFIGS) {
        await this.run('DELETE FROM entity_property_config');
        await this.run('DELETE FROM entity_config');
      } else if (type === NukedDataType.LIST_CONFIGS) {
        await this.run('DELETE FROM list_config');
      }
    }
  }

  // ─── Public List ──────────────────────────────────────────────────────────

  async getList(
    id: string,
    start: number,
    perPage: number,
  ): Promise<StorageResult<PublicEntityListResult>> {
    const configRows = await this.execRows(
      'SELECT * FROM list_config WHERE id = ?',
      [id],
    );

    if (!configRows[0]) {
      return { isOk: false, error: new Error('List not found') };
    }

    const listConfig = this.rowToListConfig(configRows[0]);
    const entityConfigs = await this.getEntityConfigs();

    const entitiesResult = await this.getEntities(
      start,
      perPage,
      listConfig.filter,
      listConfig.sort,
    );

    if (!entitiesResult.isOk) {
      return { isOk: false, error: entitiesResult.error };
    }

    return {
      isOk: true,
      value: {
        entities: entitiesResult.value.entities,
        total: entitiesResult.value.total,
        listConfig,
        entityConfigs,
      },
    };
  }

  dispose(): void {
    this.worker.terminate();
  }

  // ─── Not applicable for local storage ─────────────────────────────────────

  async createAccount(): Promise<StorageResult<CreateAccountResponseBody>> {
    return {
      isOk: false,
      error: new Error('Account creation is not supported in local storage.'),
    };
  }

  async getParties(
    _query: string,
  ): Promise<StorageResult<AccessPolicyParty[]>> {
    return { isOk: true, value: [] };
  }

  async getAccessPolicyGroups(): Promise<StorageResult<AccessPolicyGroup[]>> {
    return { isOk: true, value: [] };
  }

  async createAccessPolicyGroup(
    _name: string,
    _users: string[],
  ): Promise<StorageResult<AccessPolicyGroup>> {
    return {
      isOk: false,
      error: new Error(
        'Access policy groups are not supported in local storage.',
      ),
    };
  }

  async updateAccessPolicyGroup(
    _id: string,
    _name: string,
    _users: string[],
  ): Promise<StorageResult<AccessPolicyGroup>> {
    return {
      isOk: false,
      error: new Error(
        'Access policy groups are not supported in local storage.',
      ),
    };
  }

  async deleteAccessPolicyGroup(_id: string): Promise<boolean> {
    return false;
  }

  async getAccessPolicies(): Promise<StorageResult<AccessPolicy[]>> {
    return { isOk: true, value: [] };
  }

  async createAccessPolicy(
    _name: string,
    _description: string,
    _parties: AccessPolicyParty[],
  ): Promise<StorageResult<AccessPolicy>> {
    return {
      isOk: false,
      error: new Error('Access policies are not supported in local storage.'),
    };
  }

  async updateAccessPolicy(
    _id: number,
    _name: string,
    _description: string,
    _parties: AccessPolicyParty[],
  ): Promise<StorageResult<AccessPolicy>> {
    return {
      isOk: false,
      error: new Error('Access policies are not supported in local storage.'),
    };
  }

  async deleteAccessPolicy(_id: number): Promise<boolean> {
    return false;
  }

  async saveEntityAccessList(
    _entityId: number,
    _accessListId: number,
  ): Promise<boolean> {
    return false;
  }

  async saveListConfigAccessPolicy(
    _listConfigId: string,
    _viewAccessPolicyId: number,
    _editAccessPolicyId: number,
  ): Promise<boolean> {
    return false;
  }
}

export const sqliteStorage = new SQLiteStorage();
