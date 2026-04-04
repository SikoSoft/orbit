import { describe, it, expect, beforeEach } from 'vitest';
import { Localization } from '@/lib/Localization';

describe('Localization', () => {
  let loc: Localization;

  beforeEach(() => {
    loc = new Localization();
  });

  it('returns the translated string for a known key', () => {
    expect(loc.translate('add')).toBe('Add');
  });

  it('returns the key itself when no translation exists', () => {
    expect(loc.translate('nonExistentKey_xyz')).toBe('nonExistentKey_xyz');
  });

  it('applies single replacement placeholders', () => {
    // "entityPropertyMinCount": "At least {count} '{property}' required"
    const result = loc.translate('entityPropertyMinCount', {
      count: 2,
      property: 'title',
    });
    expect(result).toBe("At least 2 'title' required");
  });

  it('returns an empty string replacement when the value is 0', () => {
    const result = loc.translate('entityPropertyMinCount', {
      count: 0,
      property: 'tag',
    });
    expect(result).toBe("At least 0 'tag' required");
  });

  it('translate is stable across multiple calls', () => {
    expect(loc.translate('save')).toBe('Save');
    expect(loc.translate('save')).toBe('Save');
  });
});
