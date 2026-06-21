import { html, css, nothing, TemplateResult } from 'lit';
import { property, customElement, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

import { ListFilterType } from 'api-spec/models/List';
import { SettingName } from 'api-spec/models/Setting';
import { EntityConfig } from 'api-spec/models/Entity';
import { Role } from 'api-spec/models/Identity';
import { appState } from '@/state';
import { ViewElement } from '@/lib/ViewElement';
import {
  EntityFormProp,
  entityFormProps,
  EntityFormProps,
  RequestBody,
  TabEntry,
} from './entity-form.models';
import { addToast } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';

import '@ss/ui/components/ss-button';
import '@ss/ui/components/ss-select';
import '@ss/ui/components/confirmation-modal';
import '@ss/ui/components/tab-container';
import '@ss/ui/components/tab-pane';
import '@/components/svg-icon/svg-icon';
import '@/components/access-policy-assignment/access-policy-assignment';
import '@/components/entity-suggestions/entity-suggestions';
import '@/components/entity-form/entity-form-properties/entity-form-properties';
import '@/components/entity-form/entity-form-tags/entity-form-tags';

import {
  EntityItemCanceledEvent,
  EntityItemCreatedEvent,
  EntityItemDeletedEvent,
  EntityItemUpdatedEvent,
} from './entity-form.events';
import { TabIndexChangedEvent } from '@ss/ui/components/tab-container.events';
import { SelectChangedEvent } from '@ss/ui/components/ss-select.events';
import { translate } from '@/lib/Localization';
import { navigate } from '@/lib/Router';

import '@ss/ui/components/ss-toggle';
import { ToggleChangedEvent } from '@ss/ui/components/ss-toggle.events';
import { reaction } from 'mobx';
import { themed } from '@/lib/Theme';
import { storage } from '@/lib/Storage';

import { EntityFormProperties } from './entity-form-properties/entity-form-properties';
import { EntityFormTags } from './entity-form-tags/entity-form-tags';
import {
  EntityFormPropertiesChangedEvent,
  EntityFormPropertySubmittedEvent,
} from './entity-form-properties/entity-form-properties.events';
import { EntityFormTagsUpdatedEvent } from './entity-form-tags/entity-form-tags.events';

@themed()
@customElement('entity-form')
export class EntityForm extends ViewElement {
  private state = appState;

  @query('entity-form-properties')
  private propertiesRef: EntityFormProperties | undefined;

  @query('entity-form-tags')
  private tagsRef: EntityFormTags | undefined;

  static styles = css`
    :host {
      display: block;
      text-align: left;
    }

    form {
      padding: 1rem;
    }

    .save-button::part(button) {
      font-weight: bold;
    }

    .published {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
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

  @property({ type: Array })
  [EntityFormProp.PROPERTIES]: EntityFormProps[EntityFormProp.PROPERTIES] =
    entityFormProps[EntityFormProp.PROPERTIES].default;

  @property({ type: Number })
  [EntityFormProp.VIEW_ACCESS_POLICY_ID]: EntityFormProps[EntityFormProp.VIEW_ACCESS_POLICY_ID] =
    entityFormProps[EntityFormProp.VIEW_ACCESS_POLICY_ID].default;

  @property({ type: Number })
  [EntityFormProp.EDIT_ACCESS_POLICY_ID]: EntityFormProps[EntityFormProp.EDIT_ACCESS_POLICY_ID] =
    entityFormProps[EntityFormProp.EDIT_ACCESS_POLICY_ID].default;

  @property({ type: Boolean })
  [EntityFormProp.PUBLISHED]: EntityFormProps[EntityFormProp.PUBLISHED] =
    entityFormProps[EntityFormProp.PUBLISHED].default;

  @state() confirmModalShown: boolean = false;
  @state() loading: boolean = false;
  @state() initialHash = '';
  @state() instancesHash = '';
  @state() initialSortedIds: string[] = [];
  @state() currentSortedIds: string[] = [];
  @state() initialPublished: boolean = false;
  @state() initialTags: string = '';
  @state() activeTabIndex: number = 0;

  @state()
  get classes(): Record<string, boolean> {
    return { box: true, 'advanced-mode': this.state.advancedMode };
  }

  @state()
  get tagsAndSuggestions(): string[] {
    return Array.from(new Set([...this.tags, ...this.state.tagSuggestions]));
  }

  @state()
  get entityConfig(): EntityConfig | undefined {
    return this.availableEntityConfigs.find(entity => entity.id === this.type);
  }

  @state()
  get hasChanged(): boolean {
    return (
      this.initialHash !== this.instancesHash ||
      JSON.stringify(this.tagsAndSuggestions) !== this.initialTags ||
      JSON.stringify(this.currentSortedIds) !==
        JSON.stringify(this.initialSortedIds) ||
      this.published !== this.initialPublished
    );
  }

  @state()
  get availableEntityConfigs(): EntityConfig[] {
    return this.state.workspaceEntityConfigs.filter(
      config =>
        (this.state.listFilter.includeTypes?.length ?? 0) === 0 ||
        this.state.listFilter.includeTypes?.includes(config.id),
    );
  }

  connectedCallback(): void {
    super.connectedCallback();

    this.initialTags = JSON.stringify(this.tags);

    reaction(
      () => [appState.listConfigId, appState.listFilter],
      () => {
        if (this.entityId) {
          return;
        }

        this.tags =
          this.state.listFilter.tagging?.[ListFilterType.CONTAINS_ALL_OF] ?? [];
        this.published = this.state.listSetting[SettingName.AUTO_PUBLISH];

        if (this.availableEntityConfigs.length === 1) {
          this.type = this.availableEntityConfigs[0].id;
        } else {
          this.type = 0;
        }

        if (this.propertiesRef) {
          this.updateComplete.then(() => this.propertiesRef?.reset());
        }
      },
      {
        fireImmediately: true,
      },
    );
  }

  get apiUrl(): string {
    return this.entityId ? `entity/${this.entityId}` : `entity`;
  }

  private async save(): Promise<void> {
    this.loading = true;

    if (!this.propertiesRef) {
      this.loading = false;
      return;
    }

    const validationResult = this.propertiesRef.validateConstraints();

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
        const { properties, propertyReferences } =
          this.propertiesRef.getPayload();

        const payload: RequestBody = {
          entityConfigId: this.type,
          timeZone,
          tags: this.tagsAndSuggestions,
          properties,
          propertyReferences,
          published: this.published,
        };

        const isNew = !this.entityId;
        const result = this.entityId
          ? await storage.updateEntity(this.entityId, payload)
          : await storage.addEntity(payload);

        this.loading = false;

        if (!result) {
          addToast(translate('entityFailedToSave'), NotificationType.ERROR);
          return;
        }

        if (isNew) {
          const viewAccessPolicyId =
            this.viewAccessPolicyId ||
            this.state.listConfig.viewAccessPolicy?.id ||
            0;
          const editAccessPolicyId =
            this.editAccessPolicyId ||
            this.state.listConfig.editAccessPolicy?.id ||
            0;

          if (viewAccessPolicyId || editAccessPolicyId) {
            await storage.saveEntityAccessPolicy(
              result.id,
              viewAccessPolicyId,
              editAccessPolicyId,
            );
          }

          this.dispatchEvent(
            new EntityItemCreatedEvent({
              id: result.id,
              viewAccessPolicyId,
              editAccessPolicyId,
            }),
          );
        }

        this.reset();

        this.dispatchEvent(
          new EntityItemUpdatedEvent({
            id: this.entityId,
            tags: this.tags,
            properties: result.properties,
            published: payload.published,
            updatedAt: result.updatedAt,
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
    this.initialHash = '';
    this.instancesHash = '';
    this.initialSortedIds = [];
    this.currentSortedIds = [];

    if (!this.entityId) {
      this.tags =
        this.state.listFilter.tagging?.[ListFilterType.CONTAINS_ALL_OF] ?? [];
      this.published = this.state.listSetting[SettingName.AUTO_PUBLISH];
    }

    await this.propertiesRef?.reset();
    this.tagsRef?.reset();
  }

  async focusFirstField(): Promise<void> {
    await this.propertiesRef?.focusFirstField();
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
    this.save();
  }

  private handleDeleteClick(_e: CustomEvent): void {
    this.confirmModalShown = true;
  }

  private handleTypeChanged(e: SelectChangedEvent<string>): void {
    this.type = parseInt(e.detail.value);
    this.updateComplete.then(() => this.propertiesRef?.reset());
  }

  private handlePublishedChanged(e: ToggleChangedEvent): void {
    this.published = e.detail.on;
  }

  private handlePropertiesChanged(e: EntityFormPropertiesChangedEvent): void {
    const { instancesHash, sortedIds, isInitial } = e.detail;
    this.instancesHash = instancesHash;
    this.currentSortedIds = sortedIds;
    if (isInitial) {
      this.initialHash = instancesHash;
      this.initialSortedIds = sortedIds;
      this.initialPublished = this.published;
      this.initialTags = JSON.stringify(this.tagsAndSuggestions);
    }
  }

  private handlePropertySubmitted(_e: EntityFormPropertySubmittedEvent): void {
    this.save();
  }

  private handleTagsUpdated(e: EntityFormTagsUpdatedEvent): void {
    this.tags = e.detail.tags;
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
        content: () =>
          html`<access-policy-assignment
            context="entity"
            entityId=${this.entityId}
            viewAccessPolicyId=${this.viewAccessPolicyId ||
            this.state.listConfig.viewAccessPolicy?.id ||
            0}
            editAccessPolicyId=${this.editAccessPolicyId ||
            this.state.listConfig.editAccessPolicy?.id ||
            0}
          ></access-policy-assignment>`,
        shouldShow: () => this.state.hasRole(Role.ACCESS),
      },
    ];
  }

  get visibleTabs(): TabEntry[] {
    return this.tabRegistry.filter(tab => tab.shouldShow());
  }

  renderPropertiesTab(): TemplateResult | typeof nothing {
    return html`
      ${!this.entityId
        ? html`<entity-suggestions></entity-suggestions>`
        : nothing}
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

      <entity-form-properties
        entityId=${this.entityId}
        .entityConfig=${this.entityConfig}
        .properties=${this.properties}
        @entity-form-properties-changed=${this.handlePropertiesChanged}
        @entity-form-property-submitted=${this.handlePropertySubmitted}
      ></entity-form-properties>

      <entity-form-tags
        .tags=${this.tags}
        ?allowTags=${this.entityConfig?.allowTags ?? false}
        @entity-form-tags-updated=${this.handleTagsUpdated}
      ></entity-form-tags>

      ${this.entityConfig?.id
        ? html` <div class="published">
              <label>${translate('published')}</label>
              <ss-toggle
                ?on=${this.published}
                @toggle-changed=${this.handlePublishedChanged}
              ></ss-toggle>
            </div>

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
            </div>`
        : nothing}
    `;
  }

  render(): TemplateResult {
    if (this.state.entityConfigs.length === 0) {
      return this.renderNoEntityConfig();
    }

    const tabs = this.visibleTabs;

    if (tabs.length === 1) {
      return html`<form class=${classMap(this.classes)}>
        ${tabs.find(tab => tab.shouldShow())?.content()}
      </form>`;
    }

    return html`
      <form class=${classMap(this.classes)}>
        <tab-container
          @tab-index-changed=${(e: TabIndexChangedEvent): void => {
            this.activeTabIndex = e.detail.index;
          }}
        >
          ${repeat(
            tabs,
            tab => tab.heading,
            (tab, index) =>
              html`<tab-pane title=${tab.heading}
                >${index === this.activeTabIndex
                  ? tab.content()
                  : nothing}</tab-pane
              >`,
          )}
        </tab-container>
      </form>
    `;
  }
}
