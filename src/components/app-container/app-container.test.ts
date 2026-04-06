import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { AppContainer } from './app-container';
import { appState } from '@/state';
import { networkApiRequestFailedEventName } from '@/events/network-api-request-failed';
import { userLoggedOutEventName } from '@/events/user-logged-out';

import './app-container';

vi.mock('@/lib/Router', () => ({
  setupRouter: vi.fn().mockReturnValue({
    navigate: vi.fn(),
    renderPath: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
  }),
  navigate: vi.fn(),
  routerState: { currentPath: '/', params: {} },
}));

async function mount(): Promise<AppContainer> {
  const el = document.createElement('app-container') as AppContainer;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

async function waitForReady(el: AppContainer): Promise<void> {
  await new Promise<void>(resolve => setTimeout(resolve, 0));
  await el.updateComplete;
}

describe('app-container', () => {
  beforeEach(() => {
    appState.setOnline(true);
    appState.setAuthToken('');
    localStorage.clear();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('is defined as a custom element', () => {
    const el = document.createElement('app-container');
    expect(el).toBeInstanceOf(AppContainer);
  });

  it('renders the app-container wrapper div', async () => {
    const el = await mount();
    expect(el.shadowRoot!.querySelector('.app-container')).toBeTruthy();
  });

  it('does not render routerView when ready is false', async () => {
    const el = await mount();
    el.ready = false;
    await el.updateComplete;
    const container = el.shadowRoot!.querySelector('.app-container');
    expect(container!.children.length).toBe(0);
  });

  it('renders routerView when ready is true', async () => {
    const el = await mount();
    await waitForReady(el);
    const container = el.shadowRoot!.querySelector('.app-container');
    expect(container!.children.length).toBeGreaterThan(0);
  });

  it('setAuthToken stores the token in state', async () => {
    const el = await mount();
    el.setAuthToken('test-token-123');
    expect(appState.authToken).toBe('test-token-123');
  });

  it('clearSession dispatches user-logged-out event', async () => {
    const el = await mount();
    let fired = false;
    el.addEventListener(userLoggedOutEventName, () => {
      fired = true;
    });
    el.clearSession();
    expect(fired).toBe(true);
  });

  it('clearSession clears the auth token', async () => {
    const el = await mount();
    el.setAuthToken('some-token');
    el.clearSession();
    expect(appState.authToken).toBe('');
  });

  it('online window event sets state online', async () => {
    await mount();
    appState.setOnline(false);
    window.dispatchEvent(new Event('online'));
    expect(appState.online).toBe(true);
  });

  it('offline window event sets state offline', async () => {
    await mount();
    appState.setOnline(true);
    window.dispatchEvent(new Event('offline'));
    expect(appState.online).toBe(false);
  });

  it('networkApiRequestFailed with offline type sets state offline', async () => {
    await mount();
    appState.setOnline(true);
    window.dispatchEvent(
      new CustomEvent(networkApiRequestFailedEventName, {
        detail: { type: 'offline' },
      }),
    );
    expect(appState.online).toBe(false);
  });

  it('networkApiRequestFailed with network type sets state offline', async () => {
    await mount();
    appState.setOnline(true);
    window.dispatchEvent(
      new CustomEvent(networkApiRequestFailedEventName, {
        detail: { type: 'network' },
      }),
    );
    expect(appState.online).toBe(false);
  });

  it('networkApiRequestFailed with other type does not set state offline', async () => {
    await mount();
    appState.setOnline(true);
    window.dispatchEvent(
      new CustomEvent(networkApiRequestFailedEventName, {
        detail: { type: 'auth' },
      }),
    );
    expect(appState.online).toBe(true);
  });

  it('view-changed event updates the view', async () => {
    const el = await mount();
    el.dispatchEvent(
      new CustomEvent('view-changed', {
        detail: 'list',
        bubbles: true,
        composed: true,
      }),
    );
    expect(el.view).toBe('list');
  });
});
