import { customElement } from 'lit/decorators.js';

import { Setting, SettingContextType } from 'api-spec/models/Setting';
import { SettingForm } from '@/components/setting/setting-form/setting-form';

@customElement('list-settings')
export class ListSettings extends SettingForm {
  context = SettingContextType.LIST;

  protected override onSaved(setting: Setting): void {
    this.state.setSetting(setting);
  }
}
