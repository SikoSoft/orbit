import { Operation, OperationType } from 'api-spec/models/Operation';
import { PropertyDataValue } from 'api-spec/models/Entity';

export interface BulkOperationPayload {
  operation: Operation;
  actions: number[];
}

export interface BulkPropertyInstance {
  propertyConfigId: number;
  uiId: string;
  value: PropertyDataValue;
}

export const taggingOperations: OperationType[] = [
  OperationType.ADD_TAGS,
  OperationType.REMOVE_TAGS,
  OperationType.REPLACE_TAGS,
];

export const propertyOperations: OperationType[] = [
  OperationType.ADD_PROPERTIES,
  OperationType.REMOVE_PROPERTIES,
  OperationType.REPLACE_PROPERTIES,
];
