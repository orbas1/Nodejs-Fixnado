import PropTypes from 'prop-types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  fetchProviderBookingWorkspace,
  updateProviderBookingSettings,
  updateProviderBookingStatus,
  updateProviderBookingSchedule,
  updateProviderBookingDetails,
  createProviderBookingNote,
  createProviderTimelineEntry
} from '../../api/providerBookingClient.js';

const ProviderBookingManagementContext = createContext(null);

function extractWorkspace(payload) {
  if (!payload) return null;
  if (payload.workspace) return payload.workspace;
  return payload;
}

function deriveTimezone(initialTimezone) {
  if (initialTimezone) return initialTimezone;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || 'UTC';
  } catch {
    return 'UTC';
  }
}

function computeSummary(snapshot) {
  if (!snapshot?.summary) {
    return {
      totalBookings: snapshot?.bookings?.length ?? 0,
      scheduledBookings: 0,
      activeBookings: 0,
      awaitingDispatch: 0,
      completedThisMonth: 0,
      slaAtRisk: 0,
      revenueScheduled: 0,
      averageTravelMinutes: 0,
      currency: 'GBP'
    };
  }
  return snapshot.summary;
}

function mergeBooking(current, next) {
  if (!current) return current;
  return {
    ...current,
    ...next,
    statusLabel: next?.statusLabel ?? current.statusLabel,
    statusOptions: next?.statusOptions ?? current.statusOptions
  };
}

export function ProviderBookingManagementProvider({ children, companyId, initialWorkspace }) {
  const initial = extractWorkspace(initialWorkspace);
  const [workspace, setWorkspace] = useState(initial);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const abortControllerRef = useRef(null);

  const timezone = workspace?.timezone ?? deriveTimezone(initial?.timezone);
  const resolvedCompanyId = workspace?.companyId ?? companyId ?? initial?.companyId ?? null;

  const refresh = useCallback(
    async ({ signal: externalSignal, silent = false } = {}) => {
      if (!resolvedCompanyId) {
        return;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const response = await fetchProviderBookingWorkspace(
          { companyId: resolvedCompanyId, timezone },
          { signal: externalSignal || controller.signal }
        );
        const next = extractWorkspace(response);
        setWorkspace(next);
        if (!silent) {
          setLoading(false);
        }
        return next;
      } catch (caught) {
        if (!silent) {
          setLoading(false);
          setError(caught instanceof Error ? caught.message : 'Failed to load booking workspace');
        }
        throw caught;
      }
    },
    [resolvedCompanyId, timezone]
  );

  useEffect(() => {
    if (!workspace && resolvedCompanyId) {
      refresh();
    }
  }, [workspace, resolvedCompanyId, refresh]);

  const updateSettings = useCallback(
    async (updates) => {
      if (!resolvedCompanyId) {
        throw new Error('Provider context missing company');
      }
      setSavingSettings(true);
      try {
        const response = await updateProviderBookingSettings(updates, { companyId: resolvedCompanyId });
        setWorkspace((current) => ({
          ...(current ?? {}),
          settings: response.settings ?? response
        }));
        setSavingSettings(false);
        await refresh({ silent: true });
        return response.settings ?? response;
      } catch (caught) {
        setSavingSettings(false);
        throw caught;
      }
    },
    [refresh, resolvedCompanyId]
  );

  const updateStatus = useCallback(
    async (bookingId, payload) => {
      if (!resolvedCompanyId) {
        throw new Error('Provider context missing company');
      }
      const response = await updateProviderBookingStatus(bookingId, payload, { companyId: resolvedCompanyId });
      const updated = response.booking ?? response;
      setWorkspace((current) => {
        if (!current?.bookings) {
          return current;
        }
        return {
          ...current,
          bookings: current.bookings.map((booking) =>
            booking.bookingId === bookingId ? mergeBooking(booking, updated) : booking
          )
        };
      });
      await refresh({ silent: true });
      return updated;
    },
    [refresh, resolvedCompanyId]
  );

  const updateSchedule = useCallback(
    async (bookingId, payload) => {
      if (!resolvedCompanyId) {
        throw new Error('Provider context missing company');
      }
      const response = await updateProviderBookingSchedule(bookingId, payload, { companyId: resolvedCompanyId });
      const updated = response.booking ?? response;
      setWorkspace((current) => {
        if (!current?.bookings) {
          return current;
        }
        return {
          ...current,
          bookings: current.bookings.map((booking) =>
            booking.bookingId === bookingId ? mergeBooking(booking, updated) : booking
          )
        };
      });
      await refresh({ silent: true });
      return updated;
    },
    [refresh, resolvedCompanyId]
  );

  const updateDetails = useCallback(
    async (bookingId, payload) => {
      if (!resolvedCompanyId) {
        throw new Error('Provider context missing company');
      }
      const response = await updateProviderBookingDetails(bookingId, payload, { companyId: resolvedCompanyId });
      const updated = response.booking ?? response;
      setWorkspace((current) => {
        if (!current?.bookings) {
          return current;
        }
        return {
          ...current,
          bookings: current.bookings.map((booking) =>
            booking.bookingId === bookingId ? mergeBooking(booking, updated) : booking
          )
        };
      });
      await refresh({ silent: true });
      return updated;
    },
    [refresh, resolvedCompanyId]
  );

  const createNote = useCallback(
    async (bookingId, payload) => {
      if (!resolvedCompanyId) {
        throw new Error('Provider context missing company');
      }
      await createProviderBookingNote(bookingId, payload, { companyId: resolvedCompanyId });
      await refresh({ silent: true });
    },
    [refresh, resolvedCompanyId]
  );

  const createTimelineEntry = useCallback(
    async (bookingId, payload) => {
      if (!resolvedCompanyId) {
        throw new Error('Provider context missing company');
      }
      await createProviderTimelineEntry(bookingId, payload, { companyId: resolvedCompanyId });
      await refresh({ silent: true });
    },
    [refresh, resolvedCompanyId]
  );

  const value = useMemo(
    () => ({
      workspace: workspace
        ? {
            ...workspace,
            summary: computeSummary(workspace)
          }
        : null,
      loading,
      error,
      refresh,
      updateSettings,
      savingSettings,
      updateStatus,
      updateSchedule,
      updateDetails,
      createNote,
      createTimelineEntry,
      companyId: resolvedCompanyId,
      timezone
    }),
    [workspace, loading, error, refresh, updateSettings, savingSettings, updateStatus, updateSchedule, updateDetails, createNote, createTimelineEntry, resolvedCompanyId, timezone]
  );

  return (
    <ProviderBookingManagementContext.Provider value={value}>
      {children}
    </ProviderBookingManagementContext.Provider>
  );
}

ProviderBookingManagementProvider.propTypes = {
  children: PropTypes.node.isRequired,
  companyId: PropTypes.string,
  initialWorkspace: PropTypes.object
};

ProviderBookingManagementProvider.defaultProps = {
  companyId: null,
  initialWorkspace: null
};

export function useProviderBookingManagement() {
  const context = useContext(ProviderBookingManagementContext);
  if (!context) {
    throw new Error('useProviderBookingManagement must be used within a ProviderBookingManagementProvider');
  }
  return context;
}

export default ProviderBookingManagementProvider;
