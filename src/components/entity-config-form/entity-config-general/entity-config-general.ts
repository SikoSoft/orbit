import { LitElement, html, css, nothing, TemplateResult, PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { translate } from '@/lib/Localization';
import { themed } from '@/lib/Theme';
import { InputChangedEvent } from '@ss/ui/components/ss-input.events';
import { ToggleChangedEvent } from '@ss/ui/components/ss-toggle.events';

import '@ss/ui/components/ss-input';
import '@ss/ui/components/ss-toggle';
import '@ss/ui/components/ss-button';

import {
  EntityConfigGeneralProp,
  EntityConfigGeneralProps,
  entityConfigGeneralProps,
} from './entity-config-general.models';
import {
  EntityConfigGeneralConfigChangedEvent,
  EntityConfigGeneralDeleteRequestedEvent,
  EntityConfigGeneralSaveNewRevisionToggledEvent,
  EntityConfigGeneralSaveRequestedEvent,
} from './entity-config-general.events';
import { ExtendedEntityConfig } from '../entity-config-form.models';

@themed()
@customElement('entity-config-general')
export class EntityConfigGeneral extends LitElement {
  static styles = css`
    :host {
      display: block;
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
  `;

  @property({ type: Object })
  [EntityConfigGeneralProp.ENTITY_CONFIG]: EntityConfigGeneralProps[EntityConfigGeneralProp.ENTITY_CONFIG] =
    entityConfigGeneralProps[EntityConfigGeneralProp.ENTITY_CONFIG].default;

  @property({ type: Boolean })
  [EntityConfigGeneralProp.HAS_BREAKING_CHANGES]: EntityConfigGeneralProps[EntityConfigGeneralProp.HAS_BREAKING_CHANGES] =
    entityConfigGeneralProps[
      EntityConfigGeneralProp.HAS_BREAKING_CHANGES
    ].default;

  @property({ type: Boolean })
  [EntityConfigGeneralProp.IS_SAVING]: EntityConfigGeneralProps[EntityConfigGeneralProp.IS_SAVING] =
    entityConfigGeneralProps[EntityConfigGeneralProp.IS_SAVING].default;

  @property({ type: Boolean })
  [EntityConfigGeneralProp.IS_SAVE_ENABLED]: EntityConfigGeneralProps[EntityConfigGeneralProp.IS_SAVE_ENABLED] =
    entityConfigGeneralProps[
      EntityConfigGeneralProp.IS_SAVE_ENABLED
    ].default;

  @property({ type: Boolean })
  [EntityConfigGeneralProp.SAVE_NEW_REVISION]: EntityConfigGeneralProps[EntityConfigGeneralProp.SAVE_NEW_REVISION] =
    entityConfigGeneralProps[
      EntityConfigGeneralProp.SAVE_NEW_REVISION
    ].default;

  @query('.revision-target')
  revisionTarget!: HTMLElement;

  updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (
      changedProperties.has(EntityConfigGeneralProp.HAS_BREAKING_CHANGES) &&
      this[EntityConfigGeneralProp.HAS_BREAKING_CHANGES] &&
      this.revisionTarget
    ) {
      this.revisionTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  private emitConfigChanged(patch: Partial<ExtendedEntityConfig>): void {
    this.dispatchEvent(
      new EntityConfigGeneralConfigChangedEvent({
        ...this[EntityConfigGeneralProp.ENTITY_CONFIG],
        ...patch,
      }),
    );
  }

  private handleNameChanged(e: InputChangedEvent): void {
    this.emitConfigChanged({ name: e.detail.value });
  }

  private handleDescriptionChanged(e: InputChangedEvent): void {
    this.emitConfigChanged({ description: e.detail.value });
  }

  private handleAllowPropertyOrderingChanged(e: ToggleChangedEvent): void {
    this.emitConfigChanged({ allowPropertyOrdering: e.detail.on });
  }

  private handleAllowTagsChanged(e: ToggleChangedEvent): void {
    this.emitConfigChanged({ allowTags: e.detail.on });
  }

  private handleAllowCommentsChanged(e: ToggleChangedEvent): void {
    this.emitConfigChanged({ allowComments: e.detail.on });
  }

  private handleAiEnabledChanged(e: ToggleChangedEvent): void {
    this.emitConfigChanged({ aiEnabled: e.detail.on });
  }

  private handleAiIdentifyPromptChanged(e: InputChangedEvent): void {
    this.emitConfigChanged({ aiIdentifyPrompt: e.detail.value });
  }

  private handlePublicChanged(e: ToggleChangedEvent): void {
    this.emitConfigChanged({ public: e.detail.on });
  }

  private handleSaveNewRevisionToggled(): void {
    this.dispatchEvent(
      new EntityConfigGeneralSaveNewRevisionToggledEvent({
        value: !this[EntityConfigGeneralProp.SAVE_NEW_REVISION],
      }),
    );
  }

  private handleSaveClicked(): void {
    this.dispatchEvent(new EntityConfigGeneralSaveRequestedEvent());
  }

  private handleDeleteClicked(): void {
    this.dispatchEvent(new EntityConfigGeneralDeleteRequestedEvent());
  }

  render(): TemplateResult {
    const config = this[EntityConfigGeneralProp.ENTITY_CONFIG];
    if (!config) {
      return html``;
    }

    return html`
      <div class="entity-config-general">
        <div class="field">
          <label for="entity-name">${translate('entityName')}</label>
          <ss-input
            id="entity-name"
            .value=${config.name}
            @input-changed=${this.handleNameChanged}
          ></ss-input>
        </div>

        <div class="field">
          <label for="entity-description">${translate('entityDescription')}</label>
          <ss-input
            id="entity-description"
            .value=${config.description}
            @input-changed=${this.handleDescriptionChanged}
          ></ss-input>
        </div>

        <div class="field">
          <label for="allow-property-ordering">${translate('allowPropertyOrdering')}</label>
          <ss-toggle
            ?on=${config.allowPropertyOrdering}
            @toggle-changed=${this.handleAllowPropertyOrderingChanged}
          ></ss-toggle>
        </div>

        <div class="field">
          <label for="allow-tags">${translate('allowTags')}</label>
          <ss-toggle
            ?on=${config.allowTags}
            @toggle-changed=${this.handleAllowTagsChanged}
          ></ss-toggle>
        </div>

        <div class="field">
          <label for="allow-comments">${translate('allowComments')}</label>
          <ss-toggle
            ?on=${config.allowComments}
            @toggle-changed=${this.handleAllowCommentsChanged}
          ></ss-toggle>
        </div>

        <div class="field">
          <label for="ai-enabled">${translate('aiEnabled')}</label>
          <ss-toggle
            ?on=${config.aiEnabled}
            @toggle-changed=${this.handleAiEnabledChanged}
          ></ss-toggle>
        </div>

        <div class="field">
          <label for="ai-identify-prompt">${translate('aiIdentifyPrompt')}</label>
          <ss-input
            id="ai-identify-prompt"
            .value=${config.aiIdentifyPrompt}
            @input-changed=${this.handleAiIdentifyPromptChanged}
          ></ss-input>
        </div>

        <div class="field">
          <label for="entity-config-public">${translate('entityConfigPublic')}</label>
          <ss-toggle
            ?on=${config.public}
            @toggle-changed=${this.handlePublicChanged}
          ></ss-toggle>
        </div>

        <div class="revision-target"></div>

        ${this[EntityConfigGeneralProp.HAS_BREAKING_CHANGES]
          ? html`
              <div class="revision-info">
                <div class="warning">${translate('breakingChangeWarning')}</div>
                <input
                  type="checkbox"
                  id="new-revision"
                  ?checked=${this[EntityConfigGeneralProp.SAVE_NEW_REVISION]}
                  @click=${this.handleSaveNewRevisionToggled}
                />
                <label for="new-revision">${translate('createNewRevision')}</label>
              </div>
            `
          : nothing}

        <div class="buttons">
          <ss-button
            positive
            ?disabled=${!this[EntityConfigGeneralProp.IS_SAVE_ENABLED]}
            @click=${this.handleSaveClicked}
          >
            ${translate(
              this[EntityConfigGeneralProp.SAVE_NEW_REVISION]
                ? 'createNewRevision'
                : config.id
                  ? 'update'
                  : 'create',
            )}
          </ss-button>

          <ss-button
            negative
            @click=${this.handleDeleteClicked}
          >
            ${translate('delete')}
          </ss-button>
        </div>
      </div>
    `;
  }
}
