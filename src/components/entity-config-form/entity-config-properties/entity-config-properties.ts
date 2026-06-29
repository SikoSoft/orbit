import { html, css, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import {
  DataType,
  defaultEntityPropertyConfig,
  EntityCalculatedPropertyConfig,
  EntityPropertyConfig,
} from 'api-spec/models/Entity';
import { translate } from '@/lib/Localization';
import { addToast } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';
import { storage } from '@/lib/Storage';
import { appState } from '@/state';
import { themed } from '@/lib/Theme';
import { MobxLitElement } from '@adobe/lit-mobx';
import { SortUpdatedEvent } from '@ss/ui/components/sortable-list.events';
import {
  PropertyConfigAddedEvent,
  PropertyConfigBreakingChangeDetectedEvent,
  PropertyConfigUpdatedEvent,
} from '@/components/property-config-form/property-config-form.events';

import '@/components/property-config-form/property-config-form';
import '@ss/ui/components/ss-button';
import '@ss/ui/components/sortable-list';
import '@ss/ui/components/sortable-item';

import {
  EntityConfigPropertiesProp,
  EntityConfigPropertiesProps,
  entityConfigPropertiesProps,
} from './entity-config-properties.models';
import {
  EntityConfigPropertiesChangedEvent,
  EntityConfigPropertiesBreakingChangesUpdatedEvent,
} from './entity-config-properties.events';
import { PropertyConfigProblemMap } from '../entity-config-form.models';

@themed()
@customElement('entity-config-properties')
export class EntityConfigProperties extends MobxLitElement {
  public state = appState;

  static styles = css`
    :host {
      display: block;
    }

    ss-collapsable::part(head) {
      font-weight: bold;
    }
  `;

  @property({ type: Number })
  [EntityConfigPropertiesProp.ENTITY_CONFIG_ID]: EntityConfigPropertiesProps[EntityConfigPropertiesProp.ENTITY_CONFIG_ID] =
    entityConfigPropertiesProps[
      EntityConfigPropertiesProp.ENTITY_CONFIG_ID
    ].default;

  @property({ type: Array })
  [EntityConfigPropertiesProp.PROPERTIES]: EntityConfigPropertiesProps[EntityConfigPropertiesProp.PROPERTIES] =
    entityConfigPropertiesProps[EntityConfigPropertiesProp.PROPERTIES]
      .default;

  @property({ type: Boolean })
  [EntityConfigPropertiesProp.PERFORM_DRIFT_CHECK]: EntityConfigPropertiesProps[EntityConfigPropertiesProp.PERFORM_DRIFT_CHECK] =
    entityConfigPropertiesProps[
      EntityConfigPropertiesProp.PERFORM_DRIFT_CHECK
    ].default;

  @state()
  propertyConfigProblems: PropertyConfigProblemMap = [];

  get nonCalculatedProperties(): EntityPropertyConfig[] {
    return this[EntityConfigPropertiesProp.PROPERTIES].filter(
      (p): p is EntityPropertyConfig => !this.isCalculatedPropertyConfig(p),
    );
  }

  private isCalculatedPropertyConfig(
    p: EntityPropertyConfig | EntityCalculatedPropertyConfig,
  ): p is EntityCalculatedPropertyConfig {
    return 'calculation' in p;
  }

  private isPanelOpen(id: number): boolean {
    if (!id) {
      return true;
    }
    return this.state.collapsablePanelState[`propertyConfigForm-${id}`] || false;
  }

  private emitPropertiesChanged(
    properties: (EntityPropertyConfig | EntityCalculatedPropertyConfig)[],
  ): void {
    this.dispatchEvent(new EntityConfigPropertiesChangedEvent(properties));
  }

  private addPropertyToTop(): void {
    this.emitPropertiesChanged([
      { ...defaultEntityPropertyConfig },
      ...this[EntityConfigPropertiesProp.PROPERTIES],
    ]);
  }

  private addPropertyToBottom(): void {
    this.emitPropertiesChanged([
      ...this[EntityConfigPropertiesProp.PROPERTIES],
      { ...defaultEntityPropertyConfig },
    ]);
  }

  private updateProperty(
    index: number,
    updatedProperty: EntityPropertyConfig | EntityCalculatedPropertyConfig,
  ): void {
    this.emitPropertiesChanged(
      this[EntityConfigPropertiesProp.PROPERTIES].map((p, i) =>
        i === index ? updatedProperty : p,
      ),
    );
  }

  private deleteProperty(index: number): void {
    this.emitPropertiesChanged(
      this[EntityConfigPropertiesProp.PROPERTIES].filter(
        (_, i) => i !== index,
      ),
    );
  }

  private handleSortUpdated(e: SortUpdatedEvent): void {
    storage.setEntityPropertyOrder(
      this[EntityConfigPropertiesProp.ENTITY_CONFIG_ID],
      e.detail.sortedIds.map((id, index) => ({ id: Number(id), order: index })),
    );
  }

  private handleBreakingChangeDetected(
    index: number,
    e: PropertyConfigBreakingChangeDetectedEvent,
  ): void {
    if (!this[EntityConfigPropertiesProp.PERFORM_DRIFT_CHECK]) {
      return;
    }

    addToast(
      translate('propertyConfig.breakingChangeDetected'),
      NotificationType.ERROR,
    );

    const { problems } = e.detail;
    this.propertyConfigProblems = this.propertyConfigProblems.map((p, i) =>
      i === index ? problems : p,
    ) as PropertyConfigProblemMap;

    this.dispatchEvent(
      new EntityConfigPropertiesBreakingChangesUpdatedEvent({
        hasBreakingChanges: true,
      }),
    );
  }

  private handleBreakingChangesResolved(index: number): void {
    this.propertyConfigProblems = this.propertyConfigProblems.map((p, i) =>
      i === index ? undefined : p,
    ) as PropertyConfigProblemMap;

    const hasBreakingChanges = this.propertyConfigProblems.some(
      p => p !== undefined,
    );
    this.dispatchEvent(
      new EntityConfigPropertiesBreakingChangesUpdatedEvent({
        hasBreakingChanges,
      }),
    );
  }

  private renderPropertyForm(
    property: EntityPropertyConfig | EntityCalculatedPropertyConfig,
    index: number,
  ): TemplateResult {
    const isCalc = this.isCalculatedPropertyConfig(property);
    const calcProp = isCalc
      ? (property as EntityCalculatedPropertyConfig)
      : null;
    const stdProp = isCalc ? null : (property as EntityPropertyConfig);

    return html`
      <property-config-form
        ?open=${this.isPanelOpen(property.id)}
        entityConfigId=${this[EntityConfigPropertiesProp.ENTITY_CONFIG_ID]}
        propertyConfigId=${property.id}
        name=${property.name}
        prefix=${property.prefix}
        suffix=${property.suffix}
        ?hidden=${property.hidden}
        dataType=${stdProp?.dataType ?? DataType.INT}
        required=${stdProp?.required ?? 0}
        repeat=${stdProp?.repeat ?? 0}
        allowed=${stdProp?.allowed ?? 0}
        ?optionsOnly=${stdProp?.optionsOnly ?? false}
        .options=${stdProp?.options ?? []}
        .defaultValue=${stdProp?.defaultValue ?? 0}
        ?performDriftCheck=${this[EntityConfigPropertiesProp.PERFORM_DRIFT_CHECK]}
        .calculation=${calcProp?.calculation ?? null}
        .allProperties=${this.nonCalculatedProperties}
        @property-config-updated=${(e: PropertyConfigUpdatedEvent): void =>
          this.updateProperty(index, e.detail)}
        @property-config-added=${(e: PropertyConfigAddedEvent): void =>
          this.updateProperty(index, e.detail)}
        @property-config-deleted=${(): void => this.deleteProperty(index)}
        @property-config-breaking-change-detected=${(
          e: PropertyConfigBreakingChangeDetectedEvent,
        ): void => this.handleBreakingChangeDetected(index, e)}
        @property-config-breaking-changes-resolved=${(): void =>
          this.handleBreakingChangesResolved(index)}
      ></property-config-form>
    `;
  }

  render(): TemplateResult {
    return html`
      <div class="properties">
        <ss-button @click=${this.addPropertyToTop}>
          ${translate('addProperty')}
        </ss-button>

        <sortable-list @sort-updated=${this.handleSortUpdated}>
          ${repeat(
            this[EntityConfigPropertiesProp.PROPERTIES],
            property => property.id,
            (property, index) =>
              html`<sortable-item id=${property.id}>
                ${this.renderPropertyForm(property, index)}
              </sortable-item>`,
          )}
        </sortable-list>

        <ss-button @click=${this.addPropertyToBottom}>
          ${translate('addProperty')}
        </ss-button>
      </div>
    `;
  }
}
