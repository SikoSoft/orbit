import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';
import { Fact } from 'api-spec/models/Fact';

export enum FactConfigFormProp {
  FACT = 'fact',
}

export interface FactConfigFormProps extends PropTypes {
  [FactConfigFormProp.FACT]: Fact | null;
}

export const factConfigFormProps: PropConfigMap<FactConfigFormProps> = {
  [FactConfigFormProp.FACT]: {
    default: null,
    description: 'The existing fact to edit, or null to create a new one',
    control: { type: ControlType.HIDDEN },
  },
};
