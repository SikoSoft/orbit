import { FormatterEntry } from 'api-spec/models/Formatter';

import { registry } from '@/lib/FormatterRegistry';
import '@/lib/formatters/ms-to-duration';

export function applyFormatters(value: unknown, ids?: string[]): string {
  console.log('applyFormatters', value, ids);
  const idsToApply = ids && ids.length > 0 ? ids : Object.keys(registry);
  const result = idsToApply.reduce<unknown>((current, id) => {
    const entry = registry[id];
    if (!entry) {
      return current;
    }
    return entry.fn(current as never);
  }, value);
  return String(result);
}

export function listFormatters(): FormatterEntry[] {
  console.log('listFormatters', registry);
  return Object.entries(registry).map(([id, { label, description }]) => ({
    id,
    label,
    description,
  }));
}
