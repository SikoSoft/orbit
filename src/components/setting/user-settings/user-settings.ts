import { html, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import {
  Setting,
  SettingContextType,
  SettingName,
  Settings,
} from 'api-spec/models/Setting';
import { storage } from '@/lib/Storage';
import { appState } from '@/state';
import { SettingForm } from '@/components/setting/setting-form/setting-form';
import { SettingUpdatedEvent } from '@/events/setting-updated';
import { addToast } from '@/lib/Util';
import { translate } from '@/lib/Localization';
import { NotificationType } from '@ss/ui/components/notification-provider.models';

import '@/components/mfa-setup-form/mfa-setup-form';
import {
  MfaSetupConfirmedEvent,
  MfaSetupCancelledEvent,
} from '@/components/mfa-setup-form/mfa-setup-form.events';

@customElement('user-settings')
export class UserSettings extends SettingForm {
  context = SettingContextType.USER;

  @state() private showMfaSetup: boolean = false;

  protected override getSettingValue(name: SettingName): unknown {
    return this.state.userSettings[name];
  }

  protected override async doSave(setting: Setting): Promise<boolean> {
    return storage.saveSetting(setting);
  }

  private async handleMfaSetupConfirmed(_e: MfaSetupConfirmedEvent): Promise<void> {
    const setting: Setting = { name: SettingName.ENABLE_2FA, value: true };
    const isOk = await this.doSave(setting);

    if (isOk) {
      appState.setUserSettings({
        ...(appState.userSettings as Settings),
        [SettingName.ENABLE_2FA]: true,
      });
      addToast(translate('settingUpdated'), NotificationType.SUCCESS);
    } else {
      addToast(translate('failedToUpdateSetting'), NotificationType.ERROR);
    }

    this.showMfaSetup = false;
  }

  private handleMfaSetupCancelled(_e: MfaSetupCancelledEvent): void {
    this.showMfaSetup = false;
  }

  protected override async handleSettingUpdated<SettingType>(
    event: SettingUpdatedEvent<SettingType>,
  ): Promise<void> {
    if (event.detail.name === SettingName.ENABLE_2FA && event.detail.value === true) {
      this.showMfaSetup = true;
      return;
    }

    return super.handleSettingUpdated(event);
  }

  override render(): TemplateResult {
    if (this.showMfaSetup) {
      return html`
        <mfa-setup-form
          @mfa-setup-confirmed=${this.handleMfaSetupConfirmed}
          @mfa-setup-cancelled=${this.handleMfaSetupCancelled}
        ></mfa-setup-form>
      `;
    }

    return super.render();
  }
}
