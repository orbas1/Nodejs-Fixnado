import { enGB } from './locales/en-GB.js';
import { esES } from './locales/es-ES.js';

export const dictionaries = {
  'en-GB': enGB,
  'es-ES': esES
};

export function resolveLocale(candidate) {
  if (!candidate) {
    return 'en-GB';
  }

  const normalised = candidate.toLowerCase();
  const exactMatch = Object.keys(dictionaries).find((key) => key.toLowerCase() === normalised);
  if (exactMatch) {
    return exactMatch;
  }

  const base = normalised.split('-')[0];
  const baseMatch = Object.keys(dictionaries).find((key) => key.split('-')[0].toLowerCase() === base);
  return baseMatch ?? 'en-GB';
}

