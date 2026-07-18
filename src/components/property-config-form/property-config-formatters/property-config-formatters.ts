import { html, LitElement, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { listFormatters } from 'api-spec/lib/Formatter';

import { translate } from '@/lib/Localization';
import { OptionListBuilderItem } from '@/components/option-list-builder/option-list-builder.models';
import { OptionListUpdatedEvent } from '@/components/option-list-builder/option-list-builder.events';
import {
  PropertyConfigFormattersProp,
  propertyConfigFormattersProps,
  PropertyConfigFormattersProps,
} from './property-config-formatters.models';
import { FormattersChangedEvent } from './property-config-formatters.events';

import '@/components/option-list-builder/option-list-builder';

@customElement('property-config-formatters')
export class PropertyConfigFormatters extends LitElement {
  @property({ type: Array })
  [PropertyConfigFormattersProp.FORMATTERS]: PropertyConfigFormattersProps[PropertyConfigFormattersProp.FORMATTERS] =
    propertyConfigFormattersProps[PropertyConfigFormattersProp.FORMATTERS]
      .default;

  private get availableFormatters(): OptionListBuilderItem[] {
    return listFormatters().map(({ id, label }) => ({ id, label }));
  }

  private handleOptionListUpdated(e: OptionListUpdatedEvent): void {
    this.dispatchEvent(
      new FormattersChangedEvent({ formatters: e.detail.selected }),
    );
  }

  render(): TemplateResult {
    return html`
      <option-list-builder
        .available=${this.availableFormatters}
        .selected=${this[PropertyConfigFormattersProp.FORMATTERS]}
        emptyMessage=${translate('propertyConfig.formatters.empty')}
        @option-list-updated=${this.handleOptionListUpdated}
      >
        <span slot="available-heading"
          >${translate('propertyConfig.formatters.available')}</span
        >
        <span slot="selected-heading"
          >${translate('propertyConfig.formatters.selected')}</span
        >
      </option-list-builder>
    `;
  }
}
