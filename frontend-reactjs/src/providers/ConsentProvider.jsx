import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  fetchConsentSnapshot,
  submitConsentDecision,
  verifyConsent,
  ConsentApiError
} from '../api/consentClient.js';

const STORAGE_KEY = 'fixnado.consent.subject';

function loadStoredSubject() {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value && value.startsWith('anon:')) {
      return value;
    }
    if (value && value.startsWith('user:')) {
      return value;
    }
    return null;
  } catch {
    return null;
  }
}

function persistSubject(subjectId) {
  if (typeof window === 'undefined' || !subjectId) {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, subjectId);
  } catch {
    // ignore storage failures
  }
}

const ConsentContext = createContext(null);

export function ConsentProvider({ children }) {
  const [subjectId, setSubjectId] = useState(() => loadStoredSubject());
  const [policies, setPolicies] = useState([]);
  const [refreshDays, setRefreshDays] = useState(365);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchController = useRef();

  const loadSnapshot = useCallback(
    async (incomingSubjectId) => {
      if (fetchController.current) {
        fetchController.current.abort();
      }
      const controller = new AbortController();
      fetchController.current = controller;
      setLoading(true);
      try {
        const response = await fetchConsentSnapshot({ subjectId: incomingSubjectId || subjectId, signal: controller.signal });
        setPolicies(response.policies || []);
        setRefreshDays(response.refreshDays ?? 365);
        if (response.subjectId && response.subjectId !== subjectId) {
          setSubjectId(response.subjectId);
          persistSubject(response.subjectId);
        }
        setError(null);
      } catch (err) {
        if (err.name === 'AbortError') {
          return;
        }
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [subjectId]
  );

  useEffect(() => {
    loadSnapshot(subjectId);
    return () => {
      fetchController.current?.abort();
    };
  }, [loadSnapshot, subjectId]);

  const pendingPolicies = useMemo(
    () => policies.filter((policy) => policy.required && (!policy.granted || policy.stale)),
    [policies]
  );

  const requiresConsent = pendingPolicies.length > 0;

  const acknowledgeConsent = useCallback(
    async (policyKey, metadata = {}) => {
      if (!policyKey) {
        throw new ConsentApiError('policyKey is required', 400);
      }
      setLoading(true);
      try {
        const response = await submitConsentDecision({
          subjectId,
          policyKey,
          decision: 'granted',
          metadata,
          channel: 'web'
        });
        setPolicies(response.policies || []);
        if (response.subjectId && response.subjectId !== subjectId) {
          setSubjectId(response.subjectId);
          persistSubject(response.subjectId);
        }
        setError(null);
        return response;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [subjectId]
  );

  const verifyLatest = useCallback(
    async (policiesToVerify) => {
      try {
        const response = await verifyConsent({ subjectId, policies: policiesToVerify });
        setPolicies(response.policies || []);
        if (response.subjectId && response.subjectId !== subjectId) {
          setSubjectId(response.subjectId);
          persistSubject(response.subjectId);
        }
        setError(null);
        return response;
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    [subjectId]
  );

  const contextValue = useMemo(
    () => ({
      subjectId,
      policies,
      refreshDays,
      requiresConsent,
      pendingPolicies,
      loading,
      error,
      refresh: loadSnapshot,
      acknowledgeConsent,
      verifyLatest
    }),
    [
      subjectId,
      policies,
      refreshDays,
      requiresConsent,
      pendingPolicies,
      loading,
      error,
      loadSnapshot,
      acknowledgeConsent,
      verifyLatest
    ]
  );

  return <ConsentContext.Provider value={contextValue}>{children}</ConsentContext.Provider>;
}

ConsentProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export function useConsentContext() {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error('useConsentContext must be used within a ConsentProvider');
  }
  return context;
}
