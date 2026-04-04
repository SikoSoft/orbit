import { fixture, html, expect } from '@open-wc/testing';
import { BooleanSetting } from '@/components/setting/boolean-setting/boolean-setting';
import { settingUpdatedEventName } from '@/events/setting-updated';
import type { SettingUpdatedEventPayload } from '@/events/setting-updated';

import '@/components/setting/boolean-setting/boolean-setting';

describe('boolean-setting', () => {
  it('is defined as a custom element', () => {
    const el = document.createElement('boolean-setting');
    expect(el).to.be.instanceOf(BooleanSetting);
  });

  it('renders the wrapping container', async () => {
    const el = await fixture<BooleanSetting>(
      html`<boolean-setting></boolean-setting>`,
    );
    const container = el.shadowRoot!.querySelector('.boolean-setting');
    expect(container).to.exist;
  });

  it('renders the name as label text', async () => {
    const el = await fixture<BooleanSetting>(
      html`<boolean-setting name="Enable Feature"></boolean-setting>`,
    );
    const label = el.shadowRoot!.querySelector('label');
    expect(label!.textContent!.trim()).to.equal('Enable Feature');
  });

  it('reflects value property onto ss-toggle', async () => {
    const el = await fixture<BooleanSetting>(
      html`<boolean-setting .value=${true}></boolean-setting>`,
    );
    const toggle = el.shadowRoot!.querySelector('ss-toggle');
    expect(toggle!.hasAttribute('on')).to.be.true;
  });

  it('dispatches setting-updated when toggle-changed fires', async () => {
    const el = await fixture<BooleanSetting>(
      html`<boolean-setting name="myFlag" .value=${false}></boolean-setting>`,
    );

    let payload: SettingUpdatedEventPayload<boolean> | null = null;
    el.addEventListener(settingUpdatedEventName, (e: Event) => {
      payload = (e as CustomEvent<SettingUpdatedEventPayload<boolean>>).detail;
    });

    const toggle = el.shadowRoot!.querySelector('ss-toggle')!;
    toggle.dispatchEvent(
      new CustomEvent('toggle-changed', {
        bubbles: true,
        composed: true,
        detail: { on: true },
      }),
    );

    expect(payload).to.not.be.null;
    expect(payload!.name).to.equal('myFlag');
    expect(payload!.value).to.be.true;
  });
});
