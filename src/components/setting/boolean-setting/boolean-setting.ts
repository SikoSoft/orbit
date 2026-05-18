import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  BooleanSettingProp,
  booleanSettingProps,
  BooleanSettingProps,
} from './boolean-setting.models';

import { ToggleChangedEvent } from '@ss/ui/components/ss-toggle.events';
import { SettingUpdatedEvent } from '@/events/setting-updated';
import { translate } from '@/lib/Localization';

import '@ss/ui/components/ss-toggle';
import { themed } from '@/lib/Theme';

@themed()
@customElement('boolean-setting')
export class BooleanSetting extends LitElement {
  @property()
  [BooleanSettingProp.NAME]: BooleanSettingProps[BooleanSettingProp.NAME] =
    booleanSettingProps[BooleanSettingProp.NAME].default;

  @property({ type: Boolean })
  [BooleanSettingProp.VALUE]: BooleanSettingProps[BooleanSettingProp.VALUE] =
    booleanSettingProps[BooleanSettingProp.VALUE].default;

  static styles = css`
    .boolean-setting {
      padding: 1rem;
    }
  `;

  private handleToggleChanged(e: ToggleChangedEvent): void {
    this.dispatchEvent(
      new SettingUpdatedEvent<typeof this.value>({
        name: this.name,
        value: e.detail.on,
      }),
    );
  }

  render(): TemplateResult {
    return html`
      <div class="boolean-setting">
        <label>${translate(this.name)}</label>

        <ss-toggle
          ?on=${this.value}
          @toggle-changed=${this.handleToggleChanged}
        ></ss-toggle>
      </div>
    `;
  }
}
