import { describe, it, expect, beforeEach } from 'vitest';
import { AppState, defaultListConfig } from '@/state';
import { ThemeName } from '@/models/Page';
import { ListFilterType } from 'api-spec/models/List';
import { DataType, type EntityPropertyConfig } from 'api-spec/models/Entity';

describe('AppState', () => {
  let state: AppState;

  beforeEach(() => {
    state = new AppState();
  });

  describe('initial state', () => {
    it('starts with loading false', () => {
      expect(state.loading).toBe(false);
    });

    it('starts with empty listItems', () => {
      expect(state.listItems).toEqual([]);
    });

    it('starts with empty authToken', () => {
      expect(state.authToken).toBe('');
    });

    it('starts with selectMode false', () => {
      expect(state.selectMode).toBe(false);
    });
  });

  describe('setLoading', () => {
    it('sets loading to true', () => {
      state.setLoading(true);
      expect(state.loading).toBe(true);
    });

    it('sets loading to false', () => {
      state.setLoading(true);
      state.setLoading(false);
      expect(state.loading).toBe(false);
    });
  });

  describe('setAuthToken', () => {
    it('stores the token', () => {
      state.setAuthToken('my-jwt-token');
      expect(state.authToken).toBe('my-jwt-token');
    });
  });

  describe('setTitle', () => {
    it('appends " - Orbit" to the title', () => {
      state.setTitle('Dashboard');
      expect(state.title).toBe('Dashboard - Orbit');
    });
  });

  describe('setTheme', () => {
    it('sets a valid theme', () => {
      state.setTheme(ThemeName.DARK);
      expect(state.theme).toBe(ThemeName.DARK);
    });

    it('falls back to default theme for invalid value', () => {
      state.setTheme('not-a-theme' as ThemeName);
      expect(state.theme).toBe(ThemeName.LIGHT);
    });
  });

  describe('action selection', () => {
    it('addActionToSelection adds the id and enables selectMode', () => {
      state.addActionToSelection(1);
      expect(state.selectedActions).toContain(1);
      expect(state.selectMode).toBe(true);
    });

    it('addActionToSelection deduplicates', () => {
      state.addActionToSelection(1);
      state.addActionToSelection(1);
      expect(state.selectedActions.filter(id => id === 1)).toHaveLength(1);
    });

    it('removeActionFromSelection removes the id', () => {
      state.addActionToSelection(1);
      state.removeActionFromSelection(1);
      expect(state.selectedActions).not.toContain(1);
    });

    it('removeActionFromSelection disables selectMode when list becomes empty', () => {
      state.addActionToSelection(1);
      state.removeActionFromSelection(1);
      expect(state.selectMode).toBe(false);
    });

    it('removeActionFromSelection keeps selectMode true when others remain', () => {
      state.addActionToSelection(1);
      state.addActionToSelection(2);
      state.removeActionFromSelection(1);
      expect(state.selectMode).toBe(true);
    });

    it('toggleActionSelection adds when not present', () => {
      state.toggleActionSelection(5);
      expect(state.selectedActions).toContain(5);
    });

    it('toggleActionSelection removes when already selected', () => {
      state.addActionToSelection(5);
      state.toggleActionSelection(5);
      expect(state.selectedActions).not.toContain(5);
    });
  });

  describe('list configs', () => {
    const mockConfig = {
      ...defaultListConfig,
      id: 'my-config',
      name: 'My Config',
    };

    it('addListConfig appends a new config', () => {
      state.addListConfig(mockConfig);
      expect(state.listConfigs.find(c => c.id === 'my-config')).toBeDefined();
    });

    it('addListConfig replaces an existing config with the same id', () => {
      state.addListConfig(mockConfig);
      state.addListConfig({ ...mockConfig, name: 'Updated' });
      const matches = state.listConfigs.filter(c => c.id === 'my-config');
      expect(matches).toHaveLength(1);
      expect(matches[0].name).toBe('Updated');
    });

    it('setListConfigs sets hasFetchedListConfigs to true', () => {
      state.setListConfigs([mockConfig]);
      expect(state.hasFetchedListConfigs).toBe(true);
    });
  });

  describe('list filter tagging', () => {
    it('setListFilterTagging updates the tagging type', () => {
      state.setListFilterTagging(ListFilterType.CONTAINS_ALL_OF, ['foo', 'bar']);
      expect(
        state.listFilter.tagging[ListFilterType.CONTAINS_ALL_OF],
      ).toEqual(['foo', 'bar']);
    });
  });

  describe('entity configs', () => {
    it('setEntityConfigs also flattens propertyConfigs', () => {
      const entityConfig = {
        id: 1,
        userId: 'user1',
        name: 'Test',
        description: '',
        revisionOf: null,
        allowPropertyOrdering: false,
        aiEnabled: false,
        aiIdentifyPrompt: '',
        public: false,
        viewAccessPolicy: null,
        editAccessPolicy: null,
        properties: [
          {
            id: 10, entityConfigId: 1, userId: '', name: 'Prop A',
            prefix: '', suffix: '', required: 0, repeat: 1, allowed: 1, hidden: false,
            dataType: DataType.SHORT_TEXT, defaultValue: '',
          } as EntityPropertyConfig,
        ],
      };
      state.setEntityConfigs([entityConfig]);
      expect(state.propertyConfigs).toHaveLength(1);
      expect(state.propertyConfigs[0].name).toBe('Prop A');
    });
  });
});
