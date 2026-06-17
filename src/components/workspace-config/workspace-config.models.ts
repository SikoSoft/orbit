import { ThemeName, defaultTheme } from '@/models/Page';
import { PropConfigMap, PropTypes } from '@/models/Prop';
import { ControlType } from '@/models/Control';

export enum WorkspaceConfigProp {
  NAME = 'name',
  COLOR = 'color',
  THEME = 'theme',
}

export interface WorkspaceConfigProps extends PropTypes {
  [WorkspaceConfigProp.NAME]: string;
  [WorkspaceConfigProp.COLOR]: string;
  [WorkspaceConfigProp.THEME]: ThemeName;
}

export const workspaceConfigProps: PropConfigMap<WorkspaceConfigProps> = {
  [WorkspaceConfigProp.NAME]: {
    default: '',
    description: 'The workspace name',
    control: { type: ControlType.TEXT },
  },
  [WorkspaceConfigProp.COLOR]: {
    default: '',
    description: 'The workspace color as a hex string',
    control: { type: ControlType.TEXT },
  },
  [WorkspaceConfigProp.THEME]: {
    default: defaultTheme,
    description: 'The theme applied when this workspace is active',
    control: {
      type: ControlType.SELECT,
      options: Object.values(ThemeName),
    },
  },
};
