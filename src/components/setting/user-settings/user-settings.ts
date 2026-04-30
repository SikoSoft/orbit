import { customElement } from 'lit/decorators.js';

import {
  Setting,
  SettingConfig,
  SettingGroup,
  SettingName,
} from 'api-spec/models/Setting';
import { storage } from '@/lib/Storage';
import { SettingForm } from '@/components/setting/setting-form/setting-form';

@customElement('user-settings')
export class UserSettings extends SettingForm {
  protected override get visibleSettings(): SettingConfig[] {
    return super.visibleSettings.filter(
      s => s.group !== SettingGroup.ACCESS,
    );
  }

  protected override getSettingValue(name: SettingName): unknown {
    return this.state.userSettings[name];
  }

  protected override async doSave(setting: Setting): Promise<boolean> {
    return storage.saveSetting(setting);
  }
}
