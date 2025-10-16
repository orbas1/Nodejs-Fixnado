import { PanelApiError } from './panelClient.js';
import { normaliseRole } from '../constants/accessControl.js';
import { ROLE_DASHBOARD_MAP, SESSION_STORAGE_KEY } from '../hooks/useSession.js';

const STORAGE_KEY = 'fixnado:offline-users';
const SESSION_DURATION_MINUTES = 4 * 60; // 4 hours
const REFRESH_DURATION_MINUTES = 24 * 60; // 24 hours

const DEMO_PASSWORD_SHA256 = 'bf48aff49aa9a2f2c572750b4d7443b442556c8a9920639dea3869fac14aaa67';
const DEMO_PASSWORD_BASE64 = 'Rml4bmFkbyEyMDI0';

const DEMO_USERS = Object.freeze([
  {
    id: 'offline-admin',
    email: 'admin@fixnado.dev',
    firstName: 'Avery',
    lastName: 'Admin',
    type: 'admin',
    passwordHash: DEMO_PASSWORD_SHA256,
    legacyHashes: [DEMO_PASSWORD_BASE64],
    address: 'Fixnado HQ\nLondon\nUnited Kingdom',
    age: 34,
    company: {
      legalStructure: 'Private limited company',
      contactName: 'Avery Admin',
      contactEmail: 'admin@fixnado.dev',
      serviceRegions: 'Global operations',
      marketplaceIntent: 'Platform orchestration'
    }
  },
  {
    id: 'offline-provider',
    email: 'provider@fixnado.dev',
    firstName: 'Parker',
    lastName: 'Pro',
    type: 'provider',
    passwordHash: DEMO_PASSWORD_SHA256,
    legacyHashes: [DEMO_PASSWORD_BASE64],
    address: '12 Yard Way\nManchester\nUnited Kingdom',
    age: 31,
    company: {
      legalStructure: 'Sole trader',
      contactName: 'Parker Pro',
      contactEmail: 'provider@fixnado.dev',
      serviceRegions: 'North West England',
      marketplaceIntent: 'Equipment hire & rapid response crews'
    }
  },
  {
    id: 'offline-finance',
    email: 'finance@fixnado.dev',
    firstName: 'Frankie',
    lastName: 'Ledger',
    type: 'finance',
    passwordHash: DEMO_PASSWORD_SHA256,
    legacyHashes: [DEMO_PASSWORD_BASE64],
    address: '88 Escrow Street\nLondon\nUnited Kingdom',
    age: 36,
    company: {
      legalStructure: 'Private limited company',
      contactName: 'Frankie Ledger',
      contactEmail: 'finance@fixnado.dev',
      serviceRegions: 'UK & EU',
      marketplaceIntent: 'Financial governance & payouts'
    }
  },
  {
    id: 'offline-enterprise',
    email: 'enterprise@fixnado.dev',
    firstName: 'Eden',
    lastName: 'Ops',
    type: 'enterprise',
    passwordHash: DEMO_PASSWORD_SHA256,
    legacyHashes: [DEMO_PASSWORD_BASE64],
    address: '41 Fleet Square\nBirmingham\nUnited Kingdom',
    age: 39,
    company: {
      legalStructure: 'Enterprise partnership',
      contactName: 'Eden Ops',
      contactEmail: 'enterprise@fixnado.dev',
      serviceRegions: 'National coverage',
      marketplaceIntent: 'Enterprise coordination & subcontracting'
    }
  },
  {
    id: 'offline-member',
    email: 'member@fixnado.dev',
    firstName: 'Maya',
    lastName: 'Member',
    type: 'user',
    passwordHash: DEMO_PASSWORD_SHA256,
    legacyHashes: [DEMO_PASSWORD_BASE64],
    address: '22 Riverside Close\nLeeds\nUnited Kingdom',
    age: 29,
    company: null
  }
]);

const cloneUserRecord = (user) => {
  if (!user || typeof user !== 'object') {
    return null;
  }

  const base = { ...user };
  if (Array.isArray(user.legacyHashes)) {
    base.legacyHashes = [...user.legacyHashes];
  } else if (user.legacyHashes) {
    base.legacyHashes = [user.legacyHashes];
  } else {
    base.legacyHashes = [];
  }
  if (user.company && typeof user.company === 'object') {
    base.company = { ...user.company };
  } else {
    base.company = user.company ?? null;
  }
  return base;
};

const getSeedUsers = () => DEMO_USERS.map((user) => cloneUserRecord(user)).filter(Boolean);

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readUsers() {
  if (!isBrowser()) {
    return getSeedUsers();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getSeedUsers();
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return getSeedUsers();
    }
    return parsed
      .map((entry) => cloneUserRecord(entry))
      .filter((entry) => entry && typeof entry.email === 'string' && entry.email.trim().length > 0);
  } catch (error) {
    console.warn('[offlineSession] unable to read stored users', error);
    return getSeedUsers();
  }
}

function writeUsers(users) {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.warn('[offlineSession] unable to persist stored users', error);
  }
}

function encodeBase64Secret(secret) {
  if (!secret) {
    return '';
  }

  try {
    return btoa(unescape(encodeURIComponent(secret)));
  } catch (error) {
    console.warn('[offlineSession] unable to base64 secret', error);
    return '';
  }
}

async function hashSecret(secret) {
  if (!secret) {
    return '';
  }

  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(secret);
      const digest = await window.crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(digest))
        .map((value) => value.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      console.warn('[offlineSession] unable to hash secret via subtle crypto', error);
    }
  }

  const fallback = encodeBase64Secret(secret);
  return fallback || secret;
}

async function buildPasswordRecord(secret) {
  const passwordHash = await hashSecret(secret);
  const legacyHashes = [];
  const base64 = encodeBase64Secret(secret);
  if (base64 && base64 !== passwordHash) {
    legacyHashes.push(base64);
  }

  return { passwordHash, legacyHashes };
}

function normaliseEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function resolveStoredSessionUserId() {
  if (!isBrowser()) {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed === 'object' && parsed.userId) {
      return String(parsed.userId);
    }
  } catch (error) {
    console.warn('[offlineSession] unable to parse stored session user id', error);
  }

  return null;
}

function determineRole(type) {
  return normaliseRole(type || 'user') || 'user';
}

function buildSession(user) {
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + SESSION_DURATION_MINUTES * 60 * 1000);
  const refreshExpiresAt = new Date(issuedAt.getTime() + REFRESH_DURATION_MINUTES * 60 * 1000);
  const role = determineRole(user.type);

  return {
    id: `offline-${issuedAt.getTime()}`,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    refreshExpiresAt: refreshExpiresAt.toISOString(),
    role,
    persona: role,
    dashboards: ROLE_DASHBOARD_MAP[role] ?? []
  };
}

function serialiseUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    type: user.type,
    address: user.address,
    age: user.age,
    company: user.company ?? null
  };
}

export function canUseOfflineAuth() {
  if (!isBrowser()) {
    return false;
  }

  if (navigator?.onLine === false) {
    return true;
  }

  const flag = window.localStorage.getItem('fixnado:enable-offline-auth');
  return flag === '1' || flag === 'true';
}

export async function registerOfflineUser(payload, { force = false } = {}) {
  if (!force && !canUseOfflineAuth()) {
    return null;
  }

  const email = normaliseEmail(payload?.email);
  if (!email) {
    throw new PanelApiError('Email is required', 422);
  }

  if (!payload?.password || payload.password.length < 4) {
    throw new PanelApiError('Password must be at least 4 characters', 422);
  }

  const users = readUsers();
  if (users.some((entry) => entry.email === email)) {
    throw new PanelApiError('Email already registered locally', 409);
  }

  const { passwordHash, legacyHashes } = await buildPasswordRecord(payload.password);
  const now = Date.now();
  const userRecord = {
    id: `offline-user-${now}`,
    email,
    firstName: payload.firstName?.trim() || 'Offline',
    lastName: payload.lastName?.trim() || 'User',
    type: payload.type || 'user',
    passwordHash,
    legacyHashes,
    address: payload.address || null,
    age: payload.age ?? null,
    company: payload.company || null
  };

  users.push(userRecord);
  writeUsers(users);

  return serialiseUser(userRecord);
}

export async function loginOfflineUser({ email, password }, { force = false } = {}) {
  if (!force && !canUseOfflineAuth()) {
    return null;
  }

  const normalisedEmail = normaliseEmail(email);
  if (!normalisedEmail) {
    throw new PanelApiError('Email is required', 422);
  }

  const users = readUsers();
  const matched = users.find((entry) => entry.email === normalisedEmail);
  if (!matched) {
    throw new PanelApiError('Invalid credentials', 401);
  }

  const hashed = await hashSecret(password ?? '');
  const fallback = encodeBase64Secret(password ?? '');
  const candidates = [hashed];
  if (fallback && !candidates.includes(fallback)) {
    candidates.push(fallback);
  }

  const storedHashes = [matched.passwordHash, ...(matched.legacyHashes ?? [])].filter(Boolean);
  const valid = candidates.some((candidate) => storedHashes.includes(candidate));

  if (!valid) {
    throw new PanelApiError('Invalid credentials', 401);
  }

  return {
    user: serialiseUser(matched),
    session: buildSession(matched),
    tokens: null,
    expiresIn: `${SESSION_DURATION_MINUTES}m`
  };
}

export function getOfflineProfile(email, { force = false } = {}) {
  if (!force && !canUseOfflineAuth()) {
    return null;
  }

  const normalisedEmail = normaliseEmail(email);
  const identifier = normalisedEmail || resolveStoredSessionUserId();
  if (!identifier) {
    return null;
  }

  const users = readUsers();
  const matched = users.find((entry) => entry.email === identifier || entry.id === identifier);
  if (!matched) {
    return null;
  }

  return serialiseUser(matched);
}

export function resetOfflineUsers() {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('[offlineSession] unable to reset offline users', error);
  }
}

export default {
  canUseOfflineAuth,
  registerOfflineUser,
  loginOfflineUser,
  getOfflineProfile,
  resetOfflineUsers
};
