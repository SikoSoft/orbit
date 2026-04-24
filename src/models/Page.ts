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
}
export const defaultTheme: ThemeName = ThemeName.LIGHT;

export interface Theme {
  name: ThemeName;
  backgroundColor: CSSResult;
  sheet: CSSStyleSheet;
}
