import { css, html, nothing, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { appState } from '@/state';
import { translate } from '@/lib/Localization';
import { storage } from '@/lib/Storage';
import { addToast } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';
import { EntityListLoadEvent } from '@/components/entity-list/entity-list.events';
import { ListFilterUpdatedEvent } from '@/components/list-filter/list-filter.events';
import { ListSortUpdatedEvent } from '@/components/list-sort/list-sort.events';

import '@ss/ui/components/ss-collapsable';
import '@/components/list-filter/list-filter';
import { themed } from '@/lib/Theme';

const EVERYTHING_FILTER_PANEL_ID = 'everything-filter';
const SORT_PANEL_ID = 'sort';

@themed()
@customElement('entity-list-customizer')
export class EntityListCustomizer extends MobxLitElement {
  private state = appState;

  static styles = [
    css`
      .enity-list-customizer {
        position: sticky;
        margin-bottom: 1rem;
        z-index: 500;
        top: 2.5rem;

        .inner {
          display: flex;
          gap: 1rem;
          max-height: 90vh;
          overflow-y: auto;

          & > * {
            flex: 1;
          }
        }
      }
    `,
  ];

  private handleFilterUpdated = (e: ListFilterUpdatedEvent): void => {
    this.state.setListFilter(e.detail);
    storage.saveActiveFilter(e.detail);
    addToast(translate('filterUpdated'), NotificationType.INFO);
    this.dispatchEvent(new EntityListLoadEvent());
  };

  private handleSortUpdated = (_e: ListSortUpdatedEvent): void => {
    this.dispatchEvent(new EntityListLoadEvent());
  };

  render(): TemplateResult {
    if (this.state.listConfigId) {
      return html`${nothing}`;
    }

    return html`
      <div class="enity-list-customizer">
        <div class="inner">
          <ss-collapsable
            title=${translate('filter')}
            panelId=${EVERYTHING_FILTER_PANEL_ID}
            ?open=${this.state.collapsablePanelState[
              EVERYTHING_FILTER_PANEL_ID
            ] || false}
          >
            <list-filter
              showAll
              @list-filter-updated=${this.handleFilterUpdated}
            ></list-filter>
          </ss-collapsable>

          <ss-collapsable
            title=${translate('sort')}
            panelId=${SORT_PANEL_ID}
            ?open=${this.state.collapsablePanelState[SORT_PANEL_ID] || false}
          >
            <list-sort @list-sort-updated=${this.handleSortUpdated}></list-sort>
          </ss-collapsable>
        </div>
      </div>
    `;
  }
}
