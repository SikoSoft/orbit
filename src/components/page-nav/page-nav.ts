import { html, css, TemplateResult } from 'lit';
import { property, customElement, state } from 'lit/decorators.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { translate } from '@/lib/Localization';
import { PageView } from '@/models/Page';
import { appState } from '@/state';
import { PageNavProp, pageNavProps, PageNavProps } from './page-nav.models';
import { navigate, routerState } from '@/lib/Router';

import { TabIndexChangedEvent } from '@ss/ui/components/tab-container.events';
import { repeat } from 'lit/directives/repeat.js';
import { MobxReactionsController } from '@/lib/MobxReactionController';
import { themed } from '@/lib/Theme';

export interface PageViewConfig {
  id: PageView;
  label: string;
  url: string;
}

const views: PageViewConfig[] = [
  {
    id: PageView.INPUT,
    label: translate('new'),
    url: '/',
  },
  { id: PageView.LIST, label: translate('list'), url: '/entities' },
  { id: PageView.ADMIN, label: translate('admin'), url: '/admin' },
];

const debugViews: PageViewConfig[] = [...views];

@themed()
@customElement('page-nav')
export class PageNav extends MobxLitElement {
  private state = appState;
  private rx = new MobxReactionsController(this);

  static styles = css`
    .box {
      overflow: hidden;
    }

    nav span {
      display: inline-block;
      height: 32px;
      line-height: 32px;
      width: calc(100% / var(--num-views));
      text-align: center;
      background-color: #ececec;
      cursor: pointer;
    }

    nav span.active {
      background-color: #fff;
    }

    tab-container::party(headers) {
      display: flex;
    }

    tab-container::part(header) {
      text-align: center;
      flex: 1;
    }

    tab-container::part(content) {
      display: none;
    }
  `;

  @property()
  [PageNavProp.ACTIVE]: PageNavProps[PageNavProp.ACTIVE] =
    pageNavProps[PageNavProp.ACTIVE].default;

  @state()
  activePath: string = '/';

  @state()
  get displayViews(): PageViewConfig[] {
    return this.state.debugMode ? debugViews : views;
  }

  constructor() {
    super();
    this.rx.add({
      expr: () => routerState.currentPath,
      effect: newPath => {
        this.activePath = newPath;
      },
      opts: { fireImmediately: true },
    });
  }

  setActiveView(view: PageView): void {
    const url = this.displayViews.find(v => v.id === view)?.url || '';
    navigate(url);
  }

  handleTabChanged(e: TabIndexChangedEvent): void {
    const index = e.detail.index;
    const view = this.displayViews[index];
    if (view) {
      this.setActiveView(view.id);
    }
  }

  render(): TemplateResult {
    return html`
      <nav
        class="box"
        style="--num-views: ${this.displayViews.length}"
        data-debug=${this.state.debugMode ? 'true' : 'false'}
        data-view-count=${this.displayViews.length}
      >
        <tab-container
          paneId="page-nav"
          @tab-index-changed=${this.handleTabChanged}
          index=${this.displayViews.findIndex(v => v.url === this.activePath)}
        >
          ${repeat(
            this.displayViews,
            view => view.id,
            view => html`<tab-pane title=${view.label}></tab-pane>`,
          )}
        </tab-container>
      </nav>
    `;
  }
}
