import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';

export interface CommentSpec {
  id: number;
  entityId: number;
  userId: string | null;
  guestName: string | null;
  body: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  counts: { like: number; dislike: number };
}

export enum CommentReactionType {
  LIKE = 'like',
  DISLIKE = 'dislike',
}

export interface AddCommentPayload {
  entityId: number;
  body: string;
  guestName?: string;
}

export interface ReactionCounts {
  like: number;
  dislike: number;
}

export enum EntityCommentsProp {
  ENTITY_ID = 'entityId',
  ALLOW_COMMENTS = 'allowComments',
  OWNER_ID = 'ownerId',
}

export interface EntityCommentsProps extends PropTypes {
  [EntityCommentsProp.ENTITY_ID]: number;
  [EntityCommentsProp.ALLOW_COMMENTS]: boolean;
  [EntityCommentsProp.OWNER_ID]: string;
}

export const entityCommentsProps: PropConfigMap<EntityCommentsProps> = {
  [EntityCommentsProp.ENTITY_ID]: {
    default: 0,
    control: { type: ControlType.NUMBER },
    description: 'The entity ID to load comments for',
  },
  [EntityCommentsProp.ALLOW_COMMENTS]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Whether the entity allows new comments',
  },
  [EntityCommentsProp.OWNER_ID]: {
    default: '',
    control: { type: ControlType.TEXT },
    description: 'The user ID of the entity owner',
  },
};
