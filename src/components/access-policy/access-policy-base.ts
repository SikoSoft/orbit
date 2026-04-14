import { css, html, nothing, PropertyValues, TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { AccessType } from 'api-spec/models/Access';
import { translate } from '@/lib/Localization';
import { InputType } from '@ss/ui/components/ss-input.models';

import '@ss/ui/components/ss-input';
import '@ss/ui/components/ss-icon';

import { InputChangedEvent } from '@ss/ui/components/ss-input.events';

import { AccessPolicyMember } from './access-policy.models';

export abstract class AccessPolicyBase extends MobxLitElement {
  static styles = css`
    :host {
      display: block;
    }

    .access-policy {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .search-row {
      display: flex;
      gap: 0.5rem;
      align-items: flex-start;

      ss-input {
        flex: 1;
      }
    }

    .member-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .member-list-empty {
      color: var(--text-color);
      opacity: 0.6;
      font-size: 0.9rem;
    }

    .member-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--input-border-color, #ccc);
      border-radius: 4px;
      background-color: var(--input-background-color, #fff);
    }

    .member-name {
      flex: 1;
      color: var(--input-text-color, #000);
      font-size: 0.95rem;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .member-type {
      font-size: 0.75rem;
      padding: 0.1rem 0.4rem;
      border-radius: 3px;
      background-color: var(--input-border-color, #ccc);
      color: var(--input-text-color, #000);
      text-transform: uppercase;
      letter-spacing: 0.03em;
      flex-shrink: 0;
    }

    .member-remove {
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 3px;
      flex-shrink: 0;
      color: var(--input-text-color, #000);

      &:hover {
        background-color: var(--input-border-color, #ccc);
      }
    }
  `;

  @property({ type: Array }) members: AccessPolicyMember[] = [];
  @property({ type: Array }) suggestions: AccessPolicyMember[] = [];

  @state() protected _members: AccessPolicyMember[] = [];
  @state() protected searchText: string = '';

  @query('ss-input') private searchInput!: HTMLElement & { clear: () => void };

  protected abstract get searchPlaceholderKey(): string;
  protected abstract get noMembersKey(): string;
  protected abstract get allowedTypes(): AccessType[];
  protected abstract renderTypeLabel(type: AccessType): TemplateResult | typeof nothing;
  protected abstract dispatchChangedEvent(members: AccessPolicyMember[]): void;
  protected abstract dispatchSearchChangedEvent(value: string): void;

  protected willUpdate(changedProperties: PropertyValues): void {
    if (changedProperties.has('members')) {
      this._members = [...this.members];
    }
  }

  protected get suggestionNames(): string[] {
    return this.suggestions
      .filter(
        s =>
          this.allowedTypes.includes(s.type) &&
          !this._members.some(m => m.targetId === s.targetId && m.type === s.type),
      )
      .map(s => s.displayName);
  }

  private handleSearchChanged(e: InputChangedEvent): void {
    const value = e.detail.value;

    const matched = this.suggestions.find(
      s => s.displayName === value && this.allowedTypes.includes(s.type),
    );
    if (matched) {
      this.addMember(matched);
      return;
    }

    this.searchText = value;
    this.dispatchSearchChangedEvent(value);
  }

  private handleSearchSubmitted(): void {
    if (!this.searchText) {
      return;
    }

    const matched = this.suggestions.find(
      s => s.displayName === this.searchText && this.allowedTypes.includes(s.type),
    );
    if (matched) {
      this.addMember(matched);
    }
  }

  private addMember(member: AccessPolicyMember): void {
    const alreadyAdded = this._members.some(
      m => m.targetId === member.targetId && m.type === member.type,
    );

    if (alreadyAdded) {
      this.searchText = '';
      this.searchInput?.clear();
      return;
    }

    this._members = [...this._members, member];
    this.searchText = '';
    this.searchInput?.clear();
    this.dispatchSearchChangedEvent('');
    this.dispatchChangedEvent(this._members);
  }

  private removeMember(member: AccessPolicyMember): void {
    this._members = this._members.filter(
      m => !(m.targetId === member.targetId && m.type === member.type),
    );
    this.dispatchChangedEvent(this._members);
  }

  render(): TemplateResult {
    return html`
      <div class="access-policy">
        <div class="search-row">
          <ss-input
            type=${InputType.TEXT}
            autoComplete
            placeholder=${translate(this.searchPlaceholderKey)}
            .suggestions=${this.suggestionNames}
            @input-changed=${this.handleSearchChanged}
            @input-submitted=${this.handleSearchSubmitted}
          ></ss-input>
        </div>

        <div class="member-list">
          ${this._members.length === 0
            ? html`<p class="member-list-empty">${translate(this.noMembersKey)}</p>`
            : nothing}
          ${repeat(
            this._members,
            m => `${m.type}:${m.targetId}`,
            m => html`
              <div class="member-item">
                ${this.renderTypeLabel(m.type)}
                <span class="member-name">${m.displayName}</span>
                <button
                  class="member-remove"
                  aria-label=${translate('accessPolicy.removeMember')}
                  @click=${(): void => this.removeMember(m)}
                >
                  <ss-icon name="delete" size="16"></ss-icon>
                </button>
              </div>
            `,
          )}
        </div>
      </div>
    `;
  }
}
