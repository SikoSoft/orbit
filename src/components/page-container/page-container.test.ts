import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { PageContainer } from './page-container';
import { appState } from '@/state';
import { ThemeName, defaultTheme } from '@/models/Page';
import { StorageItemKey } from '@/models/Storage';
import { themesUpdatedEventName } from './page-container.events';

import './page-container';

async function mount(props: Partial<PageContainer> = {}): Promise<PageContainer> {
  const el = document.createElement('page-container') as PageContainer;
  Object.assign(el, props);
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

describe('page-container', () => {
  beforeEach(() => {
    localStorage.clear();
    appState.setOnline(true);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('is defined as a custom element', () => {
    const el = document.createElement('page-container');
    expect(el).toBeInstanceOf(PageContainer);
  });

  it('renders the page-container wrapper div', async () => {
    const el = await mount();
    expect(el.shadowRoot!.querySelector('.page-container')).toBeTruthy();
  });

  it('renders app-container inside', async () => {
    const el = await mount();
    expect(el.shadowRoot!.querySelector('app-container')).toBeTruthy();
  });

  describe('getThemeFromStorage', () => {
    it('returns defaultTheme when localStorage is empty', async () => {
      const el = await mount();
      expect(el.getThemeFromStorage()).toBe(defaultTheme);
    });

    it('returns stored theme when valid', async () => {
      localStorage.setItem(StorageItemKey.THEME, ThemeName.DARK);
      const el = await mount();
      expect(el.getThemeFromStorage()).toBe(ThemeName.DARK);
    });

    it('returns defaultTheme for an invalid stored value', async () => {
      localStorage.setItem(StorageItemKey.THEME, 'not-a-theme');
      const el = await mount();
      expect(el.getThemeFromStorage()).toBe(defaultTheme);
    });
  });

  describe('setTheme', () => {
    it('updates the theme property', async () => {
      const el = await mount();
      el.setTheme(ThemeName.DARK);
      expect(el.theme).toBe(ThemeName.DARK);
    });

    it('updates the className to include the theme name', async () => {
      const el = await mount();
      el.setTheme(ThemeName.DARK);
      expect(el.className).toContain(ThemeName.DARK);
    });
  });

  describe('themes getter', () => {
    it('returns [theme] when no listConfigThemes are set', async () => {
      const el = await mount();
      el.setTheme(ThemeName.LIGHT);
      expect(el.themes).toEqual([ThemeName.LIGHT]);
    });

    it('returns listConfigThemes when set', async () => {
      const el = await mount();
      el.setListConfigThemes([ThemeName.DARK, ThemeName.TODO]);
      expect(el.themes).toEqual([ThemeName.DARK, ThemeName.TODO]);
    });
  });

  describe('classes getter', () => {
    it('includes overlay-is-open when popUpIsOpen is true', async () => {
      const el = await mount();
      el.shadowRoot!.querySelector('app-container')!.dispatchEvent(
        new CustomEvent('pop-up-opened', { bubbles: true, composed: true }),
      );
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.overlay-is-open')).toBeTruthy();
    });

    it('includes overlay-is-open when widgetIsOpen is true', async () => {
      const el = await mount();
      appState.setWidgetIsOpen(true);
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.overlay-is-open')).toBeTruthy();
      appState.setWidgetIsOpen(false);
    });

    it('does not include overlay-is-open when neither popUp nor widget is open', async () => {
      const el = await mount();
      appState.setWidgetIsOpen(false);
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.overlay-is-open')).toBeFalsy();
    });
  });

  describe('offline banner', () => {
    it('shows the offline banner when state.online is false', async () => {
      appState.setOnline(false);
      const el = await mount();
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.offline-banner')).toBeTruthy();
    });

    it('hides the offline banner when state.online is true', async () => {
      appState.setOnline(true);
      const el = await mount();
      expect(el.shadowRoot!.querySelector('.offline-banner')).toBeFalsy();
    });
  });

  describe('setListConfigThemes', () => {
    it('dispatches themes-updated event with the provided themes', async () => {
      const el = await mount();
      let payload: string[] | null = null;
      el.addEventListener(themesUpdatedEventName, (e: Event) => {
        payload = (e as CustomEvent<{ themes: string[] }>).detail.themes;
      });
      el.setListConfigThemes([ThemeName.DARK]);
      expect(payload).toEqual([ThemeName.DARK]);
    });
  });

  describe('pop-up events', () => {
    it('pop-up-opened event sets overlay-is-open', async () => {
      const el = await mount();
      el.shadowRoot!.querySelector('app-container')!.dispatchEvent(
        new CustomEvent('pop-up-opened', { bubbles: true, composed: true }),
      );
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.overlay-is-open')).toBeTruthy();
    });

    it('pop-up-closed event clears overlay-is-open', async () => {
      const el = await mount();
      const appContainerEl = el.shadowRoot!.querySelector('app-container')!;
      appContainerEl.dispatchEvent(
        new CustomEvent('pop-up-opened', { bubbles: true, composed: true }),
      );
      await el.updateComplete;
      appContainerEl.dispatchEvent(
        new CustomEvent('pop-up-closed', { bubbles: true, composed: true }),
      );
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.overlay-is-open')).toBeFalsy();
    });
  });
});
