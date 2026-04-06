import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import sqliteWasmUrl from '@sqlite.org/sqlite-wasm/sqlite3.wasm?url';
import type {
  Database,
  SAHPoolUtil,
  Sqlite3Static,
  BindableValue,
  SqlValue,
} from '@sqlite.org/sqlite-wasm';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS entity_config (
    id   INTEGER PRIMARY KEY,
    name TEXT    NOT NULL DEFAULT '',
    description  TEXT NOT NULL DEFAULT '',
    revision_of  INTEGER,
    allow_property_ordering INTEGER NOT NULL DEFAULT 0,
    ai_enabled              INTEGER NOT NULL DEFAULT 0,
    ai_identify_prompt      TEXT    NOT NULL DEFAULT ''
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

type Ctx = {
  onmessage: ((e: MessageEvent) => void) | null;
  postMessage(data: unknown): void;
};
const ctx = self as unknown as Ctx;

let db: Database;

let resolveDbReady!: () => void;
let rejectDbReady!: (e: Error) => void;
const dbReady = new Promise<void>((resolve, reject) => {
  resolveDbReady = resolve;
  rejectDbReady = reject;
});

async function initDb(dbPath: string): Promise<void> {
  type InitFn = (opts: {
    locateFile: (filename: string) => string;
  }) => Promise<Sqlite3Static>;

  const sqlite3 = await (sqlite3InitModule as unknown as InitFn)({
    locateFile: (filename: string) =>
      filename === 'sqlite3.wasm' ? sqliteWasmUrl : filename,
  });

  if (dbPath === ':memory:') {
    db = new sqlite3.oo1.DB(':memory:', 'c');
  } else {
    try {
      const poolUtil: SAHPoolUtil = await sqlite3.installOpfsSAHPoolVfs({});
      db = new poolUtil.OpfsSAHPoolDb(dbPath);
    } catch (e) {
      console.warn(
        'SQLiteStorage: OPFS unavailable, falling back to in-memory database.',
        e,
      );
      db = new sqlite3.oo1.DB(':memory:', 'c');
    }
  }

  db.exec(SCHEMA);

  // Add columns introduced after initial schema creation; ignore errors if they already exist.
  const migrations = [
    `ALTER TABLE entity_config ADD COLUMN ai_enabled INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE entity_config ADD COLUMN ai_identify_prompt TEXT NOT NULL DEFAULT ''`,
  ];
  for (const migration of migrations) {
    try {
      db.exec(migration);
    } catch {
      // Column already exists — safe to ignore.
    }
  }
}

interface WorkerMessage {
  id: string;
  type: 'init' | 'exec_rows' | 'exec_value' | 'run';
  dbPath?: string;
  sql: string;
  bind?: BindableValue[];
}

ctx.onmessage = async (e: MessageEvent<WorkerMessage>): Promise<void> => {
  const { id, type, sql, bind } = e.data;

  if (type === 'init') {
    try {
      await initDb(e.data.dbPath ?? '/orbit.db');
      resolveDbReady();
      ctx.postMessage({ id, result: null });
    } catch (error) {
      rejectDbReady(error as Error);
      ctx.postMessage({ id, error: (error as Error).message });
    }
    return;
  }

  try {
    await dbReady;

    if (type === 'exec_rows') {
      const rows: Record<string, SqlValue>[] = [];
      db.exec({
        sql,
        bind,
        rowMode: 'object',
        callback: (row: SqlValue[] | Record<string, SqlValue>) => {
          rows.push(row as Record<string, SqlValue>);
        },
      });
      ctx.postMessage({ id, result: rows });
    } else if (type === 'exec_value') {
      const rows: SqlValue[][] = [];
      db.exec({
        sql,
        bind,
        rowMode: 'array',
        callback: (row: SqlValue[] | Record<string, SqlValue>) => {
          rows.push(row as SqlValue[]);
        },
      });
      ctx.postMessage({ id, result: rows[0]?.[0] ?? null });
    } else if (type === 'run') {
      db.exec({ sql, bind });
      ctx.postMessage({ id, result: null });
    }
  } catch (error) {
    ctx.postMessage({ id, error: (error as Error).message });
  }
};
