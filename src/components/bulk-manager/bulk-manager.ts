import { MobxLitElement } from '@adobe/lit-mobx';
import { css, html, nothing, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { v4 as uuidv4 } from 'uuid';

import { translate } from '@/lib/Localization';
import { Operation, OperationType } from 'api-spec/models/Operation';
import {
  EntityProperty,
  EntityPropertyConfig,
  PropertyDataValue,
} from 'api-spec/models/Entity';
import { SettingName, TagSuggestions } from 'api-spec/models/Setting';
import { addToast } from '@/lib/Util';
import { appState } from '@/state';
import {
  BulkPropertyInstance,
  propertyOperations,
  taggingOperations,
} from './bulk-manager.models';
import { NotificationType } from '@ss/ui/components/notification-provider.models';

import { SelectChangedEvent } from '@ss/ui/components/ss-select.events';
import { OperationPerformedEvent } from './bulk-manager.events';
import { TagsUpdatedEvent } from '@ss/ui/components/tag-manager.events';
import { TagSuggestionsRequestedEvent } from '@ss/ui/components/tag-input.events';
import {
  PropertyChangedEvent,
  PropertyDeletedEvent,
} from '@/components/entity-form/property-field/property-field.events';

import '@ss/ui/components/ss-button';
import '@ss/ui/components/tag-manager';
import '@ss/ui/components/pop-up';
import '@/components/entity-form/property-field/property-field';
import { themed } from '@/lib/Theme';
import { storage } from '@/lib/Storage';

@themed()
@customElement('bulk-manager')
export class BulkManager extends MobxLitElement {
  private minLengthForSuggestion = 1;
  private state = appState;

  static styles = css`
    :host {
      display: block;
      position: sticky;
      top: 2rem;
      z-index: 20;
    }

    .bulk-manager {
      padding: 1rem;
      box-shadow: 0 0 10px #000;
      display: none;

      &.shown {
        display: block;
      }
    }

    .number-selected,
    .select-all {
      text-align: center;
      color: #555;
      padding: 1rem;
    }

    .property-manager {
      margin-top: 1rem;

      property-field {
        display: block;
        margin-bottom: 1rem;
      }
    }

    .property-option {
      cursor: pointer;
      padding: 0.5rem;

      &:hover {
        background-color: var(--background-hover-color);
      }
    }
  `;

  @state() operationType: OperationType = OperationType.ADD_TAGS;
  @state() tagValue: string = '';
  @state() tags: string[] = [];
  @state() loading: boolean = false;
  @state() lastInput = { value: '', hadResults: true };
  @state() tagSuggestions: string[] = [];
  @state() propertyInstances: BulkPropertyInstance[] = [];
  @state() propertyPopUpIsOpen: boolean = false;

  get tagSuggestionsEnabled(): boolean {
    if (!this.state.listConfig) {
      return false;
    }

    return (
      this.state.listConfig.setting[SettingName.TAG_SUGGESTIONS] !==
      TagSuggestions.DISABLED
    );
  }

  @state()
  get showTagManager(): boolean {
    return taggingOperations.includes(this.operationType);
  }

  @state()
  get showPropertyManager(): boolean {
    return propertyOperations.includes(this.operationType);
  }

  @state()
  get classes(): Record<string, boolean> {
    return {
      box: true,
      'bulk-manager': true,
      shown: this.state.selectedEntities.length > 0,
    };
  }

  @state()
  get availablePropertyConfigs(): EntityPropertyConfig[] {
    const selectedEntities = this.state.listEntities.filter(e =>
      this.state.selectedEntities.includes(e.id),
    );
    const entityConfigIds = [...new Set(selectedEntities.map(e => e.type))];
    const seen = new Set<number>();
    const result: EntityPropertyConfig[] = [];

    for (const entityConfigId of entityConfigIds) {
      const entityConfig = this.state.entityConfigs.find(
        c => c.id === entityConfigId,
      );
      if (entityConfig) {
        for (const propConfig of entityConfig.properties) {
          if (!seen.has(propConfig.id)) {
            seen.add(propConfig.id);
            result.push(propConfig);
          }
        }
      }
    }

    return result;
  }

  private handleTypeChanged(e: SelectChangedEvent<string>): void {
    const type = e.detail.value as OperationType;
    this.operationType = type;
    this.propertyInstances = [];
  }

  private buildProperties(): EntityProperty[] {
    return this.propertyInstances.map((inst, i) => ({
      id: 0,
      propertyConfigId: inst.propertyConfigId,
      value: inst.value,
      order: i,
    }));
  }

  private buildOperation(): Operation {
    switch (this.operationType) {
      case OperationType.REPLACE_TAGS:
        return { type: OperationType.REPLACE_TAGS, tags: this.tags };
      case OperationType.ADD_TAGS:
        return { type: OperationType.ADD_TAGS, tags: this.tags };
      case OperationType.REMOVE_TAGS:
        return { type: OperationType.REMOVE_TAGS, tags: this.tags };
      case OperationType.REPLACE_PROPERTIES:
        return {
          type: OperationType.REPLACE_PROPERTIES,
          properties: this.buildProperties(),
        };
      case OperationType.ADD_PROPERTIES:
        return {
          type: OperationType.ADD_PROPERTIES,
          properties: this.buildProperties(),
        };
      case OperationType.REMOVE_PROPERTIES:
        return {
          type: OperationType.REMOVE_PROPERTIES,
          properties: this.buildProperties(),
        };
      case OperationType.DELETE:
      default:
        return { type: OperationType.DELETE };
    }
  }

  private async handlePerformOperation(): Promise<void> {
    await storage.bulkOperation({
      operation: this.buildOperation(),
      entities: this.state.selectedEntities,
    });

    this.state.setSelectedEntities([]);
    this.state.setSelectMode(false);
    addToast(
      translate('operationPerformedSuccessfully'),
      NotificationType.INFO,
    );

    this.dispatchEvent(
      new OperationPerformedEvent({
        type: this.operationType,
        entities: this.state.selectedEntities,
      }),
    );
  }

  private handleTagsUpdated(e: TagsUpdatedEvent): void {
    this.tags = e.detail.tags;
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

  private handlePropertyChanged(e: PropertyChangedEvent): void {
    const { uiId, value } = e.detail;
    this.propertyInstances = this.propertyInstances.map(inst =>
      inst.uiId === uiId
        ? { ...inst, value: value as PropertyDataValue }
        : inst,
    );
  }

  private handlePropertyDeleted(e: PropertyDeletedEvent): void {
    const { uiId } = e.detail;
    this.propertyInstances = this.propertyInstances.filter(
      inst => inst.uiId !== uiId,
    );
  }

  private addProperty(propertyConfig: EntityPropertyConfig): void {
    this.propertyInstances = [
      ...this.propertyInstances,
      {
        uiId: uuidv4(),
        propertyConfigId: propertyConfig.id,
        value: propertyConfig.defaultValue,
      },
    ];
  }

  private handleSelectAll(): void {
    this.state.toggleSelectAll();
  }

  private renderPropertyManager(): TemplateResult | typeof nothing {
    if (!this.showPropertyManager) {
      console.log('Not showing property manager');
      return nothing;
    }

    console.log(
      'Showing property manager with instances:',
      this.propertyInstances,
    );

    return html`
      <div class="property-manager">
        ${repeat(
          this.propertyInstances,
          inst => inst.uiId,
          inst => {
            const propertyConfig = this.state.propertyConfigs.find(
              pc => pc.id === inst.propertyConfigId,
            );
            return html`<property-field
              .value=${inst.value}
              uiId=${inst.uiId}
              entityConfigId=${propertyConfig?.entityConfigId ?? 0}
              propertyConfigId=${inst.propertyConfigId}
              @property-changed=${this.handlePropertyChanged}
              @property-deleted=${this.handlePropertyDeleted}
            ></property-field>`;
          },
        )}
        ${this.availablePropertyConfigs.length > 0
          ? html`
              <ss-button
                text=${translate('addProperty')}
                @click=${(): void => {
                  this.propertyPopUpIsOpen = true;
                }}
              ></ss-button>

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
                  this.availablePropertyConfigs,
                  pc => pc.id,
                  pc => html`
                    <div
                      class="property-option"
                      @click=${(): void => {
                        this.addProperty(pc);
                        this.propertyPopUpIsOpen = false;
                      }}
                    >
                      ${pc.name}
                    </div>
                  `,
                )}
              </pop-up>
            `
          : nothing}
      </div>
    `;
  }

  render(): TemplateResult {
    return html`
      <div class=${classMap(this.classes)}>
        <ss-select
          selected=${this.operationType}
          @select-changed=${this.handleTypeChanged}
          .options=${Object.values(OperationType).map(type => ({
            value: type,
            label: translate(`operationType.${type}`),
          }))}
        ></ss-select>

        ${this.showTagManager
          ? html`
              <tag-manager
                ?enableSuggestions=${this.tagSuggestionsEnabled}
                value=${this.tagValue}
                @tags-updated=${this.handleTagsUpdated}
                @tag-suggestions-requested=${this.handleTagSuggestionsRequested}
              >
                <div slot="tags">
                  ${repeat(
                    this.tags,
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
            `
          : nothing}
        ${this.renderPropertyManager()}

        <div class="number-selected">
          ${this.state.selectedEntities.length === 1
            ? translate('1ItemSelected')
            : translate('xItemsSelected', {
                count: this.state.selectedEntities.length,
              })}
        </div>

        <div class="select-all">
          <ss-button
            text=${translate('selectAll')}
            @click=${this.handleSelectAll}
          ></ss-button>
        </div>

        <ss-button
          text=${translate('performOperation')}
          @click=${this.handlePerformOperation}
        ></ss-button>
      </div>
    `;
  }
}
