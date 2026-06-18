import { html, css, nothing, TemplateResult, LitElement } from 'lit';
import { property, customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { v4 as uuidv4 } from 'uuid';
import { MobxLitElement } from '@adobe/lit-mobx';

import {
  DataType,
  EntityCalculatedPropertyConfig,
  EntityConfig,
  EntityProperty,
  PropertyDataValue,
  EntityPropertyConfig,
  ImageDataValue,
} from 'api-spec/models/Entity';

import { appState } from '@/state';
import { sha256 } from '@/lib/Util';
import { Time } from '@/lib/Time';
import { translate } from '@/lib/Localization';

import {
  EntityFormPropertiesProp,
  entityFormPropertiesProps,
  EntityFormPropertiesProps,
} from './entity-form-properties.models';
import {
  PropertyInstance,
  PropertyReference,
  ValidateionResult,
} from '../entity-form.models';
import {
  EntityFormPropertiesChangedEvent,
  EntityFormPropertySubmittedEvent,
} from './entity-form-properties.events';

import '@ss/ui/components/pop-up';
import '@ss/ui/components/ss-button';
import '@ss/ui/components/sortable-list';
import { SortUpdatedEvent } from '@ss/ui/components/sortable-list.events';
import '@/components/entity-form/property-field/property-field';
import { PropertyField } from '@/components/entity-form/property-field/property-field';
import {
  PropertyChangedEvent,
  PropertyClonedEvent,
  PropertyDeletedEvent,
  PropertySubmittedEvent,
} from '../property-field/property-field.events';

@customElement('entity-form-properties')
export class EntityFormProperties extends MobxLitElement {
  private state = appState;

  static styles = css`
    :host {
      display: block;
    }

    property-field {
      margin-bottom: 1rem;
    }

    .buttons {
      margin-top: 1rem;
    }

    .property-option {
      cursor: pointer;
      padding: 0.5rem;

      &:hover {
        background-color: var(--background-hover-color);
      }
    }

    .property-group-label {
      font-size: 0.75rem;
      font-weight: bold;
      text-transform: uppercase;
      color: var(--text-secondary-color, #666);
      padding: 0.5rem 0.5rem 0.25rem;
      margin-top: 0.25rem;
      border-top: 1px solid var(--border-color, #ddd);
    }
  `;

  @property({ type: Number })
  [EntityFormPropertiesProp.ENTITY_ID]: EntityFormPropertiesProps[EntityFormPropertiesProp.ENTITY_ID] =
    entityFormPropertiesProps[EntityFormPropertiesProp.ENTITY_ID].default;

  @property({ type: Object })
  [EntityFormPropertiesProp.ENTITY_CONFIG]: EntityFormPropertiesProps[EntityFormPropertiesProp.ENTITY_CONFIG] =
    entityFormPropertiesProps[EntityFormPropertiesProp.ENTITY_CONFIG].default;

  @property({ type: Array })
  [EntityFormPropertiesProp.PROPERTIES]: EntityFormPropertiesProps[EntityFormPropertiesProp.PROPERTIES] =
    entityFormPropertiesProps[EntityFormPropertiesProp.PROPERTIES].default;

  @state() private propertyInstances: PropertyInstance[] = [];
  @state() private sortedIds: string[] = [];
  @state() private propertyPopUpIsOpen = false;
  @state() private propertiesSetup = false;
  @state() private propertyReferences: PropertyReference[] = [];

  get allowedPropertiesToAdd(): EntityPropertyConfig[] {
    if (!this.entityConfig) {
      return [];
    }
    return this.entityConfig.properties
      .filter((p): p is EntityPropertyConfig => !('calculation' in p))
      .filter(propertyConfig => !this.propertyAtMax(propertyConfig.id));
  }

  get allowedCalculatedPropertiesToAdd(): EntityCalculatedPropertyConfig[] {
    if (!this.entityConfig) {
      return [];
    }
    return this.entityConfig.properties
      .filter(
        (p): p is EntityCalculatedPropertyConfig => 'calculation' in p,
      )
      .filter(
        propertyConfig =>
          !this.propertyInstances.some(
            instance => instance.propertyConfigId === propertyConfig.id,
          ),
      );
  }

  get canAddProperty(): boolean {
    if (!this.entityConfig) {
      return false;
    }
    return (
      this.allowedPropertiesToAdd.length > 0 ||
      this.allowedCalculatedPropertiesToAdd.length > 0
    );
  }

  updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);

    if (!this.propertiesSetup) {
      this.setupProperties();
    }

    if (
      changedProperties.has(EntityFormPropertiesProp.PROPERTIES) &&
      this.entityConfig
    ) {
      this.propertyReferences = [];
      for (const property of this.properties) {
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

  private propertyAtMax(propertyId: number): boolean {
    if (!this.entityConfig) {
      return true;
    }
    const propertyConfig = this.entityConfig.properties.find(
      prop => prop.id === propertyId,
    );
    if (!propertyConfig || 'calculation' in propertyConfig) {
      return true;
    }
    const count = this.numberOfPropertiesWithType(
      propertyConfig.dataType,
      propertyId,
      false,
    );
    return count >= propertyConfig.allowed;
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

  validateConstraints(): ValidateionResult {
    const errors: string[] = [];

    if (!this.entityConfig) {
      errors.push(translate('entityTypeRequired'));
      return { isValid: false, errors };
    }

    this.entityConfig.properties.forEach(propertyConfig => {
      if ('calculation' in propertyConfig) {
        return;
      }

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

  getPayload(): {
    properties: EntityProperty[];
    propertyReferences: PropertyReference[];
  } {
    return {
      properties: this.mapInstancesToProperties(),
      propertyReferences: this.propertyReferences,
    };
  }

  private async getInstancesHash(): Promise<string> {
    return await sha256(JSON.stringify(this.mapInstancesToProperties()));
  }

  private setSortedIds(sortedIds: string[]): void {
    this.sortedIds = sortedIds;
  }

  async setupProperties(): Promise<void> {
    if (!this.entityConfig || this.propertiesSetup) {
      return;
    }

    const existingProperties: PropertyInstance[] = this.properties.map(
      property => {
        const propConfig = this.entityConfig!.properties.find(
          p => p.id === property.propertyConfigId,
        );
        let value = property.value;
        if (
          propConfig?.dataType === DataType.DATE &&
          typeof value === 'number'
        ) {
          value = Time.formatDateTime(new Date(value));
        }
        return {
          propertyConfigId: property.propertyConfigId,
          instanceId: property.id,
          uiId: uuidv4(),
          value,
          valueIsSet: true,
        };
      },
    );

    const availableProperties: PropertyInstance[] =
      this.entityConfig.properties
        .filter(
          propertyConfig =>
            !existingProperties.some(
              existing => existing.propertyConfigId === propertyConfig.id,
            ),
        )
        .map(propertyConfig => {
          const value = propertyConfig.defaultValue;
          return {
            propertyConfigId: propertyConfig.id,
            instanceId: 0,
            uiId: uuidv4(),
            value,
            valueIsSet:
              'calculation' in propertyConfig ||
              propertyConfig.dataType === DataType.DATE ||
              propertyConfig.dataType === DataType.BOOLEAN ||
              (propertyConfig.dataType === DataType.INT &&
                value !== propertyConfig.defaultValue)
                ? true
                : false,
          };
        });

    if (this.entityId) {
      this.propertyInstances = [...existingProperties];
    } else {
      this.propertyInstances = [...existingProperties, ...availableProperties];
    }

    this.setSortedIds(this.propertyInstances.map(prop => prop.uiId));
    this.propertiesSetup = true;

    const instancesHash = await this.getInstancesHash();
    this.dispatchEvent(
      new EntityFormPropertiesChangedEvent({
        instancesHash,
        sortedIds: this.sortedIds,
        isInitial: true,
      }),
    );
  }

  async reset(): Promise<void> {
    this.propertiesSetup = false;
    this.propertyInstances = [];
    await this.setupProperties();
  }

  async focusFirstField(): Promise<void> {
    await this.updateComplete;
    const firstField = this.renderRoot.querySelector(
      'property-field',
    ) as PropertyField | null;

    if (firstField) {
      await (firstField as unknown as LitElement).updateComplete;
      firstField.focus();
    }
  }

  private addProperty(
    propertyConfig: EntityPropertyConfig | EntityCalculatedPropertyConfig,
  ): void {
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

  private showAddPropertyPopUp(): void {
    this.propertyPopUpIsOpen = true;
  }

  private handleAddPropertyOptionClick(
    propertyConfig: EntityPropertyConfig | EntityCalculatedPropertyConfig,
  ): void {
    this.addProperty(propertyConfig);
    this.propertyPopUpIsOpen = false;
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
    const instancesHash = await this.getInstancesHash();
    this.dispatchEvent(
      new EntityFormPropertiesChangedEvent({
        instancesHash,
        sortedIds: this.sortedIds,
        isInitial: false,
      }),
    );
  }

  private async handlePropertyCloned(e: PropertyClonedEvent): Promise<void> {
    const { uiId } = e.detail;
    const propertyInstanceIndex = this.propertyInstances.findIndex(
      property => property.uiId === uiId,
    );
    this.propertyInstances = [
      ...this.propertyInstances.slice(0, propertyInstanceIndex + 1),
      { ...this.propertyInstances[propertyInstanceIndex], uiId: uuidv4() },
      ...this.propertyInstances.slice(propertyInstanceIndex + 1),
    ];
    const instancesHash = await this.getInstancesHash();
    this.dispatchEvent(
      new EntityFormPropertiesChangedEvent({
        instancesHash,
        sortedIds: this.sortedIds,
        isInitial: false,
      }),
    );
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
    const instancesHash = await this.getInstancesHash();
    this.dispatchEvent(
      new EntityFormPropertiesChangedEvent({
        instancesHash,
        sortedIds: this.sortedIds,
        isInitial: false,
      }),
    );
  }

  private handlePropertySubmitted(e: PropertySubmittedEvent): void {
    const { uiId } = e.detail;
    const propertyInstanceIndex = this.propertyInstances.findIndex(
      property => property.uiId === uiId,
    );
    if (propertyInstanceIndex < 0) {
      return;
    }
    this.dispatchEvent(new EntityFormPropertySubmittedEvent());
  }

  private sortUpdated(e: SortUpdatedEvent): void {
    this.setSortedIds(e.detail.sortedIds);
    this.getInstancesHash().then(instancesHash => {
      this.dispatchEvent(
        new EntityFormPropertiesChangedEvent({
          instancesHash,
          sortedIds: this.sortedIds,
          isInitial: false,
        }),
      );
    });
  }

  private renderPropertyField(
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

  render(): TemplateResult {
    return html`
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
                  >${this.renderPropertyField(propertyInstance)}</sortable-item
                >`,
            )
          : nothing}
      </sortable-list>

      <div class="buttons">
        ${this.canAddProperty
          ? html`<ss-button @click=${this.showAddPropertyPopUp}
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
                @click=${(): void =>
                  this.handleAddPropertyOptionClick(propertyConfig)}
              >
                ${propertyConfig.name}
              </div>
            </div>`,
        )}
        ${this.allowedCalculatedPropertiesToAdd.length > 0
          ? html`
              <div class="property-group-label">
                ${translate('calculatedPropertyConfig.calculated')}
              </div>
              ${repeat(
                this.allowedCalculatedPropertiesToAdd,
                propertyConfig => propertyConfig.id,
                propertyConfig =>
                  html`<div class="property-option">
                    <div
                      @click=${(): void =>
                        this.handleAddPropertyOptionClick(propertyConfig)}
                    >
                      ${propertyConfig.name}
                    </div>
                  </div>`,
              )}
            `
          : nothing}
      </pop-up>
    `;
  }
}
