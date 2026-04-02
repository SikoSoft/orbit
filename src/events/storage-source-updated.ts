import { StorageSource } from '@/models/Storage';

export const storageSourceUpdatedEventName = 'storage-source-updated';

export interface StorageSourceUpdatedEventPayload {
  source: StorageSource;
}

export class StorageSourceUpdatedEvent extends CustomEvent<StorageSourceUpdatedEventPayload> {
  constructor(payload: StorageSourceUpdatedEventPayload) {
    super(storageSourceUpdatedEventName, {
      bubbles: true,
      composed: true,
      detail: payload,
    });
  }
}
