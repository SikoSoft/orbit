import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  PrestigeGemProp,
  PrestigeGemProps,
  prestigeGemProps,
} from './prestige-gem.models';

type GemColors = {
  c1: string;
  c2: string;
  c3: string;
  c4: string;
  c5: string;
  shine: string;
  glow: string;
};

function getGemColors(prestige: number): GemColors {
  if (prestige <= 2) {
    return {
      c1: '#f5c870',
      c2: '#d4933a',
      c3: '#b06820',
      c4: '#884a10',
      c5: '#5a2c04',
      shine: 'rgba(255,230,160,0.8)',
      glow: 'rgba(176,104,32,0.7)',
    };
  }
  if (prestige <= 4) {
    return {
      c1: '#eeeeee',
      c2: '#c4c4c4',
      c3: '#989898',
      c4: '#646464',
      c5: '#303030',
      shine: 'rgba(255,255,255,0.9)',
      glow: 'rgba(140,140,140,0.55)',
    };
  }
  if (prestige <= 6) {
    return {
      c1: '#fff580',
      c2: '#ffd700',
      c3: '#c8a800',
      c4: '#907800',
      c5: '#504000',
      shine: 'rgba(255,252,180,0.85)',
      glow: 'rgba(200,168,0,0.7)',
    };
  }
  if (prestige <= 9) {
    return {
      c1: '#e0f8ff',
      c2: '#8ce8ff',
      c3: '#48b8e0',
      c4: '#1880b0',
      c5: '#084060',
      shine: 'rgba(255,255,255,0.95)',
      glow: 'rgba(24,128,176,0.7)',
    };
  }
  return {
    c1: '#f8f0ff',
    c2: '#d8c8f0',
    c3: '#b0a0d8',
    c4: '#6858a8',
    c5: '#302060',
    shine: 'rgba(255,255,255,0.95)',
    glow: 'rgba(110,90,180,0.65)',
  };
}

@customElement('prestige-gem')
export class PrestigeGem extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }
  `;

  @property({ type: Number })
  [PrestigeGemProp.PRESTIGE]: PrestigeGemProps[PrestigeGemProp.PRESTIGE] =
    prestigeGemProps[PrestigeGemProp.PRESTIGE].default;

  render(): TemplateResult {
    const p = this[PrestigeGemProp.PRESTIGE];
    const c = getGemColors(p);

    return html`
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="gem-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="1"
              stdDeviation="1.5"
              flood-color="${c.glow}"
            />
          </filter>
        </defs>
        <g filter="url(#gem-shadow)">
          <!-- Crown center (table) — brightest face -->
          <polygon points="7,3 17,3 16,12 8,12" fill="${c.c1}" />
          <!-- Crown left shoulder — angled, medium light -->
          <polygon points="2,12 7,3 8,12" fill="${c.c2}" />
          <!-- Crown right shoulder — angled, medium dark -->
          <polygon points="17,3 22,12 16,12" fill="${c.c3}" />
          <!-- Pavilion center — medium depth -->
          <polygon points="8,12 16,12 12,23" fill="${c.c3}" />
          <!-- Pavilion left — deeper shadow -->
          <polygon points="2,12 8,12 12,23" fill="${c.c4}" />
          <!-- Pavilion right — deepest shadow -->
          <polygon points="16,12 22,12 12,23" fill="${c.c5}" />
          <!-- Facet separator lines -->
          <line
            x1="8"
            y1="12"
            x2="12"
            y2="23"
            stroke="rgba(0,0,0,0.15)"
            stroke-width="0.4"
          />
          <line
            x1="16"
            y1="12"
            x2="12"
            y2="23"
            stroke="rgba(0,0,0,0.15)"
            stroke-width="0.4"
          />
          <!-- Crown outline -->
          <polygon
            points="2,12 7,3 17,3 22,12 12,23"
            fill="none"
            stroke="rgba(0,0,0,0.12)"
            stroke-width="0.5"
          />
        </g>
        <!-- Glare highlight on crown -->
        <ellipse
          cx="9.5"
          cy="7"
          rx="3.5"
          ry="2.2"
          fill="${c.shine}"
          opacity="0.75"
        />
      </svg>
    `;
  }
}
