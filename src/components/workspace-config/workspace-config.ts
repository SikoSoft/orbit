import { html, css, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { SelectChangedEvent } from '@ss/ui/components/ss-select.events';
import { InputChangedEvent } from '@ss/ui/components/ss-input.events';
import { ThemeName } from '@/models/Page';
import { translate } from '@/lib/Localization';

import { MobxLitElement } from '@adobe/lit-mobx';
import { themed } from '@/lib/Theme';

import '@ss/ui/components/ss-input';
import '@ss/ui/components/ss-select';
import '@/components/color-selector/color-selector';

import {
  WorkspaceConfigProp,
  workspaceConfigProps,
  WorkspaceConfigProps,
} from './workspace-config.models';
import { ColorChangedEvent } from '@/components/color-selector/color-selector.events';
import { WorkspaceConfigChangedEvent } from './workspace-config.events';

@themed()
@customElement('workspace-config')
export class WorkspaceConfig extends MobxLitElement {
  static styles = css`
    :host {
      display: block;
    }

    .field {
      margin-bottom: 1rem;
    }

    .field label {
      display: block;
      font-weight: bold;
      margin-bottom: 0.25rem;
    }
  `;

  @property({ type: String })
  [WorkspaceConfigProp.NAME]: WorkspaceConfigProps[WorkspaceConfigProp.NAME] =
    workspaceConfigProps[WorkspaceConfigProp.NAME].default;

  @property({ type: String })
  [WorkspaceConfigProp.COLOR]: WorkspaceConfigProps[WorkspaceConfigProp.COLOR] =
    workspaceConfigProps[WorkspaceConfigProp.COLOR].default;

  @property({ type: String })
  [WorkspaceConfigProp.THEME]: WorkspaceConfigProps[WorkspaceConfigProp.THEME] =
    workspaceConfigProps[WorkspaceConfigProp.THEME].default;

  private dispatchChange(partial: Partial<{ name: string; color: string; theme: string }>): void {
    this.dispatchEvent(
      new WorkspaceConfigChangedEvent({
        name: this[WorkspaceConfigProp.NAME],
        color: this[WorkspaceConfigProp.COLOR],
        theme: this[WorkspaceConfigProp.THEME],
        ...partial,
      }),
    );
  }

  render(): TemplateResult {
    return html`
      <div class="field">
        <label>${translate('workspaceName')}</label>
        <ss-input
          .value=${this[WorkspaceConfigProp.NAME]}
          @input-changed=${(e: InputChangedEvent): void => {
            this.dispatchChange({ name: e.detail.value });
          }}
        ></ss-input>
      </div>

      <div class="field">
        <label>${translate('workspaceColor')}</label>
        <color-selector
          value=${this[WorkspaceConfigProp.COLOR]}
          @color-changed=${(e: ColorChangedEvent): void => {
            this.dispatchChange({ color: e.detail.value });
          }}
        ></color-selector>
      </div>

      <div class="field">
        <label>${translate('workspaceTheme')}</label>
        <ss-select
          selected=${this[WorkspaceConfigProp.THEME]}
          .options=${Object.values(ThemeName).map(v => ({
            value: v,
            label: translate(`themeOption.${v}`),
          }))}
          @select-changed=${(e: SelectChangedEvent<ThemeName>): void => {
            this.dispatchChange({ theme: e.detail.value });
          }}
        ></ss-select>
      </div>
    `;
  }
}
