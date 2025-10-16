import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  listAdminLiveFeedAudits,
  getAdminLiveFeedAudit,
  createAdminLiveFeedAudit,
  updateAdminLiveFeedAudit,
  createAdminLiveFeedAuditNote,
  updateAdminLiveFeedAuditNote,
  deleteAdminLiveFeedAuditNote
} from '../../api/adminLiveFeedAuditClient.js';
import { buildDefaultCreateForm, buildDefaultFilters, createEmptyAttachment } from './constants.js';
import { parseTags } from './utils.js';

function buildQueryParams(filters, page) {
  const params = { page };
  if (filters.search) {
    params.search = filters.search;
  }
  if (filters.eventTypes.length) {
    params.eventTypes = filters.eventTypes;
  }
  if (filters.statuses.length) {
    params.statuses = filters.statuses;
  }
  if (filters.severities.length) {
    params.severities = filters.severities;
  }
  if (filters.sortBy) {
    params.sortBy = filters.sortBy;
  }
  if (filters.sortDirection) {
    params.sortDirection = filters.sortDirection;
  }
  if (filters.includeNotes) {
    params.includeNotes = 'true';
  }

  const now = new Date();
  if (filters.timeframe === '24h') {
    params.start = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  } else if (filters.timeframe === '7d') {
    params.start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  } else if (filters.timeframe === '30d') {
    params.start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  } else if (filters.timeframe === '90d') {
    params.start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
  } else if (filters.timeframe === 'custom') {
    if (filters.customStart) {
      params.start = new Date(filters.customStart).toISOString();
    }
    if (filters.customEnd) {
      params.end = new Date(filters.customEnd).toISOString();
    }
  }

  return params;
}

function normaliseAttachments(attachments) {
  return attachments
    .map((attachment) => ({ url: attachment.url?.trim(), label: attachment.label?.trim() }))
    .filter((attachment) => attachment.url);
}

function createDetailFormFromAudit(audit, fallback = null) {
  const attachments = Array.isArray(audit.attachments) && audit.attachments.length
    ? audit.attachments.map((attachment) => ({ label: attachment.label ?? '', url: attachment.url ?? '' }))
    : fallback?.attachments ?? [createEmptyAttachment()];

  return {
    summary: audit.summary ?? fallback?.summary ?? '',
    status: audit.status ?? fallback?.status ?? 'open',
    severity: audit.severity ?? fallback?.severity ?? 'info',
    details: audit.details ?? fallback?.details ?? '',
    assigneeId: audit.assigneeId ?? fallback?.assigneeId ?? '',
    nextActionAt: audit.nextActionAt ? audit.nextActionAt.slice(0, 16) : fallback?.nextActionAt ?? '',
    tags: Array.isArray(audit.tags) ? audit.tags : fallback?.tags ?? [],
    attachments,
    metadata: audit.metadata ?? fallback?.metadata ?? {}
  };
}

export function useLiveFeedAuditing() {
  const [filters, setFilters] = useState(() => buildDefaultFilters());
  const [page, setPage] = useState(1);
  const [collectionState, setCollectionState] = useState({
    loading: true,
    error: null,
    data: [],
    meta: null,
    summary: null
  });

  const [detailState, setDetailState] = useState({
    open: false,
    loading: false,
    auditId: null,
    audit: null,
    form: null,
    saving: false,
    error: null,
    editingNoteId: null,
    noteDraft: '',
    noteTagsDraft: '',
    noteSaving: false
  });

  const [creationState, setCreationState] = useState({
    open: false,
    form: buildDefaultCreateForm(),
    saving: false,
    error: null
  });

  const loadAudits = useCallback(
    async ({ signal } = {}) => {
      setCollectionState((current) => ({ ...current, loading: true, error: null }));
      try {
        const params = buildQueryParams(filters, page);
        const payload = await listAdminLiveFeedAudits(params, { signal });
        setCollectionState({
          loading: false,
          error: null,
          data: payload?.data ?? [],
          meta: payload?.meta ?? null,
          summary: payload?.summary ?? null
        });
      } catch (error) {
        if (signal && signal.aborted) {
          return;
        }
        if (error?.name === 'AbortError') {
          return;
        }
        setCollectionState((current) => ({ ...current, loading: false, error }));
      }
    },
    [filters, page]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadAudits({ signal: controller.signal });
    return () => controller.abort();
  }, [loadAudits]);

  const setFilterValue = useCallback((key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }, []);

  const toggleFilterValue = useCallback((key, value) => {
    setFilters((current) => {
      const currentValues = new Set(current[key]);
      if (currentValues.has(value)) {
        currentValues.delete(value);
      } else {
        currentValues.add(value);
      }
      return { ...current, [key]: Array.from(currentValues) };
    });
    setPage(1);
  }, []);

  const openDetail = useCallback(async (auditId) => {
    setDetailState({
      open: true,
      loading: true,
      auditId,
      audit: null,
      form: null,
      saving: false,
      error: null,
      editingNoteId: null,
      noteDraft: '',
      noteTagsDraft: '',
      noteSaving: false
    });

    try {
      const audit = await getAdminLiveFeedAudit(auditId);
      setDetailState((current) => ({
        ...current,
        loading: false,
        audit,
        form: createDetailFormFromAudit(audit)
      }));
    } catch (error) {
      setDetailState((current) => ({ ...current, loading: false, error }));
    }
  }, []);

  const closeDetail = useCallback(() => {
    setDetailState({
      open: false,
      loading: false,
      auditId: null,
      audit: null,
      form: null,
      saving: false,
      error: null,
      editingNoteId: null,
      noteDraft: '',
      noteTagsDraft: '',
      noteSaving: false
    });
  }, []);

  const refreshCurrentAudit = useCallback(async () => {
    if (!detailState.auditId) return;
    try {
      const audit = await getAdminLiveFeedAudit(detailState.auditId);
      setDetailState((current) => {
        if (current.auditId !== audit.id) {
          return current;
        }
        return {
          ...current,
          audit,
          form: current.form ? createDetailFormFromAudit(audit, current.form) : current.form
        };
      });
    } catch {
      // ignore refresh failures
    }
  }, [detailState.auditId]);

  const setDetailField = useCallback((field, value) => {
    setDetailState((current) => {
      if (!current.form) return current;
      return { ...current, form: { ...current.form, [field]: value }, error: null };
    });
  }, []);

  const setDetailAttachmentField = useCallback((index, field, value) => {
    setDetailState((current) => {
      if (!current.form) return current;
      const attachments = current.form.attachments.slice();
      attachments[index] = { ...attachments[index], [field]: value };
      return { ...current, form: { ...current.form, attachments }, error: null };
    });
  }, []);

  const addDetailAttachment = useCallback(() => {
    setDetailState((current) => {
      if (!current.form) return current;
      return {
        ...current,
        form: { ...current.form, attachments: [...current.form.attachments, createEmptyAttachment()] },
        error: null
      };
    });
  }, []);

  const removeDetailAttachment = useCallback((index) => {
    setDetailState((current) => {
      if (!current.form) return current;
      const attachments = current.form.attachments.slice();
      attachments.splice(index, 1);
      return {
        ...current,
        form: {
          ...current.form,
          attachments: attachments.length ? attachments : [createEmptyAttachment()]
        },
        error: null
      };
    });
  }, []);

  const handleDetailSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!detailState.auditId || !detailState.form) return;

      setDetailState((current) => ({ ...current, saving: true, error: null }));
      try {
        const payload = {
          summary: detailState.form.summary,
          status: detailState.form.status,
          severity: detailState.form.severity,
          details: detailState.form.details,
          assigneeId: detailState.form.assigneeId || null,
          nextActionAt: detailState.form.nextActionAt ? new Date(detailState.form.nextActionAt).toISOString() : null,
          tags: detailState.form.tags,
          attachments: normaliseAttachments(detailState.form.attachments),
          metadata: detailState.form.metadata
        };
        await updateAdminLiveFeedAudit(detailState.auditId, payload);
        await Promise.all([refreshCurrentAudit(), loadAudits()]);
        setDetailState((current) => ({ ...current, saving: false, error: null }));
      } catch (error) {
        setDetailState((current) => ({ ...current, saving: false, error }));
      }
    },
    [detailState.auditId, detailState.form, loadAudits, refreshCurrentAudit]
  );

  const setDetailTagsFromString = useCallback((value) => {
    setDetailState((current) => {
      if (!current.form) return current;
      return { ...current, form: { ...current.form, tags: parseTags(value) } };
    });
  }, []);

  const setNoteDraft = useCallback((value) => {
    setDetailState((current) => ({ ...current, noteDraft: value }));
  }, []);

  const setNoteTagsDraft = useCallback((value) => {
    setDetailState((current) => ({ ...current, noteTagsDraft: value }));
  }, []);

  const addNote = useCallback(
    async (event) => {
      event.preventDefault();
      if (!detailState.auditId || !detailState.noteDraft.trim()) return;

      setDetailState((current) => ({ ...current, noteSaving: true, error: null }));
      try {
        await createAdminLiveFeedAuditNote(detailState.auditId, {
          note: detailState.noteDraft,
          tags: parseTags(detailState.noteTagsDraft)
        });
        setDetailState((current) => ({ ...current, noteDraft: '', noteTagsDraft: '' }));
        await Promise.all([refreshCurrentAudit(), loadAudits()]);
        setDetailState((current) => ({ ...current, noteSaving: false }));
      } catch (error) {
        setDetailState((current) => ({ ...current, noteSaving: false, error }));
      }
    },
    [detailState.auditId, detailState.noteDraft, detailState.noteTagsDraft, loadAudits, refreshCurrentAudit]
  );

  const beginEditNote = useCallback((note) => {
    setDetailState((current) => ({
      ...current,
      editingNoteId: note.id,
      noteDraft: note.note ?? '',
      noteTagsDraft: Array.isArray(note.tags) ? note.tags.join(', ') : ''
    }));
  }, []);

  const cancelEditNote = useCallback(() => {
    setDetailState((current) => ({ ...current, editingNoteId: null, noteDraft: '', noteTagsDraft: '' }));
  }, []);

  const updateNote = useCallback(
    async (event) => {
      event.preventDefault();
      if (!detailState.editingNoteId) return;

      setDetailState((current) => ({ ...current, noteSaving: true, error: null }));
      try {
        await updateAdminLiveFeedAuditNote(detailState.editingNoteId, {
          note: detailState.noteDraft,
          tags: parseTags(detailState.noteTagsDraft)
        });
        cancelEditNote();
        await Promise.all([refreshCurrentAudit(), loadAudits()]);
        setDetailState((current) => ({ ...current, noteSaving: false }));
      } catch (error) {
        setDetailState((current) => ({ ...current, noteSaving: false, error }));
      }
    },
    [cancelEditNote, detailState.editingNoteId, detailState.noteDraft, detailState.noteTagsDraft, loadAudits, refreshCurrentAudit]
  );

  const deleteNote = useCallback(
    async (noteId) => {
      if (!noteId) return;
      setDetailState((current) => ({ ...current, noteSaving: true, error: null }));
      try {
        await deleteAdminLiveFeedAuditNote(noteId);
        await Promise.all([refreshCurrentAudit(), loadAudits()]);
        setDetailState((current) => ({
          ...current,
          noteSaving: false,
          editingNoteId: current.editingNoteId === noteId ? null : current.editingNoteId
        }));
      } catch (error) {
        setDetailState((current) => ({ ...current, noteSaving: false, error }));
      }
    },
    [loadAudits, refreshCurrentAudit]
  );

  const openCreate = useCallback(() => {
    setCreationState({ open: true, form: buildDefaultCreateForm(), saving: false, error: null });
  }, []);

  const closeCreate = useCallback(() => {
    setCreationState({ open: false, form: buildDefaultCreateForm(), saving: false, error: null });
  }, []);

  const setCreateField = useCallback((field, value) => {
    setCreationState((current) => ({
      ...current,
      form: { ...current.form, [field]: value },
      error: null
    }));
  }, []);

  const setCreateTagsFromString = useCallback((value) => {
    setCreationState((current) => ({
      ...current,
      form: { ...current.form, tags: parseTags(value) }
    }));
  }, []);

  const setCreateAttachmentField = useCallback((index, field, value) => {
    setCreationState((current) => {
      const attachments = current.form.attachments.slice();
      attachments[index] = { ...attachments[index], [field]: value };
      return { ...current, form: { ...current.form, attachments } };
    });
  }, []);

  const addCreateAttachment = useCallback(() => {
    setCreationState((current) => ({
      ...current,
      form: { ...current.form, attachments: [...current.form.attachments, createEmptyAttachment()] }
    }));
  }, []);

  const removeCreateAttachment = useCallback((index) => {
    setCreationState((current) => {
      const attachments = current.form.attachments.slice();
      attachments.splice(index, 1);
      return {
        ...current,
        form: {
          ...current.form,
          attachments: attachments.length ? attachments : [createEmptyAttachment()]
        }
      };
    });
  }, []);

  const createAudit = useCallback(
    async (event) => {
      event.preventDefault();
      setCreationState((current) => ({ ...current, saving: true, error: null }));
      try {
        let metadata;
        if (creationState.form.metadataText) {
          try {
            metadata = JSON.parse(creationState.form.metadataText);
          } catch {
            throw new Error('Metadata must be valid JSON.');
          }
        }

        await createAdminLiveFeedAudit({
          eventType: creationState.form.eventType,
          summary: creationState.form.summary,
          severity: creationState.form.severity,
          status: creationState.form.status,
          details: creationState.form.details,
          zoneId: creationState.form.zoneId || undefined,
          postId: creationState.form.postId || undefined,
          assigneeId: creationState.form.assigneeId || undefined,
          nextActionAt: creationState.form.nextActionAt
            ? new Date(creationState.form.nextActionAt).toISOString()
            : undefined,
          tags: creationState.form.tags,
          attachments: normaliseAttachments(creationState.form.attachments),
          metadata
        });

        setCreationState({ open: false, form: buildDefaultCreateForm(), saving: false, error: null });
        await loadAudits();
      } catch (error) {
        setCreationState((current) => ({ ...current, saving: false, error }));
      }
    },
    [creationState.form, loadAudits]
  );

  const summaryCards = useMemo(() => {
    const summary = collectionState.summary ?? {};
    const total = summary.total ?? 0;
    const byStatus = summary.byStatus ?? {};
    const bySeverity = summary.bySeverity ?? {};
    return [
      { label: 'Total events', value: total.toLocaleString() },
      { label: 'Open', value: (byStatus.open ?? 0).toLocaleString() },
      { label: 'Investigating', value: (byStatus.investigating ?? 0).toLocaleString() },
      { label: 'Resolved', value: (byStatus.resolved ?? 0).toLocaleString() },
      { label: 'Critical severity', value: (bySeverity.critical ?? 0).toLocaleString() }
    ];
  }, [collectionState.summary]);

  const topZones = useMemo(() => collectionState.summary?.topZones ?? [], [collectionState.summary]);
  const topActors = useMemo(() => collectionState.summary?.topActors ?? [], [collectionState.summary]);

  const pagination = useMemo(() => collectionState.meta ?? { page: 1, totalPages: 1, total: 0 }, [collectionState.meta]);
  const canGoPrev = pagination.page > 1;
  const canGoNext = pagination.page < (pagination.totalPages ?? 1);

  return {
    filters,
    setFilterValue,
    toggleFilterValue,
    page,
    setPage,
    collectionState,
    summaryCards,
    topZones,
    topActors,
    pagination,
    canGoPrev,
    canGoNext,
    loadAudits,
    detailState,
    openDetail,
    closeDetail,
    refreshCurrentAudit,
    setDetailField,
    setDetailTagsFromString,
    setDetailAttachmentField,
    addDetailAttachment,
    removeDetailAttachment,
    handleDetailSubmit,
    setNoteDraft,
    setNoteTagsDraft,
    addNote,
    beginEditNote,
    cancelEditNote,
    updateNote,
    deleteNote,
    creationState,
    openCreate,
    closeCreate,
    setCreateField,
    setCreateTagsFromString,
    setCreateAttachmentField,
    addCreateAttachment,
    removeCreateAttachment,
    createAudit
  };
}
