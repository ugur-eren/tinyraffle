import English from './English';

export const MapLanguages = {
  en: English,
};

export type LanguageKeys = keyof typeof MapLanguages;
export const LanguageKeys = Object.keys(MapLanguages) as unknown as LanguageKeys[];

const FALLBACK_DEFAULT_LANGUAGE: LanguageKeys = 'en';
const LANGUAGE_STORAGE_KEY = process.env.REACT_APP_LANGUAGE_STORAGE_KEY || 'language';
const BROWSER_LANGUAGE_KEY = navigator.language.split('-')[0] as unknown as LanguageKeys;
const BROWSER_ALL_LANGUAGES = navigator.languages as unknown as LanguageKeys[];

const StorageLanguageKey = localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'default';

const GetActiveLanguageKey = (): LanguageKeys => {
  // If there is no language key in the storage, check the browser language
  // to see if it matches with assigned languages.
  if (StorageLanguageKey === 'default') {
    if (BROWSER_LANGUAGE_KEY in MapLanguages) {
      return BROWSER_LANGUAGE_KEY;
    }

    const foundKey = BROWSER_ALL_LANGUAGES.find((languageKey) => {
      return LanguageKeys.indexOf(languageKey.split('-')[0] as unknown as LanguageKeys) !== -1;
    });

    if (foundKey) return foundKey;
  }

  // If above checks fails, check if the language key in the store matches with assigned languages.
  if (StorageLanguageKey in MapLanguages) {
    return StorageLanguageKey as unknown as LanguageKeys;
  }

  // If above check fails, return the default fallback language
  return FALLBACK_DEFAULT_LANGUAGE;
};

export const ChangeActiveLanguage = (newLanguage: LanguageKeys | 'default'): void => {
  if (newLanguage === 'default') {
    localStorage.removeItem(LANGUAGE_STORAGE_KEY);
  } else {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
  }

  window.location.reload();
};

const ActiveLanguageKey = GetActiveLanguageKey();

document.getElementsByTagName('html')[0].lang = ActiveLanguageKey;

export default MapLanguages[ActiveLanguageKey] as typeof English;
