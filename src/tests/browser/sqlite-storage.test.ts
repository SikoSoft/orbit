import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { SQLiteStorage } from '@/lib/SQLiteStorage';
import {
  DataType,
  defaultEntityConfig,
  type EntityConfig,
  type EntityPropertyConfig,
} from 'api-spec/models/Entity';
import {
  defaultListFilter,
  defaultListSort,
  ListSortDirection,
  ListSortNativeProperty,
} from 'api-spec/models/List';
import { OperationType } from 'api-spec/models/Operation';
import { SettingName } from 'api-spec/models/Setting';
import { NukedDataType, ExportDataType } from 'api-spec/models/Data';
import type { RequestBody } from '@/components/entity-form/entity-form.models';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeConfig(overrides: Partial<EntityConfig> = {}): EntityConfig {
  return { ...defaultEntityConfig, name: 'Test Config', ...overrides };
}

function makeProp(
  overrides: Partial<EntityPropertyConfig> = {},
): EntityPropertyConfig {
  return {
    id: 0, entityConfigId: 0, userId: '', name: 'Test Prop',
    prefix: '', suffix: '', required: 0, repeat: 1, allowed: 1, hidden: false,
    dataType: DataType.SHORT_TEXT, defaultValue: '',
    ...overrides,
  } as unknown as EntityPropertyConfig;
}

function makePayload(configId: number, overrides: Partial<RequestBody> = {}): RequestBody {
  return {
    entityConfigId: configId,
    timeZone: 0,
    tags: [],
    properties: [],
    propertyReferences: [],
    ...overrides,
  };
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('SQLiteStorage', () => {
  let db: SQLiteStorage;

  beforeEach(() => {
    db = new SQLiteStorage(':memory:');
  });

  afterEach(() => {
    db.dispose();
  });

  // ─── Entity Configs ──────────────────────────────────────────────────────

  describe('entity configs', () => {
    it('starts empty', async () => {
      const configs = await db.getEntityConfigs();
      expect(configs).toHaveLength(0);
    });

    it('adds a config and returns it with an assigned id', async () => {
      const result = await db.addEntityConfig(makeConfig());
      expect(result).not.toBeNull();
      expect(result!.id).toBeGreaterThan(0);
      expect(result!.name).toBe('Test Config');
    });

    it('persists aiEnabled and aiIdentifyPrompt', async () => {
      const result = await db.addEntityConfig(
        makeConfig({ aiEnabled: true, aiIdentifyPrompt: 'Identify the subject' }),
      );
      expect(result!.aiEnabled).toBe(true);
      expect(result!.aiIdentifyPrompt).toBe('Identify the subject');
    });

    it('defaults aiEnabled to false and aiIdentifyPrompt to empty string', async () => {
      const result = await db.addEntityConfig(makeConfig());
      expect(result!.aiEnabled).toBe(false);
      expect(result!.aiIdentifyPrompt).toBe('');
    });

    it('retrieves a config via getEntityConfigs', async () => {
      await db.addEntityConfig(makeConfig({ name: 'Alpha' }));
      const configs = await db.getEntityConfigs();
      expect(configs).toHaveLength(1);
      expect(configs[0].name).toBe('Alpha');
    });

    it('stores multiple configs independently', async () => {
      await db.addEntityConfig(makeConfig({ name: 'A' }));
      await db.addEntityConfig(makeConfig({ name: 'B' }));
      const configs = await db.getEntityConfigs();
      expect(configs).toHaveLength(2);
      expect(configs.map(c => c.name).sort()).toEqual(['A', 'B']);
    });

    it('updates name, description, and ai fields', async () => {
      const created = await db.addEntityConfig(makeConfig());
      const updated = await db.updateEntityConfig({
        ...created!,
        name: 'Renamed',
        description: 'New desc',
        aiEnabled: true,
        aiIdentifyPrompt: 'prompt',
      });
      expect(updated!.name).toBe('Renamed');
      expect(updated!.description).toBe('New desc');
      expect(updated!.aiEnabled).toBe(true);
      expect(updated!.aiIdentifyPrompt).toBe('prompt');
    });

    it('persists updates across getEntityConfigs', async () => {
      const created = await db.addEntityConfig(makeConfig());
      await db.updateEntityConfig({ ...created!, name: 'Updated' });
      const configs = await db.getEntityConfigs();
      expect(configs[0].name).toBe('Updated');
    });

    it('deletes a config', async () => {
      const created = await db.addEntityConfig(makeConfig());
      await db.deleteEntityConfig(created!.id);
      expect(await db.getEntityConfigs()).toHaveLength(0);
    });

    it('cascades delete to property configs and entities', async () => {
      const config = await db.addEntityConfig(
        makeConfig({ properties: [makeProp()] }),
      );
      await db.addEntity(makePayload(config!.id, { tags: ['x'] }));
      await db.deleteEntityConfig(config!.id);

      const configs = await db.getEntityConfigs();
      expect(configs).toHaveLength(0);

      const { value } = await db.getEntities(0, 100, defaultListFilter, defaultListSort) as { isOk: true; value: { entities: unknown[]; total: number } };
      expect(value.total).toBe(0);
    });

    it('stores allowPropertyOrdering', async () => {
      const result = await db.addEntityConfig(
        makeConfig({ allowPropertyOrdering: true }),
      );
      expect(result!.allowPropertyOrdering).toBe(true);
    });

    it('stores revisionOf', async () => {
      const original = await db.addEntityConfig(makeConfig({ name: 'v1' }));
      const revision = await db.addEntityConfig(
        makeConfig({ name: 'v2', revisionOf: original!.id }),
      );
      expect(revision!.revisionOf).toBe(original!.id);
    });
  });

  // ─── Property Configs ────────────────────────────────────────────────────

  describe('property configs', () => {
    it('adds a property config and attaches it to the entity config', async () => {
      const config = await db.addEntityConfig(makeConfig());
      const prop = await db.addPropertyConfig(
        makeProp({ entityConfigId: config!.id, name: 'Color' }),
      );
      expect(prop).not.toBeNull();
      expect(prop!.name).toBe('Color');
      expect(prop!.entityConfigId).toBe(config!.id);

      const configs = await db.getEntityConfigs();
      expect(configs[0].properties).toHaveLength(1);
    });

    it('adds a config with inline properties', async () => {
      const result = await db.addEntityConfig(
        makeConfig({ properties: [makeProp({ name: 'Inline Prop' })] }),
      );
      expect(result!.properties).toHaveLength(1);
      expect(result!.properties[0].name).toBe('Inline Prop');
    });

    it('updates a property config', async () => {
      const config = await db.addEntityConfig(makeConfig());
      const prop = await db.addPropertyConfig(
        makeProp({ entityConfigId: config!.id }),
      );
      const updated = await db.updatePropertyConfig({ ...prop!, name: 'Updated' });
      expect(updated!.name).toBe('Updated');
    });

    it('deletes a property config', async () => {
      const config = await db.addEntityConfig(makeConfig());
      const prop = await db.addPropertyConfig(
        makeProp({ entityConfigId: config!.id }),
      );
      await db.deletePropertyConfig(config!.id, prop!.id);
      const configs = await db.getEntityConfigs();
      expect(configs[0].properties).toHaveLength(0);
    });

    it('stores all data types', async () => {
      const config = await db.addEntityConfig(makeConfig());
      for (const dataType of Object.values(DataType)) {
        const defaultValue =
          dataType === DataType.BOOLEAN
            ? false
            : dataType === DataType.INT
              ? 0
              : dataType === DataType.IMAGE
                ? { src: '', alt: '' }
                : dataType === DataType.DATE
                  ? null
                  : '';
        const prop = await db.addPropertyConfig(
          makeProp({ entityConfigId: config!.id, dataType, defaultValue } as EntityPropertyConfig),
        );
        expect(prop!.dataType).toBe(dataType);
      }
    });
  });

  // ─── Entities ────────────────────────────────────────────────────────────

  describe('entities', () => {
    it('adds an entity and retrieves it', async () => {
      const config = await db.addEntityConfig(makeConfig());
      await db.addEntity(makePayload(config!.id));
      const result = await db.getEntities(0, 10, defaultListFilter, defaultListSort);
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.total).toBe(1);
        expect(result.value.entities[0].type).toBe(config!.id);
      }
    });

    it('stores and retrieves tags on an entity', async () => {
      const config = await db.addEntityConfig(makeConfig());
      await db.addEntity(makePayload(config!.id, { tags: ['alpha', 'beta'] }));
      const result = await db.getEntities(0, 10, defaultListFilter, defaultListSort);
      if (result.isOk) {
        expect(result.value.entities[0].tags).toEqual(
          expect.arrayContaining(['alpha', 'beta']),
        );
      }
    });

    it('stores and retrieves properties on an entity', async () => {
      const config = await db.addEntityConfig(
        makeConfig({ properties: [makeProp({ name: 'Note' })] }),
      );
      const propConfigId = config!.properties[0].id;
      const entity = await db.addEntity(
        makePayload(config!.id, {
          properties: [{ id: 0, propertyConfigId: propConfigId, value: 'hello', order: 0 }],
        }),
      );
      expect(entity!.properties).toHaveLength(1);
      expect(entity!.properties[0].value).toBe('hello');
    });

    it('updates an entity', async () => {
      const config = await db.addEntityConfig(makeConfig());
      const entity = await db.addEntity(makePayload(config!.id, { tags: ['old'] }));
      const updated = await db.updateEntity(
        entity!.id,
        makePayload(config!.id, { tags: ['new'] }),
      );
      expect(updated!.tags).toEqual(['new']);
    });

    it('deletes an entity', async () => {
      const config = await db.addEntityConfig(makeConfig());
      const entity = await db.addEntity(makePayload(config!.id));
      await db.deleteEntity(entity!.id);
      const result = await db.getEntities(0, 10, defaultListFilter, defaultListSort);
      if (result.isOk) {
        expect(result.value.total).toBe(0);
      }
    });

    it('paginates with start and perPage', async () => {
      const config = await db.addEntityConfig(makeConfig());
      for (let i = 0; i < 5; i++) {
        await db.addEntity(makePayload(config!.id));
      }
      const page1 = await db.getEntities(0, 3, defaultListFilter, defaultListSort);
      const page2 = await db.getEntities(3, 3, defaultListFilter, defaultListSort);
      if (page1.isOk && page2.isOk) {
        expect(page1.value.entities).toHaveLength(3);
        expect(page1.value.total).toBe(5);
        expect(page2.value.entities).toHaveLength(2);
      }
    });

    it('sorts ascending by createdAt', async () => {
      const config = await db.addEntityConfig(makeConfig());
      const e1 = await db.addEntity(makePayload(config!.id));
      const e2 = await db.addEntity(makePayload(config!.id));
      const result = await db.getEntities(0, 10, defaultListFilter, {
        property: ListSortNativeProperty.CREATED_AT,
        direction: ListSortDirection.ASC,
      });
      if (result.isOk) {
        expect(result.value.entities[0].id).toBe(e1!.id);
        expect(result.value.entities[1].id).toBe(e2!.id);
      }
    });

    it('filters by type', async () => {
      const configA = await db.addEntityConfig(makeConfig({ name: 'A' }));
      const configB = await db.addEntityConfig(makeConfig({ name: 'B' }));
      await db.addEntity(makePayload(configA!.id));
      await db.addEntity(makePayload(configB!.id));

      const result = await db.getEntities(0, 10, {
        ...defaultListFilter,
        includeAll: false,
        includeTypes: [configA!.id],
      }, defaultListSort);
      if (result.isOk) {
        expect(result.value.total).toBe(1);
        expect(result.value.entities[0].type).toBe(configA!.id);
      }
    });
  });

  // ─── Tags & Suggestions ──────────────────────────────────────────────────

  describe('tags and property suggestions', () => {
    it('returns matching tag suggestions', async () => {
      const config = await db.addEntityConfig(makeConfig());
      await db.addEntity(makePayload(config!.id, { tags: ['fruit', 'funny'] }));
      const tags = await db.getTags('fru');
      expect(tags).toContain('fruit');
      expect(tags).not.toContain('funny');
    });

    it('returns empty array for no tag matches', async () => {
      const tags = await db.getTags('xyz');
      expect(tags).toHaveLength(0);
    });

    it('returns matching property value suggestions', async () => {
      const config = await db.addEntityConfig(
        makeConfig({ properties: [makeProp({ name: 'Brand' })] }),
      );
      const propConfigId = config!.properties[0].id;
      await db.addEntity(
        makePayload(config!.id, {
          properties: [{ id: 0, propertyConfigId: propConfigId, value: 'Acme Corp', order: 0 }],
        }),
      );
      const suggestions = await db.getPropertySuggestions(propConfigId, 'Acme');
      expect(suggestions).toContain('Acme Corp');
    });
  });

  // ─── List Configs ────────────────────────────────────────────────────────

  describe('list configs', () => {
    it('starts with no list configs', async () => {
      const configs = await db.getListConfigs();
      expect(configs).toHaveLength(0);
    });

    it('adds a list config and returns its id', async () => {
      const id = await db.addListConfig();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('retrieves added list config', async () => {
      const id = await db.addListConfig();
      const configs = await db.getListConfigs();
      expect(configs).toHaveLength(1);
      expect(configs[0].id).toBe(id);
    });

    it('saves (upserts) a list config', async () => {
      const id = await db.addListConfig();
      const [original] = await db.getListConfigs();
      const result = await db.saveListConfig({ ...original, name: 'My List' });
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.name).toBe('My List');
      }
      const configs = await db.getListConfigs();
      expect(configs).toHaveLength(1);
      expect(configs[0].name).toBe('My List');
    });

    it('updates list sort', async () => {
      const id = await db.addListConfig();
      const newSort = { property: ListSortNativeProperty.UPDATED_AT, direction: ListSortDirection.ASC };
      await db.updateListSort(id, newSort);
      const [config] = await db.getListConfigs();
      expect(config.sort).toEqual(newSort);
    });

    it('updates list filter', async () => {
      const id = await db.addListConfig();
      const newFilter = { ...defaultListFilter, includeAll: false };
      await db.updateListFilter(id, newFilter);
      const [config] = await db.getListConfigs();
      expect(config.filter.includeAll).toBe(false);
    });

    it('updates list themes', async () => {
      const id = await db.addListConfig();
      await db.updateListThemes(id, ['dark', 'ocean']);
      const [config] = await db.getListConfigs();
      expect(config.themes).toEqual(['dark', 'ocean']);
    });

    it('saves a setting within a list config', async () => {
      const id = await db.addListConfig();
      await db.saveSetting(id, { name: SettingName.PUBLIC, value: true });
      const [config] = await db.getListConfigs();
      expect((config.setting as Record<string, unknown>)[SettingName.PUBLIC]).toBe(true);
    });

    it('deletes a list config', async () => {
      const id = await db.addListConfig();
      await db.deleteListConfig(id);
      expect(await db.getListConfigs()).toHaveLength(0);
    });
  });

  // ─── Bulk Operations ─────────────────────────────────────────────────────

  describe('bulk operations', () => {
    it('deletes multiple entities', async () => {
      const config = await db.addEntityConfig(makeConfig());
      const e1 = await db.addEntity(makePayload(config!.id));
      const e2 = await db.addEntity(makePayload(config!.id));
      await db.bulkOperation({
        operation: { type: OperationType.DELETE, tags: [] },
        actions: [e1!.id, e2!.id],
      });
      const result = await db.getEntities(0, 10, defaultListFilter, defaultListSort);
      if (result.isOk) {
        expect(result.value.total).toBe(0);
      }
    });

    it('adds tags to multiple entities', async () => {
      const config = await db.addEntityConfig(makeConfig());
      const e1 = await db.addEntity(makePayload(config!.id));
      const e2 = await db.addEntity(makePayload(config!.id));
      await db.bulkOperation({
        operation: { type: OperationType.ADD_TAGS, tags: ['bulk-tag'] },
        actions: [e1!.id, e2!.id],
      });
      const result = await db.getEntities(0, 10, defaultListFilter, defaultListSort);
      if (result.isOk) {
        expect(result.value.entities.every(e => e.tags.includes('bulk-tag'))).toBe(true);
      }
    });

    it('removes tags from entities', async () => {
      const config = await db.addEntityConfig(makeConfig());
      const entity = await db.addEntity(makePayload(config!.id, { tags: ['keep', 'remove-me'] }));
      await db.bulkOperation({
        operation: { type: OperationType.REMOVE_TAGS, tags: ['remove-me'] },
        actions: [entity!.id],
      });
      const result = await db.getEntities(0, 10, defaultListFilter, defaultListSort);
      if (result.isOk) {
        expect(result.value.entities[0].tags).toContain('keep');
        expect(result.value.entities[0].tags).not.toContain('remove-me');
      }
    });

    it('replaces all tags on entities', async () => {
      const config = await db.addEntityConfig(makeConfig());
      const entity = await db.addEntity(makePayload(config!.id, { tags: ['old-a', 'old-b'] }));
      await db.bulkOperation({
        operation: { type: OperationType.REPLACE_TAGS, tags: ['new-tag'] },
        actions: [entity!.id],
      });
      const result = await db.getEntities(0, 10, defaultListFilter, defaultListSort);
      if (result.isOk) {
        expect(result.value.entities[0].tags).toEqual(['new-tag']);
      }
    });
  });

  // ─── clearData ───────────────────────────────────────────────────────────

  describe('clearData', () => {
    it('clears only entities', async () => {
      const config = await db.addEntityConfig(makeConfig());
      await db.addEntity(makePayload(config!.id));
      await db.clearData([NukedDataType.ENTITIES]);
      const result = await db.getEntities(0, 10, defaultListFilter, defaultListSort);
      if (result.isOk) {
        expect(result.value.total).toBe(0);
      }
      expect(await db.getEntityConfigs()).toHaveLength(1);
    });

    it('clears entity configs (and their properties)', async () => {
      await db.addEntityConfig(makeConfig({ properties: [makeProp()] }));
      await db.clearData([NukedDataType.ENTITY_CONFIGS]);
      expect(await db.getEntityConfigs()).toHaveLength(0);
    });

    it('clears list configs', async () => {
      await db.addListConfig();
      await db.clearData([NukedDataType.LIST_CONFIGS]);
      expect(await db.getListConfigs()).toHaveLength(0);
    });

    it('clears multiple data types at once', async () => {
      const config = await db.addEntityConfig(makeConfig());
      await db.addEntity(makePayload(config!.id));
      await db.addListConfig();
      await db.clearData([NukedDataType.ENTITIES, NukedDataType.LIST_CONFIGS]);
      const result = await db.getEntities(0, 10, defaultListFilter, defaultListSort);
      if (result.isOk) {
        expect(result.value.total).toBe(0);
      }
      expect(await db.getListConfigs()).toHaveLength(0);
      expect(await db.getEntityConfigs()).toHaveLength(1);
    });
  });

  // ─── Export / Import ─────────────────────────────────────────────────────

  describe('export and import', () => {
    it('exports entities for given config ids', async () => {
      const config = await db.addEntityConfig(makeConfig());
      await db.addEntity(makePayload(config!.id));
      const entities = await db.export([config!.id]);
      expect(entities).toHaveLength(1);
    });

    it('imports entity configs and entities into a fresh db', async () => {
      const sourceConfig = await db.addEntityConfig(
        makeConfig({ name: 'Imported Config', properties: [makeProp({ name: 'Field' })] }),
      );
      await db.addEntity(makePayload(sourceConfig!.id, { tags: ['imported'] }));
      const entities = await db.export([sourceConfig!.id]);
      const configs = await db.getEntityConfigs();

      await db.clearData([NukedDataType.ENTITIES, NukedDataType.ENTITY_CONFIGS]);

      await db.import({
        meta: { version: '1', date: new Date().toISOString() },
        [ExportDataType.ENTITY_CONFIGS]: configs,
        [ExportDataType.ENTITIES]: entities,
        [ExportDataType.LIST_CONFIGS]: [],
      });

      const importedConfigs = await db.getEntityConfigs();
      expect(importedConfigs).toHaveLength(1);
      expect(importedConfigs[0].name).toBe('Imported Config');

      const result = await db.getEntities(0, 10, defaultListFilter, defaultListSort);
      if (result.isOk) {
        expect(result.value.total).toBe(1);
        expect(result.value.entities[0].tags).toContain('imported');
      }
    });
  });
});
