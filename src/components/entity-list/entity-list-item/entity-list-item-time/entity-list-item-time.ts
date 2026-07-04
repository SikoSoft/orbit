import { html, css, nothing, TemplateResult } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { LitElement } from 'lit';

import { Time } from '@/lib/Time';
import { translate } from '@/lib/Localization';
import { themed } from '@/lib/Theme';

import {
  EntityListItemTimeProp,
  EntityListItemTimeProps,
  entityListItemTimeProps,
} from './entity-list-item-time.models';

@themed()
@customElement('entity-list-item-time')
export class EntityListItemTime extends LitElement {
  static styles = css`
    :host {
      --padding: 1rem;
    }

    .time {
      color: #888;
      font-size: 0.9rem;
      display: flex;
      justify-content: center;
      padding: var(--padding);
      gap: 2rem;

      label {
        font-weight: lighter;
        opacity: 0.8;
        margin-right: 0.25rem;
      }
    }
  `;

  @property()
  [EntityListItemTimeProp.CREATED_AT]: EntityListItemTimeProps[EntityListItemTimeProp.CREATED_AT] =
    entityListItemTimeProps[EntityListItemTimeProp.CREATED_AT].default;

  @property()
  [EntityListItemTimeProp.UPDATED_AT]: EntityListItemTimeProps[EntityListItemTimeProp.UPDATED_AT] =
    entityListItemTimeProps[EntityListItemTimeProp.UPDATED_AT].default;

  private get readableCreatedAt(): string {
    return Time.formatDateTime(new Date(this.createdAt));
  }

  private get readableUpdatedAt(): string {
    return Time.formatDateTime(new Date(this.updatedAt));
  }

  render(): TemplateResult {
    return html`
      <div class="time">
        <span class="created-at">
          <label>${translate('createdAt')}</label>:
          ${this.readableCreatedAt}
        </span>
        ${this.createdAt !== this.updatedAt
          ? html`
              <span class="updated-at"
                ><label>${translate('updatedAt')}</label>:
                ${this.readableUpdatedAt}</span
              >
            `
          : nothing}
      </div>
    `;
  }
}
