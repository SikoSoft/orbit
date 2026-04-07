import { MobxLitElement } from '@adobe/lit-mobx';
import { css, html, nothing, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

import { translate } from '@/lib/Localization';
import { OperationType } from 'api-spec/models/Operation';
import { SettingName, TagSuggestions } from 'api-spec/models/Setting';
import { addToast } from '@/lib/Util';
import { appState } from '@/state';
import { taggingOperations } from './bulk-manager.models';
import { NotificationType } from '@ss/ui/components/notification-provider.models';

import { SelectChangedEvent } from '@ss/ui/components/ss-select.events';
import { OperationPerformedEvent } from './bulk-manager.events';
import { TagsUpdatedEvent } from '@ss/ui/components/tag-manager.events';
import { TagSuggestionsRequestedEvent } from '@ss/ui/components/tag-input.events';

import '@ss/ui/components/ss-button';
import '@ss/ui/components/tag-manager';
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
  `;

  @state() operationType: OperationType = OperationType.ADD_TAGS;
  @state() tagValue: string = '';
  @state() tags: string[] = [];
  @state() loading: boolean = false;
  @state() lastInput = { value: '', hadResults: true };
  @state() tagSuggestions: string[] = [];

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
  get classes(): Record<string, boolean> {
    return {
      box: true,
      'bulk-manager': true,
      shown: this.state.selectedActions.length > 0,
    };
  }

  private handleTypeChanged(e: SelectChangedEvent<string>): void {
    const type = e.detail.value as OperationType;
    this.operationType = type;
  }

  private async handlePerformOperation(): Promise<void> {
    await storage.bulkOperation({
      operation: { tags: this.tags, type: this.operationType },
      actions: this.state.selectedActions,
    });

    this.state.setSelectedActions([]);
    this.state.setSelectMode(false);
    addToast(
      translate('operationPerformedSuccessfully'),
      NotificationType.INFO,
    );

    this.dispatchEvent(
      new OperationPerformedEvent({
        type: this.operationType,
        actions: this.state.selectedActions,
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

  private handleSelectAll(): void {
    this.state.toggleSelectAll();
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

        <div class="number-selected">
          ${this.state.selectedActions.length === 1
            ? translate('1ItemSelected')
            : translate('xItemsSelected', {
                count: this.state.selectedActions.length,
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
