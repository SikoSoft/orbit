import { ThemeName, defaultTheme } from '@/models/Page';
import { PropConfigMap, PropTypes } from '@/models/Prop';
import { ControlType } from '@/models/Control';

export enum WorkspaceManagerProp {
  WORKSPACE_ID = 'workspaceId',
  NAME = 'name',
  COLOR = 'color',
  SHOW_EVERYTHING = 'showEverything',
  LIST_CONFIGS = 'listConfigs',
  THEME = 'theme',
  OPEN = 'open',
  FACTS = 'facts',
  STREAKS = 'streaks',
  CHARTS = 'charts',
}

export interface WorkspaceManagerProps extends PropTypes {
  [WorkspaceManagerProp.WORKSPACE_ID]: string;
  [WorkspaceManagerProp.NAME]: string;
  [WorkspaceManagerProp.COLOR]: string;
  [WorkspaceManagerProp.SHOW_EVERYTHING]: boolean;
  [WorkspaceManagerProp.LIST_CONFIGS]: string[];
  [WorkspaceManagerProp.THEME]: ThemeName;
  [WorkspaceManagerProp.OPEN]: boolean;
  [WorkspaceManagerProp.FACTS]: number[];
  [WorkspaceManagerProp.STREAKS]: number[];
  [WorkspaceManagerProp.CHARTS]: number[];
}

export const workspaceManagerProps: PropConfigMap<WorkspaceManagerProps> = {
  [WorkspaceManagerProp.WORKSPACE_ID]: {
    default: '',
    description: 'The ID of the workspace being edited',
    control: { type: ControlType.TEXT },
  },
  [WorkspaceManagerProp.NAME]: {
    default: '',
    description: 'The workspace name',
    control: { type: ControlType.TEXT },
  },
  [WorkspaceManagerProp.COLOR]: {
    default: '',
    description: 'The workspace color as a hex string',
    control: { type: ControlType.TEXT },
  },
  [WorkspaceManagerProp.SHOW_EVERYTHING]: {
    default: false,
    description: 'Whether this workspace shows all entities regardless of list config filters',
    control: { type: ControlType.BOOLEAN },
  },
  [WorkspaceManagerProp.LIST_CONFIGS]: {
    default: [],
    description: 'List config IDs assigned to this workspace',
    control: { type: ControlType.HIDDEN },
  },
  [WorkspaceManagerProp.THEME]: {
    default: defaultTheme,
    description: 'The theme applied when this workspace is active',
    control: {
      type: ControlType.SELECT,
      options: Object.values(ThemeName),
    },
  },
  [WorkspaceManagerProp.OPEN]: {
    default: false,
    description: 'Whether the collapsable panel is open',
    control: { type: ControlType.BOOLEAN },
  },
  [WorkspaceManagerProp.FACTS]: {
    default: [],
    description: 'Fact IDs assigned to this workspace',
    control: { type: ControlType.HIDDEN },
  },
  [WorkspaceManagerProp.STREAKS]: {
    default: [],
    description: 'Streak IDs assigned to this workspace',
    control: { type: ControlType.HIDDEN },
  },
  [WorkspaceManagerProp.CHARTS]: {
    default: [],
    description: 'Chart IDs assigned to this workspace',
    control: { type: ControlType.HIDDEN },
  },
};
