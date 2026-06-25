export const listConfigMenusSettingUpdatedEventName =
  'list-config-menus-setting-updated';

export class ListConfigMenusSettingUpdatedEvent extends CustomEvent<Record<string, never>> {
  constructor() {
    super(listConfigMenusSettingUpdatedEventName, {
      bubbles: true,
      composed: true,
      detail: {},
    });
  }
}
