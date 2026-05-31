import { HSL, RGB } from '@/models/Color';

export class Color {
  static rgbToHsl({ r, g, b }: RGB): HSL {
    const normR = r / 255;
    const normG = g / 255;
    const normB = b / 255;

    const max = Math.max(normR, normG, normB);
    const min = Math.min(normR, normG, normB);

    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case normR:
          h = (normG - normB) / d + (normG < normB ? 6 : 0);
          break;
        case normG:
          h = (normB - normR) / d + 2;
          break;
        case normB:
          h = (normR - normG) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }

  static parseHexToRgb(hexColor: string): RGB {
    let cleanHex = hexColor.replace('#', '').trim();

    if (cleanHex.length === 3) {
      cleanHex = cleanHex
        .split('')
        .map(char => char + char)
        .join('');
    }

    if (cleanHex.length !== 6) {
      throw new Error(`Invalid hex color format: ${hexColor}`);
    }

    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      throw new Error(`Invalid hex color values: ${hexColor}`);
    }

    return { r, g, b };
  }

  static calculateChannelLuminance(channelValue: number): number {
    const s = channelValue / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }

  static getRelativeLuminance({ r, g, b }: RGB): number {
    const rL = Color.calculateChannelLuminance(r);
    const gL = Color.calculateChannelLuminance(g);
    const bL = Color.calculateChannelLuminance(b);

    return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
  }

  static getAdaptiveTextColor(backgroundHex: string): string {
    const rgb = Color.parseHexToRgb(backgroundHex);
    const luminance = Color.getRelativeLuminance(rgb);
    const { h, s } = Color.rgbToHsl(rgb);

    const isLightBackground = luminance > 0.179;

    if (isLightBackground) {
      const targetSaturation = Math.min(100, s + 10);
      return `hsl(${h}, ${targetSaturation}%, 12%)`;
    } else {
      const targetSaturation = Math.max(0, s - 15);
      return `hsl(${h}, ${targetSaturation}%, 93%)`;
    }
  }
}
