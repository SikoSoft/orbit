import { html, css, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { MobxLitElement } from '@adobe/lit-mobx';

import { Workspace } from 'api-spec/models/Workspace';
import { appState } from '@/state';
import { storage } from '@/lib/Storage';
import { ThemeName } from '@/models/Page';
import { Color } from '@/lib/Color';
import { translate } from '@/lib/Localization';
import { WorkspaceChangedEvent } from '@/events/workspace-changed';
import { CURATED_COLORS } from '@/components/color-selector/color-selector.models';

import {
  WorkspaceSelectorProp,
  workspaceSelectorProps,
  WorkspaceSelectorProps,
} from './workspace-selector.models';
import { classMap } from 'lit/directives/class-map.js';

const DEFAULT_COLOR = CURATED_COLORS[0];

@customElement('workspace-selector')
export class WorkspaceSelector extends MobxLitElement {
  static styles = css`
    :host {
      display: block;
    }

    .bar {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 2000;
      user-select: none;
      transition: background-color 0.2s;

      &.open {
        z-index: 5000;
      }
    }

    .bar-name {
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      pointer-events: none;
    }

    .overlay {
      position: fixed;
      inset: 0;
      z-index: 3000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      transition: background-color 0.2s;
    }

    .workspace-list {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
      width: 100%;
      padding: 2rem 1rem;
    }

    .workspace-item {
      cursor: pointer;
      transition:
        opacity 0.15s,
        font-size 0.15s;
      text-align: center;
      width: 100%;
      padding: 0.5rem 1rem;
    }

    .workspace-item--active {
      font-size: clamp(2rem, 8vw, 4rem);
      font-weight: 700;
      opacity: 1;
    }

    .workspace-item--adjacent {
      font-size: clamp(1.1rem, 4vw, 1.8rem);
      font-weight: 500;
      opacity: 0.55;
    }

    .workspace-item--far {
      font-size: clamp(0.85rem, 2.5vw, 1.2rem);
      font-weight: 400;
      opacity: 0.3;
    }

    .workspace-item:hover {
      opacity: 1;
    }

    .hint {
      position: absolute;
      bottom: 2rem;
      font-size: 0.75rem;
      opacity: 0.5;
      letter-spacing: 0.04em;
      pointer-events: none;
    }
  `;

  private appState = appState;

  @property({ type: Boolean })
  [WorkspaceSelectorProp.FORCE_OPEN]: WorkspaceSelectorProps[WorkspaceSelectorProp.FORCE_OPEN] =
    workspaceSelectorProps[WorkspaceSelectorProp.FORCE_OPEN].default;

  @state()
  private isExpanded: boolean = false;

  @state()
  private selectedIndex: number = 0;

  private touchStartY: number = 0;
  private touchLastY: number = 0;

  connectedCallback(): void {
    super.connectedCallback();
    this.syncSelectedIndex();
  }

  updated(changedProps: Map<string | symbol, unknown>): void {
    if (changedProps.has(WorkspaceSelectorProp.FORCE_OPEN)) {
      if (this[WorkspaceSelectorProp.FORCE_OPEN]) {
        this.isExpanded = true;
      }
    }

    if (changedProps.has('isExpanded') && this.isExpanded) {
      this.syncSelectedIndex();
    }
  }

  private syncSelectedIndex(): void {
    const workspaces = this.appState.workspaces;
    const activeId = this.appState.activeWorkspaceId;
    const idx = workspaces.findIndex(w => w.id === activeId);
    this.selectedIndex = idx >= 0 ? idx : 0;
  }

  private get savedWorkspace(): Workspace | undefined {
    return (
      this.appState.workspaces.find(
        w => w.id === this.appState.activeWorkspaceId,
      ) ?? this.appState.workspaces[0]
    );
  }

  private get navigatingWorkspace(): Workspace | undefined {
    return this.appState.workspaces[this.selectedIndex];
  }

  private colorFor(workspace: Workspace | undefined): string {
    return (
      workspace?.color || storage.getActiveWorkspaceColor() || DEFAULT_COLOR
    );
  }

  private get barBgColor(): string {
    return this.colorFor(this.savedWorkspace);
  }

  private get overlayBgColor(): string {
    return this.colorFor(this.navigatingWorkspace);
  }

  private adaptiveText(hex: string): string {
    try {
      return Color.getAdaptiveTextColor(hex);
    } catch {
      return '#ffffff';
    }
  }

  private handleBarClick(): void {
    if (this.appState.workspaces.length <= 1) {
      return;
    }
    this.isExpanded = true;
  }

  private handleWorkspaceItemClick(e: MouseEvent, index: number): void {
    e.stopPropagation();
    this.selectWorkspace(index);
  }

  private selectWorkspace(index: number): void {
    const workspace = this.appState.workspaces[index];
    if (!workspace) {
      return;
    }
    this.selectedIndex = index;
    storage.setActiveWorkspaceId(workspace.id);
    storage.setActiveWorkspaceColor(workspace.color);
    storage.setActiveWorkspaceTheme(workspace.theme as ThemeName);
    this.appState.setActiveWorkspaceId(workspace.id);
    this.appState.setWorkspaceSelectorVisible(false);
    this.isExpanded = false;
    this.dispatchEvent(
      new WorkspaceChangedEvent({ workspaceId: workspace.id }),
    );
  }

  private handleWheel = (e: WheelEvent): void => {
    if (!this.isExpanded) {
      return;
    }
    e.preventDefault();
    const workspaces = this.appState.workspaces;
    if (workspaces.length <= 1) {
      return;
    }
    const delta = e.deltaY > 0 ? 1 : -1;
    this.selectedIndex =
      (this.selectedIndex + delta + workspaces.length) % workspaces.length;
  };

  private handleTouchStart = (e: TouchEvent): void => {
    this.touchStartY = e.touches[0].clientY;
    this.touchLastY = this.touchStartY;
  };

  private handleTouchMove = (e: TouchEvent): void => {
    if (!this.isExpanded) {
      return;
    }
    e.preventDefault();
    const currentY = e.touches[0].clientY;
    const diff = this.touchLastY - currentY;
    if (Math.abs(diff) > 40) {
      const workspaces = this.appState.workspaces;
      if (workspaces.length <= 1) {
        return;
      }
      const delta = diff > 0 ? 1 : -1;
      this.selectedIndex =
        (this.selectedIndex + delta + workspaces.length) % workspaces.length;
      this.touchLastY = currentY;
    }
  };

  private handleOverlayClick(e: MouseEvent): void {
    if (e.target === e.currentTarget) {
      this.isExpanded = false;
      this.appState.setWorkspaceSelectorVisible(false);
    }
  }

  private itemClass(index: number): string {
    const diff = Math.abs(index - this.selectedIndex);
    if (diff === 0) {
      return 'workspace-item workspace-item--active';
    }
    if (diff === 1) {
      return 'workspace-item workspace-item--adjacent';
    }
    return 'workspace-item workspace-item--far';
  }

  private renderOverlay(): TemplateResult {
    const workspaces = this.appState.workspaces;
    const bg = this.overlayBgColor;
    const color = this.adaptiveText(bg);

    return html`
      <div
        class="overlay"
        style="background:${bg};color:${color}"
        @wheel=${this.handleWheel}
        @touchstart=${this.handleTouchStart}
        @touchmove=${this.handleTouchMove}
        @click=${this.handleOverlayClick}
      >
        <div class="workspace-list">
          ${repeat(
            workspaces,
            w => w.id,
            (w, i) => html`
              <div
                class=${this.itemClass(i)}
                style="color:${color}"
                @click=${(e: MouseEvent): void =>
                  this.handleWorkspaceItemClick(e, i)}
              >
                ${w.name}
              </div>
            `,
          )}
        </div>
        <div class="hint" style="color:${color}">
          ${translate('selectWorkspace')}
        </div>
      </div>
    `;
  }

  get classes(): Record<string, boolean> {
    return {
      bar: true,
      open: this.isExpanded || this[WorkspaceSelectorProp.FORCE_OPEN],
    };
  }

  render(): TemplateResult {
    const bg = this.barBgColor;
    const color = this.adaptiveText(bg);
    const workspaceName = this.savedWorkspace?.name ?? '';

    return html`
      <div
        class=${classMap(this.classes)}
        style="background:${bg};color:${color}"
        @click=${this.handleBarClick}
      >
        <span class="bar-name">${workspaceName}</span>
      </div>

      ${this.isExpanded || this[WorkspaceSelectorProp.FORCE_OPEN]
        ? this.renderOverlay()
        : ''}
    `;
  }
}
