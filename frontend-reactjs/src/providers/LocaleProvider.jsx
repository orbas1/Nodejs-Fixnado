import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { dictionaries, resolveLocale } from '../i18n/index.js';

const STORAGE_KEY = 'fixnado:locale';

const LocaleContext = createContext(null);

function replacePlaceholders(template, values) {
  if (!values) {
    return template;
  }

  return template.replace(/\{([^}]+)\}/g, (match, key) => {
    const cleanedKey = key.trim();
    if (!Object.prototype.hasOwnProperty.call(values, cleanedKey)) {
      return '';
    }

    const value = values[cleanedKey];
    return value === undefined || value === null ? '' : String(value);
  });
}

function normaliseDocumentLanguage({ htmlLang, direction }) {
  if (typeof document === 'undefined') {
    return;
  }

  if (htmlLang) {
    document.documentElement.setAttribute('lang', htmlLang);
  }

  document.documentElement.setAttribute('dir', direction ?? 'ltr');
}

function readStoredLocale() {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.warn('[LocaleProvider] Unable to read stored locale', error);
    return null;
  }
}

function persistLocale(locale) {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch (error) {
    console.warn('[LocaleProvider] Unable to persist locale', error);
  }
}

function detectInitialLocale(explicitInitialLocale) {
  if (explicitInitialLocale) {
    return resolveLocale(explicitInitialLocale);
  }

  const stored = readStoredLocale();
  if (stored) {
    return resolveLocale(stored);
  }

  if (typeof navigator !== 'undefined') {
    const navigatorLocales = Array.isArray(navigator.languages) && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language];

    for (const candidate of navigatorLocales) {
      if (candidate) {
        return resolveLocale(candidate);
      }
    }
  }

  return 'en-GB';
}

export function LocaleProvider({ children, initialLocale = undefined }) {
  const [locale, setLocaleState] = useState(() => detectInitialLocale(initialLocale));

  const dictionary = dictionaries[locale] ?? dictionaries['en-GB'];

  const setLocale = useCallback((nextLocale) => {
    setLocaleState((current) => {
      const resolved = resolveLocale(nextLocale ?? current);
      persistLocale(resolved);
      return resolved;
    });
  }, []);

  useEffect(() => {
    normaliseDocumentLanguage(dictionary.metadata);
  }, [dictionary.metadata]);

  const translate = useCallback(
    (key, values) => {
      const template = dictionary.messages[key];
      if (!template) {
        return key;
      }
      return replacePlaceholders(template, values);
    },
    [dictionary.messages]
  );

  const formats = useMemo(() => {
    const { numberLocale, currency, dateLocale } = dictionary.metadata;
    const fallbackText = dictionary.messages['common.notAvailable'] ?? 'Not available';

    return {
      number: (value, options) => {
        if (!Number.isFinite(value)) {
          return fallbackText;
        }
        return new Intl.NumberFormat(numberLocale, { maximumFractionDigits: 0, ...options }).format(value);
      },
      percentage: (value, options) => {
        if (typeof value !== 'number') {
          return fallbackText;
        }
        return new Intl.NumberFormat(numberLocale, {
          style: 'percent',
          maximumFractionDigits: 1,
          ...options
        }).format(value);
      },
      currency: (value, options) => {
        if (typeof value !== 'number') {
          return fallbackText;
        }
        return new Intl.NumberFormat(numberLocale, {
          style: 'currency',
          currency,
          maximumFractionDigits: 0,
          ...options
        }).format(value);
      },
      date: (value, options) => {
        if (!value) {
          return fallbackText;
        }
        try {
          return new Intl.DateTimeFormat(dateLocale, { dateStyle: 'medium', ...options }).format(new Date(value));
        } catch (error) {
          console.warn('[LocaleProvider] Unable to format date', error);
          return fallbackText;
        }
      },
      dateTime: (value, options) => {
        if (!value) {
          return fallbackText;
        }
        try {
          return new Intl.DateTimeFormat(dateLocale, {
            dateStyle: 'medium',
            timeStyle: 'short',
            ...options
          }).format(new Date(value));
        } catch (error) {
          console.warn('[LocaleProvider] Unable to format date/time', error);
          return fallbackText;
        }
      }
    };
  }, [dictionary.metadata, dictionary.messages]);

  const availableLocales = useMemo(() => {
    const locales = Object.values(dictionaries).map((entry) => {
      const { id, name, language, nativeName, direction, flag } = entry.metadata;
      const fallbackLanguage = language ?? (typeof name === 'string' ? name.replace(/\s*\(.*?\)\s*/g, '').trim() : name);
      const fallbackNative = nativeName ?? fallbackLanguage;

      return {
        id,
        name,
        language: fallbackLanguage,
        nativeName: fallbackNative,
        direction,
        flag: flag ?? ''
      };
    });

    return locales.sort((a, b) => a.language.localeCompare(b.language, undefined, { sensitivity: 'base' }));
  }, []);

  const value = useMemo(
    () => ({
      locale,
      direction: dictionary.metadata.direction,
      availableLocales,
      setLocale,
      t: translate,
      format: formats
    }),
    [availableLocales, dictionary.metadata.direction, formats, locale, setLocale, translate]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

LocaleProvider.propTypes = {
  children: PropTypes.node.isRequired,
  initialLocale: PropTypes.string
};

export function useLocaleContext() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

