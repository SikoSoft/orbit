import { LitElement, TemplateResult, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('svg-lock')
export class SVGLock extends LitElement {
  render(): TemplateResult {
    return html`
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor"></rect>
        <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor"></path>
        <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none"></circle>
      </svg>
    `;
  }
}
