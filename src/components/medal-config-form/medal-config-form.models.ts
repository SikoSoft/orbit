import { ControlType } from '@/models/Control';
import { Criterion, Criteria } from 'api-spec/models/Medal';
import { PropConfigMap, PropTypes } from '@/models/Prop';

export enum MedalConfigFormProp {
  MEDAL_CONFIG_ID = 'medalConfigId',
  NAME = 'name',
  DESCRIPTION = 'description',
  SERIES = 'series',
  RECURRENCE = 'recurrence',
  PRESTIGE = 'prestige',
  ICON = 'icon',
  CRITERIA = 'criteria',
}

export interface MedalConfigFormProps extends PropTypes {
  [MedalConfigFormProp.MEDAL_CONFIG_ID]: number;
  [MedalConfigFormProp.NAME]: string;
  [MedalConfigFormProp.DESCRIPTION]: string;
  [MedalConfigFormProp.SERIES]: string;
  [MedalConfigFormProp.RECURRENCE]: number;
  [MedalConfigFormProp.PRESTIGE]: number;
  [MedalConfigFormProp.ICON]: string;
  [MedalConfigFormProp.CRITERIA]: Criterion | Criteria;
}

export const medalConfigFormProps: PropConfigMap<MedalConfigFormProps> = {
  [MedalConfigFormProp.MEDAL_CONFIG_ID]: {
    default: 0,
    control: { type: ControlType.NUMBER },
    description: 'The unique identifier for the medal config',
  },
  [MedalConfigFormProp.NAME]: {
    default: '',
    control: { type: ControlType.TEXT },
    description: 'The name of the medal',
  },
  [MedalConfigFormProp.DESCRIPTION]: {
    default: '',
    control: { type: ControlType.TEXT },
    description: 'A description of the medal',
  },
  [MedalConfigFormProp.SERIES]: {
    default: '',
    control: { type: ControlType.TEXT },
    description: 'The grouping series for the medal',
  },
  [MedalConfigFormProp.RECURRENCE]: {
    default: 0,
    control: { type: ControlType.NUMBER },
    description: 'How often the medal can be earned (0 = one-time)',
  },
  [MedalConfigFormProp.PRESTIGE]: {
    default: 0,
    control: { type: ControlType.NUMBER },
    description: 'The numeric rank/weight of the medal',
  },
  [MedalConfigFormProp.ICON]: {
    default: '',
    control: { type: ControlType.TEXT },
    description: 'The icon identifier for the medal',
  },
  [MedalConfigFormProp.CRITERIA]: {
    default: {} as Criterion | Criteria,
    control: { type: ControlType.HIDDEN },
    description: 'The criteria for earning the medal',
  },
};
