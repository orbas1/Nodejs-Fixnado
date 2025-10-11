import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const VALID_RANGES = new Set(['1d', '7d', '30d']);
const DEFAULT_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

function normaliseRange(range) {
  return VALID_RANGES.has(range) ? range : '7d';
}

function safeNow() {
  return typeof Date !== 'undefined' ? new Date() : null;
}

function parseDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function useTelemetrySummary({ range, tenantId, refreshInterval } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const controllerRef = useRef();
  const intervalRef = useRef();
  const lastRequestedRangeRef = useRef(normaliseRange(range ?? '7d'));

  const resolvedRefreshInterval = typeof refreshInterval === 'number' ? refreshInterval : DEFAULT_REFRESH_INTERVAL;

  const fetchSummary = useCallback(
    async (selectedRange = lastRequestedRangeRef.current, { silent = false } = {}) => {
      const effectiveRange = normaliseRange(selectedRange);

      if (controllerRef.current) {
        controllerRef.current.abort();
      }

      const controller = new AbortController();
      controllerRef.current = controller;

      if (!silent) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      try {
        const searchParams = new URLSearchParams({ range: effectiveRange });
        if (tenantId) {
          searchParams.set('tenantId', tenantId);
        }

        const response = await fetch(`/api/telemetry/ui-preferences/summary?${searchParams.toString()}`, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Telemetry summary request failed (${response.status}): ${errorText || 'Unknown error'}`);
        }

        const payload = await response.json();
        const fetchedAt = safeNow();

        setData({
          ...payload,
          fetchedAt,
          resolvedRange: effectiveRange
        });
        lastRequestedRangeRef.current = effectiveRange;
      } catch (err) {
        if (err.name === 'AbortError') {
          return;
        }
        setError(err);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [tenantId]
  );

  const refresh = useCallback(() => fetchSummary(lastRequestedRangeRef.current), [fetchSummary]);

  useEffect(() => {
    const effectiveRange = normaliseRange(range ?? '7d');
    fetchSummary(effectiveRange);

    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, [range, fetchSummary]);

  useEffect(() => {
    if (!resolvedRefreshInterval || resolvedRefreshInterval < 15_000) {
      return undefined;
    }

    function startTimer() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        const doc = typeof document !== 'undefined' ? document : null;
        if (doc && doc.hidden) {
          return;
        }
        fetchSummary(lastRequestedRangeRef.current, { silent: true });
      }, resolvedRefreshInterval);
    }

    function stopTimer() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    startTimer();

    const doc = typeof document !== 'undefined' ? document : null;
    if (doc) {
      const handler = () => {
        if (!doc.hidden) {
          fetchSummary(lastRequestedRangeRef.current, { silent: true });
          startTimer();
        } else {
          stopTimer();
        }
      };
      doc.addEventListener('visibilitychange', handler);
      return () => {
        stopTimer();
        doc.removeEventListener('visibilitychange', handler);
      };
    }

    return () => {
      stopTimer();
    };
  }, [fetchSummary, resolvedRefreshInterval]);

  const computed = useMemo(() => {
    if (!data) {
      return null;
    }

    const start = parseDate(data?.range?.start);
    const end = parseDate(data?.range?.end);
    const latestEventAt = parseDate(data?.latestEventAt);

    return {
      ...data,
      range: {
        ...data.range,
        start,
        end
      },
      latestEventAt,
      fetchedAt: data.fetchedAt ?? safeNow()
    };
  }, [data]);

  return {
    data: computed,
    loading,
    error,
    refresh,
    isRefreshing,
    range: lastRequestedRangeRef.current
  };
}

export default useTelemetrySummary;
