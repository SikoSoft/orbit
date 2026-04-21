import { ControlType } from '@/models/Control';
import { PropConfigMap, PropTypes } from '@/models/Prop';

export type AccessPolicyAssignmentContext =
  | 'entity'
  | 'entityConfig'
  | 'listConfig';

export enum AccessPolicyAssignmentProp {
  CONTEXT = 'context',
  ENTITY_ID = 'entityId',
  LIST_CONFIG_ID = 'listConfigId',
  VIEW_ACCESS_POLICY_ID = 'viewAccessPolicyId',
  EDIT_ACCESS_POLICY_ID = 'editAccessPolicyId',
}

export interface AccessPolicyAssignmentProps extends PropTypes {
  [AccessPolicyAssignmentProp.CONTEXT]: AccessPolicyAssignmentContext;
  [AccessPolicyAssignmentProp.ENTITY_ID]: number;
  [AccessPolicyAssignmentProp.LIST_CONFIG_ID]: string;
  [AccessPolicyAssignmentProp.VIEW_ACCESS_POLICY_ID]: number;
  [AccessPolicyAssignmentProp.EDIT_ACCESS_POLICY_ID]: number;
}

export const accessPolicyAssignmentProps: PropConfigMap<AccessPolicyAssignmentProps> =
  {
    [AccessPolicyAssignmentProp.CONTEXT]: {
      default: 'entity',
      control: { type: ControlType.HIDDEN },
      description:
        'Whether this component manages access policies for an entity or a list config',
    },
    [AccessPolicyAssignmentProp.ENTITY_ID]: {
      default: 0,
      control: { type: ControlType.HIDDEN },
      description:
        'The ID of the entity whose access policy is being managed (used when context is "entity")',
    },
    [AccessPolicyAssignmentProp.LIST_CONFIG_ID]: {
      default: '',
      control: { type: ControlType.HIDDEN },
      description:
        'The ID of the list config whose access policy is being managed (used when context is "listConfig")',
    },
    [AccessPolicyAssignmentProp.VIEW_ACCESS_POLICY_ID]: {
      default: 0,
      control: { type: ControlType.HIDDEN },
      description:
        'The ID of the view access policy currently assigned (0 for none)',
    },
    [AccessPolicyAssignmentProp.EDIT_ACCESS_POLICY_ID]: {
      default: 0,
      control: { type: ControlType.HIDDEN },
      description:
        'The ID of the edit access policy currently assigned (0 for none)',
    },
  };
