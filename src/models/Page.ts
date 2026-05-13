import { CSSResult } from 'lit';

export enum PageView {
  INPUT = 'input',
  LIST = 'list',
  MOCK = 'mock',
  ADMIN = 'admin',
  ENTITY_CONFIG_LIST = 'entityConfigList',
}

export const defaultPageView: PageView = PageView.INPUT;

export enum ThemeName {
  LIGHT = 'light',
  DARK = 'dark',
  TODO = 'todo',
  XMAS = 'xmas',
  CRAFTACULAR = 'craftacular',
  COLLECTION = 'collection',
}
export const defaultTheme: ThemeName = ThemeName.LIGHT;

export enum ThemeType {
  LAYOUT = 'layout',
  COLOR = 'color',
}

export interface Theme {
  name: ThemeName;
  backgroundColor: CSSResult;
  sheet: CSSStyleSheet;
  type: ThemeType[];
}
