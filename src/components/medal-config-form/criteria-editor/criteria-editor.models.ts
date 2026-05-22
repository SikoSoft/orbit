import { ControlType } from '@/models/Control';
import { Criterion, Criteria } from 'api-spec/models/Medal';
import { PropConfigMap, PropTypes } from '@/models/Prop';

export enum CriteriaEditorProp {
  CRITERIA = 'criteria',
  FACT_ALIASES = 'factAliases',
}

export interface CriteriaEditorProps extends PropTypes {
  [CriteriaEditorProp.CRITERIA]: Criterion | Criteria;
  [CriteriaEditorProp.FACT_ALIASES]: string[];
}

export const criteriaEditorProps: PropConfigMap<CriteriaEditorProps> = {
  [CriteriaEditorProp.CRITERIA]: {
    default: { all: [] } as Criteria,
    control: { type: ControlType.HIDDEN },
    description: 'The criteria structure to edit',
  },
  [CriteriaEditorProp.FACT_ALIASES]: {
    default: [],
    control: { type: ControlType.HIDDEN },
    description: 'Available fact aliases for the fact selector in criteria',
  },
};
