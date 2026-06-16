import { FactContext, FactOperation } from 'api-spec/models/Fact';
import { defaultListFilter } from 'api-spec/models/List';

import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';

export enum FactFormProp {
  CONTEXT = 'context',
}

export interface FactFormProps extends PropTypes {
  [FactFormProp.CONTEXT]: FactContext;
}

export function defaultFactContext(): FactContext {
  return {
    operation: FactOperation.ENTITY_COUNT,
    filter: { ...defaultListFilter },
  };
}

export const factFormProps: PropConfigMap<FactFormProps> = {
  [FactFormProp.CONTEXT]: {
    default: defaultFactContext(),
    description: 'The fact context being configured',
    control: { type: ControlType.HIDDEN },
  },
};
