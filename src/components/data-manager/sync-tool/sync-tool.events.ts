export const deviceToCloudSyncFailedEventName = 'device-to-cloud-sync-failed';
export const cloudToDeviceSyncFailedEventName = 'cloud-to-device-sync-failed';

export class DeviceToCloudSyncFailedEvent extends CustomEvent<void> {
  constructor() {
    super(deviceToCloudSyncFailedEventName, { bubbles: true, composed: true });
  }
}

export class CloudToDeviceSyncFailedEvent extends CustomEvent<void> {
  constructor() {
    super(cloudToDeviceSyncFailedEventName, { bubbles: true, composed: true });
  }
}
