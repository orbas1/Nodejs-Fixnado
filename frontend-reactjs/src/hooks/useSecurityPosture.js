import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchSecurityPosture,
  createSecuritySignal,
  updateSecuritySignal,
  deleteSecuritySignal,
  reorderSecuritySignals,
  createAutomationTask,
  updateAutomationTask,
  deleteAutomationTask,
  createTelemetryConnector,
  updateTelemetryConnector,
  deleteTelemetryConnector
} from '../api/securityPostureClient.js';

export default function useSecurityPosture({ initialState = null, autoRefresh = true, refreshInterval = 0 } = {}) {
  const [state, setState] = useState({
    loading: !initialState,
    error: null,
    data: initialState,
    refreshing: false
  });
  const intervalRef = useRef(null);

  const refresh = useCallback(
    async ({ silent = false } = {}) => {
      setState((current) => ({ ...current, loading: !silent, refreshing: silent, error: silent ? current.error : null }));
      try {
        const data = await fetchSecurityPosture({ includeInactive: true });
        setState({ loading: false, refreshing: false, error: null, data });
        return data;
      } catch (error) {
        if (error.name === 'AbortError') {
          return null;
        }
        setState((current) => ({ ...current, loading: false, refreshing: false, error }));
        return null;
      }
    },
    []
  );

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!autoRefresh) {
      if (!initialState) {
        refresh();
      }
      return undefined;
    }

    refresh({ silent: Boolean(initialState) });

    if (refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        refresh({ silent: true });
      }, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, refreshInterval, refresh, initialState]);

  const mutate = useCallback(
    (updater) => {
      setState((current) => {
        if (!current.data) {
          return current;
        }
        const nextData = typeof updater === 'function' ? updater(current.data) : current.data;
        return { ...current, data: nextData };
      });
    },
    []
  );

  const saveSignal = useCallback(
    async (payload, id = null) => {
      if (id) {
        await updateSecuritySignal(id, payload);
      } else {
        await createSecuritySignal(payload);
      }
      return refresh({ silent: true });
    },
    [refresh]
  );

  const reorderSignals = useCallback(
    async (orderedIds) => {
      await reorderSecuritySignals(orderedIds);
      return refresh({ silent: true });
    },
    [refresh]
  );

  const removeSignal = useCallback(
    async (id) => {
      await deleteSecuritySignal(id);
      return refresh({ silent: true });
    },
    [refresh]
  );

  const saveAutomationTask = useCallback(
    async (payload, id = null) => {
      if (id) {
        await updateAutomationTask(id, payload);
      } else {
        await createAutomationTask(payload);
      }
      return refresh({ silent: true });
    },
    [refresh]
  );

  const removeAutomationTask = useCallback(
    async (id) => {
      await deleteAutomationTask(id);
      return refresh({ silent: true });
    },
    [refresh]
  );

  const saveConnector = useCallback(
    async (payload, id = null) => {
      if (id) {
        await updateTelemetryConnector(id, payload);
      } else {
        await createTelemetryConnector(payload);
      }
      return refresh({ silent: true });
    },
    [refresh]
  );

  const removeConnector = useCallback(
    async (id) => {
      await deleteTelemetryConnector(id);
      return refresh({ silent: true });
    },
    [refresh]
  );

  const value = useMemo(
    () => ({
      loading: state.loading,
      refreshing: state.refreshing,
      error: state.error,
      data: state.data,
      refresh,
      mutate,
      saveSignal,
      removeSignal,
      saveAutomationTask,
      removeAutomationTask,
      saveConnector,
      removeConnector,
      reorderSignals
    }),
    [
      state,
      refresh,
      mutate,
      saveSignal,
      removeSignal,
      saveAutomationTask,
      removeAutomationTask,
      saveConnector,
      removeConnector,
      reorderSignals
    ]
  );

  return value;
}
