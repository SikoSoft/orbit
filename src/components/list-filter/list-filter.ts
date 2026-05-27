import { html, css, nothing, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import {
  ListFilter as ListFilterSpec,
  ListFilterType,
  ListFilterTimeType,
  TimeContext,
  TextContext,
  FilterProperty,
} from 'api-spec/models/List';
import {
  ListFilterProp,
  listFilterProps,
  ListFilterProps,
} from './list-filter.models';

import { translate } from '@/lib/Localization';

import { appState } from '@/state';
import { SavedListFilter, storage } from '@/lib/Storage';
import { SettingName, TagSuggestions } from 'api-spec/models/Setting';

import { TimeFiltersUpdatedEvent } from '@/components/list-filter/time-filters/time-filters.events';
import { FilterPropertiesUpdatedEvent } from '@/components/list-filter/filter-properties/filter-properties.events';
import { ListFilterUpdatedEvent } from './list-filter.events';
import { TagsUpdatedEvent } from '@ss/ui/components/tag-manager.events';
import { TagSuggestionsRequestedEvent } from '@ss/ui/components/tag-input.events';
import { OptionSelectorChangedEvent } from '@/components/option-selector/option-selector.events';

import { SSInput } from '@ss/ui/components/ss-input';
import '@ss/ui/components/ss-select';
import '@ss/ui/components/tag-manager';
import '@/components/list-filter/time-filters/time-filters';
import '@/components/list-filter/text-filters/text-filters';
import '@/components/list-filter/filter-properties/filter-properties';
import '@/components/option-selector/option-selector';

import { SelectChangedEvent } from '@ss/ui/components/ss-select.events';
import { themed } from '@/lib/Theme';

@themed()
@customElement('list-filter')
export class ListFilter extends MobxLitElement {
  private minLengthForSuggestion = 1;
  public state = appState;

  static styles = css`
    .list-filter {
      padding: 1rem;
    }

    .list-filter.all .filters,
    .tagging.all .tag-rules {
      opacity: 0.3;
      pointer-events: none;
    }

    .save {
      position: relative;
    }

    .save ss-input {
      position: absolute;
      bottom: 0%;
      width: 100%;
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s;
    }

    .list-filter.save-mode .save ss-input {
      bottom: 100%;
      opacity: 1;
      pointer-events: initial;
    }
  `;

  @property({ type: Object })
  [ListFilterProp.LIST_FILTER]: ListFilterProps[ListFilterProp.LIST_FILTER] =
    listFilterProps[ListFilterProp.LIST_FILTER].default;

  @property({ type: Boolean })
  [ListFilterProp.ALL]: ListFilterProps[ListFilterProp.ALL] =
    listFilterProps[ListFilterProp.ALL].default;

  @property({ type: Boolean })
  [ListFilterProp.TYPES]: ListFilterProps[ListFilterProp.TYPES] =
    listFilterProps[ListFilterProp.TYPES].default;

  @property({ type: Boolean })
  [ListFilterProp.PROPERTIES]: ListFilterProps[ListFilterProp.PROPERTIES] =
    listFilterProps[ListFilterProp.PROPERTIES].default;

  @property({ type: Boolean })
  [ListFilterProp.PUBLISHED]: ListFilterProps[ListFilterProp.PUBLISHED] =
    listFilterProps[ListFilterProp.PUBLISHED].default;

  @property({ type: Boolean })
  [ListFilterProp.SUGGESTED]: ListFilterProps[ListFilterProp.SUGGESTED] =
    listFilterProps[ListFilterProp.SUGGESTED].default;

  @property({ type: Boolean })
  [ListFilterProp.IDENTIFIED]: ListFilterProps[ListFilterProp.IDENTIFIED] =
    listFilterProps[ListFilterProp.IDENTIFIED].default;

  @property({ type: Boolean })
  [ListFilterProp.TAGGING]: ListFilterProps[ListFilterProp.TAGGING] =
    listFilterProps[ListFilterProp.TAGGING].default;

  @property({ type: Boolean })
  [ListFilterProp.TIME]: ListFilterProps[ListFilterProp.TIME] =
    listFilterProps[ListFilterProp.TIME].default;

  @state() [ListFilterType.CONTAINS_ONE_OF]: string[] = [];
  @state() [ListFilterType.CONTAINS_ALL_OF]: string[] = [];
  @state() userIds: string[] = [];
  @state() includeTypes: number[] = [];
  @state() includeUntagged: boolean = false;
  @state() includeAll: boolean = true;
  @state() includeAllTagging: boolean = false;
  @state() timeContext: TimeContext = { type: ListFilterTimeType.ALL_TIME };
  @state() text: TextContext[] = [];
  @state() filterProperties: FilterProperty[] = [];
  @state() publishedFilter: boolean | null = null;
  @state() suggestedFilter: boolean | null = null;
  @state() identifiedFilter: boolean | null = null;

  @state() savedFilters: SavedListFilter[] = [];
  @state() saveMode: boolean = false;
  @state() filterName: string = '';
  @state() selectedSavedFilter: string = '';
  @state() lastInput = { value: '', hadResults: true };
  @state() tagSuggestions: string[] = [];

  @query('#filter-name') filterNameInput!: SSInput;
  @query('#saved-filters') savedFiltersInput!: HTMLSelectElement;

  @state() get classes(): Record<string, boolean> {
    return {
      box: true,
      'list-filter': true,
      all: this.includeAll,
      'save-mode': this.saveMode,
      'valid-filter-name': this.filterNameIsValid,
    };
  }

  @state() get taggingClasses(): Record<string, boolean> {
    return {
      tagging: true,
      all: this.includeAllTagging,
    };
  }

  @state()
  get filterNameIsValid(): boolean {
    return this.filterName.length > 0;
  }

  @state()
  get saveButtonIsEnabled(): boolean {
    return !this.saveMode || this.filterNameIsValid;
  }

  get tagSuggestionsEnabled(): boolean {
    return (
      this.state.listConfig.setting[SettingName.TAG_SUGGESTIONS] !==
      TagSuggestions.DISABLED
    );
  }

  get filter(): ListFilterSpec {
    return {
      userIds: this.userIds,
      includeAll: this.includeAll,
      includeTypes: this.includeTypes,
      includeUntagged: this.includeUntagged,
      includeAllTagging: this.includeAllTagging,
      tagging: {
        containsOneOf: this.containsOneOf,
        containsAllOf: this.containsAllOf,
      },
      time: this.timeContext,
      properties: this.filterProperties,
      ...(this.publishedFilter !== null && { published: this.publishedFilter }),
      ...(this.suggestedFilter !== null && { suggested: this.suggestedFilter }),
      ...(this.identifiedFilter !== null && {
        identified: this.identifiedFilter,
      }),
    };
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.sync();
    this.savedFilters = storage.getSavedFilters();
  }

  updated(changedProperties: PropertyValues): void {
    if (changedProperties.has(ListFilterProp.LIST_FILTER)) {
      this.sync();
    }
  }

  sync(_reset: boolean = false): void {
    if (!this[ListFilterProp.LIST_FILTER]) {
      return;
    }
    const listFilter = this[ListFilterProp.LIST_FILTER] as ListFilterSpec;
    Object.values(ListFilterType).forEach(type => {
      this[type] = listFilter.tagging?.[type] ?? [];
    });
    this.includeTypes = listFilter.includeTypes ?? [];
    this.includeUntagged = listFilter.includeUntagged ?? true;
    this.includeAll = listFilter.includeAll ?? true;
    this.includeAllTagging = listFilter.includeAllTagging ?? true;
    if (listFilter.time) {
      this.timeContext = listFilter.time;
    }
    if (listFilter.properties) {
      this.filterProperties = listFilter.properties;
    }
    this.publishedFilter =
      listFilter.published !== undefined ? listFilter.published : null;
    this.suggestedFilter =
      listFilter.suggested !== undefined ? listFilter.suggested : null;
    this.identifiedFilter =
      listFilter.identified !== undefined ? listFilter.identified : null;
  }

  private handleIncludeUntaggedChanged(): void {
    this.includeUntagged = !this.includeUntagged;
  }

  private handleIncludeAllChanged(): void {
    this.includeAll = !this.includeAll;
  }

  private handleIncludeAllTaggingChanged(): void {
    this.includeAllTagging = !this.includeAllTagging;
  }

  private handleUpdateClick(_e: CustomEvent): void {
    this.dispatchEvent(new ListFilterUpdatedEvent(this.filter));
  }

  private handleTimeChanged(e: TimeFiltersUpdatedEvent): void {
    this.timeContext = e.detail;
  }

  private handlePropertiesChanged(e: FilterPropertiesUpdatedEvent): void {
    this.filterProperties = e.detail.filters;
  }

  private updateTags(type: ListFilterType, tags: string[]): void {
    this[type] = tags;
  }

  private async handleTagSuggestionsRequested(
    e: TagSuggestionsRequestedEvent,
  ): Promise<void> {
    const value = e.detail.value;
    if (
      (!this.lastInput.hadResults && value.startsWith(this.lastInput.value)) ||
      !this.tagSuggestionsEnabled
    ) {
      this.tagSuggestions = [];
      return;
    }

    this.lastInput.hadResults = false;
    this.lastInput.value = value;

    let tags: string[] = [];

    if (value.length >= this.minLengthForSuggestion) {
      const result = await storage.getTags(value);
      if (result) {
        tags = result;
      }
    }

    if (tags.length || value === '') {
      this.lastInput.hadResults = true;
    }

    this.tagSuggestions = tags;
  }

  private handleTypesChanged(e: SelectChangedEvent<string[]>): void {
    this.includeTypes = e.detail.value.map(v => Number(v));
  }

  private handlePublishedChanged(e: OptionSelectorChangedEvent): void {
    const { selected } = e.detail;
    if (selected.includes('true') && selected.includes('false')) {
      this.publishedFilter = null;
    } else if (selected.includes('true')) {
      this.publishedFilter = true;
    } else if (selected.includes('false')) {
      this.publishedFilter = false;
    } else {
      this.publishedFilter = null;
    }
  }

  private handleSuggestedChanged(e: OptionSelectorChangedEvent): void {
    const { selected } = e.detail;
    if (selected.includes('true') && selected.includes('false')) {
      this.suggestedFilter = null;
    } else if (selected.includes('true')) {
      this.suggestedFilter = true;
    } else if (selected.includes('false')) {
      this.suggestedFilter = false;
    } else {
      this.suggestedFilter = null;
    }
  }

  private handleIdentifiedChanged(e: OptionSelectorChangedEvent): void {
    const { selected } = e.detail;
    if (selected.includes('true') && selected.includes('false')) {
      this.identifiedFilter = null;
    } else if (selected.includes('true')) {
      this.identifiedFilter = true;
    } else if (selected.includes('false')) {
      this.identifiedFilter = false;
    } else {
      this.identifiedFilter = null;
    }
  }

  private publishedToSelected(): string[] {
    if (this.publishedFilter === null) {
      return ['true', 'false'];
    }
    return [String(this.publishedFilter)];
  }

  private suggestedToSelected(): string[] {
    if (this.suggestedFilter === null) {
      return ['true', 'false'];
    }
    return [String(this.suggestedFilter)];
  }

  private identifiedToSelected(): string[] {
    if (this.identifiedFilter === null) {
      return ['true', 'false'];
    }
    return [String(this.identifiedFilter)];
  }

  private isVisible(section: ListFilterProp): boolean {
    return this[ListFilterProp.ALL] || (this[section as keyof this] as boolean);
  }

  render(): TemplateResult {
    return html`
      <div class=${classMap(this.classes)}>
        <div class="all">
          <input
            id="include-all"
            type="checkbox"
            ?checked=${this.includeAll}
            @change=${this.handleIncludeAllChanged}
          />

          <label for="include-all">${translate('includeAllItems')}</label>
        </div>

        <div class="filters">
          ${this.isVisible(ListFilterProp.TYPES)
            ? html`
                <fieldset>
                  <legend>${translate('includedTypes')}</legend>
                  <div class="types">
                    <ss-select
                      multiple
                      @select-changed=${this.handleTypesChanged}
                      .selected=${this.includeTypes.map(String)}
                      .options=${this.state.entityConfigs.map(config => ({
                        label: config.name,
                        value: config.id,
                      }))}
                    ></ss-select>
                  </div>
                </fieldset>
              `
            : nothing}
          ${this.isVisible(ListFilterProp.PROPERTIES)
            ? html`
                <filter-properties
                  .includeTypes=${this.includeTypes}
                  .filters=${this.filterProperties}
                  @filter-properties-updated=${(
                    e: FilterPropertiesUpdatedEvent,
                  ): void => this.handlePropertiesChanged(e)}
                ></filter-properties>
              `
            : nothing}
          ${this.isVisible(ListFilterProp.PUBLISHED)
            ? html`
                <fieldset>
                  <legend>${translate('published')}</legend>
                  <option-selector
                    multiple
                    required
                    .options=${[
                      { name: translate('published'), value: 'true' },
                      { name: translate('unpublished'), value: 'false' },
                    ]}
                    .selected=${this.publishedToSelected()}
                    @option-selector-changed=${(
                      e: OptionSelectorChangedEvent,
                    ): void => this.handlePublishedChanged(e)}
                  ></option-selector>
                </fieldset>
              `
            : nothing}
          ${this.isVisible(ListFilterProp.SUGGESTED)
            ? html`
                <fieldset>
                  <legend>${translate('suggested')}</legend>
                  <option-selector
                    multiple
                    required
                    .options=${[
                      { name: translate('suggested'), value: 'true' },
                      { name: translate('nonSuggested'), value: 'false' },
                    ]}
                    .selected=${this.suggestedToSelected()}
                    @option-selector-changed=${(
                      e: OptionSelectorChangedEvent,
                    ): void => this.handleSuggestedChanged(e)}
                  ></option-selector>
                </fieldset>
              `
            : nothing}
          ${this.isVisible(ListFilterProp.IDENTIFIED)
            ? html`
                <fieldset>
                  <legend>${translate('identified')}</legend>
                  <option-selector
                    multiple
                    required
                    .options=${[
                      { name: translate('identified'), value: 'true' },
                      { name: translate('nonIdentified'), value: 'false' },
                    ]}
                    .selected=${this.identifiedToSelected()}
                    @option-selector-changed=${(
                      e: OptionSelectorChangedEvent,
                    ): void => this.handleIdentifiedChanged(e)}
                  ></option-selector>
                </fieldset>
              `
            : nothing}
          ${this.isVisible(ListFilterProp.TAGGING)
            ? html`
                <fieldset class=${classMap(this.taggingClasses)}>
                  <legend>${translate('tagging')}</legend>

                  <div class="all">
                    <input
                      id="include-all-tagging"
                      type="checkbox"
                      ?checked=${this.includeAllTagging}
                      @change=${this.handleIncludeAllTaggingChanged}
                    />

                    <label for="include-all-tagging"
                      >${translate('includeAll')}</label
                    >
                  </div>

                  <div class="tag-rules">
                    ${repeat(
                      Object.values(ListFilterType),
                      type => type,
                      type => html`
                        <fieldset>
                          <legend>${translate(`filterType.${type}`)}</legend>

                          <tag-manager
                            ?enableSuggestions=${this.tagSuggestionsEnabled}
                            @tags-updated=${(e: TagsUpdatedEvent): void => {
                              this.updateTags(type, e.detail.tags);
                            }}
                            @tag-suggestions-requested=${this
                              .handleTagSuggestionsRequested}
                          >
                            <div slot="tags">
                              ${repeat(
                                this[type],
                                tag => tag,
                                tag => html`<data-item>${tag}</data-item>`,
                              )}
                            </div>

                            <div slot="suggestions">
                              ${repeat(
                                this.tagSuggestions,
                                suggestion => suggestion,
                                suggestion =>
                                  html`<data-item>${suggestion}</data-item>`,
                              )}
                            </div>
                          </tag-manager>
                        </fieldset>
                      `,
                    )}
                    <div>
                      <input
                        id="include-untagged"
                        type="checkbox"
                        ?checked=${this.includeUntagged}
                        @change=${this.handleIncludeUntaggedChanged}
                      />

                      <label for="include-untagged"
                        >${translate('includeItemsWithoutTags')}</label
                      >
                    </div>
                  </div>
                </fieldset>
              `
            : nothing}
          ${this.isVisible(ListFilterProp.TIME)
            ? html`
                <time-filters
                  type=${this.timeContext.type}
                  date=${this.timeContext.type === ListFilterTimeType.EXACT_DATE
                    ? this.timeContext.date
                    : ''}
                  start=${this.timeContext.type === ListFilterTimeType.RANGE
                    ? this.timeContext.start
                    : ''}
                  end=${this.timeContext.type === ListFilterTimeType.RANGE
                    ? this.timeContext.end
                    : ''}
                  @time-filters-updated=${(e: TimeFiltersUpdatedEvent): void =>
                    this.handleTimeChanged(e)}
                ></time-filters>
              `
            : nothing}
        </div>

        <ss-button
          @click=${this.handleUpdateClick}
          text=${translate('useFilter')}
        ></ss-button>
      </div>
    `;
  }
}
