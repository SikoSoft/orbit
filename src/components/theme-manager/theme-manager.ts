import { css, html, LitElement, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import {
  ThemeManagerProp,
  themeManagerProps,
  ThemeManagerProps,
} from './theme-manager.models';
import { translate } from '@/lib/Localization';
import { ThemeName } from '@/models/Page';

import '@/components/option-list-builder/option-list-builder';
import { OptionListBuilderItem } from '@/components/option-list-builder/option-list-builder.models';
import { OptionListUpdatedEvent } from '@/components/option-list-builder/option-list-builder.events';
import { ThemesUpdatedEvent, ThemesSavedEvent } from './theme-manager.events';
import { themed } from '@/lib/Theme';

@themed()
@customElement('theme-manager')
export class ThemeManager extends LitElement {
  static styles = css`
    .buttons {
      margin-top: 1rem;
    }
  `;

  @property({ type: Array })
  [ThemeManagerProp.ACTIVE]: ThemeManagerProps[ThemeManagerProp.ACTIVE] =
    themeManagerProps[ThemeManagerProp.ACTIVE].default;

  @state()
  initialActive: string[] = [];

  @state()
  get available(): OptionListBuilderItem[] {
    return Object.values(ThemeName).map(theme => ({
      id: theme,
      label: theme,
    }));
  }

  @state()
  get enableSave(): boolean {
    return (
      JSON.stringify(this.initialActive) !==
      JSON.stringify(this[ThemeManagerProp.ACTIVE])
    );
  }

  protected firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);

    this.initialActive = [...this[ThemeManagerProp.ACTIVE]];
  }

  saveThemes(): void {
    this.dispatchEvent(
      new ThemesSavedEvent({ themes: this[ThemeManagerProp.ACTIVE] }),
    );
  }

  private handleOptionListUpdated(e: OptionListUpdatedEvent): void {
    this.dispatchEvent(
      new ThemesUpdatedEvent({
        themes: e.detail.selected,
      }),
    );
  }

  render(): TemplateResult {
    return html`
      <div>
        <option-list-builder
          .available=${this.available}
          .selected=${this[ThemeManagerProp.ACTIVE]}
          emptyMessage=${translate('noThemesActive')}
          @option-list-updated=${this.handleOptionListUpdated}
        >
          <h3 slot="available-heading">${translate('availableThemes')}</h3>
          <h3 slot="selected-heading">${translate('activeThemes')}</h3>
        </option-list-builder>

        <div class="buttons">
          <ss-button
            ?disabled=${!this.enableSave}
            positive
            @click=${this.saveThemes}
            >${translate('save')}</ss-button
          >
        </div>
      </div>
    `;
  }
}
