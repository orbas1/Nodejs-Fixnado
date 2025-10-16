import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { loginAdmin, revokeAdminSession } from '../api/adminSessionClient.js';
import { clearPanelCache, PanelApiError } from '../api/panelClient.js';
import { fetchCurrentUser } from '../api/authClient.js';

const AdminSessionContext = createContext(null);

const INITIAL_STATE = {
  status: 'initialising',
  user: null,
  session: null,
  error: null
};

export function AdminSessionProvider({ children }) {
  const [state, setState] = useState(INITIAL_STATE);
  const pendingLoginRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    async function initialise() {
      try {
        const profile = await fetchCurrentUser();
        if (!isMounted) return;
        setState({
          status: 'authenticated',
          user: profile,
          session: {
            role: profile?.type ?? 'admin',
            expiresAt: null,
            issuedAt: null
          },
          error: null
        });
      } catch (error) {
        if (!isMounted) return;
        if (error instanceof PanelApiError && error.status === 401) {
          setState({ status: 'anonymous', user: null, session: null, error: null });
        } else {
          setState({ status: 'error', user: null, session: null, error });
        }
      }
    }

    initialise();

    return () => {
      isMounted = false;
    };
  }, []);

  const logout = useCallback(async () => {
    setState({ status: 'anonymous', user: null, session: null, error: null });
    clearPanelCache();
    try {
      await revokeAdminSession();
    } catch {
      // ignore logout failures
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const profile = await fetchCurrentUser();
      setState((current) => ({
        status: 'authenticated',
        user: profile,
        session:
          current.session ?? {
            role: profile?.type ?? 'admin',
            expiresAt: null,
            issuedAt: null
          },
        error: null
      }));
      return profile;
    } catch (error) {
      setState((current) => ({ ...current, error }));
      throw error;
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
        clearPanelCache();

        setState({
          status: 'authenticated',
          user: payload.user,
          session: payload.session,
          error: null
        });

        return payload;
      } catch (error) {
        const normalised =
          error instanceof PanelApiError
            ? error
            : new PanelApiError('Unable to authenticate admin user', 503, { cause: error });
        setState({ status: 'error', user: null, session: null, error: normalised });
        throw normalised;
      } finally {
        pendingLoginRef.current = null;
      }
    },
    []
  );

  const value = useMemo(() => {
    const { user, session, status, error } = state;
    const loading = status === 'initialising' || status === 'authenticating';
    const isAuthenticated = status === 'authenticated' && user?.type === 'admin';

    return {
      user,
      session,
      status,
      error,
      loading,
      isAuthenticated,
      login,
      logout,
      refresh
    };
  }, [state, login, logout, refresh]);

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
