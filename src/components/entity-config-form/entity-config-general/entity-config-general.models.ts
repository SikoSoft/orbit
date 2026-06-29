import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';
import { ExtendedEntityConfig } from '../entity-config-form.models';

export enum EntityConfigGeneralProp {
  ENTITY_CONFIG = 'entityConfig',
  HAS_BREAKING_CHANGES = 'hasBreakingChanges',
  IS_SAVING = 'isSaving',
  IS_SAVE_ENABLED = 'isSaveEnabled',
  SAVE_NEW_REVISION = 'saveNewRevision',
}

export interface EntityConfigGeneralProps extends PropTypes {
  [EntityConfigGeneralProp.ENTITY_CONFIG]: ExtendedEntityConfig;
  [EntityConfigGeneralProp.HAS_BREAKING_CHANGES]: boolean;
  [EntityConfigGeneralProp.IS_SAVING]: boolean;
  [EntityConfigGeneralProp.IS_SAVE_ENABLED]: boolean;
  [EntityConfigGeneralProp.SAVE_NEW_REVISION]: boolean;
}

export const entityConfigGeneralProps: PropConfigMap<EntityConfigGeneralProps> = {
  [EntityConfigGeneralProp.ENTITY_CONFIG]: {
    default: null as unknown as ExtendedEntityConfig,
    control: { type: ControlType.HIDDEN },
    description: 'The current entity config being edited',
  },
  [EntityConfigGeneralProp.HAS_BREAKING_CHANGES]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Whether any breaking property changes have been detected',
  },
  [EntityConfigGeneralProp.IS_SAVING]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Whether a save is currently in progress',
  },
  [EntityConfigGeneralProp.IS_SAVE_ENABLED]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Whether the save button should be enabled',
  },
  [EntityConfigGeneralProp.SAVE_NEW_REVISION]: {
    default: false,
    control: { type: ControlType.BOOLEAN },
    description: 'Whether to save as a new revision',
  },
};
