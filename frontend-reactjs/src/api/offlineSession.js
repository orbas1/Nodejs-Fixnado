import { PanelApiError } from './panelClient.js';
import { normaliseRole } from '../constants/accessControl.js';
import { ROLE_DASHBOARD_MAP, SESSION_STORAGE_KEY } from '../hooks/useSession.js';

const STORAGE_KEY = 'fixnado:offline-users';
const SESSION_DURATION_MINUTES = 4 * 60; // 4 hours
const REFRESH_DURATION_MINUTES = 24 * 60; // 24 hours

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readUsers() {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('[offlineSession] unable to read stored users', error);
    return [];
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

  try {
    return btoa(unescape(encodeURIComponent(secret)));
  } catch (error) {
    console.warn('[offlineSession] unable to base64 secret', error);
    return secret;
  }
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

  const passwordHash = await hashSecret(payload.password);
  const now = Date.now();
  const userRecord = {
    id: `offline-user-${now}`,
    email,
    firstName: payload.firstName?.trim() || 'Offline',
    lastName: payload.lastName?.trim() || 'User',
    type: payload.type || 'user',
    passwordHash,
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
  if (hashed !== matched.passwordHash) {
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
