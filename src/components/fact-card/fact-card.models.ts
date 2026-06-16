import { Fact, FactResult } from 'api-spec/models/Fact';

import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';

export enum FactCardProp {
  FACT = 'fact',
  RESULT = 'result',
}

export interface FactCardProps extends PropTypes {
  [FactCardProp.FACT]: Fact | null;
  [FactCardProp.RESULT]: FactResult | null;
}

export const factCardProps: PropConfigMap<FactCardProps> = {
  [FactCardProp.FACT]: {
    default: null,
    description: 'The fact to display',
    control: { type: ControlType.HIDDEN },
  },
  [FactCardProp.RESULT]: {
    default: null,
    description: 'The computed fact result',
    control: { type: ControlType.HIDDEN },
  },
};
