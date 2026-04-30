import { customElement } from 'lit/decorators.js';

import {
  Setting,
  SettingConfig,
  SettingGroup,
  SettingName,
  defaultSettings,
} from 'api-spec/models/Setting';
import { storage } from '@/lib/Storage';
import { SettingForm } from '@/components/setting/setting-form/setting-form';

@customElement('system-settings')
export class SystemSettings extends SettingForm {
  protected override get visibleSettings(): SettingConfig[] {
    return super.visibleSettings.filter(
      s => s.group !== SettingGroup.ACCESS,
    );
  }

  protected override getSettingValue(name: SettingName): unknown {
    return defaultSettings[name];
  }

  protected override async doSave(setting: Setting): Promise<boolean> {
    return storage.saveSetting(setting, undefined, true);
  }
}
