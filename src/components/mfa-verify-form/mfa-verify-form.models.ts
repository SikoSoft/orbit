import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';

export enum MfaVerifyFormProp {
  PENDING_MFA_TOKEN = 'pendingMfaToken',
}

export interface MfaVerifyFormProps extends PropTypes {
  [MfaVerifyFormProp.PENDING_MFA_TOKEN]: string;
}

export const mfaVerifyFormProps: PropConfigMap<MfaVerifyFormProps> = {
  [MfaVerifyFormProp.PENDING_MFA_TOKEN]: {
    default: '',
    control: { type: ControlType.TEXT },
    description: 'The pending MFA token from the login response',
  },
};
