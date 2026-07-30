import { FormatterMeta } from 'api-spec/models/Formatter';

export const registry: Record<string, FormatterMeta> = {};

export function registerFormatter(id: string, meta: FormatterMeta): void {
  registry[id] = meta;
}
