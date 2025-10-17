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
  fetchServicemanWorkspace,
  updateServicemanSettings,
  updateServicemanBookingStatus,
  updateServicemanBookingSchedule,
  updateServicemanBookingDetails,
  createServicemanBookingNote,
  createServicemanTimelineEntry
} from '../../api/servicemanBookingClient.js';

const STATUS_TRANSITIONS = {
  pending: ['awaiting_assignment', 'cancelled'],
  awaiting_assignment: ['scheduled', 'in_progress', 'cancelled'],
  scheduled: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'disputed', 'cancelled'],
  completed: [],
  cancelled: [],
  disputed: ['in_progress']
};

const ServicemanBookingManagementContext = createContext(null);

function humaniseStatus(status) {
  if (!status) return '';
  return status
    .split('_')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

function buildStatusOptions(status) {
  if (!status) return [];
  const transitions = STATUS_TRANSITIONS[status] ?? STATUS_TRANSITIONS[status?.toLowerCase()] ?? [];
  const unique = new Set([status, ...transitions]);
  return Array.from(unique).map((value) => ({ value, label: humaniseStatus(value) }));
}

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

function computeSummary(bookings = [], currency) {
  let resolvedCurrency = currency;
  if (!resolvedCurrency && Array.isArray(bookings)) {
    const withCurrency = bookings.find((booking) => booking?.currency);
    if (withCurrency?.currency) {
      resolvedCurrency = withCurrency.currency;
    }
  }
  if (!resolvedCurrency) {
    resolvedCurrency = 'GBP';
  }

  if (!Array.isArray(bookings) || bookings.length === 0) {
    return {
      totalAssignments: bookings?.length ?? 0,
      scheduledAssignments: 0,
      activeAssignments: 0,
      awaitingResponse: 0,
      completedThisMonth: 0,
      slaAtRisk: 0,
      revenueEarned: 0,
      averageTravelMinutes: 0,
      currency: resolvedCurrency
    };
  }

  let scheduled = 0;
  let active = 0;
  let awaiting = 0;
  let completed = 0;
  let slaAtRisk = 0;
  let revenue = 0;
  let travelTotal = 0;
  let travelSamples = 0;

  bookings.forEach((booking) => {
    const status = booking.status;
    if (status === 'scheduled') scheduled += 1;
    if (status === 'in_progress') active += 1;
    if (status === 'pending' || status === 'awaiting_assignment' || booking.assignmentStatus === 'pending') {
      awaiting += 1;
    }
    if (status === 'completed') completed += 1;
    if (booking.slaStatus === 'at_risk') slaAtRisk += 1;
    const commission = Number.parseFloat(booking.commissionAmount ?? booking.totalAmount ?? 0);
    if (Number.isFinite(commission)) {
      revenue += commission;
    }
    const travelMinutes = Number.parseInt(booking.travelMinutes ?? booking.meta?.travelMinutes ?? 0, 10);
    if (Number.isFinite(travelMinutes) && travelMinutes > 0) {
      travelTotal += travelMinutes;
      travelSamples += 1;
    }
  });

  return {
    totalAssignments: bookings.length,
    scheduledAssignments: scheduled,
    activeAssignments: active,
    awaitingResponse: awaiting,
    completedThisMonth: completed,
    slaAtRisk,
    revenueEarned: Math.round(revenue * 100) / 100,
    averageTravelMinutes: travelSamples ? Math.round(travelTotal / travelSamples) : 0,
    currency: resolvedCurrency
  };
}

function mergeBooking(current, update) {
  if (!current) return current;
  const meta = update?.meta && typeof update.meta === 'object' ? update.meta : {};
  const status = update?.status ?? current.status;
  const slaStatus = meta.slaStatus ?? current.slaStatus ?? (current.slaStatus || null);

  return {
    ...current,
    status,
    statusLabel: humaniseStatus(status),
    statusOptions: buildStatusOptions(status),
    scheduledStart: update?.scheduledStart ?? (update?.meta?.scheduledStart ?? current.scheduledStart ?? null),
    scheduledEnd: update?.scheduledEnd ?? (update?.meta?.scheduledEnd ?? current.scheduledEnd ?? null),
    slaExpiresAt: update?.slaExpiresAt ?? (update?.meta?.slaExpiresAt ?? current.slaExpiresAt ?? null),
    slaStatus: slaStatus ?? (current.slaStatus ?? null),
    travelMinutes:
      Number.isFinite(Number(meta.travelMinutes)) ? Number(meta.travelMinutes) : current.travelMinutes ?? null,
    instructions: meta.instructions ?? update?.instructions ?? current.instructions ?? '',
    summary: meta.summary ?? update?.summary ?? current.summary ?? '',
    tags: Array.isArray(meta.tags) ? meta.tags : current.tags ?? [],
    checklist: Array.isArray(meta.checklist) ? meta.checklist : current.checklist ?? [],
    attachments: Array.isArray(meta.attachments) ? meta.attachments : current.attachments ?? [],
    images: Array.isArray(meta.images) ? meta.images : current.images ?? [],
    autoAssignEnabled:
      typeof meta.autoAssignEnabled === 'boolean' ? meta.autoAssignEnabled : current.autoAssignEnabled ?? false,
    allowCustomerEdits:
      typeof meta.allowCustomerEdits === 'boolean' ? meta.allowCustomerEdits : current.allowCustomerEdits ?? false
  };
}

export function ServicemanBookingManagementProvider({ children, initialWorkspace }) {
  const initial = extractWorkspace(initialWorkspace);
  const [workspace, setWorkspace] = useState(initial);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const abortControllerRef = useRef(null);

  const servicemanId = workspace?.servicemanId ?? initial?.servicemanId ?? null;
  const timezone = workspace?.timezone ?? deriveTimezone(initial?.timezone);

  const refresh = useCallback(
    async ({ signal: externalSignal } = {}) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setLoading(true);
      setError(null);
      try {
        const params = { timezone };
        if (servicemanId) {
          params.servicemanId = servicemanId;
        }
        const response = await fetchServicemanWorkspace(params, {
          signal: externalSignal || controller.signal
        });
        const next = extractWorkspace(response);
        setWorkspace((currentWorkspace) => {
          const previousSummary = currentWorkspace?.summary;
          const computedSummary = computeSummary(
            next?.bookings ?? [],
            next?.summary?.currency ?? previousSummary?.currency
          );
          const mergedSummary = next?.summary
            ? {
                ...computedSummary,
                ...next.summary,
                currency: next.summary.currency ?? computedSummary.currency
              }
            : computedSummary;
          return {
            ...(currentWorkspace ?? {}),
            ...(next ?? {}),
            summary: mergedSummary
          };
        });
      } catch (caught) {
        if (caught?.name === 'AbortError') {
          return;
        }
        setError(caught instanceof Error ? caught.message : 'Failed to load workspace');
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
        setLoading(false);
      }
    },
    [servicemanId, timezone]
  );

  useEffect(() => {
    if (!workspace) {
      refresh();
    } else if (!workspace.summary || !workspace.summary.currency) {
      setWorkspace((current) =>
        current
          ? {
              ...current,
              summary: computeSummary(
                current.bookings ?? [],
                current.summary?.currency ?? initial?.summary?.currency
              )
            }
          : current
      );
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const applyBookingUpdate = useCallback((bookingId, update) => {
    setWorkspace((current) => {
      if (!current?.bookings) {
        return current;
      }
      const bookings = current.bookings;
      const index = bookings.findIndex((booking) => booking.bookingId === bookingId);
      if (index === -1) {
        return current;
      }
      const nextBookings = [...bookings];
      nextBookings[index] = mergeBooking(nextBookings[index], update);
      const summaryCurrency = current.summary?.currency;
      return {
        ...current,
        bookings: nextBookings,
        summary: computeSummary(nextBookings, summaryCurrency)
      };
    });
  }, []);

  const updateSettings = useCallback(
    async (payload) => {
      setSavingSettings(true);
      try {
        const response = await updateServicemanSettings(payload);
        const settings = response?.settings ?? response;
        setWorkspace((current) => ({ ...current, settings: { ...(current?.settings ?? {}), ...(settings ?? {}) } }));
        return settings;
      } finally {
        setSavingSettings(false);
      }
    },
    []
  );

  const updateStatus = useCallback(
    async (bookingId, payload) => {
      const response = await updateServicemanBookingStatus(bookingId, payload);
      applyBookingUpdate(bookingId, response?.booking ?? response);
      return response;
    },
    [applyBookingUpdate]
  );

  const updateSchedule = useCallback(
    async (bookingId, payload) => {
      const response = await updateServicemanBookingSchedule(bookingId, payload);
      applyBookingUpdate(bookingId, response?.booking ?? response);
      return response;
    },
    [applyBookingUpdate]
  );

  const updateDetails = useCallback(
    async (bookingId, payload) => {
      const response = await updateServicemanBookingDetails(bookingId, payload);
      applyBookingUpdate(bookingId, response?.booking ?? response);
      return response;
    },
    [applyBookingUpdate]
  );

  const createNote = useCallback(
    async (bookingId, payload) => {
      const response = await createServicemanBookingNote(bookingId, payload);
      const note = response?.note ?? response;
      setWorkspace((current) => {
        if (!current?.bookings) {
          return current;
        }
        const bookings = current.bookings;
        const index = bookings.findIndex((booking) => booking.bookingId === bookingId);
        if (index === -1) {
          return current;
        }
        const nextBookings = [...bookings];
        const target = nextBookings[index];
        const notes = Array.isArray(target.notes) ? [note, ...target.notes].slice(0, 8) : [note];
        nextBookings[index] = { ...target, notes };
        return {
          ...current,
          bookings: nextBookings
        };
      });
      return note;
    },
    []
  );

  const createTimelineEntry = useCallback(
    async (bookingId, payload) => {
      const response = await createServicemanTimelineEntry(bookingId, payload);
      const entry = response?.entry ?? response;
      setWorkspace((current) => {
        if (!current?.bookings) {
          return current;
        }
        const bookings = current.bookings;
        const index = bookings.findIndex((booking) => booking.bookingId === bookingId);
        if (index === -1) {
          return current;
        }
        const nextBookings = [...bookings];
        const target = nextBookings[index];
        const timeline = Array.isArray(target.timeline) ? [entry, ...target.timeline].slice(0, 12) : [entry];
        nextBookings[index] = { ...target, timeline };
        return {
          ...current,
          bookings: nextBookings
        };
      });
      return entry;
    },
    []
  );

  const value = useMemo(
    () => ({
      workspace,
      loading,
      error,
      savingSettings,
      refresh,
      updateSettings,
      updateStatus,
      updateSchedule,
      updateDetails,
      createNote,
      createTimelineEntry
    }),
    [
      workspace,
      loading,
      error,
      savingSettings,
      refresh,
      updateSettings,
      updateStatus,
      updateSchedule,
      updateDetails,
      createNote,
      createTimelineEntry
    ]
  );

  return (
    <ServicemanBookingManagementContext.Provider value={value}>
      {children}
    </ServicemanBookingManagementContext.Provider>
  );
}

ServicemanBookingManagementProvider.propTypes = {
  children: PropTypes.node.isRequired,
  initialWorkspace: PropTypes.object
};

export function useServicemanBookingManagement() {
  const context = useContext(ServicemanBookingManagementContext);
  if (!context) {
    throw new Error('useServicemanBookingManagement must be used within a ServicemanBookingManagementProvider');
  }
  return context;
}

export default ServicemanBookingManagementProvider;
