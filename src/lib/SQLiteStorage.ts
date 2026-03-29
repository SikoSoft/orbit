import sqlite3InitModule, {
  BindableValue,
  Database,
  SAHPoolUtil,
  Sqlite3Static,
  SqlValue,
} from '@sqlite.org/sqlite-wasm';
import { v4 as uuidv4 } from 'uuid';

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
} from 'api-spec/models/List';
import { Setting, Settings, defaultSettings } from 'api-spec/models/Setting';
import { ExportDataContents, ExportDataType, NukedDataType } from 'api-spec/models/Data';

import { StorageResult, StorageSchema } from '@/models/Storage';
import { RequestBody } from '@/components/entity-form/entity-form.models';
import { BulkOperationPayload } from '@/components/bulk-manager/bulk-manager.models';
import {
  EntityListResult,
  PublicEntityListResult,
} from '@/components/entity-list/entity-list.models';
import { CreateAccountResponseBody } from '@/components/account-form/account-form.models';
import { OperationType } from 'api-spec/models/Operation';
import { translate } from './Localization';

type Sqlite3Db = Database;

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS entity_config (
    id   INTEGER PRIMARY KEY,
    name TEXT    NOT NULL DEFAULT '',
    description  TEXT NOT NULL DEFAULT '',
    revision_of  INTEGER,
    allow_property_ordering INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS entity_property_config (
    id               INTEGER PRIMARY KEY,
    entity_config_id INTEGER NOT NULL,
    name             TEXT    NOT NULL DEFAULT '',
    data_type        TEXT    NOT NULL,
    prefix           TEXT    NOT NULL DEFAULT '',
    suffix           TEXT    NOT NULL DEFAULT '',
    required         INTEGER NOT NULL DEFAULT 0,
    repeat           INTEGER NOT NULL DEFAULT 1,
    allowed          INTEGER NOT NULL DEFAULT 1,
    hidden           INTEGER NOT NULL DEFAULT 0,
    default_value    TEXT    NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS entity (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    type       INTEGER NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
  );

  CREATE TABLE IF NOT EXISTS entity_tag (
    entity_id INTEGER NOT NULL,
    tag       TEXT    NOT NULL,
    PRIMARY KEY (entity_id, tag)
  );

  CREATE TABLE IF NOT EXISTS entity_property (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_id          INTEGER NOT NULL,
    property_config_id INTEGER NOT NULL,
    data_type          TEXT    NOT NULL,
    value              TEXT    NOT NULL DEFAULT '',
    sort_order         INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS list_config (
    id      TEXT PRIMARY KEY,
    name    TEXT NOT NULL DEFAULT '',
    filter  TEXT NOT NULL DEFAULT '{}',
    sort    TEXT NOT NULL DEFAULT '{}',
    setting TEXT NOT NULL DEFAULT '{}',
    themes  TEXT NOT NULL DEFAULT '[]'
  );
`;

function serializePropertyValue(
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
  private initPromise: Promise<Sqlite3Db> | null = null;

  async init(): Promise<void> {
    await this.getDb();
  }

  private getDb(): Promise<Sqlite3Db> {
    if (!this.initPromise) {
      this.initPromise = (async () => {
        const sqlite3: Sqlite3Static = await sqlite3InitModule();
        let db: Sqlite3Db;

        try {
          const poolUtil: SAHPoolUtil = await sqlite3.installOpfsSAHPoolVfs({});
          db = new poolUtil.OpfsSAHPoolDb('/orbit.db');
        } catch {
          console.warn(
            'SQLiteStorage: OPFS unavailable, falling back to in-memory database.',
          );
          db = new sqlite3.oo1.DB(':memory:', 'c');
        }

        db.exec(SCHEMA);
        return db;
      })();
    }

    return this.initPromise;
  }

  private execRows(
    db: Sqlite3Db,
    sql: string,
    bind: BindableValue[] = [],
  ): Record<string, SqlValue>[] {
    const rows: Record<string, SqlValue>[] = [];
    db.exec({
      sql,
      bind,
      rowMode: 'object',
      callback: (row: SqlValue[] | Record<string, SqlValue>) => {
        rows.push(row as Record<string, SqlValue>);
      },
    });
    return rows;
  }

  private execValue(
    db: Sqlite3Db,
    sql: string,
    bind: BindableValue[] = [],
  ): SqlValue {
    const rows: SqlValue[][] = [];
    db.exec({
      sql,
      bind,
      rowMode: 'array',
      callback: (row: SqlValue[] | Record<string, SqlValue>) => {
        rows.push(row as SqlValue[]);
      },
    });
    return rows[0]?.[0] ?? null;
  }

  // ─── Entity Configs ───────────────────────────────────────────────────────

  async getEntityConfigs(): Promise<EntityConfig[]> {
    const db = await this.getDb();

    const configRows = this.execRows(db, 'SELECT * FROM entity_config');
    const propRows = this.execRows(
      db,
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
    const db = await this.getDb();

    db.exec({
      sql: `INSERT INTO entity_config (name, description, revision_of, allow_property_ordering)
            VALUES (?, ?, ?, ?)`,
      bind: [
        entityConfig.name,
        entityConfig.description,
        entityConfig.revisionOf ?? null,
        entityConfig.allowPropertyOrdering ? 1 : 0,
      ],
    });

    const id = this.execValue(db, 'SELECT last_insert_rowid()') as number;

    for (const prop of entityConfig.properties) {
      db.exec({
        sql: `INSERT INTO entity_property_config
              (id, entity_config_id, name, data_type, prefix, suffix, required, repeat, allowed, hidden, default_value)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        bind: [
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
        ],
      });
    }

    const configs = await this.getEntityConfigs();
    return configs.find(c => c.id === id) ?? null;
  }

  async updateEntityConfig(
    entityConfig: EntityConfig,
  ): Promise<EntityConfig | null> {
    const db = await this.getDb();

    db.exec({
      sql: `UPDATE entity_config
            SET name = ?, description = ?, revision_of = ?, allow_property_ordering = ?
            WHERE id = ?`,
      bind: [
        entityConfig.name,
        entityConfig.description,
        entityConfig.revisionOf ?? null,
        entityConfig.allowPropertyOrdering ? 1 : 0,
        entityConfig.id,
      ],
    });

    const configs = await this.getEntityConfigs();
    return configs.find(c => c.id === entityConfig.id) ?? null;
  }

  async deleteEntityConfig(id: number): Promise<boolean> {
    const db = await this.getDb();

    const propConfigIds = this.execRows(
      db,
      'SELECT id FROM entity_property_config WHERE entity_config_id = ?',
      [id],
    ).map(r => r['id'] as number);

    for (const propConfigId of propConfigIds) {
      db.exec({
        sql: 'DELETE FROM entity_property WHERE property_config_id = ?',
        bind: [propConfigId],
      });
    }

    db.exec({
      sql: 'DELETE FROM entity_property_config WHERE entity_config_id = ?',
      bind: [id],
    });
    db.exec({ sql: 'DELETE FROM entity WHERE type = ?', bind: [id] });
    db.exec({ sql: 'DELETE FROM entity_config WHERE id = ?', bind: [id] });

    return true;
  }

  // ─── Property Configs ─────────────────────────────────────────────────────

  async addPropertyConfig(
    propertyConfig: EntityPropertyConfig,
  ): Promise<EntityPropertyConfig | null> {
    const db = await this.getDb();

    db.exec({
      sql: `INSERT INTO entity_property_config
            (entity_config_id, name, data_type, prefix, suffix, required, repeat, allowed, hidden, default_value)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      bind: [
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
      ],
    });

    const id = this.execValue(db, 'SELECT last_insert_rowid()') as number;
    const row = this.execRows(
      db,
      'SELECT * FROM entity_property_config WHERE id = ?',
      [id],
    )[0];

    return row ? rowToEntityPropertyConfig(row) : null;
  }

  async updatePropertyConfig(
    propertyConfig: EntityPropertyConfig,
  ): Promise<EntityPropertyConfig | null> {
    const db = await this.getDb();

    db.exec({
      sql: `UPDATE entity_property_config
            SET name = ?, data_type = ?, prefix = ?, suffix = ?, required = ?,
                repeat = ?, allowed = ?, hidden = ?, default_value = ?
            WHERE id = ?`,
      bind: [
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
        propertyConfig.id,
      ],
    });

    const row = this.execRows(
      db,
      'SELECT * FROM entity_property_config WHERE id = ?',
      [propertyConfig.id],
    )[0];

    return row ? rowToEntityPropertyConfig(row) : null;
  }

  async deletePropertyConfig(
    _entityConfigId: number,
    id: number,
  ): Promise<boolean> {
    const db = await this.getDb();

    db.exec({
      sql: 'DELETE FROM entity_property WHERE property_config_id = ?',
      bind: [id],
    });
    db.exec({
      sql: 'DELETE FROM entity_property_config WHERE id = ?',
      bind: [id],
    });

    return true;
  }

  async setEntityPropertyOrder(
    entityConfigId: number,
    propertyConfigOrder: { id: number; order: number }[],
  ): Promise<boolean> {
    const db = await this.getDb();

    for (const { id, order } of propertyConfigOrder) {
      db.exec({
        sql: `UPDATE entity_property
              SET sort_order = ?
              WHERE entity_id IN (SELECT id FROM entity WHERE type = ?)
              AND property_config_id = ?`,
        bind: [order, entityConfigId, id],
      });
    }

    return true;
  }

  // ─── Entities ─────────────────────────────────────────────────────────────

  private loadEntityRows(
    db: Sqlite3Db,
    entityRows: Record<string, unknown>[],
  ): Entity[] {
    if (entityRows.length === 0) {
      return [];
    }

    const ids = entityRows.map(r => r['id'] as number);
    const placeholders = ids.map(() => '?').join(',');

    const tagRows = this.execRows(
      db,
      `SELECT entity_id, tag FROM entity_tag WHERE entity_id IN (${placeholders})`,
      ids,
    );

    const propRows = this.execRows(
      db,
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
    const db = await this.getDb();

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
    const total = this.execValue(db, countSql, bindings) as number;

    const rowSql = `
      SELECT DISTINCT e.id, e.type, e.created_at, e.updated_at
      FROM entity e
      ${joinClause}
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;

    const entityRows = this.execRows(db, rowSql, [
      ...bindings,
      perPage,
      start,
    ]);

    const entities = this.loadEntityRows(db, entityRows);

    return { isOk: true, value: { entities, total } };
  }

  async addEntity(payload: RequestBody): Promise<Entity | null> {
    const db = await this.getDb();

    const now = new Date().toISOString();

    db.exec({
      sql: `INSERT INTO entity (type, created_at, updated_at) VALUES (?, ?, ?)`,
      bind: [payload.entityConfigId, now, now],
    });

    const id = this.execValue(db, 'SELECT last_insert_rowid()') as number;

    this.writeEntityTags(db, id, payload.tags);
    this.writeEntityProperties(db, id, payload.properties);

    const rows = this.execRows(db, 'SELECT * FROM entity WHERE id = ?', [id]);
    return this.loadEntityRows(db, rows)[0] ?? null;
  }

  async updateEntity(
    id: number,
    payload: RequestBody,
  ): Promise<Entity | null> {
    const db = await this.getDb();

    const now = new Date().toISOString();

    db.exec({
      sql: `UPDATE entity SET type = ?, updated_at = ? WHERE id = ?`,
      bind: [payload.entityConfigId, now, id],
    });

    db.exec({ sql: 'DELETE FROM entity_tag WHERE entity_id = ?', bind: [id] });
    db.exec({
      sql: 'DELETE FROM entity_property WHERE entity_id = ?',
      bind: [id],
    });

    this.writeEntityTags(db, id, payload.tags);
    this.writeEntityProperties(db, id, payload.properties);

    const rows = this.execRows(db, 'SELECT * FROM entity WHERE id = ?', [id]);
    return this.loadEntityRows(db, rows)[0] ?? null;
  }

  async deleteEntity(id: number): Promise<boolean> {
    const db = await this.getDb();

    db.exec({ sql: 'DELETE FROM entity_tag WHERE entity_id = ?', bind: [id] });
    db.exec({
      sql: 'DELETE FROM entity_property WHERE entity_id = ?',
      bind: [id],
    });
    db.exec({ sql: 'DELETE FROM entity WHERE id = ?', bind: [id] });

    return true;
  }

  private writeEntityTags(db: Sqlite3Db, entityId: number, tags: string[]): void {
    for (const tag of tags) {
      db.exec({
        sql: 'INSERT OR IGNORE INTO entity_tag (entity_id, tag) VALUES (?, ?)',
        bind: [entityId, tag],
      });
    }
  }

  private writeEntityProperties(
    db: Sqlite3Db,
    entityId: number,
    properties: EntityProperty[],
  ): void {
    for (const prop of properties) {
      const propConfigRows = this.execRows(
        db,
        'SELECT data_type FROM entity_property_config WHERE id = ?',
        [prop.propertyConfigId],
      );
      const dataType =
        (propConfigRows[0]?.['data_type'] as DataType) ?? DataType.SHORT_TEXT;

      db.exec({
        sql: `INSERT INTO entity_property (entity_id, property_config_id, data_type, value, sort_order)
              VALUES (?, ?, ?, ?, ?)`,
        bind: [
          entityId,
          prop.propertyConfigId,
          dataType,
          serializePropertyValue(prop.value, dataType),
          prop.order,
        ],
      });
    }
  }

  // ─── Tags & Suggestions ───────────────────────────────────────────────────

  async getTags(tag: string): Promise<string[]> {
    const db = await this.getDb();
    const rows = this.execRows(
      db,
      `SELECT DISTINCT tag FROM entity_tag WHERE tag LIKE ? ORDER BY tag ASC LIMIT 20`,
      [`%${tag}%`],
    );
    return rows.map(r => r['tag'] as string);
  }

  async getPropertySuggestions(
    propertyConfigId: number,
    query: string,
  ): Promise<string[]> {
    const db = await this.getDb();
    const rows = this.execRows(
      db,
      `SELECT DISTINCT value FROM entity_property
       WHERE property_config_id = ? AND value LIKE ?
       ORDER BY value ASC LIMIT 20`,
      [propertyConfigId, `%${query}%`],
    );
    return rows.map(r => r['value'] as string);
  }

  // ─── List Configs ─────────────────────────────────────────────────────────

  async getListConfigs(): Promise<ListConfig[]> {
    const db = await this.getDb();
    const rows = this.execRows(db, 'SELECT * FROM list_config');
    return rows.map(row => this.rowToListConfig(row));
  }

  async addListConfig(): Promise<string> {
    const db = await this.getDb();
    const id = uuidv4();

    db.exec({
      sql: `INSERT INTO list_config (id, name, filter, sort, setting, themes)
            VALUES (?, ?, ?, ?, ?, ?)`,
      bind: [
        id,
        translate('configName'),
        JSON.stringify({}),
        JSON.stringify({}),
        JSON.stringify(defaultSettings),
        JSON.stringify([]),
      ],
    });

    return id;
  }

  async saveListConfig(
    listConfig: ListConfig,
  ): Promise<StorageResult<ListConfig>> {
    const db = await this.getDb();

    db.exec({
      sql: `INSERT INTO list_config (id, name, filter, sort, setting, themes)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              name    = excluded.name,
              filter  = excluded.filter,
              sort    = excluded.sort,
              setting = excluded.setting,
              themes  = excluded.themes`,
      bind: [
        listConfig.id,
        listConfig.name,
        JSON.stringify(listConfig.filter),
        JSON.stringify(listConfig.sort),
        JSON.stringify(listConfig.setting),
        JSON.stringify(listConfig.themes),
      ],
    });

    return { isOk: true, value: listConfig };
  }

  async updateListSort(listConfigId: string, sort: ListSort): Promise<void> {
    const db = await this.getDb();
    db.exec({
      sql: 'UPDATE list_config SET sort = ? WHERE id = ?',
      bind: [JSON.stringify(sort), listConfigId],
    });
  }

  async updateListFilter(
    listConfigId: string,
    filter: ListFilter,
  ): Promise<void> {
    const db = await this.getDb();
    db.exec({
      sql: 'UPDATE list_config SET filter = ? WHERE id = ?',
      bind: [JSON.stringify(filter), listConfigId],
    });
  }

  async updateListThemes(
    listConfigId: string,
    themes: string[],
  ): Promise<void> {
    const db = await this.getDb();
    db.exec({
      sql: 'UPDATE list_config SET themes = ? WHERE id = ?',
      bind: [JSON.stringify(themes), listConfigId],
    });
  }

  async deleteListConfig(id: string): Promise<boolean> {
    const db = await this.getDb();
    db.exec({ sql: 'DELETE FROM list_config WHERE id = ?', bind: [id] });
    return true;
  }

  async saveSetting(listConfigId: string, setting: Setting): Promise<boolean> {
    const db = await this.getDb();

    const row = this.execRows(
      db,
      'SELECT setting FROM list_config WHERE id = ?',
      [listConfigId],
    )[0];

    if (!row) {
      return false;
    }

    const current: Settings = JSON.parse(row['setting'] as string);
    const updated: Settings = { ...current, [setting.name]: setting.value };

    db.exec({
      sql: 'UPDATE list_config SET setting = ? WHERE id = ?',
      bind: [JSON.stringify(updated), listConfigId],
    });

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
    };
  }

  // ─── Bulk Operations ──────────────────────────────────────────────────────

  async bulkOperation(payload: BulkOperationPayload): Promise<boolean> {
    const db = await this.getDb();
    const { operation, actions } = payload;

    if (operation.type === OperationType.DELETE) {
      for (const id of actions) {
        await this.deleteEntity(id);
      }
      return true;
    }

    for (const entityId of actions) {
      if (operation.type === OperationType.REPLACE_TAGS) {
        db.exec({
          sql: 'DELETE FROM entity_tag WHERE entity_id = ?',
          bind: [entityId],
        });
        this.writeEntityTags(db, entityId, operation.tags);
      } else if (operation.type === OperationType.ADD_TAGS) {
        this.writeEntityTags(db, entityId, operation.tags);
      } else if (operation.type === OperationType.REMOVE_TAGS) {
        for (const tag of operation.tags) {
          db.exec({
            sql: 'DELETE FROM entity_tag WHERE entity_id = ? AND tag = ?',
            bind: [entityId, tag],
          });
        }
      }
    }

    return true;
  }

  // ─── Import / Export / Nuke ───────────────────────────────────────────────

  async export(entityConfigIds: number[]): Promise<Entity[]> {
    const db = await this.getDb();

    const ph = entityConfigIds.map(() => '?').join(',');
    const entityRows = this.execRows(
      db,
      `SELECT * FROM entity WHERE type IN (${ph})`,
      entityConfigIds,
    );

    return this.loadEntityRows(db, entityRows);
  }

  async import(data: ExportDataContents): Promise<boolean> {
    const db = await this.getDb();

    for (const config of data[ExportDataType.ENTITY_CONFIGS]) {
      db.exec({
        sql: `INSERT OR REPLACE INTO entity_config (id, name, description, revision_of, allow_property_ordering)
              VALUES (?, ?, ?, ?, ?)`,
        bind: [
          config.id,
          config.name,
          config.description,
          config.revisionOf ?? null,
          config.allowPropertyOrdering ? 1 : 0,
        ],
      });

      for (const prop of config.properties) {
        db.exec({
          sql: `INSERT OR REPLACE INTO entity_property_config
                (id, entity_config_id, name, data_type, prefix, suffix, required, repeat, allowed, hidden, default_value)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          bind: [
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
          ],
        });
      }
    }

    for (const entity of data[ExportDataType.ENTITIES]) {
      db.exec({
        sql: `INSERT OR REPLACE INTO entity (id, type, created_at, updated_at)
              VALUES (?, ?, ?, ?)`,
        bind: [entity.id, entity.type, entity.createdAt, entity.updatedAt],
      });

      db.exec({
        sql: 'DELETE FROM entity_tag WHERE entity_id = ?',
        bind: [entity.id],
      });
      this.writeEntityTags(db, entity.id, entity.tags);

      db.exec({
        sql: 'DELETE FROM entity_property WHERE entity_id = ?',
        bind: [entity.id],
      });
      this.writeEntityProperties(db, entity.id, entity.properties);
    }

    for (const listConfig of data[ExportDataType.LIST_CONFIGS]) {
      await this.saveListConfig(listConfig);
    }

    return true;
  }

  async clearData(nukedDataTypes: NukedDataType[]): Promise<void> {
    const db = await this.getDb();

    for (const type of nukedDataTypes) {
      if (type === NukedDataType.ENTITIES) {
        db.exec('DELETE FROM entity_tag');
        db.exec('DELETE FROM entity_property');
        db.exec('DELETE FROM entity');
      } else if (type === NukedDataType.ENTITY_CONFIGS) {
        db.exec('DELETE FROM entity_property_config');
        db.exec('DELETE FROM entity_config');
      } else if (type === NukedDataType.LIST_CONFIGS) {
        db.exec('DELETE FROM list_config');
      }
    }
  }

  // ─── Public List ──────────────────────────────────────────────────────────

  async getList(
    id: string,
    start: number,
    perPage: number,
  ): Promise<StorageResult<PublicEntityListResult>> {
    const db = await this.getDb();

    const configRow = this.execRows(
      db,
      'SELECT * FROM list_config WHERE id = ?',
      [id],
    )[0];

    if (!configRow) {
      return { isOk: false, error: new Error('List not found') };
    }

    const listConfig = this.rowToListConfig(configRow);
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

  // ─── Not applicable for local storage ─────────────────────────────────────

  async createAccount(): Promise<StorageResult<CreateAccountResponseBody>> {
    return {
      isOk: false,
      error: new Error('Account creation is not supported in local storage.'),
    };
  }
}

export const sqliteStorage = new SQLiteStorage();
