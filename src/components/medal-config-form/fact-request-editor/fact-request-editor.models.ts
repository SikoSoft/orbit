import { ControlType } from '@/models/Control';
import { FactRequest } from 'api-spec/models/Fact';
import { FactOperation } from 'api-spec/models/Fact';
import { defaultListFilter } from 'api-spec/models/List';
import { PropConfigMap, PropTypes } from '@/models/Prop';

export enum FactRequestEditorProp {
  FACT_REQUEST = 'factRequest',
  INDEX = 'index',
}

export interface FactRequestEditorProps extends PropTypes {
  [FactRequestEditorProp.FACT_REQUEST]: FactRequest;
  [FactRequestEditorProp.INDEX]: number;
}

export const factRequestEditorProps: PropConfigMap<FactRequestEditorProps> = {
  [FactRequestEditorProp.FACT_REQUEST]: {
    default: {
      alias: '',
      context: { operation: FactOperation.ENTITY_COUNT, filter: { ...defaultListFilter } },
    },
    control: { type: ControlType.HIDDEN },
    description: 'The fact request being edited',
  },
  [FactRequestEditorProp.INDEX]: {
    default: 0,
    control: { type: ControlType.NUMBER },
    description: 'The position of this fact request in the list',
  },
};
