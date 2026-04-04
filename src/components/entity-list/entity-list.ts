import { css, html, nothing, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { PaginationType, SettingName } from 'api-spec/models/Setting';
import {
  ListSortDirection,
  ListSortNativeProperty,
} from 'api-spec/models/List';
import { appState } from '@/state';
import { ViewElement } from '@/lib/ViewElement';
import { translate } from '@/lib/Localization';

import { PointerLongPressEvent } from '@/events/pointer-long-press';
import { PointerUpEvent } from '@/events/pointer-up';
import { PageChangedEvent } from '@/components/list-paginator/list-paginator.events';

import '@ss/ui/components/ss-button';
import '@ss/ui/components/ss-loader';
import '@ss/ui/components/ss-collapsable';
import '@/components/list-paginator/list-paginator';
import '@/components/entity-list/entity-list-item/entity-list-item';
import { EntityListItem } from './entity-list-item/entity-list-item';

import { EntityListItemMode } from './entity-list-item/entity-list-item.models';
import {
  EntityItemDeletedEvent,
  EntityItemUpdatedEvent,
} from '../entity-form/entity-form.events';
import { themed } from '@/lib/Theme';
import {
  entityListLoadEventName,
  entityListSyncEventName,
} from './entity-list.events';
import { storage } from '@/lib/Storage';
import { reaction } from 'mobx';
import {
  EntityListProp,
  EntityListProps,
  entityListProps,
  EntityListResult,
} from './entity-list.models';

@themed()
@customElement('entity-list')
export class EntityList extends ViewElement {
  public state = appState;

  static styles = css`
    ss-collapsable {
      display: block;
      margin-top: 1rem;
    }

    .list-items {
      overflow: hidden;
    }

    entity-list-item:not(:last-of-type) {
      display: block;
      border-bottom: 1px solid #ccc;
    }

    .no-items {
      padding: 1rem;
    }

    .more {
      margin-top: 1rem;
    }
  `;

  @property({ type: Boolean })
  [EntityListProp.PUBLIC_VIEW]: EntityListProps[EntityListProp.PUBLIC_VIEW] =
    entityListProps[EntityListProp.PUBLIC_VIEW].default;

  private scrollHandler: EventListener = () => this.handleScroll();
  @query('#lazy-loader') lazyLoader!: HTMLDivElement;

  @state() start: number = 0;
  @state() total: number = 0;
  @state() loading: boolean = false;

  @state()
  get perPage(): number {
    const perPage = this.state.listSetting[SettingName.PAGINATION_PAGE_SIZE];
    return perPage;
  }

  @state()
  get totalShown(): number {
    return this.start + this.perPage;
  }

  @state()
  get reachedEnd(): boolean {
    return this.totalShown >= this.total;
  }

  @state()
  get sortIsDefault(): boolean {
    return (
      this.state.listSort.direction === ListSortDirection.DESC &&
      this.state.listSort.property === ListSortNativeProperty.CREATED_AT
    );
  }

  get lazyLoaderIsVisible(): boolean {
    const rect = this.lazyLoader.getBoundingClientRect();
    const docHeight =
      window.innerHeight || document.documentElement.clientHeight;
    return rect.bottom <= docHeight;
  }

  @state()
  get paginationType(): PaginationType {
    return (
      this.state.listSetting[SettingName.PAGINATION_TYPE] ?? PaginationType.LAZY
    );
  }

  async connectedCallback(): Promise<void> {
    super.connectedCallback();

    window.addEventListener('scroll', this.scrollHandler);

    window.addEventListener(entityListLoadEventName, () => {
      this.load();
    });

    window.addEventListener(entityListSyncEventName, () => {
      this.sync();
    });

    let initialFire = true;
    reaction(
      () => this.state.listConfig,
      () => {
        this.state.setListEntities([]);
        if (!initialFire) {
          this.sync(true);
        }
        initialFire = false;
      },
      {
        fireImmediately: true,
      },
    );
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('scroll', this.scrollHandler);
  }

  protected async firstUpdated(
    changedProperties: PropertyValues,
  ): Promise<void> {
    super.firstUpdated(changedProperties);

    await this.load();

    while (this.lazyLoaderIsVisible && !this.reachedEnd) {
      await this.handleScroll();
    }
  }

  sync(reset = false): void {
    if (reset) {
      this.start = 0;
    }

    this.load();
  }

  private handleItemDeleted(e: EntityItemDeletedEvent): void {
    this.state.setListEntities(
      this.state.listEntities.filter(item => item.id !== e.detail.id),
    );
  }

  private handleItemUpdated(e: EntityItemUpdatedEvent): void {
    const { properties, tags } = e.detail;

    const updatedList = this.state.listEntities.map(item =>
      item.id === e.detail.id
        ? {
            ...item,
            properties,
            tags,
          }
        : item,
    );

    this.state.setListEntities(updatedList);
  }

  private async handleScroll(): Promise<void> {
    if (this.paginationType === PaginationType.LAZY) {
      if (this.lazyLoaderIsVisible && !this.loading && !this.reachedEnd) {
        await this.load(true);
      }
    }
  }

  async load(more = false): Promise<void> {
    this.loading = true;

    if (more) {
      this.start += this.perPage;
    }

    try {
      const entityResult = await this.getEntities();
      this.state.setListEntities(
        more
          ? [...this.state.listEntities, ...entityResult.entities]
          : [...entityResult.entities],
      );
      this.total = entityResult.total;
    } catch (error) {
      console.error('Failed to get list', error);
    } finally {
      this.ready = true;
      this.loading = false;
    }
  }

  async getEntities(): Promise<EntityListResult> {
    const result = await storage.getEntities(
      this.start,
      this.perPage,
      this.state.listFilter,
      this.state.listSort,
    );

    if (result.isOk) {
      return result.value;
    }

    throw result.error;
  }

  private handlePageChanged(e: PageChangedEvent): void {
    this.start = e.detail.start;
    this.load();
  }

  private handlePointerLongPress(e: PointerLongPressEvent): void {
    const listItem = e.target as EntityListItem;
    this.state.toggleActionSelection(listItem.entityId);
  }

  private handlePointerUp(e: PointerUpEvent): void {
    const listItem = e.target as EntityListItem;
    if (!this.state.selectMode) {
      listItem.setMode(EntityListItemMode.EDIT);
      return;
    }
    this.state.toggleActionSelection(listItem.entityId);
  }

  render(): TemplateResult {
    return html`
      ${this.paginationType === PaginationType.NAVIGATION
        ? html`
            <list-paginator
              @page-changed=${this.handlePageChanged}
              start=${this.start}
              total=${this.total}
              perPage=${this.perPage}
            ></list-paginator>
          `
        : nothing}

      <div class="box list-items">
        ${this.loading ? html` <ss-loader padded></ss-loader> ` : nothing}
        ${this.state.listEntities.length
          ? html`${repeat(
              this.state.listEntities,
              item => item.id,
              item => html`
                <entity-list-item
                  ?publicView=${this.publicView}
                  ?debug=${this.state.debugMode}
                  entityId=${item.id}
                  type=${item.type}
                  createdAt=${item.createdAt}
                  updatedAt=${item.updatedAt}
                  .tags=${item.tags}
                  ?selected=${this.state.selectedActions.includes(item.id)}
                  .properties=${item.properties}
                  @pointer-long-press=${this.handlePointerLongPress}
                  @pointer-up=${this.handlePointerUp}
                  @entity-item-deleted=${this.handleItemDeleted}
                  @entity-item-updated=${this.handleItemUpdated}
                ></entity-list-item>
              `,
            )}
            ${this.loading ? html` <ss-loader padded></ss-loader> ` : nothing} `
          : !this.loading
            ? html` <div class="no-items">${translate('noItemsFound')}</div>`
            : nothing}

        <div id="lazy-loader"></div>
      </div>
      ${this.paginationType === PaginationType.NAVIGATION
        ? html`
            <list-paginator
              @page-changed=${this.handlePageChanged}
              start=${this.start}
              total=${this.total}
              perPage=${this.perPage}
            ></list-paginator>
          `
        : nothing}
      ${this.paginationType === PaginationType.MORE_BUTTON && !this.reachedEnd
        ? html`
            <div class="more box">
              <ss-button
                text=${translate('loadMore')}
                @click=${(): Promise<void> => this.load(true)}
                ?loading=${this.loading}
                ?disabled=${this.loading}
              ></ss-button>
            </div>
          `
        : nothing}
    `;
  }
}
