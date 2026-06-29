import { html, css, nothing, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import {
  defaultEntityConfig,
  EntityPropertyConfig,
} from 'api-spec/models/Entity';
import { Role } from 'api-spec/models/Identity';
import { addToast } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';
import {
  EntityConfigFormProp,
  entityConfigFormProps,
  EntityConfigFormProps,
  ExtendedEntityConfig,
} from './entity-config-form.models';
import { TabEntry } from '@/components/entity-form/entity-form.models';
import { storage } from '@/lib/Storage';

import { TabIndexChangedEvent } from '@ss/ui/components/tab-container.events';
import { translate } from '@/lib/Localization';
import {
  EntityConfigDeletedEvent,
  EntityConfigUpdatedEvent,
} from './entity-config-form.events';
import { Entity } from 'api-spec/models';
import { themed } from '@/lib/Theme';
import { ifDefined } from 'lit/directives/if-defined.js';
import { MobxLitElement } from '@adobe/lit-mobx';
import { appState } from '@/state';

import {
  EntityConfigGeneralConfigChangedEvent,
  EntityConfigGeneralDeleteRequestedEvent,
  EntityConfigGeneralSaveNewRevisionToggledEvent,
  EntityConfigGeneralSaveRequestedEvent,
} from './entity-config-general/entity-config-general.events';
import {
  EntityConfigPropertiesChangedEvent,
  EntityConfigPropertiesBreakingChangesUpdatedEvent,
} from './entity-config-properties/entity-config-properties.events';

import '@ss/ui/components/ss-collapsable';
import '@ss/ui/components/confirmation-modal';
import '@ss/ui/components/tab-container';
import '@ss/ui/components/tab-pane';
import '@/components/access-policy-assignment/access-policy-assignment';
import './entity-config-general/entity-config-general';
import './entity-config-properties/entity-config-properties';
import './entity-config-constraints/entity-config-constraints';

@themed()
@customElement('entity-config-form')
export class EntityConfigForm extends MobxLitElement {
  public state = appState;

  static styles = css`
    :host {
      display: block;
      padding: 1rem;
    }
  `;

  @state()
  entityConfig: ExtendedEntityConfig = {
    ...defaultEntityConfig,
    allowComments: false,
  };

  @state()
  confirmationModalIsOpen: boolean = false;

  @state()
  isSaving = false;

  @state()
  performDriftCheck: boolean = false;

  @state()
  saveNewRevision: boolean = false;

  @state()
  hasBreakingChanges: boolean = false;

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
  [EntityConfigFormProp.ALLOW_TAGS]: EntityConfigFormProps[EntityConfigFormProp.ALLOW_TAGS] =
    entityConfigFormProps[EntityConfigFormProp.ALLOW_TAGS].default;

  @property({ type: Boolean })
  [EntityConfigFormProp.ALLOW_COMMENTS]: EntityConfigFormProps[EntityConfigFormProp.ALLOW_COMMENTS] =
    entityConfigFormProps[EntityConfigFormProp.ALLOW_COMMENTS].default;

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

  @property({ type: Array })
  [EntityConfigFormProp.UNIQUE_CONSTRAINTS]: EntityConfigFormProps[EntityConfigFormProp.UNIQUE_CONSTRAINTS] =
    entityConfigFormProps[EntityConfigFormProp.UNIQUE_CONSTRAINTS].default;

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
      this.entityConfig.allowTags === this[EntityConfigFormProp.ALLOW_TAGS] &&
      this.entityConfig.allowComments ===
        this[EntityConfigFormProp.ALLOW_COMMENTS] &&
      this.entityConfig.aiEnabled === this[EntityConfigFormProp.AI_ENABLED] &&
      this.entityConfig.aiIdentifyPrompt ===
        this[EntityConfigFormProp.AI_IDENTIFY_PROMPT] &&
      this.entityConfig.public === this[EntityConfigFormProp.PUBLIC]
    );
  }

  get isSaveEnabled(): boolean {
    return !this.isSaving && (!this.inSync || this.saveNewRevision);
  }

  get nonCalculatedProperties(): EntityPropertyConfig[] {
    return this.entityConfig.properties.filter(
      (p): p is EntityPropertyConfig => !('calculation' in p),
    );
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
      allowTags: this[EntityConfigFormProp.ALLOW_TAGS],
      allowComments: this[EntityConfigFormProp.ALLOW_COMMENTS],
      aiEnabled: this[EntityConfigFormProp.AI_ENABLED],
      aiClassifyEnabled: false,
      aiIdentifyPrompt: this[EntityConfigFormProp.AI_IDENTIFY_PROMPT],
      viewAccessPolicy: this[EntityConfigFormProp.VIEW_ACCESS_POLICY],
      editAccessPolicy: this[EntityConfigFormProp.EDIT_ACCESS_POLICY],
      public: this[EntityConfigFormProp.PUBLIC],
      uniqueConstraints: this[EntityConfigFormProp.UNIQUE_CONSTRAINTS],
    };
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
    let result: (Entity.EntityConfig & { allowComments?: boolean }) | null =
      null;

    const entityConfig = this.saveNewRevision
      ? {
          ...this.entityConfig,
          id: 0,
          revisionOf: this.entityConfig.id,
          properties: this.entityConfig.properties.map(p => ({ ...p, id: 0 })),
        }
      : { ...this.entityConfig };

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

  private handleConfigChanged(e: EntityConfigGeneralConfigChangedEvent): void {
    this.entityConfig = e.detail;
  }

  private handleSaveNewRevisionToggled(
    e: EntityConfigGeneralSaveNewRevisionToggledEvent,
  ): void {
    this.saveNewRevision = e.detail.value;
  }

  private handleSaveRequested(_e: EntityConfigGeneralSaveRequestedEvent): void {
    this.save();
  }

  private handleDeleteRequested(
    _e: EntityConfigGeneralDeleteRequestedEvent,
  ): void {
    this.confirmationModalIsOpen = true;
  }

  private handlePropertiesChanged(e: EntityConfigPropertiesChangedEvent): void {
    this.entityConfig = { ...this.entityConfig, properties: e.detail };
  }

  private handleBreakingChangesUpdated(
    e: EntityConfigPropertiesBreakingChangesUpdatedEvent,
  ): void {
    this.hasBreakingChanges = e.detail.hasBreakingChanges;
  }

  get tabRegistry(): TabEntry[] {
    return [
      {
        heading: translate('entityConfigForm.tab.config'),
        content: () => html`
          <entity-config-general
            .entityConfig=${this.entityConfig}
            ?hasBreakingChanges=${this.hasBreakingChanges}
            ?isSaving=${this.isSaving}
            ?isSaveEnabled=${this.isSaveEnabled}
            ?saveNewRevision=${this.saveNewRevision}
            @entity-config-general-config-changed=${this.handleConfigChanged}
            @entity-config-general-save-new-revision-toggled=${this
              .handleSaveNewRevisionToggled}
            @entity-config-general-save-requested=${this.handleSaveRequested}
            @entity-config-general-delete-requested=${this
              .handleDeleteRequested}
          ></entity-config-general>
        `,
        shouldShow: () => true,
      },
      {
        heading: translate('entityConfigForm.tab.properties'),
        content: () => html`
          <entity-config-properties
            entityConfigId=${this.entityConfig.id}
            .properties=${this.entityConfig.properties}
            ?performDriftCheck=${this.performDriftCheck}
            @entity-config-properties-changed=${this.handlePropertiesChanged}
            @entity-config-properties-breaking-changes-updated=${this
              .handleBreakingChangesUpdated}
          ></entity-config-properties>
        `,
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
      {
        heading: translate('entityConfigForm.tab.constraints'),
        content: () => html`
          <entity-config-constraints
            entityConfigId=${this.entityConfig.id}
            .uniqueConstraints=${this[EntityConfigFormProp.UNIQUE_CONSTRAINTS]}
            .nonCalculatedProperties=${this.nonCalculatedProperties}
          ></entity-config-constraints>
        `,
        shouldShow: () => !!this.entityConfig.id,
      },
    ];
  }

  get visibleTabs(): TabEntry[] {
    return this.tabRegistry.filter(tab => tab.shouldShow());
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
