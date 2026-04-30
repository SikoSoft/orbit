import { customElement } from 'lit/decorators.js';

import { Setting } from 'api-spec/models/Setting';
import { SettingForm } from '@/components/setting/setting-form/setting-form';

@customElement('list-settings')
export class ListSettings extends SettingForm {
  protected override onSaved(setting: Setting): void {
    this.state.setSetting(setting);
  }
}
