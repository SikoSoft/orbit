import { LitElement, TemplateResult, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('svg-close')
export class SVGClose extends LitElement {
  render(): TemplateResult {
    return html`
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
        <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor"></line>
        <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor"></line>
      </svg>
    `;
  }
}
