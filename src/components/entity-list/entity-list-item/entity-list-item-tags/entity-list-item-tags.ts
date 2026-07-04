import { html, css, nothing, TemplateResult } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';
import { repeat } from 'lit/directives/repeat.js';

import { ListFilter, ListFilterTimeType, ListFilterType } from 'api-spec/models/List';
import { SettingName } from 'api-spec/models/Setting';
import { appState } from '@/state';
import { themed } from '@/lib/Theme';

import {
  EntityListItemTagsProp,
  EntityListItemTagsProps,
  entityListItemTagsProps,
} from './entity-list-item-tags.models';

@themed()
@customElement('entity-list-item-tags')
export class EntityListItemTags extends MobxLitElement {
  private state = appState;

  static styles = css`
    :host {
      --padding: 1rem;
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      padding: var(--padding);
      padding-top: 0;
      justify-content: center;
    }

    .tag-link {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 3px;
      background-color: color-mix(in srgb, currentColor 12%, transparent);
      color: inherit;
      text-decoration: none;
      font-size: 0.8rem;
      opacity: 0.8;

      &:hover {
        opacity: 1;
      }
    }
  `;

  @property({ type: Array })
  [EntityListItemTagsProp.TAGS]: EntityListItemTagsProps[EntityListItemTagsProp.TAGS] =
    entityListItemTagsProps[EntityListItemTagsProp.TAGS].default;

  private tagFilterUrl(tag: string): string {
    const filter: ListFilter = {
      includeAll: false,
      includeAllTagging: false,
      includeUntagged: false,
      tagging: {
        [ListFilterType.CONTAINS_ALL_OF]: [tag],
        [ListFilterType.CONTAINS_ONE_OF]: [],
      },
      time: { type: ListFilterTimeType.ALL_TIME },
    };
    return `/list?filter=${encodeURIComponent(JSON.stringify(filter))}`;
  }

  render(): TemplateResult | typeof nothing {
    if (
      !this.state.getSetting<boolean>(SettingName.SHOW_TAGS) ||
      !this.tags?.length
    ) {
      return nothing;
    }
    return html`
      <div class="tags">
        ${repeat(
          this.tags,
          tag => tag,
          tag =>
            html`<a class="tag-link" href=${this.tagFilterUrl(tag)}>${tag}</a>`,
        )}
      </div>
    `;
  }
}
