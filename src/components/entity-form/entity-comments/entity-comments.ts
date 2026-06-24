import { html, css, nothing, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { appState } from '@/state';
import { storage } from '@/lib/Storage';
import { translate } from '@/lib/Localization';
import { addToast } from '@/lib/Util';
import { NotificationType } from '@ss/ui/components/notification-provider.models';
import { themed } from '@/lib/Theme';

import {
  AddCommentPayload,
  CommentReactionType,
  CommentSpec,
  EntityCommentsProp,
  entityCommentsProps,
  EntityCommentsProps,
} from './entity-comments.models';

import '@ss/ui/components/ss-button';
import '@ss/ui/components/ss-input';
import '@ss/ui/components/confirmation-modal';

@themed()
@customElement('entity-comments')
export class EntityComments extends MobxLitElement {
  private appState = appState;

  static styles = css`
    :host {
      display: block;
      padding: 1rem;
    }

    .comments-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .no-comments {
      color: #666;
      font-style: italic;
      margin-bottom: 1rem;
    }

    .comment {
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 0.75rem;

      &.unpublished {
        border-color: #f0ad4e;
        background: #fff8e1;
      }
    }

    .comment-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .comment-author {
      font-weight: bold;
      font-size: 0.875rem;
    }

    .comment-date {
      font-size: 0.75rem;
      color: #888;
    }

    .unpublished-badge {
      font-size: 0.7rem;
      font-weight: bold;
      background: #f0ad4e;
      color: #000;
      padding: 0.1rem 0.4rem;
      border-radius: 3px;
      text-transform: uppercase;
    }

    .comment-body {
      margin-bottom: 0.5rem;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .comment-footer {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .reaction-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      cursor: pointer;
      background: none;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 0.2rem 0.5rem;
      font-size: 0.875rem;

      &.active {
        background: #e8f0fe;
        border-color: #4285f4;
        color: #4285f4;
      }
    }

    .moderation-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-left: auto;
    }

    .composer {
      border-top: 1px solid #eee;
      padding-top: 1rem;
    }

    .composer-disabled {
      color: #888;
      font-style: italic;
      padding: 0.5rem 0;
    }

    .composer-field {
      margin-bottom: 0.75rem;

      label {
        display: block;
        font-weight: bold;
        margin-bottom: 0.25rem;
        font-size: 0.875rem;
      }
    }

    .composer-textarea {
      width: 100%;
      min-height: 80px;
      padding: 0.5rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 0.875rem;
      font-family: inherit;
      resize: vertical;
      box-sizing: border-box;
    }
  `;

  @property({ type: Number })
  [EntityCommentsProp.ENTITY_ID]: EntityCommentsProps[EntityCommentsProp.ENTITY_ID] =
    entityCommentsProps[EntityCommentsProp.ENTITY_ID].default;

  @property({ type: Boolean })
  [EntityCommentsProp.ALLOW_COMMENTS]: EntityCommentsProps[EntityCommentsProp.ALLOW_COMMENTS] =
    entityCommentsProps[EntityCommentsProp.ALLOW_COMMENTS].default;

  @property({ type: String })
  [EntityCommentsProp.OWNER_ID]: EntityCommentsProps[EntityCommentsProp.OWNER_ID] =
    entityCommentsProps[EntityCommentsProp.OWNER_ID].default;

  @state() private comments: CommentSpec[] = [];
  @state() private loading = false;
  @state() private composerBody = '';
  @state() private composerGuestName = '';
  @state() private submitting = false;
  @state() private confirmDeleteCommentId: number | null = null;
  @state() private myReactions: Map<number, CommentReactionType> = new Map();

  connectedCallback(): void {
    super.connectedCallback();
    this.loadComments();
  }

  private get currentUserId(): string | null {
    return this.appState.user?.id ?? null;
  }

  private get isOwner(): boolean {
    return (
      this.currentUserId !== null && this.currentUserId === this.ownerId
    );
  }

  private get isLoggedIn(): boolean {
    return this.currentUserId !== null;
  }

  private async loadComments(): Promise<void> {
    if (!this.entityId) {
      return;
    }
    this.loading = true;
    const result = await storage.getComments(this.entityId);
    this.loading = false;
    if (result) {
      this.comments = result;
    }
  }

  private async handleSubmit(): Promise<void> {
    const body = this.composerBody.trim();
    if (!body) {
      return;
    }
    if (!this.isLoggedIn && !this.composerGuestName.trim()) {
      addToast(translate('comment.guestNameRequired'), NotificationType.ERROR);
      return;
    }

    this.submitting = true;

    const payload: AddCommentPayload = { entityId: this.entityId, body };
    if (!this.isLoggedIn) {
      payload.guestName = this.composerGuestName.trim();
    }

    const result = await storage.addComment(payload);
    this.submitting = false;

    if (!result) {
      addToast(translate('comment.failedToPost'), NotificationType.ERROR);
      return;
    }

    this.composerBody = '';
    this.composerGuestName = '';
    addToast(translate('comment.posted'), NotificationType.SUCCESS);
    await this.loadComments();
  }

  private async handleReactionClick(
    comment: CommentSpec,
    type: CommentReactionType,
  ): Promise<void> {
    const current = this.myReactions.get(comment.id);
    let updatedCounts: { like: number; dislike: number } | null = null;

    if (current === type) {
      updatedCounts = await storage.deleteCommentReaction(comment.id);
      if (updatedCounts) {
        const next = new Map(this.myReactions);
        next.delete(comment.id);
        this.myReactions = next;
      }
    } else {
      updatedCounts = await storage.addCommentReaction(comment.id, type);
      if (updatedCounts) {
        const next = new Map(this.myReactions);
        next.set(comment.id, type);
        this.myReactions = next;
      }
    }

    if (updatedCounts) {
      this.comments = this.comments.map(c =>
        c.id === comment.id ? { ...c, counts: updatedCounts! } : c,
      );
    }
  }

  private async handleTogglePublished(comment: CommentSpec): Promise<void> {
    const result = await storage.updateComment(comment.id, !comment.published);
    if (!result) {
      addToast(translate('comment.moderationFailed'), NotificationType.ERROR);
      return;
    }
    this.comments = this.comments.map(c =>
      c.id === comment.id ? { ...c, published: !c.published } : c,
    );
  }

  private handleDeleteRequested(id: number): void {
    this.confirmDeleteCommentId = id;
  }

  private handleDeleteDeclined(): void {
    this.confirmDeleteCommentId = null;
  }

  private async handleDeleteConfirmed(): Promise<void> {
    const id = this.confirmDeleteCommentId;
    this.confirmDeleteCommentId = null;
    if (id === null) {
      return;
    }
    const success = await storage.deleteComment(id);
    if (!success) {
      addToast(translate('comment.deleteFailed'), NotificationType.ERROR);
      return;
    }
    this.comments = this.comments.filter(c => c.id !== id);
    addToast(translate('comment.deleted'), NotificationType.SUCCESS);
  }

  private canDelete(comment: CommentSpec): boolean {
    if (!this.currentUserId) {
      return false;
    }
    return this.isOwner || comment.userId === this.currentUserId;
  }

  private formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString();
  }

  private renderReactionButton(
    comment: CommentSpec,
    type: CommentReactionType,
    emoji: string,
  ): TemplateResult {
    const count =
      type === CommentReactionType.LIKE ? comment.counts.like : comment.counts.dislike;
    const isActive = this.myReactions.get(comment.id) === type;
    return html`
      <button
        class="reaction-btn ${isActive ? 'active' : ''}"
        @click=${(): Promise<void> => this.handleReactionClick(comment, type)}
        title=${isActive
          ? translate('comment.removeReaction')
          : translate('comment.addReaction')}
      >
        ${emoji} ${count}
      </button>
    `;
  }

  private renderComment(comment: CommentSpec): TemplateResult {
    const authorName =
      comment.guestName ?? comment.userId ?? translate('comment.unknownAuthor');
    return html`
      <div class="comment ${!comment.published ? 'unpublished' : ''}">
        <div class="comment-header">
          <span class="comment-author">${authorName}</span>
          <span class="comment-date">${this.formatDate(comment.createdAt)}</span>
          ${!comment.published
            ? html`<span class="unpublished-badge"
                >${translate('comment.unpublished')}</span
              >`
            : nothing}
        </div>

        <div class="comment-body">${comment.body}</div>

        <div class="comment-footer">
          ${this.renderReactionButton(comment, CommentReactionType.LIKE, '👍')}
          ${this.renderReactionButton(
            comment,
            CommentReactionType.DISLIKE,
            '👎',
          )}

          <div class="moderation-actions">
            ${this.isOwner
              ? html`
                  <ss-button
                    small
                    @click=${(): Promise<void> =>
                      this.handleTogglePublished(comment)}
                    text=${comment.published
                      ? translate('comment.hide')
                      : translate('comment.publish')}
                  ></ss-button>
                `
              : nothing}
            ${this.canDelete(comment)
              ? html`
                  <ss-button
                    small
                    negative
                    @click=${(): void =>
                      this.handleDeleteRequested(comment.id)}
                    text=${translate('delete')}
                  ></ss-button>
                `
              : nothing}
          </div>
        </div>
      </div>
    `;
  }

  private renderComposer(): TemplateResult {
    if (!this.allowComments) {
      return html`<div class="composer-disabled">
        ${translate('comment.commentsDisabled')}
      </div>`;
    }

    return html`
      <div class="composer">
        ${!this.isLoggedIn
          ? html`
              <div class="composer-field">
                <label>${translate('comment.yourName')}</label>
                <ss-input
                  .value=${this.composerGuestName}
                  placeholder=${translate('comment.yourNamePlaceholder')}
                  @input-changed=${(e: CustomEvent<{ value: string }>): void => {
                    this.composerGuestName = e.detail.value;
                  }}
                ></ss-input>
              </div>
            `
          : nothing}

        <div class="composer-field">
          <label>${translate('comment.yourComment')}</label>
          <textarea
            class="composer-textarea"
            .value=${this.composerBody}
            placeholder=${translate('comment.commentPlaceholder')}
            maxlength="4000"
            @input=${(e: Event): void => {
              this.composerBody = (e.target as HTMLTextAreaElement).value;
            }}
          ></textarea>
        </div>

        <ss-button
          positive
          ?loading=${this.submitting}
          ?disabled=${!this.composerBody.trim() ||
          (!this.isLoggedIn && !this.composerGuestName.trim())}
          @click=${this.handleSubmit}
          text=${translate('comment.post')}
        ></ss-button>
      </div>
    `;
  }

  render(): TemplateResult {
    if (this.loading) {
      return html`<p>${translate('loading')}</p>`;
    }

    return html`
      <div class="comments-list">
        ${this.comments.length === 0
          ? html`<div class="no-comments">
              ${translate('comment.noComments')}
            </div>`
          : repeat(
              this.comments,
              comment => comment.id,
              comment => this.renderComment(comment),
            )}
      </div>

      ${this.renderComposer()}

      <confirmation-modal
        ?open=${this.confirmDeleteCommentId !== null}
        @confirmation-accepted=${this.handleDeleteConfirmed}
        @confirmation-declined=${this.handleDeleteDeclined}
      ></confirmation-modal>
    `;
  }
}
