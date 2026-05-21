import { html, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import '@/components/dashboard-cards/dashboard-cards';

import { ViewElement } from '@/lib/ViewElement';
import { translate } from '@/lib/Localization';
import { IconName } from '@/components/svg-icon/svg-icon.models';
import { DashboardCard } from '@/components/dashboard-cards/dashboard-cards.models';

@customElement('admin-dashboard')
export class AdminDashboard extends ViewElement {
  private get cards(): DashboardCard[] {
    return [
      { label: translate('data'), icon: IconName.DATABASE, url: 'admin/data' },
      {
        label: translate('entities'),
        icon: IconName.SETTINGS,
        url: 'admin/entityConfig',
      },
    ];
  }

  render(): TemplateResult {
    return html` <dashboard-cards .cards=${this.cards}></dashboard-cards> `;
  }
}
