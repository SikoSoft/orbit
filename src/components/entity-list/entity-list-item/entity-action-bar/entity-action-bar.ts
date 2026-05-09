import { html, css, TemplateResult } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { themed } from '@/lib/Theme';
import { translate } from '@/lib/Localization';

import {
  EntityActionBarProp,
  EntityActionBarProps,
  entityActionBarProps,
} from './entity-action-bar.models';
import {
  EntityActionBarAddEvent,
  EntityActionBarEditEvent,
} from './entity-action-bar.events';

import '@ss/ui/components/ss-button';

@themed()
@customElement('entity-action-bar')
export class EntityActionBar extends MobxLitElement {
  static styles = css`
    :host {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
    }

    .action-bar {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.5rem;
    }
  `;

  @property({ type: Boolean })
  [EntityActionBarProp.SUGGESTION]: EntityActionBarProps[EntityActionBarProp.SUGGESTION] =
    entityActionBarProps[EntityActionBarProp.SUGGESTION].default;

  private handleAdd(): void {
    this.dispatchEvent(new EntityActionBarAddEvent());
  }

  private handleEdit(): void {
    this.dispatchEvent(new EntityActionBarEditEvent());
  }

  render(): TemplateResult {
    return html`
      <div class="action-bar">
        ${this.suggestion
          ? html`
              <ss-button
                text=${translate('add')}
                @click=${this.handleAdd}
              ></ss-button>
            `
          : null}
        <ss-button
          text=${translate('edit')}
          @click=${this.handleEdit}
        ></ss-button>
      </div>
    `;
  }
}
