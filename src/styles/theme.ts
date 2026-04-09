import { Theme, ThemeName } from '@/models/Page';
import { css } from 'lit';

export const themes: Record<ThemeName, Theme> = {
  [ThemeName.LIGHT]: {
    name: ThemeName.LIGHT,
    backgroundColor: css`#ededed`,
    sheet: new CSSStyleSheet(),
  },
  [ThemeName.DARK]: {
    name: ThemeName.DARK,
    backgroundColor: css`#12221a`,
    sheet: new CSSStyleSheet(),
  },
  [ThemeName.TODO]: {
    name: ThemeName.TODO,
    backgroundColor: css`#ffffff`,
    sheet: new CSSStyleSheet(),
  },
  [ThemeName.XMAS]: {
    name: ThemeName.XMAS,
    backgroundColor: css`#bb0000`,
    sheet: new CSSStyleSheet(),
  },
};

export const commonStyles = css`
  :host {
    color: var(--text-color);
  }

  input[type='text'],
  input[type='date'],
  input[type='datetime-local'],
  select,
  button {
    font-family: Poppins;
    padding: 0.5rem;
    box-sizing: border-box;
    width: 100%;
  }
  main {
    margin-top: 1rem;
  }

  fieldset {
    border-color: var(--border-color);
    border-radius: 0.5rem;
  }

  .box {
    background-color: var(--box-background-color);
    border-radius: 8px;
    border: 1px var(--box-border-color) solid;
  }

  .unsynced {
    color: var(--unsynced-color);
    background-color: var(--unsynced-background-color);
    border: 1px solid var(--unsynced-color);
  }
`;

export const lightStyles = [
  commonStyles,
  css`
    :host {
      --negative-color: #600;
      --negative-background-color: #ffc4c4;
      --positive-color: #060;
      --positive-background-color: #c4ffc4;
      --unsynced-color: #666;
      --unsynced-background-color: #c4c4c4;
      --primary-color: #0066ff;
      --border-color: #ccc;
      --border-color-light: #eee;
      --border-color-dark: #999;
      --border-radius: 0.5rem;
      --padding: 0.5rem;
      --font-size: 1rem;
      --text-color: #000;
      --background-color: ${themes[ThemeName.LIGHT].backgroundColor ??
      css`#ededed`};
      --background-hover-color: #e0e0e0;
      --box-background-color: #fff;
      --box-border-color: #aaa;
      --box-text-color: #000;
      --overlay-color-top: rgba(0, 0, 0, 0.25);
      --overlay-color-bottom: rgba(0, 0, 0, 0.75);

      --tabs-border-color: #ccc;
      --tabs-header-bg-color: #f9f9f9;
      --tabs-header-hover-bg-color: #eee;
      --tabs-border-color: #ccc;
      --tabs-active-header-bg-color: #fff;

      --input-background-color: #efefef;
      --input-border-color: #ccc;
      --input-text-color: #000;
      --input-suggestion-background-color: #fff;
      --input-suggestion-text-color: #888;
      --input-suggestion-selected-background-color: #ddd;
      --input-suggestion-selected-text-color: #000;

      --loader-color1: #000;
      --loader-color2: #0002;

      --toggle-outer-background-color1: #777;
      --toggle-outer-background-color2: #999;
      --toggle-inner-background-color1: #ccc;
      --toggle-inner-background-color2: #aaa;
      --toggle-ball-background-color1: #555;
      --toggle-ball-background-color2: #777;
      --toggle-ball-border-color: #222;
    }
  `,
];

themes[ThemeName.LIGHT].sheet.replaceSync(lightStyles.join('\n'));

export const darkStyles = [
  commonStyles,
  css`
    :host {
      --negative-color: #600;
      --negative-background-color: #ffc4c4;
      --positive-color: #060;
      --positive-background-color: #c4ffc4;
      --unsynced-color: #666;
      --unsynced-background-color: #c4c4c4;
      --primary-color: #0066ff;
      --border-color: #38635e;
      --border-color-light: #5a857f;
      --border-color-dark: #0a1911;
      --border-radius: 0.5rem;
      --padding: 0.5rem;
      --font-size: 1rem;
      --text-color: #cff5f4;
      --background-color: ${themes[ThemeName.DARK].backgroundColor};
      --background-hover-color: #1a2e2c;
      --box-background-color: #0a1911;
      --box-text-color: #cff5f4;
      --box-border-color: #38635e;
      --overlay-color-top: rgba(0, 0, 0, 0.25);
      --overlay-color-bottom: rgba(0, 0, 0, 0.75);

      --tabs-border-color: #3f6f6a;
      --tabs-header-bg-color: #1a2e2c;
      --tabs-header-hover-bg-color: #4d857e;
      --tabs-active-header-bg-color: #38635e;

      --input-background-color: #08100b;
      --input-border-color: #38635e;
      --input-unsaved-border-color: #b60;
      --input-text-color: #cff5f4;
      --input-suggestion-background-color: #000;
      --input-suggestion-text-color: #ccc;
      --input-suggestion-selected-background-color: #587;
      --input-suggestion-selected-text-color: #fff;

      --loader-color1: #cff5f4;
      --loader-color2: #cff5f422;

      --toggle-outer-background-color1: #354;
      --toggle-outer-background-color2: #132;
      --toggle-inner-background-color1: #477;
      --toggle-inner-background-color2: #799;
      --toggle-ball-background-color1: #243;
      --toggle-ball-background-color2: #132;
      --toggle-ball-border-color: #222;
    }
  `,
];

themes[ThemeName.DARK].sheet.replaceSync(darkStyles.join('\n'));

export const todoStyles = [
  commonStyles,
  css`
    .time {
      display: none;
    }

    .properties {
      position: relative;
    }

    .property--description {
      .property-name {
        display: none;
      }

      .property-value {
        font-size: 1.25rem;
      }
    }

    .property--details {
      .property-name {
        display: none;
      }

      .property-value {
        padding-right: 4rem;
        opacity: 0.8;
      }
    }

    .property--priority {
      padding: 0;

      .property-name {
        display: none;
      }

      .property-value {
        font-weight: bold;
        font-size: 2rem;
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
      }
    }
  `,
];

themes[ThemeName.TODO].sheet.replaceSync(todoStyles.join('\n'));

export const xmasStyles = [
  commonStyles,
  darkStyles,
  css`
    :host {
      --background-color: #bb0000;
      --text-color: #fff;
      --box-background-color: #770000;
      --box-border-color: #660000;
      --box-text-color: #fff;

      --tabs-border-color: #249c24;
      --tabs-header-bg-color: #050;
      --tabs-header-hover-bg-color: #080;
      --tabs-active-header-bg-color: #161;
    }

    .list-config .name {
      font-size: 5rem;
      ss-input::part(input) {
        font-family: 'Lavishly Yours', cursive;
      }
    }
  `,
];

themes[ThemeName.XMAS].sheet.replaceSync(xmasStyles.join('\n'));
