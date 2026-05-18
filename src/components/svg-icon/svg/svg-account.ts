import { LitElement, TemplateResult, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('svg-account')
export class SVGAccount extends LitElement {
  render(): TemplateResult {
    return html`
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="8" r="4" stroke="currentColor"></circle>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor"></path>
      </svg>
    `;
  }
}
