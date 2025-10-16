import { normaliseRole } from '../constants/accessControl.js';

export const PERSONA_ACCESS_KEY = 'fixnado:personaAccess';
export const ACTIVE_PERSONA_KEY = 'fixnado:activePersona';

const DEFAULT_ALLOWED = Object.freeze(['user', 'finance']);

function sanitiseList(list) {
  if (!Array.isArray(list)) {
    return [];
  }

  const unique = new Set();
  list.forEach((entry) => {
    const role = normaliseRole(entry);
    if (role) {
      unique.add(role);
    }
  });

  return Array.from(unique);
}

function readRawPersonaAccess() {
  if (typeof window === 'undefined') {
    return [...DEFAULT_ALLOWED];
  }

  try {
    const stored = window.localStorage?.getItem(PERSONA_ACCESS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const cleaned = sanitiseList(parsed);
      if (cleaned.length > 0) {
        return cleaned;
      }
    }

    const active = window.localStorage?.getItem(ACTIVE_PERSONA_KEY);
    const normalisedActive = normaliseRole(active);
    if (normalisedActive) {
      return [normalisedActive];
    }
  } catch (error) {
    console.warn('[personaStorage] unable to read persona access metadata', error);
  }

  return [...DEFAULT_ALLOWED];
}

export function readPersonaAccess() {
  return readRawPersonaAccess();
}

function emitPersonaChangeEvent(allowed) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.dispatchEvent(new CustomEvent('fixnado:persona:change', { detail: { allowed } }));
  } catch (error) {
    console.warn('[personaStorage] unable to emit persona change event', error);
  }
}

export function writePersonaAccess(nextAllowed) {
  if (typeof window === 'undefined') {
    return [...DEFAULT_ALLOWED];
  }

  const cleaned = sanitiseList(nextAllowed);
  const finalList = cleaned.length > 0 ? cleaned : [...DEFAULT_ALLOWED];

  try {
    window.localStorage?.setItem(PERSONA_ACCESS_KEY, JSON.stringify(finalList));
  } catch (error) {
    console.warn('[personaStorage] unable to persist persona access metadata', error);
  }

  emitPersonaChangeEvent(finalList);
  try {
    window.dispatchEvent(new Event('fixnado:session:update'));
  } catch (error) {
    console.warn('[personaStorage] unable to dispatch session update', error);
  }

  return finalList;
}

export function addPersonaAccess(persona) {
  const allowed = readRawPersonaAccess();
  const candidate = normaliseRole(persona);
  if (!candidate) {
    return allowed;
  }

  if (!allowed.includes(candidate)) {
    allowed.push(candidate);
  }

  return writePersonaAccess(allowed);
}

export function removePersonaAccess(persona) {
  const allowed = readRawPersonaAccess();
  const candidate = normaliseRole(persona);
  if (!candidate) {
    return allowed;
  }

  const filtered = allowed.filter((entry) => entry !== candidate);
  return writePersonaAccess(filtered);
}

export function readActivePersona() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return normaliseRole(window.localStorage?.getItem(ACTIVE_PERSONA_KEY));
  } catch (error) {
    console.warn('[personaStorage] unable to read active persona', error);
    return null;
  }
}

export function writeActivePersona(persona) {
  if (typeof window === 'undefined') {
    return null;
  }

  const candidate = normaliseRole(persona);
  try {
    if (candidate) {
      window.localStorage?.setItem(ACTIVE_PERSONA_KEY, candidate);
    } else {
      window.localStorage?.removeItem(ACTIVE_PERSONA_KEY);
    }
  } catch (error) {
    console.warn('[personaStorage] unable to persist active persona', error);
  }

  if (candidate) {
    addPersonaAccess(candidate);
  } else {
    const allowed = readRawPersonaAccess();
    emitPersonaChangeEvent(allowed);
    try {
      window.dispatchEvent(new Event('fixnado:session:update'));
    } catch (error) {
      console.warn('[personaStorage] unable to dispatch session update for persona reset', error);
    }
  }

  return candidate;
}

export function resetPersonaAccess() {
  if (typeof window === 'undefined') {
    return [...DEFAULT_ALLOWED];
  }

  try {
    window.localStorage?.removeItem(PERSONA_ACCESS_KEY);
  } catch (error) {
    console.warn('[personaStorage] unable to clear persona access metadata', error);
  }
  return writePersonaAccess([...DEFAULT_ALLOWED]);
}

export function getDefaultAllowedPersonas() {
  return [...DEFAULT_ALLOWED];
}

export default {
  PERSONA_ACCESS_KEY,
  ACTIVE_PERSONA_KEY,
  readPersonaAccess,
  writePersonaAccess,
  addPersonaAccess,
  removePersonaAccess,
  readActivePersona,
  writeActivePersona,
  resetPersonaAccess,
  getDefaultAllowedPersonas
};
