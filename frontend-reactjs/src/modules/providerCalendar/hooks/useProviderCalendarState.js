import { useCallback, useMemo, useState } from 'react';
import {
  fetchProviderCalendar,
  updateProviderCalendarSettings,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  updateCalendarBooking,
  createCalendarBooking
} from '../../../api/providerCalendarClient.js';

const ISO_OPTIONS = { minimumFractionDigits: 0 };

const formatNumber = (value) =>
  Number.isFinite(value) ? value.toLocaleString(undefined, ISO_OPTIONS) : new Intl.NumberFormat().format(0);

function getMonthStart(rangeStart) {
  if (!rangeStart) {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  }
  const current = new Date(rangeStart);
  if (Number.isNaN(current.getTime())) {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  }
  return new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), 1)).toISOString();
}

function shiftMonth(rangeStart, offset) {
  const current = rangeStart ? new Date(rangeStart) : new Date();
  const shifted = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + offset, 1));
  return shifted.toISOString();
}

export function useProviderCalendarState(initialSnapshot = {}) {
  const initialMeta = initialSnapshot.meta ?? {};
  const [calendar, setCalendar] = useState(initialSnapshot.calendar ?? {});
  const [summary, setSummary] = useState(initialSnapshot.summary ?? {});
  const [bookings, setBookings] = useState(initialSnapshot.bookings ?? []);
  const [events, setEvents] = useState(initialSnapshot.events ?? []);
  const [settings, setSettings] = useState(initialSnapshot.settings ?? {});
  const [options, setOptions] = useState(initialSnapshot.options ?? {});
  const [permissions, setPermissions] = useState(initialSnapshot.permissions ?? {});
  const [meta, setMeta] = useState(initialMeta);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editorMode, setEditorMode] = useState(null);
  const [eventDraft, setEventDraft] = useState(null);
  const [bookingDraft, setBookingDraft] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  const companyId = meta.companyId ?? initialSnapshot.meta?.companyId ?? initialSnapshot.metadata?.companyId ?? null;
  const timezone = settings.timezone || meta.timezone || 'Europe/London';

  const refreshCalendar = useCallback(
    async ({ start, end } = {}) => {
      if (!companyId) {
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await fetchProviderCalendar({
          companyId,
          timezone,
          start: start ?? calendar.rangeStart,
          end: end ?? calendar.rangeEnd
        });
        setCalendar(response.data?.calendar ?? {});
        setSummary(response.data?.summary ?? {});
        setBookings(response.data?.bookings ?? []);
        setEvents(response.data?.events ?? []);
        setSettings(response.data?.settings ?? {});
        setOptions(response.data?.options ?? {});
        setPermissions(response.data?.permissions ?? {});
        setMeta((current) => ({ ...current, ...(response.meta ?? {}) }));
        return response;
      } catch (caught) {
        console.error('Failed to refresh provider calendar', caught);
        setError(caught?.message ?? 'Unable to refresh calendar');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [calendar.rangeEnd, calendar.rangeStart, companyId, timezone]
  );

  const handleNavigate = useCallback(
    async (direction) => {
      const offset = direction === 'prev' ? -1 : direction === 'next' ? 1 : 0;
      const targetStart =
        direction === 'current' ? getMonthStart(new Date().toISOString()) : shiftMonth(calendar.rangeStart, offset);
      await refreshCalendar({ start: targetStart });
    },
    [calendar.rangeStart, refreshCalendar]
  );

  const handleSelectItem = useCallback((item) => {
    setSelectedItem(item);
    setFeedback(null);
  }, []);

  const handleOpenCreateEvent = useCallback(
    (defaults = {}) => {
      const defaultStart = defaults.date || calendar.rangeStart || new Date().toISOString();
      setEditorMode('create-event');
      setEventDraft({
        title: '',
        start: defaultStart,
        end: '',
        status: 'planned',
        type: 'internal',
        visibility: 'internal',
        description: '',
        companyId,
        ...defaults
      });
      setEventModalOpen(true);
      setFeedback(null);
    },
    [calendar.rangeStart, companyId]
  );

  const handleEditEvent = useCallback((event) => {
    setEditorMode('edit-event');
    setEventDraft({ ...event, companyId });
    setEventModalOpen(true);
  }, [companyId]);

  const handleSaveEvent = useCallback(
    async (draft) => {
      try {
        setFeedback(null);
        const payload = { ...draft, companyId };
        const result =
          editorMode === 'edit-event'
            ? await updateCalendarEvent(draft.id, payload)
            : await createCalendarEvent(payload);
        await refreshCalendar();
        setEventModalOpen(false);
        setEditorMode(null);
        setEventDraft(null);
        setFeedback(editorMode === 'edit-event' ? 'Event updated' : 'Event created');
        return result;
      } catch (caught) {
        console.error('Failed to save event', caught);
        setFeedback(caught?.message ?? 'Unable to save event');
        throw caught;
      }
    },
    [companyId, editorMode, refreshCalendar]
  );

  const handleDeleteEvent = useCallback(
    async (event) => {
      if (!event) {
        return;
      }
      try {
        await deleteCalendarEvent(event.id, { companyId });
        await refreshCalendar();
        setSelectedItem(null);
        setFeedback('Event removed');
      } catch (caught) {
        console.error('Failed to delete event', caught);
        setFeedback(caught?.message ?? 'Unable to delete event');
      }
    },
    [companyId, refreshCalendar]
  );

  const handleSaveSettings = useCallback(
    async (draft) => {
      try {
        const payload = { ...draft, companyId };
        const response = await updateProviderCalendarSettings(payload);
        setSettings((current) => ({ ...current, ...(response?.settings ?? {}) }));
        setFeedback('Calendar settings updated');
        setSettingsOpen(false);
        await refreshCalendar({ start: calendar.rangeStart, end: calendar.rangeEnd });
      } catch (caught) {
        console.error('Failed to update settings', caught);
        setFeedback(caught?.message ?? 'Unable to update settings');
      }
    },
    [calendar.rangeEnd, calendar.rangeStart, companyId, refreshCalendar]
  );

  const handleOpenBookingEditor = useCallback((booking = null, defaults = {}) => {
    const base = booking
      ? { ...booking, companyId }
      : {
          title: '',
          customerName: '',
          start: defaults.date || calendar.rangeStart || new Date().toISOString(),
          end: '',
          status: 'scheduled',
          zoneId: options.zones?.[0]?.id ?? '',
          companyId
        };
    setBookingDraft(base);
    setEditorMode(booking ? 'edit-booking' : 'create-booking');
    setBookingModalOpen(true);
    setFeedback(null);
  }, [calendar.rangeStart, companyId, options.zones]);

  const handleSaveBooking = useCallback(
    async (draft) => {
      const payload = { ...draft, companyId };
      try {
        if (editorMode === 'edit-booking') {
          await updateCalendarBooking(draft.id, payload);
          setFeedback('Booking updated');
        } else {
          await createCalendarBooking(payload);
          setFeedback('Booking created');
        }
        setBookingModalOpen(false);
        setBookingDraft(null);
        setEditorMode(null);
        await refreshCalendar();
      } catch (caught) {
        console.error('Failed to save booking', caught);
        setFeedback(caught?.message ?? 'Unable to save booking');
        throw caught;
      }
    },
    [companyId, editorMode, refreshCalendar]
  );

  const metrics = useMemo(() => {
    const totals = summary?.totals ?? {};
    return [
      {
        id: 'total-bookings',
        label: 'Bookings this month',
        value: formatNumber(totals.total ?? bookings.length),
        helper: `${formatNumber(events.length)} custom events`
      },
      {
        id: 'active-bookings',
        label: 'Active jobs',
        value: formatNumber(totals.active ?? 0),
        helper: `${formatNumber(totals.byStatus?.scheduled ?? 0)} scheduled`
      },
      {
        id: 'utilisation',
        label: 'Utilisation',
        value: `${Math.round((summary?.utilisation ?? 0) * 100)}%`,
        helper: `${formatNumber(summary?.holds ?? 0)} holds`
      },
      {
        id: 'upcoming',
        label: 'Upcoming',
        value: formatNumber(summary?.upcoming ?? 0),
        helper: `${formatNumber(summary?.travel ?? 0)} travel windows`
      }
    ];
  }, [bookings.length, events.length, summary]);

  return {
    calendar,
    summary,
    bookings,
    events,
    settings,
    options,
    permissions,
    meta,
    loading,
    error,
    feedback,
    selectedItem,
    eventDraft,
    bookingDraft,
    settingsOpen,
    eventModalOpen,
    bookingModalOpen,
    metrics,
    timezone,
    actions: {
      refreshCalendar,
      navigate: handleNavigate,
      selectItem: handleSelectItem,
      openCreateEvent: handleOpenCreateEvent,
      editEvent: handleEditEvent,
      saveEvent: handleSaveEvent,
      deleteEvent: handleDeleteEvent,
      openSettings: () => {
        setSettingsOpen(true);
        setFeedback(null);
      },
      closeSettings: () => setSettingsOpen(false),
      saveSettings: handleSaveSettings,
      openBookingEditor: handleOpenBookingEditor,
      saveBooking: handleSaveBooking,
      closeEventModal: () => {
        setEventModalOpen(false);
        setEditorMode(null);
        setEventDraft(null);
      },
      closeBookingModal: () => {
        setBookingModalOpen(false);
        setEditorMode(null);
        setBookingDraft(null);
      },
      clearSelection: () => setSelectedItem(null),
      resetFeedback: () => setFeedback(null)
    }
  };
}

export default useProviderCalendarState;
