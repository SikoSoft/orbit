import {
  DEFAULT_LANGUAGE,
  Language,
  LocalizationStringMap,
} from '@/models/Localization';
import enStrings from '@/lib/data/localization/en.json';

export class Localization {
  public language: Language;
  private languageMap: Record<Language, LocalizationStringMap> = {
    [Language.EN]: enStrings,
  };

  constructor() {
    this.language = DEFAULT_LANGUAGE;
  }

  setLanguage(language: Language): void {
    this.language = language;
  }

  getLanguage(): Language {
    return this.language;
  }

  translate(
    key: string,
    replacement: Record<string, string | number> = {},
  ): string {
    let returnString = key;
    if (this.languageMap[this.language][key]) {
      returnString = this.languageMap[this.language][key];
    }

    if (replacement) {
      Object.keys(replacement).forEach(key => {
        returnString = returnString.replace(`{${key}}`, `${replacement[key]}`);
      });
    }

    return returnString;
  }
}

export const localization = new Localization();
export const setLanguage = (language: Language): void => {
  localization.setLanguage(language);
};
export const getLanguage = (): Language => {
  return localization.getLanguage();
};
export const translate = localization.translate.bind(localization);
