import { reaction, runInAction, toJS } from 'mobx';

export interface PersistedOptions<T> {
  parse?: (raw: string) => T;
  serialize?: (value: T) => string;
  deep?: boolean;
}

interface PersistedFieldMeta {
  storageKey: string;
  options: PersistedOptions<unknown>;
}

const persistedFields = new WeakMap<
  object,
  Map<string | symbol, PersistedFieldMeta>
>();

export function persisted<T>(
  storageKey: string,
  options: PersistedOptions<T> = {},
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol): void => {
    if (!persistedFields.has(target)) {
      persistedFields.set(target, new Map());
    }
    persistedFields
      .get(target)!
      .set(propertyKey, { storageKey, options: options as PersistedOptions<unknown> });
  };
}

export function initPersistedState(instance: object): void {
  let proto = Object.getPrototypeOf(instance) as object | null;

  while (proto && proto !== Object.prototype) {
    const fields = persistedFields.get(proto);
    if (fields) {
      for (const [propertyKey, { storageKey, options }] of fields) {
        const raw = localStorage.getItem(storageKey);
        if (raw !== null) {
          const value = options.parse ? options.parse(raw) : JSON.parse(raw);
          runInAction(() => {
            (instance as Record<string | symbol, unknown>)[propertyKey] = value;
          });
        }

        const obj = instance as Record<string | symbol, unknown>;

        if (options.deep) {
          reaction(
            () =>
              JSON.stringify(toJS(obj[propertyKey] as object)),
            serialized => localStorage.setItem(storageKey, serialized),
          );
        } else {
          reaction(
            () => obj[propertyKey],
            value => {
              const serialized = options.serialize
                ? options.serialize(value)
                : JSON.stringify(value);
              localStorage.setItem(storageKey, serialized);
            },
          );
        }
      }
    }
    proto = Object.getPrototypeOf(proto) as object | null;
  }
}
