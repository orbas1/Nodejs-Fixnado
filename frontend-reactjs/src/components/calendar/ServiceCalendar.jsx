import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  MapPinIcon,
  UsersIcon,
  BuildingOfficeIcon,
  PencilSquareIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon,
  InformationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import {
  fetchBookingCalendar,
  fetchBooking,
  createBooking,
  updateBooking
} from '../../api/bookingsClient.js';
import { getStatusBadgeClass, normaliseStatusLabel } from '../../utils/calendarUtils.js';
import BookingModal from './BookingModal.jsx';
import BookingNotesPanel from './BookingNotesPanel.jsx';

function normaliseCalendarEvent(event) {
  if (!event) return null;
  return {
    id: event.id,
    title: event.title || '',
    status: event.statusRaw || event.status || 'pending',
    type: event.type || 'scheduled',
    zoneId: event.zoneId || '',
    location: event.location || '',
    instructions: event.instructions || '',
    demandLevel: event.demandLevel || '',
    scheduledStart: event.start || null,
    scheduledEnd: event.end || null,
    attachments: event.attachments || [],
    assignments: event.assignments || []
  };
}

function formatProviderName(provider) {
  if (!provider) {
    return null;
  }
  const parts = [provider.firstName, provider.lastName].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(' ');
  }
  return provider.email || provider.id || null;
}

function normaliseApiBooking(booking) {
  if (!booking) return null;
  const base = booking.meta || {};
  const assignments = Array.isArray(booking.BookingAssignments)
    ? booking.BookingAssignments.map((assignment) => ({
        id: assignment.id,
        providerId: assignment.providerId,
        providerName: formatProviderName(assignment.provider),
        providerEmail: assignment.provider?.email || null,
        role: assignment.role,
        status: assignment.status,
        assignedAt: assignment.assignedAt,
        acknowledgedAt: assignment.acknowledgedAt
      }))
    : [];
  return {
    id: booking.id,
    title: booking.title || base.title || '',
    status: booking.status,
    type: booking.type,
    zoneId: booking.zoneId || '',
    location: booking.location || base.location || '',
    instructions: booking.instructions || base.instructions || '',
    demandLevel: base.demandLevel || '',
    scheduledStart: booking.scheduledStart || null,
    scheduledEnd: booking.scheduledEnd || null,
    attachments: Array.isArray(base.attachments) ? base.attachments : [],
    assignments
  };
}

function getInitialMonth(section) {
  const data = section?.data;
  return data?.controls?.month || data?.monthValue || null;
}

function findDayByIso(weeks, isoDate) {
  for (const week of weeks || []) {
    for (const day of week) {
      if (day.isoDate === isoDate) {
        return day;
      }
    }
  }
  return null;
}

function ServiceCalendar({ section }) {
  const initialData = section?.data || null;
  const [calendar, setCalendar] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState({
    month: getInitialMonth(section),
    statuses: [],
    zoneId: null
  });
  const abortController = useRef(null);
  const hasLoadedInitial = useRef(false);
  const [selectedDay, setSelectedDay] = useState(() => {
    if (!initialData?.weeks) return null;
    const today = initialData.weeks
      .flat()
      .find((day) => day.isToday) || initialData.weeks.flat().find((day) => day.events?.length);
    return today?.isoDate || null;
  });
  const [modalState, setModalState] = useState({ open: false, mode: 'create', booking: null, bookingId: null });
  const [notesState, setNotesState] = useState({ open: false, booking: null });

  const context = calendar?.context || initialData?.context || {};
  const permissions =
    calendar?.permissions ||
    initialData?.permissions ||
    { canCreate: true, canEdit: true, canManageNotes: true, canManageCrew: true };

  const controllerCleanup = () => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
  };

  const refreshCalendar = useCallback(
    async (overrides = {}, { silent = false } = {}) => {
      const nextQuery = {
        month: overrides.month ?? query.month ?? getInitialMonth(section),
        statuses: overrides.statuses ?? query.statuses ?? [],
        zoneId: overrides.zoneId !== undefined ? overrides.zoneId : query.zoneId ?? null
      };

      setQuery(nextQuery);

      controllerCleanup();
      const controller = new AbortController();
      abortController.current = controller;

      if (!silent) {
        setLoading(true);
        setError(null);
      }

      try {
        const params = {
          month: nextQuery.month,
          status: nextQuery.statuses,
          timezone: context.timezone
        };
        if (nextQuery.zoneId) {
          params.zoneId = nextQuery.zoneId;
        }
        if (context.customerId) {
          params.customerId = context.customerId;
        }
        if (context.companyId) {
          params.companyId = context.companyId;
        }

        const response = await fetchBookingCalendar(params, { signal: controller.signal });
        setCalendar(response);
        setError(null);
        return response;
      } catch (err) {
        if (err.name === 'AbortError') {
          return null;
        }
        setError(err.message || 'Unable to load calendar');
        return null;
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [context.companyId, context.customerId, context.timezone, query.month, query.statuses, query.zoneId, section]
  );

  useEffect(() => {
    if (initialData || hasLoadedInitial.current) {
      return;
    }
    hasLoadedInitial.current = true;
    refreshCalendar();
  }, [initialData, refreshCalendar]);

  useEffect(() => () => controllerCleanup(), []);

  useEffect(() => {
    if (!calendar?.weeks) {
      return;
    }
    const selected = selectedDay && findDayByIso(calendar.weeks, selectedDay);
    if (!selected) {
      const today = calendar.weeks.flat().find((day) => day.isToday);
      const fallback = today || calendar.weeks.flat().find((day) => day.events?.length) || calendar.weeks.flat()[0];
      setSelectedDay(fallback?.isoDate || null);
    }
  }, [calendar, selectedDay]);

  const statusFilters = calendar?.filters?.statuses || initialData?.filters?.statuses || [];
  const zoneFilters = calendar?.filters?.zones || initialData?.filters?.zones || [];

  const activeStatuses = query.statuses;
  const selectedZone = query.zoneId;

  const selectedDayData = useMemo(() => {
    if (!calendar?.weeks || !selectedDay) return null;
    return findDayByIso(calendar.weeks, selectedDay);
  }, [calendar, selectedDay]);

  const summaryMetrics = calendar?.summary || initialData?.summary || [];
  const legend = calendar?.legend || initialData?.legend || [];
  const backlog = calendar?.backlog || initialData?.backlog || [];

  const handleToggleStatus = async (value) => {
    const valueLower = value?.toLowerCase();
    const nextStatuses = activeStatuses.includes(valueLower)
      ? activeStatuses.filter((entry) => entry !== valueLower)
      : [...activeStatuses, valueLower];
    await refreshCalendar({ statuses: nextStatuses });
  };

  const handleZoneChange = async (event) => {
    const nextZone = event.target.value || null;
    await refreshCalendar({ zoneId: nextZone });
  };

  const handleNavigateMonth = async (direction) => {
    if (!calendar?.controls) return;
    const target = direction === 'prev' ? calendar.controls.previousMonth : calendar.controls.nextMonth;
    await refreshCalendar({ month: target });
  };

  const openCreateModal = (dayIsoDate = null) => {
    if (!permissions.canCreate) return;
    const start = dayIsoDate ? `${dayIsoDate}T09:00:00` : null;
    const end = dayIsoDate ? `${dayIsoDate}T11:00:00` : null;
    setModalState({
      open: true,
      mode: 'create',
      booking: {
        title: '',
        status: 'pending',
        type: 'scheduled',
        zoneId: zoneFilters[0]?.value || '',
        location: '',
        instructions: '',
        demandLevel: '',
        scheduledStart: start,
        scheduledEnd: end,
        attachments: [],
        assignments: []
      },
      bookingId: null
    });
  };

  const openEditModal = async (eventBooking) => {
    if (!permissions.canEdit) return;
    const normalised = normaliseCalendarEvent(eventBooking);
    setModalState({ open: true, mode: 'edit', booking: normalised, bookingId: eventBooking.id });

    try {
      const detailed = await fetchBooking(eventBooking.id);
      const mapped = normaliseApiBooking(detailed);
      setModalState({ open: true, mode: 'edit', booking: mapped, bookingId: eventBooking.id });
    } catch (err) {
      setError(err.message || 'Unable to load booking details');
    }
  };

  const closeModal = () => {
    setModalState({ open: false, mode: 'create', booking: null, bookingId: null });
  };

  const handleSaveBooking = async (payload) => {
    if (modalState.mode === 'create') {
      const request = {
        ...payload,
        customerId: context.customerId,
        companyId: context.companyId
      };
      if (!request.zoneId) {
        throw new Error('Zone is required');
      }
      if (!request.customerId || !request.companyId) {
        throw new Error('Customer and company context are required to create bookings');
      }
      await createBooking(request);
      await refreshCalendar({}, { silent: false });
    } else if (modalState.bookingId) {
      const updates = { ...payload };
      delete updates.type;
      await updateBooking(modalState.bookingId, updates);
      await refreshCalendar({}, { silent: false });
    }
  };

  const openNotes = (booking) => {
    setNotesState({ open: true, booking: { id: booking.id, title: booking.title } });
  };

  const closeNotes = () => {
    setNotesState({ open: false, booking: null });
  };

  const handleNotesChanged = async () => {
    await refreshCalendar({}, { silent: true });
  };

  const handleAssignmentsChanged = useCallback(async () => {
    await refreshCalendar({}, { silent: true });
  }, [refreshCalendar]);

  const renderEvent = (event) => (
    <div
      key={event.id}
      role="button"
      tabIndex={0}
      onClick={() => openEditModal(event)}
      onKeyDown={(evt) => {
        if (evt.key === 'Enter' || evt.key === ' ') {
          evt.preventDefault();
          openEditModal(event);
        }
      }}
      className={`group flex w-full cursor-pointer flex-col gap-1 rounded-2xl border px-3 py-2 text-left text-xs shadow-sm transition ${getStatusBadgeClass(event.status)}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-primary/90 group-hover:text-primary">{event.title}</p>
        {event.time && <span className="whitespace-nowrap text-[0.65rem] uppercase tracking-wide text-slate-500">{event.time}</span>}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[0.65rem] text-slate-500">
        <span>{normaliseStatusLabel(event.status)}</span>
        {event.zone && (
          <span className="inline-flex items-center gap-1">
            <MapPinIcon className="h-3 w-3" />
            {event.zone}
          </span>
        )}
        {event.notesCount > 0 && (
          <span className="inline-flex items-center gap-1 text-primary">
            <ChatBubbleLeftRightIcon className="h-3 w-3" />
            {event.notesCount}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-primary">{calendar?.month || initialData?.month || 'Service calendar'}</h2>
          <p className="text-sm text-slate-600">Co-ordinate field crews, follow-ups, and inspections in {context.timezone || 'local time'}.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
            <ClockIcon className="h-4 w-4 text-primary" />
            {context.timezone || 'Local timezone'}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleNavigateMonth('prev')}
              className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => handleNavigateMonth('next')}
              className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
          {permissions.canCreate && (
            <button
              type="button"
              onClick={() => openCreateModal(selectedDay)}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <PlusIcon className="h-5 w-5" />
              New booking
            </button>
          )}
        </div>
      </div>

      {error && <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {summaryMetrics.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {summaryMetrics.map((metric) => (
            <div key={metric.id || metric.label} className="rounded-3xl border border-primary/10 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">{metric.label}</p>
              <p className="mt-2 text-2xl font-semibold text-primary">{metric.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {statusFilters.map((filter) => {
          const isActive = activeStatuses.includes(filter.value.toLowerCase());
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => handleToggleStatus(filter.value)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1 text-xs font-semibold transition ${
                isActive ? 'border-primary/40 bg-primary/10 text-primary' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              <UsersIcon className="h-4 w-4" />
              {filter.label}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="calendar-zone" className="text-xs font-semibold text-slate-500">
            Zone
          </label>
          <select
            id="calendar-zone"
            value={selectedZone || ''}
            onChange={handleZoneChange}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs text-primary focus:border-primary focus:ring focus:ring-primary/20"
          >
            <option value="">All zones</option>
            {zoneFilters.map((zone) => (
              <option key={zone.value || zone.id} value={zone.value || zone.id}>
                {zone.label || zone.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {legend.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
          {legend.map((item) => (
            <span key={item.status} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${getStatusBadgeClass(item.status)}`}>
              <span className="h-2 w-2 rounded-full bg-current" />
              {item.label}
            </span>
          ))}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-primary/10 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-7 gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="px-2 py-1 text-center">{day}</div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2 text-sm">
            {calendar?.weeks?.map((week, index) => (
              <div key={`week-${index}`} className="contents">
                {week.map((day) => {
                  const isSelected = selectedDay === day.isoDate;
                  return (
                    <button
                      key={day.isoDate}
                      type="button"
                      onClick={() => setSelectedDay(day.isoDate)}
                      className={`flex min-h-[120px] flex-col gap-1 rounded-2xl border px-2 py-2 text-left transition ${
                        day.isCurrentMonth ? 'border-slate-200 bg-secondary' : 'border-transparent bg-slate-50 text-slate-400'
                      } ${isSelected ? 'ring-2 ring-primary/40' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold ${day.isToday ? 'text-primary' : ''}`}>{day.date}</span>
                        {day.capacity && (
                          <span className="text-[0.6rem] uppercase tracking-wide text-slate-400">{day.capacity}</span>
                        )}
                      </div>
                      <div className="flex-1 space-y-1 overflow-hidden">
                        {(day.events || []).slice(0, 3).map((event) => (
                          <div key={event.id} className="text-xs">
                            {renderEvent(event)}
                          </div>
                        ))}
                        {day.events && day.events.length > 3 && (
                          <span className="text-[0.65rem] text-primary">+{day.events.length - 3} more</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-primary/10 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Selected day</p>
                <h3 className="text-lg font-semibold text-primary">
                  {selectedDayData ? new Date(`${selectedDayData.isoDate}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }) : 'No day selected'}
                </h3>
              </div>
              {permissions.canCreate && (
                <button
                  type="button"
                  onClick={() => openCreateModal(selectedDay)}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/20 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add visit
                </button>
              )}
            </div>

            <div className="mt-4 space-y-4">
              {selectedDayData?.events && selectedDayData.events.length > 0 ? (
                selectedDayData.events.map((event) => (
                  <div key={event.id} className="rounded-2xl border border-slate-200 bg-secondary p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-primary">{event.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          {event.time && (
                            <span className="inline-flex items-center gap-1">
                              <ClockIcon className="h-4 w-4" />
                              {event.time}
                            </span>
                          )}
                          {event.zone && (
                            <span className="inline-flex items-center gap-1">
                              <MapPinIcon className="h-4 w-4" />
                              {event.zone}
                            </span>
                          )}
                          {event.location && (
                            <span className="inline-flex items-center gap-1">
                              <BuildingOfficeIcon className="h-4 w-4" />
                              {event.location}
                            </span>
                          )}
                          {event.crew && (
                            <span className="inline-flex items-center gap-1">
                              <UsersIcon className="h-4 w-4" />
                              {event.crew}
                            </span>
                          )}
                          {event.value && <span className="font-semibold text-primary">{event.value}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {permissions.canEdit && (
                          <button
                            type="button"
                            onClick={() => openEditModal(event)}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                          >
                            <PencilSquareIcon className="h-4 w-4" /> Edit
                          </button>
                        )}
                        {permissions.canManageNotes && (
                          <button
                            type="button"
                            onClick={() => openNotes(event)}
                            className="inline-flex items-center gap-1 rounded-full border border-primary/30 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10"
                          >
                            <ChatBubbleLeftRightIcon className="h-4 w-4" /> Notes ({event.notesCount || 0})
                          </button>
                        )}
                      </div>
                    </div>
                    {event.demandLevel && (
                      <p className="mt-2 text-xs text-slate-500">Demand level: {event.demandLevel}</p>
                    )}
                    {event.attachments && event.attachments.length > 0 && (
                      <div className="mt-2 space-y-1 text-xs">
                        {event.attachments.map((attachment, index) => (
                          <a
                            key={`${event.id}-attachment-${index}`}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-primary underline underline-offset-2"
                          >
                            <InformationCircleIcon className="h-4 w-4" />
                            {attachment.label || attachment.url}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                  No visits scheduled for this day. {permissions.canCreate ? 'Create one with “Add visit”.' : 'You do not have permission to create visits.'}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-primary/10 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Backlog</p>
                <h3 className="text-lg font-semibold text-primary">On-demand & pending requests</h3>
                <p className="text-xs text-slate-500">Prioritise these to keep SLAs on track.</p>
              </div>
            </div>
            <div className="mt-4 space-y-4">
              {backlog.length > 0 ? (
                backlog.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-secondary p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-primary">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.statusLabel}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          {item.requestedAt && (
                            <span className="inline-flex items-center gap-1">
                              <ClockIcon className="h-4 w-4" />
                              {new Date(item.requestedAt).toLocaleString()}
                            </span>
                          )}
                          {item.zone && (
                            <span className="inline-flex items-center gap-1">
                              <MapPinIcon className="h-4 w-4" />
                              {item.zone}
                            </span>
                          )}
                          {item.demandLevel && (
                            <span className="inline-flex items-center gap-1">
                              <UsersIcon className="h-4 w-4" />
                              {item.demandLevel}
                            </span>
                          )}
                          {item.value && <span className="font-semibold text-primary">{item.value}</span>}
                          {item.notesCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-primary">
                              <ChatBubbleLeftRightIcon className="h-4 w-4" />
                              {item.notesCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {permissions.canEdit && (
                          <button
                            type="button"
                            onClick={() => openEditModal({ ...item, status: item.status })}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                            Update
                          </button>
                        )}
                        {permissions.canManageNotes && (
                          <button
                            type="button"
                            onClick={() => openNotes(item)}
                            className="inline-flex items-center gap-1 rounded-full border border-primary/30 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10"
                          >
                            <ChatBubbleLeftRightIcon className="h-4 w-4" />
                            Notes ({item.notesCount || 0})
                          </button>
                        )}
                      </div>
                    </div>
                    {item.attachments && item.attachments.length > 0 && (
                      <div className="mt-3 space-y-2 text-xs">
                        {item.attachments.map((attachment, index) => (
                          <a
                            key={`${item.id}-attachment-${index}`}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-primary underline underline-offset-2"
                          >
                            <InformationCircleIcon className="h-4 w-4" />
                            {attachment.label || attachment.url}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                  All caught up! No backlog items need your attention.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-full border border-primary/20 bg-white px-4 py-2 text-sm text-primary">
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
            Refreshing calendar…
          </div>
        </div>
      )}

      {modalState.open && (
        <BookingModal
          open={modalState.open}
          mode={modalState.mode}
          booking={modalState.booking}
          zones={zoneFilters}
          onClose={closeModal}
          onSave={handleSaveBooking}
          permissions={permissions}
          onAssignmentsChanged={handleAssignmentsChanged}
        />
      )}

      {notesState.open && (
        <BookingNotesPanel
          booking={notesState.booking}
          open={notesState.open}
          onClose={closeNotes}
          permissions={permissions}
          onChanged={handleNotesChanged}
        />
      )}
    </div>
  );
}

ServiceCalendar.propTypes = {
  section: PropTypes.shape({
    data: PropTypes.shape({
      month: PropTypes.string,
      monthValue: PropTypes.string,
      summary: PropTypes.array,
      legend: PropTypes.array,
      filters: PropTypes.shape({
        statuses: PropTypes.array,
        zones: PropTypes.array
      }),
      weeks: PropTypes.array,
      backlog: PropTypes.array,
      permissions: PropTypes.object,
      context: PropTypes.object
    })
  }).isRequired
};

export default ServiceCalendar;
