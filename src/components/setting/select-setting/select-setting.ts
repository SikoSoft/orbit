import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  SelectSettingProp,
  selectSettingProps,
  SelectSettingProps,
} from './select-setting.models';

import { SelectChangedEvent } from '@ss/ui/components/ss-select.events';
import { SettingUpdatedEvent } from '@/events/setting-updated';
import { translate } from '@/lib/Localization';

import '@ss/ui/components/ss-select';
import { themed } from '@/lib/Theme';

@themed()
@customElement('select-setting')
export class SelectSetting extends LitElement {
  @property()
  [SelectSettingProp.NAME]: SelectSettingProps[SelectSettingProp.NAME] =
    selectSettingProps[SelectSettingProp.NAME].default;

  @property()
  [SelectSettingProp.VALUE]: SelectSettingProps[SelectSettingProp.VALUE] =
    selectSettingProps[SelectSettingProp.VALUE].default;

  @property({ type: Array })
  [SelectSettingProp.OPTIONS]: SelectSettingProps[SelectSettingProp.OPTIONS] =
    selectSettingProps[SelectSettingProp.OPTIONS].default;

  static styles = css`
    .select-setting {
      padding: 1rem;
    }
  `;

  private handleSelectChanged(e: SelectChangedEvent<string>): void {
    this.dispatchEvent(
      new SettingUpdatedEvent<typeof this.value>({
        name: this.name,
        value: e.detail.value,
      }),
    );
  }

  render(): TemplateResult {
    return html`
      <div class="select-setting">
        <label>${translate(this.name)}</label>

        <ss-select
          @select-changed=${this.handleSelectChanged}
          selected=${this.value}
          .options=${this.options.map(option => ({
            label: option,
            value: option,
          }))}
        ></ss-select>
      </div>
    `;
  }
}
