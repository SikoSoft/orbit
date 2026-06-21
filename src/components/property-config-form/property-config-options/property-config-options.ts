import { LitElement, html, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import {
  PropertyConfigOptionsProp,
  propertyConfigOptionsProps,
  PropertyConfigOptionsProps,
} from './property-config-options.models';
import { OptionsChangedEvent } from './property-config-options.events';

import { TagsUpdatedEvent } from '@ss/ui/components/tag-manager.events';
import '@ss/ui/components/tag-manager';

@customElement('property-config-options')
export class PropertyConfigOptions extends LitElement {
  @property({ type: Array })
  [PropertyConfigOptionsProp.OPTIONS]: PropertyConfigOptionsProps[PropertyConfigOptionsProp.OPTIONS] =
    propertyConfigOptionsProps[PropertyConfigOptionsProp.OPTIONS].default;

  private handleTagsUpdated(e: TagsUpdatedEvent): void {
    this.dispatchEvent(new OptionsChangedEvent({ options: e.detail.tags }));
  }

  render(): TemplateResult {
    return html`
      <tag-manager @tags-updated=${this.handleTagsUpdated}>
        <div slot="tags">
          ${repeat(
            this.options,
            option => option,
            option => html`<data-item>${option}</data-item>`,
          )}
        </div>
      </tag-manager>
    `;
  }
}
