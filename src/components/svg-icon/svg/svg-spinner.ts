import { LitElement, TemplateResult, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('svg-spinner')
export class SVGSpinner extends LitElement {
  static styles = css`
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    svg {
      animation: spin 0.8s linear infinite;
    }

    circle {
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-dasharray: 40;
      stroke-dashoffset: 12;
    }
  `;

  render(): TemplateResult {
    return html`
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10"></circle>
      </svg>
    `;
  }
}
