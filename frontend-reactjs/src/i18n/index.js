import { arSA } from './locales/ar-SA.js';
import { deDE } from './locales/de-DE.js';
import { enGB } from './locales/en-GB.js';
import { esES } from './locales/es-ES.js';
import { frFR } from './locales/fr-FR.js';
import { hiIN } from './locales/hi-IN.js';
import { itIT } from './locales/it-IT.js';
import { plPL } from './locales/pl-PL.js';
import { ptBR } from './locales/pt-BR.js';
import { ruRU } from './locales/ru-RU.js';

export const dictionaries = {
  'ar-SA': arSA,
  'de-DE': deDE,
  'en-GB': enGB,
  'es-ES': esES,
  'fr-FR': frFR,
  'hi-IN': hiIN,
  'it-IT': itIT,
  'pl-PL': plPL,
  'pt-BR': ptBR,
  'ru-RU': ruRU
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

