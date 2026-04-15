import { html, css, nothing, TemplateResult } from 'lit';
import { property, customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { v4 as uuidv4 } from 'uuid';

import { ListFilterType } from 'api-spec/models/List';
import { SettingName, TagSuggestions } from 'api-spec/models/Setting';
import {
  DataType,
  EntityConfig,
  EntityProperty,
  PropertyDataValue,
  EntityPropertyConfig,
  ImageDataValue,
} from 'api-spec/models/Entity';
import { Role } from 'api-spec/models/Identity';
import { appState } from '@/state';
import { ViewElement } from '@/lib/ViewElement';
import {
  EntityFormProp,
  entityFormProps,
  EntityFormProps,
  PropertyInstance,
  PropertyReference,
  RequestBody,
  SuggestionInputType,
  SuggestionLastInput,
  TabEntry,
  ValidateionResult,
} from './entity-form.models';
import { addToast, sha256 } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';

import '@ss/ui/components/pop-up';
import '@ss/ui/components/ss-button';
import '@ss/ui/components/ss-input';
import '@ss/ui/components/ss-select';
import '@ss/ui/components/tag-manager';
import '@ss/ui/components/confirmation-modal';
import '@ss/ui/components/tab-container';
import '@ss/ui/components/tab-pane';
import '@/components/entity-form/property-field/property-field';
import '@/components/svg-icon/svg-icon';
import '@/components/access-policy/access-policy';

import {
  EntityItemCanceledEvent,
  EntityItemDeletedEvent,
  EntityItemUpdatedEvent,
} from './entity-form.events';
import { TagsUpdatedEvent } from '@ss/ui/components/tag-manager.events';
import { TagSuggestionsRequestedEvent } from '@ss/ui/components/tag-input.events';
import { SelectChangedEvent } from '@ss/ui/components/ss-select.events';

import {
  PropertyChangedEvent,
  PropertyClonedEvent,
  PropertyDeletedEvent,
  PropertySubmittedEvent,
} from './property-field/property-field.events';
import { translate } from '@/lib/Localization';
import { navigate } from '@/lib/Router';

import '@ss/ui/components/sortable-list';
import { SortUpdatedEvent } from '@ss/ui/components/sortable-list.events';
import { reaction } from 'mobx';
import { themed } from '@/lib/Theme';
import { PropertyField } from '@/components/entity-form/property-field/property-field';
import { storage } from '@/lib/Storage';

@themed()
@customElement('entity-form')
export class EntityForm extends ViewElement {
  private state = appState;
  private minLengthForSuggestion = 1;
  private suggestionTimeout: ReturnType<typeof setTimeout> | null = null;
  private abortController: AbortController | null = null;
  private sortedIds: string[] = [];

  static styles = css`
    :host {
      display: block;
      text-align: left;
    }

    form {
      padding: 1rem;
    }

    tag-manager {
      display: block;
      margin-top: 1rem;
    }

    tag-manager:part(legend) {
      font-weight: bold;
    }

    .buttons {
      margin-top: 1rem;
    }

    property-field {
      margin-bottom: 1rem;
    }

    .save-button::part(button) {
      font-weight: bold;
    }

    .property-option {
      cursor: pointer;
      padding: 0.5rem;

      &:hover {
        background-color: var(--background-hover-color);
      }
    }

    .no-entity-configs {
      text-align: center;
      font-weight: bold;
      padding: 1rem;
    }

    .wizard-banner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      margin-top: 1rem;
      padding: 1.5rem 1rem;
      border: 2px solid #000;
      border-radius: 6px;
      cursor: pointer;
      text-align: center;
      background: #fff;
      color: #000;
      transition:
        background 0.15s,
        color 0.15s;

      &:hover {
        background: #000;
        color: #fff;
      }

      &:hover svg {
        fill: #fff;
        stroke: #fff;
      }

      .wizard-banner-text {
        font-weight: bold;
        font-size: 1rem;
      }
    }
  `;

  @property({ type: Number, reflect: true })
  [EntityFormProp.ENTITY_ID]: EntityFormProps[EntityFormProp.ENTITY_ID] =
    entityFormProps[EntityFormProp.ENTITY_ID].default;

  @property({ type: Number })
  [EntityFormProp.TYPE]: EntityFormProps[EntityFormProp.TYPE] =
    entityFormProps[EntityFormProp.TYPE].default;

  @property({ type: Array })
  [EntityFormProp.TAGS]: EntityFormProps[EntityFormProp.TAGS] =
    entityFormProps[EntityFormProp.TAGS].default;

  @property()
  [EntityFormProp.TAG_VALUE]: EntityFormProps[EntityFormProp.TAG_VALUE] =
    entityFormProps[EntityFormProp.TAG_VALUE].default;

  @property({ type: Array })
  [EntityFormProp.PROPERTIES]: EntityFormProps[EntityFormProp.PROPERTIES] =
    entityFormProps[EntityFormProp.PROPERTIES].default;

  @state() initialTags: string = '';
  @state() confirmModalShown: boolean = false;
  @state() advancedMode: boolean = false;
  @state() loading: boolean = false;
  @state() lastInput: SuggestionLastInput = {
    [SuggestionInputType.ACTION]: { value: '', hadResults: true },
    [SuggestionInputType.TAG]: { value: '', hadResults: true },
  };
  @state() tagSuggestions: string[] = [];

  @state() propertyInstances: PropertyInstance[] = [];

  @state() propertiesSetup = false;

  @state() initialHash = '';
  @state() instancesHash = '';

  @state() propertyReferences: PropertyReference[] = [];
  @state() propertyPopUpIsOpen = false;

  @state()
  get classes(): Record<string, boolean> {
    return { box: true, 'advanced-mode': this.state.advancedMode };
  }

  @state()
  get tagsAndSuggestions(): string[] {
    return Array.from(new Set([...this.tags, ...this.state.tagSuggestions]));
  }

  @state()
  get tagSuggestionsEnabled(): boolean {
    return (
      this.state.listConfig.setting[SettingName.TAG_SUGGESTIONS] !==
      TagSuggestions.DISABLED
    );
  }

  @state()
  get entityConfig(): EntityConfig | undefined {
    return this.availableEntityConfigs.find(entity => entity.id === this.type);
  }

  @state()
  get canAddProperty(): boolean {
    if (!this.entityConfig) {
      return false;
    }

    return this.entityConfig.properties.some(propertyConfig => {
      return !this.propertyAtMax(propertyConfig.id);
    });
  }

  @state()
  get hasChanged(): boolean {
    return (
      this.initialHash !== this.instancesHash ||
      JSON.stringify(this.tagsAndSuggestions) !== this.initialTags
    );
  }

  @state()
  get availableEntityConfigs(): EntityConfig[] {
    return this.state.entityConfigs.filter(
      config =>
        this.state.listConfig.filter.includeTypes.length === 0 ||
        this.state.listConfig.filter.includeTypes.includes(config.id),
    );
  }

  @state()
  get allowedPropertiesToAdd(): EntityPropertyConfig[] {
    if (!this.entityConfig) {
      return [];
    }

    return this.entityConfig.properties.filter(
      propertyConfig => !this.propertyAtMax(propertyConfig.id),
    );
  }

  connectedCallback(): void {
    super.connectedCallback();

    this.initialTags = JSON.stringify(this.tags);

    reaction(
      () => appState.listConfig,
      () => {
        if (this.entityId) {
          return;
        }

        this.tags =
          this.state.listConfig.filter.tagging[ListFilterType.CONTAINS_ALL_OF];

        if (this.availableEntityConfigs.length === 1) {
          this.type = this.availableEntityConfigs[0].id;
        } else {
          this.type = 0;
        }
        this.propertiesSetup = false;
        this.propertyInstances = [];
        this.setupProperties();
      },
      {
        fireImmediately: true,
      },
    );
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();

    if (this.suggestionTimeout) {
      clearTimeout(this.suggestionTimeout);
      this.suggestionTimeout = null;
    }

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);

    if (!this.propertiesSetup) {
      this.setupProperties();
    }

    if (changedProperties.has(EntityFormProp.PROPERTIES) && this.entityConfig) {
      this.propertyReferences = [];
      for (const property of this[EntityFormProp.PROPERTIES]) {
        const dataType = this.entityConfig.properties.find(
          prop => prop.id === property.propertyConfigId,
        )?.dataType;

        if (!dataType) {
          continue;
        }

        this.propertyReferences.push({
          dataType,
          propertyValueId: property.id,
        });
      }
    }
  }

  get apiUrl(): string {
    return this.entityId ? `entity/${this.entityId}` : `entity`;
  }

  async getInstancesHash(): Promise<string> {
    return await sha256(JSON.stringify(this.mapInstancesToProperties()));
  }

  async setupProperties(): Promise<void> {
    if (!this.entityConfig) {
      return;
    }

    if (this.entityConfig && !this.propertiesSetup) {
      const existingProperties: PropertyInstance[] = this.properties.map(
        property => ({
          propertyConfigId: property.propertyConfigId,
          instanceId: property.id,
          uiId: uuidv4(),
          value: property.value,
          valueIsSet: true,
        }),
      );

      const availableProperties: PropertyInstance[] =
        this.entityConfig.properties
          .filter(
            propertyConfig =>
              !existingProperties.some(
                existing => existing.propertyConfigId === propertyConfig.id,
              ),
          )
          .map(propertyConfig => ({
            propertyConfigId: propertyConfig.id,
            instanceId: 0,
            uiId: uuidv4(),
            value: propertyConfig.defaultValue,
            valueIsSet:
              propertyConfig.dataType === DataType.DATE ||
              propertyConfig.dataType === DataType.INT
                ? true
                : false,
          }));

      if (this.entityId) {
        this.propertyInstances = [...existingProperties];
      } else {
        this.propertyInstances = [
          ...existingProperties,
          ...availableProperties,
        ];
      }
      this.sortedIds = this.propertyInstances.map(prop => prop.uiId);
      this.propertiesSetup = true;
      this.initialHash = this.instancesHash = await this.getInstancesHash();
    }
  }

  private propertyAtMax(propertyId: number): boolean {
    if (!this.entityConfig) {
      return true;
    }

    const propertyConfig = this.entityConfig.properties.find(
      prop => prop.id === propertyId,
    );

    if (!propertyConfig) {
      return true;
    }

    const numberOfPropertiesWithType = this.numberOfPropertiesWithType(
      propertyConfig.dataType,
      propertyId,
      false,
    );

    return numberOfPropertiesWithType >= propertyConfig.allowed;
  }

  private numberOfPropertiesWithType(
    dataType: DataType,
    type: number,
    onlyValidated = true,
  ): number {
    if (!this.entityConfig) {
      return 0;
    }

    return this.propertyInstances.filter(
      prop =>
        prop.propertyConfigId === type &&
        (this.validateTypedData(dataType, prop.value) || !onlyValidated),
    ).length;
  }

  private validateTypedData(
    dataType: DataType,
    value: PropertyDataValue,
  ): boolean {
    let imageValue: ImageDataValue;
    switch (dataType) {
      case DataType.SHORT_TEXT:
      case DataType.LONG_TEXT:
        return (
          typeof value === 'string' && value.length > 0 && value.length <= 255
        );
      case DataType.INT:
        return typeof value === 'number';
      case DataType.BOOLEAN:
        return typeof value === 'boolean';
      case DataType.IMAGE:
        imageValue = value as ImageDataValue;
        return typeof value === 'object' && imageValue.src.length > 0;
      case DataType.DATE:
        return value === null || !isNaN(new Date(value as string).getTime());
      default:
        return false;
    }
  }

  private mapInstancesToProperties(): EntityProperty[] {
    return this.propertyInstances
      .filter(prop => prop.valueIsSet)
      .map(propertyInstance => ({
        id: propertyInstance.instanceId,
        propertyConfigId: propertyInstance.propertyConfigId,
        value: propertyInstance.value,
        order:
          this.sortedIds.indexOf(propertyInstance.uiId) ??
          this.propertyInstances.length,
      }));
  }

  private validateConstraints(): ValidateionResult {
    const errors: string[] = [];

    if (!this.entityConfig) {
      errors.push(translate('entityTypeRequired'));
      return { isValid: false, errors };
    }

    this.entityConfig.properties.forEach(propertyConfig => {
      const count = this.numberOfPropertiesWithType(
        propertyConfig.dataType,
        propertyConfig.id,
      );

      if (count < propertyConfig.required) {
        errors.push(
          translate('entityPropertyMinCount', {
            property: propertyConfig.name,
            count: propertyConfig.required,
          }),
        );
      }

      if (count > propertyConfig.allowed) {
        errors.push(
          translate('entityPropertyMaxCount', {
            property: propertyConfig.name,
            count: propertyConfig.allowed,
          }),
        );
      }
    });

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    return { isValid: true };
  }

  private async save(): Promise<void> {
    console.log(
      'Saving entity with properties:',
      this.mapInstancesToProperties(),
    );
    this.loading = true;
    const validationResult = this.validateConstraints();

    if (!validationResult.isValid) {
      this.loading = false;

      validationResult.errors.forEach(error =>
        addToast(error, NotificationType.ERROR),
      );

      return;
    }

    try {
      if (validationResult.isValid && this.hasChanged) {
        const timeZone = new Date().getTimezoneOffset();

        const properties: EntityProperty[] = this.mapInstancesToProperties();

        const payload: RequestBody = {
          entityConfigId: this.type,
          timeZone,
          tags: this.tagsAndSuggestions,
          properties,
          propertyReferences: this.propertyReferences,
        };

        const result = this.entityId
          ? await storage.updateEntity(this.entityId, payload)
          : await storage.addEntity(payload);

        this.loading = false;

        if (!result) {
          addToast(translate('entityFailedToSave'), NotificationType.ERROR);
          return;
        }

        this.reset();

        this.dispatchEvent(
          new EntityItemUpdatedEvent({
            id: this.entityId,
            tags: this.tags,
            properties: result.properties,
          }),
        );

        addToast(
          this.entityId ? translate('updated') : translate('added'),
          NotificationType.SUCCESS,
        );
        return;
      }

      this.dispatchEvent(
        new EntityItemCanceledEvent({
          id: this.entityId,
        }),
      );
    } catch (error) {
      console.error(`Error encountered in when saving entity: ${error}`);
    }

    this.loading = false;
  }

  private async reset(): Promise<void> {
    this.propertiesSetup = false;
    this.propertyInstances = [];
    this.initialHash = '';
    this.instancesHash = '';
    await this.setupProperties();

    this.tagValue = '';
    if (!this.entityId) {
      this.tags =
        this.state.listConfig.filter.tagging[ListFilterType.CONTAINS_ALL_OF];
    }
    this.state.setTagSuggestions([]);

    if (this.suggestionTimeout) {
      clearTimeout(this.suggestionTimeout);
      this.suggestionTimeout = null;
    }

    this.focusFirstField();
  }

  focusFirstField(): void {
    const firstField = this.renderRoot.querySelector(
      'property-field',
    ) as PropertyField | null;

    if (firstField) {
      firstField.focus();
    }
  }

  private async deleteEntity(): Promise<void> {
    this.loading = true;

    try {
      await storage.deleteEntity(this.entityId);

      addToast(translate('removed'), NotificationType.INFO);
    } catch (error) {
      console.error(`Error encountered when deleting entity: ${error}`);
    }

    this.dispatchEvent(
      new EntityItemDeletedEvent({
        id: this.entityId,
      }),
    );

    this.loading = false;
  }

  private handleSaveClick(_e: CustomEvent): void {
    console.log('Save clicked');
    this.save();
  }

  private handleDeleteClick(_e: CustomEvent): void {
    this.confirmModalShown = true;
  }

  private handleTagsUpdated(e: TagsUpdatedEvent): void {
    this.tags = e.detail.tags;

    this.state.setTagSuggestions(
      this.state.tagSuggestions.filter(suggestion =>
        this.tags.includes(suggestion),
      ),
    );
  }

  private async handleTagSuggestionsRequested(
    e: TagSuggestionsRequestedEvent,
  ): Promise<void> {
    const value = e.detail.value;
    if (
      (!this.lastInput.tag.hadResults &&
        value.startsWith(this.lastInput.tag.value)) ||
      !this.tagSuggestionsEnabled
    ) {
      this.tagSuggestions = [];
      return;
    }

    this.lastInput.tag.hadResults = false;
    this.lastInput.tag.value = value;

    let tags: string[] = [];

    if (value.length >= this.minLengthForSuggestion) {
      const result = await storage.getTags(value);
      if (result) {
        tags = result;
      }
    }

    if (tags.length || value === '') {
      this.lastInput.tag.hadResults = true;
    }

    this.tagSuggestions = tags;
  }

  private handleTypeChanged(e: SelectChangedEvent<string>): void {
    this.type = parseInt(e.detail.value);
    this.propertiesSetup = false;
    this.propertyInstances = [];
  }

  private async handlePropertyChanged(e: PropertyChangedEvent): Promise<void> {
    const { value, uiId } = e.detail;

    const propertyInstance = this.propertyInstances.find(
      property => property.uiId === uiId,
    );

    if (!propertyInstance) {
      return;
    }

    propertyInstance.valueIsSet = true;
    propertyInstance.value = value;

    this.instancesHash = await this.getInstancesHash();
  }

  private async handlePropertyCloned(e: PropertyClonedEvent): Promise<void> {
    const { uiId } = e.detail;
    const propertyInstanceIndex = this.propertyInstances.findIndex(
      property => property.uiId === uiId,
    );

    const propertyInstances = [
      ...this.propertyInstances.slice(0, propertyInstanceIndex + 1),
      { ...this.propertyInstances[propertyInstanceIndex], uiId: uuidv4() },
      ...this.propertyInstances.slice(propertyInstanceIndex + 1),
    ];

    this.propertyInstances = propertyInstances;

    this.instancesHash = await this.getInstancesHash();
  }

  private async handlePropertyDeleted(e: PropertyDeletedEvent): Promise<void> {
    const { uiId } = e.detail;

    const instanceToRemove = this.propertyInstances.find(
      property => property.uiId === uiId,
    );

    if (!instanceToRemove) {
      return;
    }

    this.propertyInstances = this.propertyInstances.filter(
      property => property.uiId !== uiId,
    );

    this.instancesHash = await this.getInstancesHash();
  }

  handlePropertySubmitted(e: PropertySubmittedEvent): void {
    const { uiId } = e.detail;
    const propertyInstanceIndex = this.propertyInstances.findIndex(
      property => property.uiId === uiId,
    );

    if (propertyInstanceIndex < 0) {
      return;
    }

    this.save();
  }

  sortUpdated(e: SortUpdatedEvent): void {
    this.sortedIds = e.detail.sortedIds;
  }

  addProperty(propertyConfig: EntityPropertyConfig): void {
    if (!propertyConfig) {
      return;
    }

    this.propertyInstances = [
      ...this.propertyInstances,
      {
        uiId: uuidv4(),
        instanceId: 0,
        propertyConfigId: propertyConfig.id,
        value: propertyConfig.defaultValue,
        valueIsSet: false,
      },
    ];
  }

  showAddPropertyPopUp(): void {
    this.propertyPopUpIsOpen = true;
  }

  renderPropertyField(
    propertyInstance: PropertyInstance,
  ): TemplateResult | typeof nothing {
    const { propertyConfigId, uiId } = propertyInstance;
    if (!propertyConfigId || !this.entityConfig) {
      return nothing;
    }

    return html`<property-field
      .value=${propertyInstance.value}
      uiId=${uiId}
      entityConfigId=${this.entityConfig.id}
      propertyConfigId=${propertyConfigId}
      usedOfThisType=${this.state.entityPropertyInstances[propertyConfigId] ||
      0}
      @property-changed=${this.handlePropertyChanged}
      @property-cloned=${this.handlePropertyCloned}
      @property-deleted=${this.handlePropertyDeleted}
      @property-submitted=${this.handlePropertySubmitted}
    ></property-field>`;
  }

  renderNoEntityConfig(): TemplateResult {
    return html`
      <div class="box no-entity-configs">${translate('noEntityConfigs')}</div>

      <div class="wizard-banner" @click=${(): void => navigate('/wizard')}>
        <svg-icon name="wizard" size="48"></svg-icon>

        <span class="wizard-banner-text"
          >${translate('getStartedWithWizard')}</span
        >
      </div>
    `;
  }

  get tabRegistry(): TabEntry[] {
    return [
      {
        heading: translate('entityForm.tab.properties'),
        content: () => this.renderPropertiesTab(),
        shouldShow: () => true,
      },
      {
        heading: translate('entityForm.tab.access'),
        content: () => html`<access-policy></access-policy>`,
        shouldShow: () => this.state.hasRole(Role.ACCESS),
      },
    ];
  }

  get visibleTabs(): TabEntry[] {
    return this.tabRegistry.filter(tab => tab.shouldShow());
  }

  renderPropertiesTab(): TemplateResult {
    return html`
      ${!this.entityId && this.availableEntityConfigs.length > 1
        ? html` <div class="type">
            <ss-select
              selected=${this.type}
              @select-changed=${this.handleTypeChanged}
              .options=${[
                { label: translate('selectItemType'), value: '0' },
                ...this.availableEntityConfigs.map(entity => ({
                  label: entity.name,
                  value: entity.id,
                })),
              ]}
            ></ss-select>
          </div>`
        : nothing}

      <div class="properties">
        <sortable-list
          @sort-updated=${this.sortUpdated}
          ?disabled=${!this.entityConfig?.allowPropertyOrdering}
        >
          ${this.propertyInstances.length && this.entityConfig
            ? repeat(
                this.propertyInstances,
                propertyInstance => propertyInstance.uiId,
                propertyInstance =>
                  html`<sortable-item
                    id=${propertyInstance.uiId}
                    ?disabled=${!this.entityConfig?.allowPropertyOrdering}
                    >${this.renderPropertyField(
                      propertyInstance,
                    )}</sortable-item
                  >`,
              )
            : nothing}
        </sortable-list>

        <div class="buttons">
          ${this.canAddProperty
            ? html` <ss-button @click=${this.showAddPropertyPopUp}
                >${translate('addProperty')}</ss-button
              >`
            : nothing}
        </div>

        <pop-up
          closeOnOutsideClick
          closeOnEsc
          closeButton
          ?open=${this.propertyPopUpIsOpen}
          @pop-up-closed=${(): void => {
            this.propertyPopUpIsOpen = false;
          }}
        >
          ${repeat(
            this.allowedPropertiesToAdd,
            propertyConfig => propertyConfig.id,
            propertyConfig =>
              html`<div class="property-option">
                <div
                  @click=${(): void => {
                    this.addProperty(propertyConfig);
                    this.propertyPopUpIsOpen = false;
                  }}
                >
                  ${propertyConfig.name}
                </div>
              </div>`,
          )}
        </pop-up>
      </div>

      <tag-manager
        ?enableSuggestions=${this.tagSuggestionsEnabled}
        value=${this.tagValue}
        @tags-updated=${this.handleTagsUpdated}
        @tag-suggestions-requested=${this.handleTagSuggestionsRequested}
      >
        <div slot="tags">
          ${repeat(
            this.tagsAndSuggestions,
            tag => tag,
            tag => html`<data-item>${tag}</data-item>`,
          )}
        </div>

        <div slot="suggestions">
          ${repeat(
            this.tagSuggestions,
            suggestion => suggestion,
            suggestion => html`<data-item>${suggestion}</data-item>`,
          )}
        </div>
      </tag-manager>

      <div class="buttons">
        <ss-button
          class="save-button"
          ?positive=${!this.entityId || this.hasChanged}
          @click=${this.handleSaveClick}
          text=${this.entityId
            ? this.hasChanged
              ? translate('update')
              : translate('cancel')
            : translate('add')}
          ?loading=${this.loading}
        ></ss-button>

        ${this.entityId
          ? html`
              <ss-button
                negative
                @click=${this.handleDeleteClick}
                text=${translate('delete')}
              ></ss-button>

              <confirmation-modal
                @confirmation-accepted=${this.deleteEntity}
                @confirmation-declined=${(): void => {
                  this.confirmModalShown = false;
                }}
                ?open=${this.confirmModalShown}
              ></confirmation-modal>
            `
          : nothing}
      </div>
    `;
  }

  render(): TemplateResult {
    if (this.state.entityConfigs.length === 0) {
      return this.renderNoEntityConfig();
    }

    const tabs = this.visibleTabs;

    if (tabs.length === 1) {
      return html`<form class=${classMap(this.classes)}>${tabs[0].content()}</form>`;
    }

    return html`
      <form class=${classMap(this.classes)}>
        <tab-container>
          ${repeat(
            tabs,
            tab => tab.heading,
            tab => html`<tab-pane title=${tab.heading}>${tab.content()}</tab-pane>`,
          )}
        </tab-container>
      </form>
    `;
  }
}
