import { describe, it, expect, afterEach } from 'vitest';
import { BooleanSetting } from '@/components/setting/boolean-setting/boolean-setting';
import { settingUpdatedEventName } from '@/events/setting-updated';
import type { SettingUpdatedEventPayload } from '@/events/setting-updated';

import '@/components/setting/boolean-setting/boolean-setting';

async function mount(props: Partial<BooleanSetting> = {}): Promise<BooleanSetting> {
  const el = document.createElement('boolean-setting') as BooleanSetting;
  Object.assign(el, props);
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

describe('boolean-setting', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('is defined as a custom element', () => {
    const el = document.createElement('boolean-setting');
    expect(el).toBeInstanceOf(BooleanSetting);
  });

  it('renders the wrapping container', async () => {
    const el = await mount();
    expect(el.shadowRoot!.querySelector('.boolean-setting')).toBeTruthy();
  });

  it('renders the name as label text', async () => {
    const el = await mount({ name: 'Enable Feature' });
    const label = el.shadowRoot!.querySelector('label');
    expect(label!.textContent!.trim()).toBe('Enable Feature');
  });

  it('reflects value property onto ss-toggle', async () => {
    const el = await mount({ value: true });
    expect(el.shadowRoot!.querySelector('ss-toggle')!.hasAttribute('on')).toBe(true);
  });

  it('dispatches setting-updated when toggle-changed fires', async () => {
    const el = await mount({ name: 'myFlag', value: false });

    let payload: SettingUpdatedEventPayload<boolean> | null = null;
    el.addEventListener(settingUpdatedEventName, (e: Event) => {
      payload = (e as CustomEvent<SettingUpdatedEventPayload<boolean>>).detail;
    });

    el.shadowRoot!.querySelector('ss-toggle')!.dispatchEvent(
      new CustomEvent('toggle-changed', {
        bubbles: true,
        composed: true,
        detail: { on: true },
      }),
    );

    expect(payload).not.toBeNull();
    expect(payload!.name).toBe('myFlag');
    expect(payload!.value).toBe(true);
  });
});
