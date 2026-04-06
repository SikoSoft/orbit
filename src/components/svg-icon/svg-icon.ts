import { LitElement, html, css, nothing, TemplateResult } from 'lit';
import { property, customElement } from 'lit/decorators.js';

import { themed } from '@/lib/Theme';

import './svg/svg-cloud';
import './svg/svg-device';

import {
  IconName,
  SvgIconProp,
  SvgIconProps,
  svgIconProps,
} from './svg-icon.models';

@themed()
@customElement('svg-icon')
export class SvgIcon extends LitElement {
  static styles = [
    css`
      :host {
        display: inline-block;
        vertical-align: middle;
        width: var(--size, 24px);
        height: var(--size, 24px);
      }

      .icon {
        display: inline-block;
        width: var(--size, 24px);
        height: var(--size, 24px);

        & > * {
          display: inline-block;
          width: 100%;
          height: 100%;
          color: var(--color, #000);
        }
      }
    `,
  ];

  @property()
  [SvgIconProp.NAME]: SvgIconProps[SvgIconProp.NAME] =
    svgIconProps[SvgIconProp.NAME].default;

  @property()
  [SvgIconProp.COLOR]: SvgIconProps[SvgIconProp.COLOR] =
    svgIconProps[SvgIconProp.COLOR].default;

  @property({ type: Number })
  [SvgIconProp.SIZE]: SvgIconProps[SvgIconProp.SIZE] =
    svgIconProps[SvgIconProp.SIZE].default;

  updated(changedProperties: Map<string | number | symbol, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has(SvgIconProp.SIZE)) {
      this.style.setProperty('--size', `${this[SvgIconProp.SIZE]}px`);
    }
  }

  renderIcon(): TemplateResult | typeof nothing {
    switch (this[SvgIconProp.NAME]) {
      case IconName.CLOUD:
        return html`<svg-cloud></svg-cloud>`;
      case IconName.DEVICE:
        return html`<svg-device></svg-device>`;
      default:
        return nothing;
    }
  }

  render(): TemplateResult {
    return html`
      <span
        class="icon"
        style="--color: ${this[SvgIconProp.COLOR]}; --size: ${this[
          SvgIconProp.SIZE
        ]}px;"
      >
        ${this.renderIcon()}
      </span>
    `;
  }
}
