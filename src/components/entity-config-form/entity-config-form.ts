import { html, css, nothing, TemplateResult } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { produce } from 'immer';

import {
  defaultEntityConfig,
  defaultEntityPropertyConfig,
  EntityConfig,
  EntityPropertyConfig,
} from 'api-spec/models/Entity';
import { Role } from 'api-spec/models/Identity';
import { addToast } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';
import {
  EntityConfigFormProp,
  entityConfigFormProps,
  EntityConfigFormProps,
  PropertyConfigInstance,
  PropertyConfigProblemMap,
} from './entity-config-form.models';
import { TabEntry } from '@/components/entity-form/entity-form.models';
import { storage } from '@/lib/Storage';

import {
  PropertyConfigAddedEvent,
  PropertyConfigBreakingChangeDetectedEvent,
  PropertyConfigUpdatedEvent,
} from '@/components/property-config-form/property-config-form.events';
import { InputChangedEvent } from '@ss/ui/components/ss-input.events';
import { TabIndexChangedEvent } from '@ss/ui/components/tab-container.events';

import '@/components/property-config-form/property-config-form';
import '@ss/ui/components/ss-collapsable';
import '@ss/ui/components/confirmation-modal';
import '@ss/ui/components/sortable-list';
import '@ss/ui/components/sortable-item';
import '@ss/ui/components/ss-toggle';
import '@ss/ui/components/tab-container';
import '@ss/ui/components/tab-pane';
import '@/components/access-policy-assignment/access-policy-assignment';
import { MobxLitElement } from '@adobe/lit-mobx';
import { appState } from '@/state';
import { SortUpdatedEvent } from '@ss/ui/components/sortable-list.events';
import { translate } from '@/lib/Localization';
import {
  EntityConfigDeletedEvent,
  EntityConfigUpdatedEvent,
} from './entity-config-form.events';
import { Entity } from 'api-spec/models';
import { ToggleChangedEvent } from '@ss/ui/components/ss-toggle.events';
import { themed } from '@/lib/Theme';
import { ifDefined } from 'lit/directives/if-defined.js';

@themed()
@customElement('entity-config-form')
export class EntityConfigForm extends MobxLitElement {
  public state = appState;

  static styles = css`
    :host {
      display: block;
      padding: 1rem;
    }

    .field {
      margin-bottom: 1rem;

      label {
        display: block;
        font-weight: bold;
        margin-bottom: 0.25rem;
      }
    }

    .buttons {
      padding: 0.5rem 0;

      ss-button {
        display: block;
        margin-bottom: 0.5rem;
      }
    }

    .revision-info {
      border: 1px solid #ffa500;
      background-color: #ffe4b1;
      color: #000;
      padding: 1rem;
      margin-bottom: 1rem;
      border-radius: 4px;
    }

    .warning {
      font-weight: bold;
      margin-bottom: 0.5rem;
    }

    ss-collapsable::part(head) {
      font-weight: bold;
    }
  `;

  @state()
  entityConfig: EntityConfig = defaultEntityConfig;

  @state()
  confirmationModalIsOpen: boolean = false;

  @state()
  isSaving = false;

  @state()
  performDriftCheck: boolean = false;

  @state()
  propertyConfigInstances: PropertyConfigInstance[] = [];

  @state()
  propertyConfigProblems: PropertyConfigProblemMap = [];

  @state()
  saveNewRevision: boolean = false;

  @state()
  activeTabIndex: number = 0;

  @property({ type: Boolean, reflect: true })
  open: boolean = false;

  @property({ type: Number })
  [EntityConfigFormProp.ENTITY_CONFIG_ID]: EntityConfigFormProps[EntityConfigFormProp.ENTITY_CONFIG_ID] =
    entityConfigFormProps[EntityConfigFormProp.ENTITY_CONFIG_ID].default;

  @property({ type: String })
  [EntityConfigFormProp.NAME]: EntityConfigFormProps[EntityConfigFormProp.NAME] =
    entityConfigFormProps[EntityConfigFormProp.NAME].default;

  @property({ type: String })
  [EntityConfigFormProp.DESCRIPTION]: EntityConfigFormProps[EntityConfigFormProp.DESCRIPTION] =
    entityConfigFormProps[EntityConfigFormProp.DESCRIPTION].default;

  @property({ type: Array })
  [EntityConfigFormProp.PROPERTIES]: EntityConfigFormProps[EntityConfigFormProp.PROPERTIES] =
    entityConfigFormProps[EntityConfigFormProp.PROPERTIES].default;

  @property({ type: Boolean })
  [EntityConfigFormProp.ALLOW_PROPERTY_ORDERING]: EntityConfigFormProps[EntityConfigFormProp.ALLOW_PROPERTY_ORDERING] =
    entityConfigFormProps[EntityConfigFormProp.ALLOW_PROPERTY_ORDERING].default;

  @property({ type: Boolean })
  [EntityConfigFormProp.AI_ENABLED]: EntityConfigFormProps[EntityConfigFormProp.AI_ENABLED] =
    entityConfigFormProps[EntityConfigFormProp.AI_ENABLED].default;

  @property({ type: String })
  [EntityConfigFormProp.AI_IDENTIFY_PROMPT]: EntityConfigFormProps[EntityConfigFormProp.AI_IDENTIFY_PROMPT] =
    entityConfigFormProps[EntityConfigFormProp.AI_IDENTIFY_PROMPT].default;

  @property({ type: Object })
  [EntityConfigFormProp.VIEW_ACCESS_POLICY]: EntityConfigFormProps[EntityConfigFormProp.VIEW_ACCESS_POLICY] =
    entityConfigFormProps[EntityConfigFormProp.VIEW_ACCESS_POLICY].default;

  @property({ type: Object })
  [EntityConfigFormProp.EDIT_ACCESS_POLICY]: EntityConfigFormProps[EntityConfigFormProp.EDIT_ACCESS_POLICY] =
    entityConfigFormProps[EntityConfigFormProp.EDIT_ACCESS_POLICY].default;

  @property({ type: Boolean })
  [EntityConfigFormProp.PUBLIC]: EntityConfigFormProps[EntityConfigFormProp.PUBLIC] =
    entityConfigFormProps[EntityConfigFormProp.PUBLIC].default;

  @state()
  get hasBreakingChanges(): boolean {
    return (
      this.performDriftCheck &&
      this.propertyConfigProblems.some(problems => problems !== undefined)
    );
  }

  @state()
  get inSync(): boolean {
    return (
      this.entityConfig.name === this[EntityConfigFormProp.NAME] &&
      this.entityConfig.description ===
        this[EntityConfigFormProp.DESCRIPTION] &&
      JSON.stringify(this.entityConfig.properties) ===
        JSON.stringify(this[EntityConfigFormProp.PROPERTIES]) &&
      this.entityConfig.allowPropertyOrdering ===
        this[EntityConfigFormProp.ALLOW_PROPERTY_ORDERING] &&
      this.entityConfig.aiEnabled === this[EntityConfigFormProp.AI_ENABLED] &&
      this.entityConfig.aiIdentifyPrompt ===
        this[EntityConfigFormProp.AI_IDENTIFY_PROMPT] &&
      this.entityConfig.public === this[EntityConfigFormProp.PUBLIC]
    );
  }

  @query('.revision-target')
  revisionInfo!: HTMLElement;

  get isSaveEnabled(): boolean {
    return !this.isSaving && (!this.inSync || this.saveNewRevision);
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.entityConfig = {
      userId: '',
      id: this[EntityConfigFormProp.ENTITY_CONFIG_ID],
      name: this[EntityConfigFormProp.NAME],
      description: this[EntityConfigFormProp.DESCRIPTION],
      properties: this[EntityConfigFormProp.PROPERTIES],
      revisionOf: null,
      allowPropertyOrdering: this[EntityConfigFormProp.ALLOW_PROPERTY_ORDERING],
      aiEnabled: this[EntityConfigFormProp.AI_ENABLED],
      aiIdentifyPrompt: this[EntityConfigFormProp.AI_IDENTIFY_PROMPT],
      viewAccessPolicy: this[EntityConfigFormProp.VIEW_ACCESS_POLICY],
      editAccessPolicy: this[EntityConfigFormProp.EDIT_ACCESS_POLICY],
      public: this[EntityConfigFormProp.PUBLIC],
    };
  }

  updateName(name: string): void {
    this.entityConfig = { ...this.entityConfig, name };
  }

  updateDescription(description: string): void {
    this.entityConfig = { ...this.entityConfig, description };
  }

  validate(): string[] {
    const errors: string[] = [];
    if (!this.entityConfig.name) {
      errors.push(translate('entityConfigNameRequired'));
    }
    return errors;
  }

  async save(): Promise<void> {
    const validationErrors = this.validate();
    if (validationErrors.length > 0) {
      addToast(
        translate('entityConfigValidationFailed'),
        NotificationType.ERROR,
      );
      return;
    }

    this.isSaving = true;
    let result: Entity.EntityConfig | null = null;

    const entityConfig = produce(this.entityConfig, draft => {
      if (this.saveNewRevision) {
        draft.id = 0;
        draft.revisionOf = this.entityConfig.id;
        draft.properties = draft.properties.map(p => ({ ...p, id: 0 }));
      }
    });

    if (entityConfig.id) {
      result = await storage.updateEntityConfig(entityConfig);
    } else {
      result = await storage.addEntityConfig(entityConfig);
    }

    this.isSaving = false;

    if (!result) {
      addToast(translate('failedToSaveEntityConfig'), NotificationType.ERROR);
      return;
    }

    this.dispatchEvent(new EntityConfigUpdatedEvent({ ...result }));
    addToast(translate('entityConfigSaved'), NotificationType.SUCCESS);
  }

  async delete(): Promise<void> {
    const result = await storage.deleteEntityConfig(this.entityConfig.id);

    if (!result) {
      addToast(translate('failedToDeleteEntityConfig'), NotificationType.ERROR);
      return;
    }

    addToast(translate('entityConfigDeleted'), NotificationType.SUCCESS);

    this.dispatchEvent(
      new EntityConfigDeletedEvent({ id: this.entityConfig.id }),
    );
  }

  addPropertyToTop(): void {
    const entityPropertyConfig = produce(
      defaultEntityPropertyConfig,
      draft => draft,
    );

    const entityConfig = produce(this.entityConfig, draft => {
      draft.properties.unshift(entityPropertyConfig);
    });
    this.entityConfig = entityConfig;
  }

  addPropertyToBottom(): void {
    const entityConfig = produce(this.entityConfig, draft => {
      draft.properties.push(defaultEntityPropertyConfig);
    });
    this.entityConfig = entityConfig;
  }

  updateProperty(index: number, updatedProperty: EntityPropertyConfig): void {
    const entityConfig = produce(this.entityConfig, draft => {
      draft.properties[index] = updatedProperty;
    });
    this.entityConfig = entityConfig;
  }

  deleteProperty(index: number): void {
    const entityConfig = produce(this.entityConfig, draft => {
      draft.properties.splice(index, 1);
    });
    this.entityConfig = entityConfig;
  }

  isPanelOpen(id: number): boolean {
    if (!id) {
      return true;
    }

    return (
      this.state.collapsablePanelState[`propertyConfigForm-${id}`] || false
    );
  }

  sortUpdated(e: SortUpdatedEvent): void {
    const newOrder = e.detail;

    storage.setEntityPropertyOrder(
      this.entityConfig.id,
      newOrder.sortedIds.map((id, index) => ({ id: Number(id), order: index })),
    );
  }

  breakingChangeDetected(
    index: number,
    e: PropertyConfigBreakingChangeDetectedEvent,
  ): void {
    if (!this.performDriftCheck) {
      return;
    }

    addToast(
      translate('propertyConfig.breakingChangeDetected'),
      NotificationType.ERROR,
    );

    const { problems } = e.detail;
    this.propertyConfigProblems = produce(
      this.propertyConfigProblems,
      draft => {
        draft[index] = problems;
      },
    );

    if (this.revisionInfo) {
      this.revisionInfo.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  breakingChangesResolved(index: number): void {
    this.propertyConfigProblems = produce(
      this.propertyConfigProblems,
      draft => {
        draft[index] = undefined;
      },
    );
  }

  updateAllowPropertyOrdering(allow: boolean): void {
    this.entityConfig = produce(this.entityConfig, draft => {
      draft.allowPropertyOrdering = allow;
    });
  }

  updateAIEnabled(enabled: boolean): void {
    this.entityConfig = produce(this.entityConfig, draft => {
      draft.aiEnabled = enabled;
    });
  }

  updateAIIdentifyPrompt(prompt: string): void {
    this.entityConfig = produce(this.entityConfig, draft => {
      draft.aiIdentifyPrompt = prompt;
    });
  }

  updatePublic(isPublic: boolean): void {
    this.entityConfig = produce(this.entityConfig, draft => {
      draft.public = isPublic;
    });
  }

  get tabRegistry(): TabEntry[] {
    return [
      {
        heading: translate('entityConfigForm.tab.config'),
        content: () => this.renderConfigTab(),
        shouldShow: () => true,
      },
      {
        heading: translate('entityConfigForm.tab.properties'),
        content: () => this.renderPropertiesTab(),
        shouldShow: () => true,
      },
      {
        heading: translate('entityConfigForm.tab.access'),
        content: () =>
          html`<access-policy-assignment
            context="entityConfig"
            entityId=${this[EntityConfigFormProp.ENTITY_CONFIG_ID]}
            viewAccessPolicyId=${ifDefined(
              this[EntityConfigFormProp.VIEW_ACCESS_POLICY]?.id,
            )}
            editAccessPolicyId=${ifDefined(
              this[EntityConfigFormProp.EDIT_ACCESS_POLICY]?.id,
            )}
          ></access-policy-assignment>`,
        shouldShow: () => this.state.hasRole(Role.ACCESS),
      },
    ];
  }

  get visibleTabs(): TabEntry[] {
    return this.tabRegistry.filter(tab => tab.shouldShow());
  }

  renderConfigTab(): TemplateResult {
    return html`
      <div class="entity-config-form">
        <div class="field">
          <label for="entity-name">${translate('entityName')}</label>

          <ss-input
            id="entity-name"
            .value=${this.entityConfig.name}
            @input-changed=${(e: InputChangedEvent): void =>
              this.updateName(e.detail.value)}
          ></ss-input>
        </div>

        <div class="field">
          <label for="entity-description"
            >${translate('entityDescription')}</label
          >

          <ss-input
            id="entity-description"
            .value=${this.entityConfig.description}
            @input-changed=${(e: InputChangedEvent): void =>
              this.updateDescription(e.detail.value)}
          ></ss-input>
        </div>

        <div class="field">
          <label for="allow-property-ordering"
            >${translate('allowPropertyOrdering')}</label
          >

          <ss-toggle
            ?on=${this[EntityConfigFormProp.ALLOW_PROPERTY_ORDERING]}
            @toggle-changed=${(e: ToggleChangedEvent): void => {
              this.updateAllowPropertyOrdering(e.detail.on);
            }}
          ></ss-toggle>
        </div>

        <div class="field">
          <label for="ai-enabled">${translate('aiEnabled')}</label>

          <ss-toggle
            ?on=${this[EntityConfigFormProp.AI_ENABLED]}
            @toggle-changed=${(e: ToggleChangedEvent): void => {
              this.updateAIEnabled(e.detail.on);
            }}
          ></ss-toggle>
        </div>

        <div class="field">
          <label for="ai-identify-prompt"
            >${translate('aiIdentifyPrompt')}</label
          >

          <ss-input
            id="ai-identify-prompt"
            .value=${this[EntityConfigFormProp.AI_IDENTIFY_PROMPT]}
            @input-changed=${(e: InputChangedEvent): void => {
              this.updateAIIdentifyPrompt(e.detail.value);
            }}
          ></ss-input>
        </div>

        <div class="field">
          <label for="entity-config-public"
            >${translate('entityConfigPublic')}</label
          >

          <ss-toggle
            ?on=${this.entityConfig.public}
            @toggle-changed=${(e: ToggleChangedEvent): void => {
              this.updatePublic(e.detail.on);
            }}
          ></ss-toggle>
        </div>

        <div class="revision-target"></div>

        ${this.hasBreakingChanges
          ? html` <div class="revision-info">
              <div class="warning">${translate('breakingChangeWarning')}</div>

              <input
                type="checkbox"
                id="new-revision"
                ?checked=${this.saveNewRevision}
                @click=${(): void => {
                  this.saveNewRevision = !this.saveNewRevision;
                }}
              />

              <label for="new-revision"
                >${translate('createNewRevision')}</label
              >
            </div>`
          : nothing}

        <div class="buttons">
          <ss-button
            positive
            ?disabled=${!this.isSaveEnabled}
            @click=${this.save}
            >${translate(
              this.saveNewRevision
                ? 'createNewRevision'
                : this.entityConfig.id
                  ? 'update'
                  : 'create',
            )}</ss-button
          >

          <ss-button
            negative
            @click=${(): void => {
              this.confirmationModalIsOpen = true;
            }}
            >${translate('delete')}</ss-button
          >
        </div>
      </div>
    `;
  }

  renderPropertiesTab(): TemplateResult {
    return html`
      <div class="properties">
        <ss-button @click=${this.addPropertyToTop}
          >${translate('addProperty')}</ss-button
        >

        <sortable-list @sort-updated=${this.sortUpdated}>
          ${repeat(
            this.entityConfig.properties,
            property => property.id,
            (property, index) => html`
              <sortable-item id=${property.id}>
                <property-config-form
                  ?open=${this.isPanelOpen(property.id)}
                  entityConfigId=${this.entityConfig.id}
                  propertConfigId=${property.id}
                  dataType=${property.dataType}
                  propertyConfigId=${property.id}
                  name=${property.name}
                  required=${property.required}
                  repeat=${property.repeat}
                  allowed=${property.allowed}
                  prefix=${property.prefix}
                  suffix=${property.suffix}
                  ?optionsOnly=${property.optionsOnly}
                  .options=${property.options}
                  ?hidden=${property.hidden}
                  ?performDriftCheck=${this.performDriftCheck}
                  .defaultValue=${property.defaultValue}
                  @property-config-updated=${(
                    e: PropertyConfigUpdatedEvent,
                  ): void => this.updateProperty(index, e.detail)}
                  @property-config-added=${(
                    e: PropertyConfigAddedEvent,
                  ): void => this.updateProperty(index, e.detail)}
                  @property-config-deleted=${(): void => {
                    this.deleteProperty(index);
                  }}
                  @property-config-breaking-change-detected=${(
                    e: PropertyConfigBreakingChangeDetectedEvent,
                  ): void => {
                    this.breakingChangeDetected(index, e);
                  }}
                  @property-config-breaking-changes-resolved=${(): void => {
                    this.breakingChangesResolved(index);
                  }}
                ></property-config-form>
              </sortable-item>
            `,
          )}
        </sortable-list>

        ${this.entityConfig.properties.length > 0
          ? html` <ss-button @click=${this.addPropertyToBottom}
              >${translate('addProperty')}</ss-button
            >`
          : nothing}
      </div>
    `;
  }

  render(): TemplateResult {
    const tabs = this.visibleTabs;

    return html`
      <ss-collapsable
        title=${this.entityConfig.name || translate('entityConfiguration')}
        ?open=${this.open}
        panelId=${`entityConfigForm-${this.entityConfig.id}`}
      >
        ${tabs.length === 1
          ? tabs[0].content()
          : html`
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
            `}
      </ss-collapsable>

      <confirmation-modal
        ?open=${this.confirmationModalIsOpen}
        @confirmation-accepted=${this.delete}
        @confirmation-declined=${(): void => {
          this.confirmationModalIsOpen = false;
        }}
      ></confirmation-modal>
    `;
  }
}
