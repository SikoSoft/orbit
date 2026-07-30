import { FormatterEntry } from 'api-spec/models/Formatter';

import { registry } from '@/lib/FormatterRegistry';

export function applyFormatters(value: unknown, ids?: string[]): string {
  console.log('applyFormatters', value, ids);
  const idsToApply = ids && ids.length > 0 ? ids : Object.keys(registry);
  return idsToApply.reduce<string>((current, id) => {
    const entry = registry[id];
    if (!entry) {
      return current;
    }
    return String(entry.fn(current as never));
  }, String(value));
}

export function listFormatters(): FormatterEntry[] {
  console.log('listFormatters', registry);
  return Object.entries(registry).map(([id, { label, description }]) => ({
    id,
    label,
    description,
  }));
}
