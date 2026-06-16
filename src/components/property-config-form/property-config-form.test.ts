import { describe, it, expect, afterEach, vi } from 'vitest';
import { DataType, EntityPropertyCalculationReference } from 'api-spec/models/Entity';
import { PropertyConfigForm } from './property-config-form';

import './property-config-form';

vi.mock('@/lib/Storage', () => ({ storage: {} }));
vi.mock('@/lib/Util', () => ({ addToast: vi.fn() }));

const prop86 = {
  id: 86,
  name: 'Score',
  dataType: DataType.INT,
  repeat: 1,
  entityConfigId: 1,
  userId: '',
  defaultValue: 0,
  prefix: '',
  suffix: '',
  hidden: false,
};

const prop90 = {
  id: 90,
  name: 'Distance',
  dataType: DataType.INT,
  repeat: 1,
  entityConfigId: 1,
  userId: '',
  defaultValue: 0,
  prefix: '',
  suffix: '',
  hidden: false,
};

async function mount(props: Partial<PropertyConfigForm> = {}): Promise<PropertyConfigForm> {
  const el = document.createElement('property-config-form') as PropertyConfigForm;
  Object.assign(el, { entityConfigId: 1, allProperties: [prop86, prop90], ...props });
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

describe('property-config-form', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('buildCalculation — property operand default initialisation', () => {
    it('uses the first pickable property id for value2 when type is switched to property without interacting with the property dropdown', async () => {
      const el = await mount();

      el.value2Type = 'property';
      await el.updateComplete;

      const calc = el.buildCalculation();
      const value2 = calc.value2 as EntityPropertyCalculationReference;

      expect(value2.propertyConfigId).toBe(86);
    });

    it('uses the first pickable property id for value1 when type is switched to property without interacting with the property dropdown', async () => {
      const el = await mount();

      el.value1Type = 'property';
      await el.updateComplete;

      const calc = el.buildCalculation();
      const value1 = calc.value1 as EntityPropertyCalculationReference;

      expect(value1.propertyConfigId).toBe(86);
    });

    it('uses explicitly selected property id when user changes the property dropdown', async () => {
      const el = await mount();

      el.value2Type = 'property';
      await el.updateComplete;
      el.value2PropertyConfigId = 90;
      await el.updateComplete;

      const calc = el.buildCalculation();
      const value2 = calc.value2 as EntityPropertyCalculationReference;

      expect(value2.propertyConfigId).toBe(90);
    });

    it('exact repro: value1 explicitly set to a property, value2 switched to property without dropdown interaction', async () => {
      const el = await mount();

      el.value1Type = 'property';
      await el.updateComplete;
      el.value1PropertyConfigId = 86;
      await el.updateComplete;

      el.value2Type = 'property';
      await el.updateComplete;

      const calc = el.buildCalculation();
      const value1 = calc.value1 as EntityPropertyCalculationReference;
      const value2 = calc.value2 as EntityPropertyCalculationReference;

      expect(value1.propertyConfigId).toBe(86);
      expect(value2.propertyConfigId).not.toBe(0);
      expect(value2.propertyConfigId).toBe(86);
    });
  });
});
