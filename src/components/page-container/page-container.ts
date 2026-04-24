import { css, html, nothing, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import '@/components/app-container/app-container';
import '@/components/storage-source-prompt/storage-source-prompt';
import { themes } from '@/styles/theme';
import { MobxLitElement } from '@adobe/lit-mobx';
import { appState } from '@/state';
import { classMap } from 'lit/directives/class-map.js';
import {
  PageContainerProp,
  PageContainerProps,
  pageContainerProps,
} from './page-container.models';
import { reaction } from 'mobx';
import { ThemeName, defaultTheme } from '@/models/Page';
import { StorageItemKey } from '@/models/Storage';
import { ThemesUpdatedEvent } from './page-container.events';
import { translate } from '@/lib/Localization';

@customElement('page-container')
export class PageContainer extends MobxLitElement {
  private state = appState;

  static styles = css`
    :host {
      display: block;
      margin-top: 0rem;
      padding: 2rem;
      background-color: var(--background-color);
      min-height: 100vh;
      overflow-x: hidden;
    }

    .page-container {
      &.overlay-is-open .overlay {
        opacity: 1;
      }
    }

    .overlay {
      position: fixed;
      z-index: 100;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        var(--overlay-color-top),
        var(--overlay-color-bottom)
      );
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s;
    }

    .offline-banner {
      margin: 0 auto 1rem;
      padding: 0.75rem 1rem;
      border-radius: var(--border-radius);
      border: 1px solid var(--box-border-color);
      background: color-mix(in srgb, var(--box-background-color), #e67e22 12%);
      color: var(--text-color);
      max-width: 640px;
      text-align: center;
      font-weight: 600;
    }

    app-container {
      display: block;
      margin: auto;
      max-width: 640px;
    }
  `;

  @property({ reflect: true })
  [PageContainerProp.THEME]: PageContainerProps[PageContainerProp.THEME] =
    pageContainerProps[PageContainerProp.THEME].default;

  @state() popUpIsOpen: boolean = false;

  @state() listConfigThemes: string[] = [];

  @state()
  get themes(): string[] {
    return this.listConfigThemes.length
      ? Array.from(this.listConfigThemes)
      : [this.theme];
  }

  @state()
  get classes(): Record<string, boolean> {
    return {
      'page-container': true,
      'overlay-is-open': this.state.widgetIsOpen || this.popUpIsOpen,
    };
  }

  @state()
  get showOfflineBanner(): boolean {
    return !this.state.online && !this.state.isNative;
  }

  setTheme(theme: ThemeName): void {
    this.theme = theme;
    this.syncThemes();
  }

  syncThemes(): void {
    this.className = this.themes.join(' ');
    const theme = this.themes[0];
    const backgroundColor = themes[theme as ThemeName].backgroundColor;
    document.body.style.backgroundColor = backgroundColor.cssText;
    this.dispatchEvent(new ThemesUpdatedEvent({ themes: this.themes }));
  }

  getThemeFromStorage(): ThemeName {
    const storedTheme = localStorage.getItem(StorageItemKey.THEME);
    if (
      storedTheme &&
      Object.values(ThemeName).includes(storedTheme as ThemeName)
    ) {
      return storedTheme as ThemeName;
    }

    return defaultTheme;
  }

  firstUpdated(): void {
    const loader = document.getElementById('initial-loader');
    if (loader) {
      loader.style.opacity = '0';
      loader.addEventListener('transitionend', () => loader.remove(), { once: true });
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.setTheme(this.getThemeFromStorage());

    reaction(
      () => appState.theme,
      () => {
        this.setTheme(this.state.theme);
      },
      {
        fireImmediately: false,
      },
    );

    reaction(
      () => appState.title,
      () => {
        document.title = this.state.title;
      },
      {
        fireImmediately: false,
      },
    );

    reaction(
      () => this.state.listConfig,
      () => {
        this.setListConfigThemes(this.state.listConfig.themes);
      },
      {
        fireImmediately: true,
      },
    );
  }

  setListConfigThemes(themes: string[]): void {
    this.listConfigThemes = themes;
    this.syncThemes();
  }

  private handlePopUpOpened(): void {
    this.popUpIsOpen = true;
  }

  private handlePopUpClosed(): void {
    this.popUpIsOpen = false;
  }

  render(): TemplateResult {
    return html`
      <div class=${classMap(this.classes)}>
        <div class="overlay"></div>
        ${this.showOfflineBanner
          ? html`<div class="offline-banner">
              ${translate('offlineModeBanner')}
            </div>`
          : nothing}
        <app-container
          @pop-up-opened=${this.handlePopUpOpened}
          @pop-up-closed=${this.handlePopUpClosed}
        ></app-container>
        <storage-source-prompt></storage-source-prompt>
      </div>
    `;
  }
}
