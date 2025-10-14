import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { loginAdmin, revokeAdminSession } from '../api/adminSessionClient.js';
import { clearPanelCache, PanelApiError } from '../api/panelClient.js';

const AdminSessionContext = createContext(null);

const TOKEN_STORAGE_KEY = 'fixnado:accessToken';
const USER_STORAGE_KEY = 'fixnado:adminUser';
const EXPIRY_STORAGE_KEY = 'fixnado:adminExpiry';

function readStoredValue(key) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.warn('[AdminSession] Unable to read storage key', key, error);
    return null;
  }
}

function writeStoredValue(key, value) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    if (value == null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
  } catch (error) {
    console.warn('[AdminSession] Unable to persist storage key', key, error);
  }
}

function parseJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn('[AdminSession] Failed to parse JSON payload', error);
    return null;
  }
}

function computeExpiryTimestamp(expiresIn) {
  if (!expiresIn) {
    return null;
  }

  const match = /^([0-9]+)h$/i.exec(String(expiresIn).trim());
  if (match) {
    const hours = Number.parseInt(match[1], 10);
    if (Number.isFinite(hours)) {
      return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    }
  }

  const numeric = Number.parseInt(expiresIn, 10);
  if (Number.isFinite(numeric)) {
    return new Date(Date.now() + numeric * 1000).toISOString();
  }

  return null;
}

function isExpired(expiresAt) {
  if (!expiresAt) {
    return false;
  }
  const expires = new Date(expiresAt);
  if (Number.isNaN(expires.getTime())) {
    return false;
  }
  return expires.getTime() <= Date.now();
}

export function AdminSessionProvider({ children }) {
  const [state, setState] = useState({
    status: 'initialising',
    token: null,
    user: null,
    error: null,
    expiresAt: null
  });
  const pendingLoginRef = useRef(null);

  useEffect(() => {
    const storedToken = readStoredValue(TOKEN_STORAGE_KEY);
    const storedUser = parseJson(readStoredValue(USER_STORAGE_KEY));
    const storedExpiry = readStoredValue(EXPIRY_STORAGE_KEY);

    if (!storedToken || !storedUser || storedUser.type !== 'admin' || isExpired(storedExpiry)) {
      writeStoredValue(TOKEN_STORAGE_KEY, null);
      writeStoredValue(USER_STORAGE_KEY, null);
      writeStoredValue(EXPIRY_STORAGE_KEY, null);
      setState({ status: 'anonymous', token: null, user: null, error: null, expiresAt: null });
      return;
    }

    setState({ status: 'authenticated', token: storedToken, user: storedUser, error: null, expiresAt: storedExpiry });
  }, []);

  const logout = useCallback(async () => {
    writeStoredValue(TOKEN_STORAGE_KEY, null);
    writeStoredValue(USER_STORAGE_KEY, null);
    writeStoredValue(EXPIRY_STORAGE_KEY, null);
    clearPanelCache();
    setState({ status: 'anonymous', token: null, user: null, error: null, expiresAt: null });
    try {
      await revokeAdminSession();
    } catch {
      // ignore logout failures
    }
  }, []);

  const login = useCallback(
    async ({ email, password, securityToken }) => {
      if (pendingLoginRef.current) {
        await pendingLoginRef.current;
      }

      const loginPromise = loginAdmin({ email, password, securityToken });
      pendingLoginRef.current = loginPromise;
      setState((current) => ({ ...current, status: 'authenticating', error: null }));

      try {
        const payload = await loginPromise;
        const { token, user, expiresIn } = payload;
        const expiresAt = computeExpiryTimestamp(expiresIn) ?? null;

        writeStoredValue(TOKEN_STORAGE_KEY, token);
        writeStoredValue(USER_STORAGE_KEY, JSON.stringify(user));
        writeStoredValue(EXPIRY_STORAGE_KEY, expiresAt);
        clearPanelCache();

        setState({ status: 'authenticated', token, user, error: null, expiresAt });
        return payload;
      } catch (error) {
        const normalised = error instanceof PanelApiError ? error : new PanelApiError('Unable to authenticate admin user', 503, { cause: error });
        writeStoredValue(TOKEN_STORAGE_KEY, null);
        writeStoredValue(USER_STORAGE_KEY, null);
        writeStoredValue(EXPIRY_STORAGE_KEY, null);
        setState({ status: 'error', token: null, user: null, error: normalised, expiresAt: null });
        throw normalised;
      } finally {
        pendingLoginRef.current = null;
      }
    },
    []
  );

  const value = useMemo(() => {
    const { token, user, status, error, expiresAt } = state;
    const authenticated = Boolean(token && user?.type === 'admin' && !isExpired(expiresAt));
    const loading = status === 'initialising' || status === 'authenticating';

    return {
      token,
      user,
      status,
      error,
      expiresAt,
      loading,
      isAuthenticated: authenticated,
      login,
      logout
    };
  }, [state, login, logout]);

  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>;
}

AdminSessionProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export function useAdminSession() {
  const context = useContext(AdminSessionContext);
  if (!context) {
    throw new Error('useAdminSession must be used within an AdminSessionProvider');
  }
  return context;
}
