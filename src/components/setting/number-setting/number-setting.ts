import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  NumberSettingProp,
  numberSettingProps,
  NumberSettingProps,
} from './number-setting.models';

import { InputChangedEvent } from '@ss/ui/components/ss-input.events';
import { SettingUpdatedEvent } from '@/events/setting-updated';
import { translate } from '@/lib/Localization';

import '@ss/ui/components/ss-input';
import '@ss/ui/components/ss-toggle';
import { themed } from '@/lib/Theme';

@themed()
@customElement('number-setting')
export class NumberSetting extends LitElement {
  @property()
  [NumberSettingProp.NAME]: NumberSettingProps[NumberSettingProp.NAME] =
    numberSettingProps[NumberSettingProp.NAME].default;

  @property({ type: Number })
  [NumberSettingProp.VALUE]: NumberSettingProps[NumberSettingProp.VALUE] =
    numberSettingProps[NumberSettingProp.VALUE].default;

  @property({ type: Number })
  [NumberSettingProp.MIN]: NumberSettingProps[NumberSettingProp.MIN] =
    numberSettingProps[NumberSettingProp.MIN].default;

  @property({ type: Number })
  [NumberSettingProp.MAX]: NumberSettingProps[NumberSettingProp.MAX] =
    numberSettingProps[NumberSettingProp.MAX].default;

  @property({ type: Number })
  [NumberSettingProp.STEP]: NumberSettingProps[NumberSettingProp.STEP] =
    numberSettingProps[NumberSettingProp.STEP].default;

  static styles = css`
    .number-setting {
      padding: 1rem;
    }
  `;

  private handleInputChanged(e: InputChangedEvent): void {
    this.dispatchEvent(
      new SettingUpdatedEvent<typeof this.value>({
        name: this.name,
        value: parseInt(e.detail.value),
      }),
    );
  }

  render(): TemplateResult {
    return html`
      <div class="number-setting">
        <label>${translate(this.name)}</label>

        <ss-input
          type="number"
          value=${this.value}
          min=${this.min}
          max=${this.max}
          step=${this.step}
          @input-changed=${this.handleInputChanged}
        ></ss-input>
      </div>
    `;
  }
}
