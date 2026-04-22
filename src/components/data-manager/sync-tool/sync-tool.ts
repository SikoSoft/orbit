import { TemplateResult, css, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { translate } from '@/lib/Localization';
import { SyncType } from './sync-tool.models';
import { MobxLitElement } from '@adobe/lit-mobx';
import { appState } from '@/state';
import { storage } from '@/lib/Storage';

import '@ss/ui/components/confirmation-modal';
import { StorageSource } from '@/models/Storage';
import {
  CloudToDeviceSyncFailedEvent,
  DeviceToCloudSyncFailedEvent,
} from './sync-tool.events';

@customElement('sync-tool')
export class SyncTool extends MobxLitElement {
  private state = appState;

  static styles = css`
    textarea {
      width: 100%;
      height: 200px;
      font-family: monospace;
      font-size: 0.9rem;
      box-sizing: border-box;
    }
  `;

  @state()
  isLoading: boolean = false;

  @state()
  confirmIsOpen: boolean = false;

  @state()
  get syncType(): SyncType {
    return this.state.storageSource === StorageSource.DEVICE
      ? SyncType.DEVICE_TO_CLOUD
      : SyncType.CLOUD_TO_DEVICE;
  }

  private async syncCloudToDevice(): Promise<void> {
    await storage.syncCloudToDevice();
  }

  private async syncDeviceToCloud(): Promise<void> {
    await storage.syncDeviceToCloud();
  }

  private async handleSyncData(): Promise<void> {
    this.isLoading = true;
    try {
      switch (this.syncType) {
        case SyncType.CLOUD_TO_DEVICE:
          await this.syncCloudToDevice();
          break;
        case SyncType.DEVICE_TO_CLOUD:
          await this.syncDeviceToCloud();
          break;
      }
    } catch {
      const event =
        this.syncType === SyncType.CLOUD_TO_DEVICE
          ? new CloudToDeviceSyncFailedEvent()
          : new DeviceToCloudSyncFailedEvent();
      this.dispatchEvent(event);
    } finally {
      this.isLoading = false;
    }
  }

  render(): TemplateResult {
    return html` <div class="import">
      <div class="buttons">
        <ss-button
          ?loading=${this.isLoading}
          ?disabled=${this.isLoading}
          @click=${(): void => {
            this.confirmIsOpen = true;
          }}
          >${translate('syncData')}</ss-button
        >
      </div>

      <pop-up
        ?open=${this.confirmIsOpen}
        @pop-up-closed=${(): void => {
          this.confirmIsOpen = false;
        }}
      >
        <div class="confirmation-content">
          ${this.state.user
            ? html`
                <div class="current-user-info">
                  ${translate('currentlyLoggedInAs', {
                    username: this.state.user.username,
                  })}
                </div>
              `
            : nothing}

          <p>${translate(`confirmSyncData.${this.syncType}`)}</p>

          <div class="confirmation-buttons">
            <ss-button
              @click=${(): void => {
                this.confirmIsOpen = false;
              }}
              >${translate('cancel')}</ss-button
            >
            <ss-button
              @click=${(): void => {
                this.confirmIsOpen = false;
                this.handleSyncData();
              }}
              >${translate('confirm')}</ss-button
            >
          </div>
        </div>
      </pop-up>
    </div>`;
  }
}
