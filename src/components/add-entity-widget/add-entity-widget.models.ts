import { Entity } from 'api-spec/models/Entity';

export interface AssistResponse {
  filename: string;
  size: number;
  content_type: string;
  entity: Entity;
}
