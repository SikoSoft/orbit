import { LitElement, TemplateResult, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('svg-wizard')
export class SVGGWizard extends LitElement {
  render(): TemplateResult {
    return html`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="currentColor"
        stroke="none"
      >
        <rect
          x="6"
          y="38"
          width="26"
          height="4"
          rx="2"
          transform="rotate(-45 6 38)"
        />
        <polygon
          points="28,4 29.5,8.5 34,8.5 30.5,11.5 32,16 28,13 24,16 25.5,11.5 22,8.5 26.5,8.5"
        />
        <polygon
          points="8,6 8.8,8.5 11.5,8.5 9.3,10.1 10.1,12.5 8,11 5.9,12.5 6.7,10.1 4.5,8.5 7.2,8.5"
        />
        <polygon
          points="38,24 38.5,25.8 40.5,25.8 38.9,27 39.5,28.8 38,27.7 36.5,28.8 37.1,27 35.5,25.8 37.5,25.8"
        />
        <polygon
          points="42,10 42.4,11.3 43.8,11.3 42.7,12.1 43.1,13.5 42,12.7 40.9,13.5 41.3,12.1 40.2,11.3 41.6,11.3"
        />
      </svg>
    `;
  }
}
