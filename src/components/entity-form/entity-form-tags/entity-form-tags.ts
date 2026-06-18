import { html, css, nothing, TemplateResult } from 'lit';
import { property, customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { SettingName, TagSuggestions } from 'api-spec/models/Setting';

import { appState } from '@/state';
import { storage } from '@/lib/Storage';
import { SuggestionInputType, SuggestionLastInput } from '../entity-form.models';
import {
  EntityFormTagsProp,
  entityFormTagsProps,
  EntityFormTagsProps,
} from './entity-form-tags.models';
import { EntityFormTagsUpdatedEvent } from './entity-form-tags.events';

import '@ss/ui/components/tag-manager';
import { TagsUpdatedEvent } from '@ss/ui/components/tag-manager.events';
import { TagSuggestionsRequestedEvent } from '@ss/ui/components/tag-input.events';

@customElement('entity-form-tags')
export class EntityFormTags extends MobxLitElement {
  private state = appState;
  private minLengthForSuggestion = 1;
  private suggestionTimeout: ReturnType<typeof setTimeout> | null = null;
  private abortController: AbortController | null = null;

  static styles = css`
    tag-manager {
      display: block;
      margin-top: 1rem;
    }

    tag-manager::part(legend) {
      font-weight: bold;
    }
  `;

  @property({ type: Array })
  [EntityFormTagsProp.TAGS]: EntityFormTagsProps[EntityFormTagsProp.TAGS] =
    entityFormTagsProps[EntityFormTagsProp.TAGS].default;

  @property({ type: Boolean })
  [EntityFormTagsProp.ALLOW_TAGS]: EntityFormTagsProps[EntityFormTagsProp.ALLOW_TAGS] =
    entityFormTagsProps[EntityFormTagsProp.ALLOW_TAGS].default;

  @state() private tagSuggestions: string[] = [];
  @state() private tagValue: string = '';
  @state() private lastInput: SuggestionLastInput = {
    [SuggestionInputType.ACTION]: { value: '', hadResults: true },
    [SuggestionInputType.TAG]: { value: '', hadResults: true },
  };

  get tagSuggestionsEnabled(): boolean {
    return (
      this.state.listConfig.setting[SettingName.TAG_SUGGESTIONS] !==
      TagSuggestions.DISABLED
    );
  }

  get tagsAndSuggestions(): string[] {
    return Array.from(new Set([...this.tags, ...this.state.tagSuggestions]));
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

  reset(): void {
    this.tagValue = '';
    this.tagSuggestions = [];
    this.state.setTagSuggestions([]);

    if (this.suggestionTimeout) {
      clearTimeout(this.suggestionTimeout);
      this.suggestionTimeout = null;
    }

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  private handleTagsUpdated(e: TagsUpdatedEvent): void {
    const tags = e.detail.tags;
    this.state.setTagSuggestions(
      this.state.tagSuggestions.filter(suggestion => tags.includes(suggestion)),
    );
    this.dispatchEvent(new EntityFormTagsUpdatedEvent({ tags }));
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

  render(): TemplateResult | typeof nothing {
    if (!this.allowTags) {
      return nothing;
    }

    return html`
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
    `;
  }
}
