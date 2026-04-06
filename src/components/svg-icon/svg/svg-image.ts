import { LitElement, TemplateResult, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('svg-image')
export class SVGImage extends LitElement {
  render(): TemplateResult {
    return html`
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="2"
          ry="2"
          stroke="currentColor"
        ></rect>
        <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor"></circle>
        <polyline points="21 15 16 10 5 21" stroke="currentColor"></polyline>
      </svg>
    `;
  }
}
