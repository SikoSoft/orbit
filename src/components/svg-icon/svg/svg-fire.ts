import { LitElement, TemplateResult, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('svg-fire')
export class SVGFire extends LitElement {
  render(): TemplateResult {
    return html`
      <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C12 2 8 7 8 11a4 4 0 0 0 8 0c0-1.5-.5-3-1.5-4C14 9 13 10 12 10c0-2 1-5 0-8z" fill="currentColor" stroke="none"/>
        <path d="M8.5 14.5C7 13.5 6 11.8 6 10c0 3.3 2.7 6 6 6s6-2.7 6-6c0 2-1.2 3.8-3 4.8" stroke="currentColor" fill="none"/>
      </svg>
    `;
  }
}
