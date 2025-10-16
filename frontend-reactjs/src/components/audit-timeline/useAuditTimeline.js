import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  listAdminAuditEvents,
  createAdminAuditEvent,
  updateAdminAuditEvent,
  deleteAdminAuditEvent
} from '../../api/panelClient.js';
import { CATEGORY_OPTIONS, STATUS_OPTIONS, STATUS_LABELS, TIMEFRAME_OPTIONS } from './constants.js';
import {
  aggregateByKey,
  buildCategoryStats,
  buildStatusStats,
  emptyForm,
  formatDateTimeInputValue,
  formatLastUpdated,
  formatRange,
  formatTimezone,
  mergeCounts,
  normaliseManualEvent,
  eventsToCsv
} from './utils.js';

function useAuditTimeline(section) {
  const initialEvents = Array.isArray(section.data?.events) ? section.data.events : [];
  const initialManual = initialEvents.filter((entry) => entry.source === 'manual');
  const initialSystem = initialEvents.filter((entry) => entry.source !== 'manual');
  const initialSummary = section.data?.summary ?? {};
  const initialTimezone = initialSummary.timezone ?? 'Europe/London';

  const [timeframe, setTimeframe] = useState(section.data?.initialTimeframe ?? '7d');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [manualEvents, setManualEvents] = useState(() =>
    initialManual.map((event) => normaliseManualEvent(event, initialTimezone))
  );
  const [manualMeta, setManualMeta] = useState({
    timeframe: initialSummary.timeframe ?? timeframe,
    timeframeLabel: initialSummary.timeframeLabel ?? '7 days',
    timezone: initialTimezone,
    range: initialSummary.range ?? null,
    lastUpdated: initialSummary.lastUpdated ?? null,
    countsByCategory: initialSummary.manualCounts ?? {},
    countsByStatus: initialSummary.manualStatusCounts ?? {}
  });
  const [systemEvents, setSystemEvents] = useState(initialSystem);
  const [baseSummary, setBaseSummary] = useState(initialSummary);
  const [detailEvent, setDetailEvent] = useState(null);
  const [editorState, setEditorState] = useState({ open: false, mode: 'create', eventId: null });
  const [formData, setFormData] = useState(() => emptyForm(initialTimezone));
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const nextEvents = Array.isArray(section.data?.events) ? section.data.events : [];
    const nextSummary = section.data?.summary ?? {};

    setSystemEvents(nextEvents.filter((entry) => entry.source !== 'manual'));
    setManualEvents((previous) => {
      if (!previous.length) {
        const timezone = nextSummary.timezone ?? manualMeta.timezone ?? initialTimezone;
        return nextEvents
          .filter((entry) => entry.source === 'manual')
          .map((entry) => normaliseManualEvent(entry, timezone));
      }
      return previous;
    });

    setBaseSummary(nextSummary);
    setManualMeta((prev) => ({
      ...prev,
      timeframe: nextSummary.timeframe ?? prev.timeframe ?? timeframe,
      timeframeLabel: nextSummary.timeframeLabel ?? prev.timeframeLabel,
      timezone: nextSummary.timezone ?? prev.timezone ?? initialTimezone,
      range: nextSummary.range ?? prev.range,
      lastUpdated: nextSummary.lastUpdated ?? prev.lastUpdated
    }));

    if (nextSummary.timeframe && nextSummary.timeframe !== timeframe) {
      setTimeframe(nextSummary.timeframe);
    }

    if (nextSummary.timezone && nextSummary.timezone !== formData.timezone) {
      setFormData((current) => ({ ...current, timezone: nextSummary.timezone }));
    }
  }, [section.data, initialTimezone, manualMeta.timezone, timeframe, formData.timezone]);

  const loadManualEvents = useCallback(
    async ({ signal, forceRefresh = false } = {}) => {
      setLoading(true);
      try {
        const response = await listAdminAuditEvents({
          timeframe,
          category: categoryFilter === 'all' ? undefined : categoryFilter,
          status: statusFilter === 'all' ? undefined : statusFilter,
          signal,
          forceRefresh
        });

        setManualEvents(() => {
          const timezone = response?.meta?.timezone || manualMeta.timezone || initialTimezone;
          const normalised = Array.isArray(response?.events)
            ? response.events.map((event) => normaliseManualEvent(event, timezone))
            : [];
          return normalised;
        });

        setManualMeta((prev) => {
          const timezone = response?.meta?.timezone || prev.timezone || initialTimezone;
          return {
            timeframe: response?.meta?.timeframe ?? timeframe,
            timeframeLabel:
              response?.meta?.timeframeLabel ?? prev.timeframeLabel ?? '7 days',
            timezone,
            range: response?.meta?.range ?? prev.range ?? baseSummary.range ?? null,
            lastUpdated:
              response?.meta?.lastUpdated ?? baseSummary.lastUpdated ?? prev.lastUpdated ?? new Date().toISOString(),
            countsByCategory: response?.meta?.countsByCategory ?? {},
            countsByStatus: response?.meta?.countsByStatus ?? {}
          };
        });

        setError(null);
      } catch (err) {
        if (signal?.aborted) {
          return;
        }
        const message = err instanceof Error ? err.message : 'Unable to load audit events';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [
      timeframe,
      categoryFilter,
      statusFilter,
      manualMeta.timezone,
      baseSummary.range,
      baseSummary.lastUpdated,
      initialTimezone
    ]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadManualEvents({ signal: controller.signal });
    return () => controller.abort();
  }, [loadManualEvents]);

  const combinedEvents = useMemo(() => {
    const events = [...manualEvents, ...systemEvents];
    const filtered = events.filter((event) => {
      const categoryOk = categoryFilter === 'all' || event.category === categoryFilter;
      const statusOk = statusFilter === 'all' || event.status === statusFilter;
      return categoryOk && statusOk;
    });
    return filtered.sort((a, b) => {
      const aTime = a.occurredAt ? new Date(a.occurredAt).getTime() : 0;
      const bTime = b.occurredAt ? new Date(b.occurredAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [manualEvents, systemEvents, categoryFilter, statusFilter]);

  const manualCounts = useMemo(() => aggregateByKey(manualEvents, 'category'), [manualEvents]);
  const manualStatusCounts = useMemo(() => aggregateByKey(manualEvents, 'status'), [manualEvents]);
  const systemCounts = useMemo(() => aggregateByKey(systemEvents, 'category'), [systemEvents]);
  const systemStatusCounts = useMemo(() => aggregateByKey(systemEvents, 'status'), [systemEvents]);

  const combinedSummary = useMemo(
    () => ({
      countsByCategory: mergeCounts(systemCounts, manualCounts),
      countsByStatus: mergeCounts(systemStatusCounts, manualStatusCounts),
      manualCounts,
      manualStatusCounts,
      timeframe: manualMeta.timeframe ?? baseSummary.timeframe ?? timeframe,
      timeframeLabel: manualMeta.timeframeLabel ?? baseSummary.timeframeLabel ?? '7 days',
      timezone: manualMeta.timezone ?? baseSummary.timezone ?? initialTimezone,
      range: manualMeta.range ?? baseSummary.range ?? null,
      lastUpdated: manualMeta.lastUpdated ?? baseSummary.lastUpdated ?? null
    }),
    [
      systemCounts,
      manualCounts,
      systemStatusCounts,
      manualStatusCounts,
      manualMeta,
      baseSummary,
      timeframe,
      initialTimezone
    ]
  );

  const categoryStats = useMemo(
    () => buildCategoryStats(combinedSummary.countsByCategory),
    [combinedSummary.countsByCategory]
  );
  const statusStats = useMemo(
    () => buildStatusStats(combinedSummary.countsByStatus, STATUS_LABELS),
    [combinedSummary.countsByStatus]
  );

  const manualEventCount = manualEvents.length;
  const systemEventCount = systemEvents.length;
  const timeframeLabel = combinedSummary.timeframeLabel || '7 days';
  const rangeDisplay = formatRange(combinedSummary.range);
  const timezoneDisplay = formatTimezone(combinedSummary.timezone);
  const lastUpdatedDisplay = formatLastUpdated(combinedSummary.lastUpdated);

  const openCreateModal = () => {
    setFormData(emptyForm(manualMeta.timezone ?? initialTimezone));
    setFormErrors({});
    setEditorState({ open: true, mode: 'create', eventId: null });
  };

  const openEditModal = (event) => {
    setFormData({
      title: event.event,
      summary: event.summary,
      category: event.category,
      status: event.status,
      ownerName: event.owner,
      ownerTeam: event.ownerTeam || '',
      occurredAt: formatDateTimeInputValue(event.occurredAt),
      dueAt: formatDateTimeInputValue(event.dueAt),
      attachments:
        event.attachments && event.attachments.length
          ? event.attachments.map((attachment) => ({
              label: attachment.label || '',
              url: attachment.url || ''
            }))
          : [{ label: '', url: '' }],
      note: event.metadata?.note || '',
      timezone: manualMeta.timezone ?? initialTimezone
    });
    setFormErrors({});
    setEditorState({ open: true, mode: 'edit', eventId: event.id });
  };

  const closeEditor = () => {
    setEditorState({ open: false, mode: 'create', eventId: null });
    setSaving(false);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    if (!formData.ownerName.trim()) {
      errors.ownerName = 'Owner is required';
    }
    if (!formData.occurredAt) {
      errors.occurredAt = 'Start time is required';
    }
    if (formData.attachments.some((attachment) => attachment.url && !/^https?:\/\//i.test(attachment.url))) {
      errors.attachments = 'Attachment URLs must start with http or https';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAttachmentChange = (index, key, value) => {
    setFormData((current) => {
      const next = current.attachments.slice();
      next[index] = { ...next[index], [key]: value };
      return { ...current, attachments: next };
    });
  };

  const addAttachmentRow = () => {
    setFormData((current) => ({ ...current, attachments: [...current.attachments, { label: '', url: '' }] }));
  };

  const removeAttachmentRow = (index) => {
    setFormData((current) => ({
      ...current,
      attachments: current.attachments.filter((_, attachmentIndex) => attachmentIndex !== index)
    }));
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    setSaving(true);
    const payload = {
      title: formData.title.trim(),
      summary: formData.summary.trim(),
      category: formData.category,
      status: formData.status,
      ownerName: formData.ownerName.trim(),
      ownerTeam: formData.ownerTeam.trim() || null,
      occurredAt: new Date(formData.occurredAt).toISOString(),
      dueAt: formData.dueAt ? new Date(formData.dueAt).toISOString() : null,
      attachments: formData.attachments
        .filter((attachment) => attachment.url)
        .map((attachment) => ({
          label: attachment.label || 'Evidence',
          url: attachment.url
        })),
      metadata: formData.note ? { note: formData.note.trim() } : undefined
    };

    try {
      if (editorState.mode === 'create') {
        await createAdminAuditEvent(payload);
      } else {
        await updateAdminAuditEvent(editorState.eventId, payload);
      }
      await loadManualEvents({ forceRefresh: true });
      closeEditor();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save audit event';
      setFormErrors((current) => ({ ...current, submit: message }));
      setSaving(false);
    }
  };

  const handleDelete = async (event) => {
    if (!window.confirm(`Delete “${event.event}”? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteAdminAuditEvent(event.id);
      await loadManualEvents({ forceRefresh: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to delete audit event';
      setError(message);
    }
  };

  const refreshTimeline = useCallback(() => loadManualEvents({ forceRefresh: true }), [loadManualEvents]);

  const exportTimeline = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const csv = eventsToCsv(combinedEvents);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const filenameBase = manualMeta.timeframe ?? timeframe ?? 'audit-window';
    const filename = `audit-timeline-${filenameBase.replace(/[^a-z0-9-]/gi, '-').replace(/-{2,}/g, '-') || 'window'}.csv`;

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename.toLowerCase());
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [combinedEvents, manualMeta.timeframe, timeframe]);

  return {
    timeframe,
    setTimeframe,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    loading,
    error,
    manualEventCount,
    systemEventCount,
    timeframeLabel,
    rangeDisplay,
    timezoneDisplay,
    lastUpdatedDisplay,
    categoryStats,
    statusStats,
    combinedEvents,
    detailEvent,
    setDetailEvent,
    openCreateModal,
    openEditModal,
    closeEditor,
    editorState,
    formData,
    setFormData,
    formErrors,
    setFormErrors,
    handleAttachmentChange,
    addAttachmentRow,
    removeAttachmentRow,
    handleSave,
    handleDelete,
    saving,
    refreshTimeline,
    exportTimeline
  };
}

export default useAuditTimeline;
