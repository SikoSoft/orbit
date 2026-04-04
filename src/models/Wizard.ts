import { ListConfig } from 'api-spec/lib/ListConfig';
import { EntityConfig } from 'api-spec/models/Entity';

export interface WizardCollectionConfig {
  entityConfig: EntityConfig[];
  listConfig: ListConfig[];
}
