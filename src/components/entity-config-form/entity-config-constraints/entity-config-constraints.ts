import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { EntityConfigUniqueConstraint } from 'api-spec/models/Entity';
import { translate } from '@/lib/Localization';
import { addToast } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';
import { storage } from '@/lib/Storage';
import { themed } from '@/lib/Theme';

import '@ss/ui/components/ss-button';

import {
  EntityConfigConstraintsProp,
  EntityConfigConstraintsProps,
  entityConfigConstraintsProps,
} from './entity-config-constraints.models';

@themed()
@customElement('entity-config-constraints')
export class EntityConfigConstraints extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .buttons {
      padding: 0.5rem 0;

      ss-button {
        display: block;
        margin-bottom: 0.5rem;
      }
    }

    .constraint {
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .constraint-properties {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .constraint-property {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      cursor: pointer;
    }
  `;

  @property({ type: Number })
  [EntityConfigConstraintsProp.ENTITY_CONFIG_ID]: EntityConfigConstraintsProps[EntityConfigConstraintsProp.ENTITY_CONFIG_ID] =
    entityConfigConstraintsProps[
      EntityConfigConstraintsProp.ENTITY_CONFIG_ID
    ].default;

  @property({ type: Array })
  [EntityConfigConstraintsProp.UNIQUE_CONSTRAINTS]: EntityConfigConstraintsProps[EntityConfigConstraintsProp.UNIQUE_CONSTRAINTS] =
    entityConfigConstraintsProps[
      EntityConfigConstraintsProp.UNIQUE_CONSTRAINTS
    ].default;

  @property({ type: Array })
  [EntityConfigConstraintsProp.NON_CALCULATED_PROPERTIES]: EntityConfigConstraintsProps[EntityConfigConstraintsProp.NON_CALCULATED_PROPERTIES] =
    entityConfigConstraintsProps[
      EntityConfigConstraintsProp.NON_CALCULATED_PROPERTIES
    ].default;

  @state()
  localConstraints: EntityConfigUniqueConstraint[] = [];

  @state()
  isSavingConstraints = false;

  connectedCallback(): void {
    super.connectedCallback();
    this.localConstraints = this[
      EntityConfigConstraintsProp.UNIQUE_CONSTRAINTS
    ].map(c => ({ ...c, propertyIds: [...c.propertyIds] }));
  }

  private addConstraint(): void {
    this.localConstraints = [...this.localConstraints, { propertyIds: [] }];
  }

  private removeConstraint(index: number): void {
    this.localConstraints = this.localConstraints.filter((_, i) => i !== index);
  }

  private toggleConstraintProperty(
    constraintIndex: number,
    propertyId: number,
  ): void {
    this.localConstraints = this.localConstraints.map((c, i) => {
      if (i !== constraintIndex) {
        return c;
      }
      const propertyIds = c.propertyIds.includes(propertyId)
        ? c.propertyIds.filter(id => id !== propertyId)
        : [...c.propertyIds, propertyId];
      return { ...c, propertyIds };
    });
  }

  private async saveConstraints(): Promise<void> {
    this.isSavingConstraints = true;
    const result = await storage.saveEntityConfigUniqueConstraints(
      this[EntityConfigConstraintsProp.ENTITY_CONFIG_ID],
      this.localConstraints,
    );
    this.isSavingConstraints = false;

    if (!result) {
      addToast(
        translate('entityConfigForm.constraints.saveError'),
        NotificationType.ERROR,
      );
      return;
    }

    addToast(
      translate('entityConfigForm.constraints.saveSuccess'),
      NotificationType.SUCCESS,
    );
  }

  render(): TemplateResult {
    return html`
      <div class="constraints">
        ${repeat(
          this.localConstraints,
          (_, i) => i,
          (constraint, index) => html`
            <div class="constraint">
              <div class="constraint-properties">
                ${repeat(
                  this[
                    EntityConfigConstraintsProp.NON_CALCULATED_PROPERTIES
                  ],
                  p => p.id,
                  property => html`
                    <label class="constraint-property">
                      <input
                        type="checkbox"
                        ?checked=${constraint.propertyIds.includes(property.id)}
                        @change=${(): void =>
                          this.toggleConstraintProperty(index, property.id)}
                      />
                      ${property.name}
                    </label>
                  `,
                )}
              </div>
              <ss-button
                negative
                @click=${(): void => this.removeConstraint(index)}
              >
                ${translate('remove')}
              </ss-button>
            </div>
          `,
        )}

        <div class="buttons">
          <ss-button @click=${this.addConstraint}>
            ${translate('entityConfigForm.constraints.addConstraint')}
          </ss-button>

          <ss-button
            positive
            ?disabled=${this.isSavingConstraints}
            @click=${this.saveConstraints}
          >
            ${translate('save')}
          </ss-button>
        </div>
      </div>
    `;
  }
}
