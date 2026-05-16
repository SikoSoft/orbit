import { LitElement, TemplateResult, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('svg-key')
export class SVGKey extends LitElement {
  render(): TemplateResult {
    return html`
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
        <circle cx="6" cy="12" r="4" stroke="currentColor"></circle>
        <circle cx="6" cy="12" r="1.5" fill="currentColor" stroke="none"></circle>
        <path d="M10 12h12" stroke="currentColor"></path>
        <path d="M18 12v3" stroke="currentColor"></path>
        <path d="M21 12v2" stroke="currentColor"></path>
      </svg>
    `;
  }
}
