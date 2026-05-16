import { LitElement, TemplateResult, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('svg-layers')
export class SVGLayers extends LitElement {
  render(): TemplateResult {
    return html`
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
        <polygon points="12 2 2 7 12 12 22 7 12 2" stroke="currentColor"></polygon>
        <polyline points="2 17 12 22 22 17" stroke="currentColor"></polyline>
        <polyline points="2 12 12 17 22 12" stroke="currentColor"></polyline>
      </svg>
    `;
  }
}
