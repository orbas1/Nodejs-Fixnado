import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  listCustomJobs,
  fetchCustomJob,
  createCustomJob,
  updateCustomJob,
  awardCustomJob,
  sendAdminBidMessage
} from '../../../api/adminCustomJobsClient.js';
import { fetchZonesWithAnalytics } from '../../../api/zoneAdminClient.js';
import { defaultCreateForm } from '../constants.js';
import {
  buildUpdatePayload,
  createAttachmentDraft,
  createInitialEditForm,
  parseImages
} from '../utils.js';

const defaultFilters = { status: 'open', zoneId: '', search: '' };

export function useAdminCustomJobs() {
  const [filters, setFilters] = useState(defaultFilters);
  const [searchInput, setSearchInput] = useState('');
  const [jobs, setJobs] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [zones, setZones] = useState([]);
  const [createMode, setCreateMode] = useState(false);
  const [createForm, setCreateForm] = useState(defaultCreateForm);
  const [createError, setCreateError] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [messageDrafts, setMessageDrafts] = useState({});
  const [messageStatus, setMessageStatus] = useState({});
  const [messageAttachments, setMessageAttachments] = useState({});

  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters((current) => (current.search === searchInput ? current : { ...current, search: searchInput }));
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const loadZones = useCallback(async () => {
    try {
      const response = await fetchZonesWithAnalytics();
      const list = Array.isArray(response?.zones) ? response.zones : [];
      setZones(list);
    } catch (caught) {
      console.warn('Failed to load zones', caught);
      setZones([]);
    }
  }, []);

  const loadJobs = useCallback(
    async (preferredSelection) => {
      setLoading(true);
      setError(null);
      try {
        const query = {
          ...filters,
          status: filters.status === 'all' ? undefined : filters.status
        };
        const payload = await listCustomJobs(query);
        setJobs(payload.jobs);
        setSummary(payload.summary ?? {});

        if (payload.jobs.length === 0) {
          setSelectedJobId(null);
          setSelectedJob(null);
          setEditForm(null);
          return;
        }

        const candidate = preferredSelection || selectedJobId || (createMode ? null : payload.jobs[0]?.id);
        if (candidate && payload.jobs.some((job) => job.id === candidate)) {
          setSelectedJobId(candidate);
        } else if (!createMode) {
          setSelectedJobId(payload.jobs[0].id);
        }
      } catch (caught) {
        console.error('Failed to load custom jobs', caught);
        setError(caught instanceof Error ? caught.message : 'Unable to load custom jobs');
      } finally {
        setLoading(false);
      }
    },
    [filters, selectedJobId, createMode]
  );

  const loadJobDetail = useCallback(async (jobId) => {
    if (!jobId) {
      setSelectedJob(null);
      setEditForm(null);
      return;
    }
    setDetailLoading(true);
    try {
      const job = await fetchCustomJob(jobId);
      setSelectedJob(job);
      setEditForm(createInitialEditForm(job));
      setMessageDrafts({});
      setMessageStatus({});
      setMessageAttachments({});
    } catch (caught) {
      console.error('Failed to fetch custom job detail', caught);
      setSelectedJob(null);
      setEditForm(null);
      setError(caught instanceof Error ? caught.message : 'Unable to load job detail');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    loadZones();
  }, [loadZones]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    if (selectedJobId && !createMode) {
      loadJobDetail(selectedJobId);
    }
  }, [selectedJobId, loadJobDetail, createMode]);

  const selectJob = useCallback((jobId) => {
    setCreateMode(false);
    setSelectedJobId(jobId);
  }, []);

  const openJobWindow = useCallback(() => {
    if (!selectedJobId || typeof window === 'undefined') {
      return;
    }
    window.open(`/api/admin/custom-jobs/${selectedJobId}`, '_blank', 'noopener,noreferrer');
  }, [selectedJobId]);

  const openCreate = useCallback(() => {
    setCreateMode(true);
    setSelectedJobId(null);
    setSelectedJob(null);
    setEditForm(null);
    setCreateForm(defaultCreateForm);
    setCreateError(null);
  }, []);

  const cancelCreate = useCallback(() => {
    setCreateMode(false);
    setCreateError(null);
    setCreateForm(defaultCreateForm);
  }, []);

  const updateCreateField = useCallback((field, value) => {
    setCreateForm((current) => ({ ...current, [field]: value }));
  }, []);

  const updateEditField = useCallback((field, value) => {
    setEditForm((current) => ({ ...current, [field]: value }));
  }, []);

  const resetEditForm = useCallback(() => {
    if (!selectedJob) {
      return;
    }
    setEditForm(createInitialEditForm(selectedJob));
  }, [selectedJob]);

  const submitCreate = useCallback(
    async (event) => {
      event.preventDefault();
      if (!createForm.title || createForm.title.trim().length < 5) {
        setCreateError('Title must be at least 5 characters.');
        return;
      }
      if (!createForm.customerEmail || !createForm.customerEmail.includes('@')) {
        setCreateError('A customer email is required.');
        return;
      }

      setSaving(true);
      setCreateError(null);
      try {
        const payload = {
          title: createForm.title,
          description: createForm.description,
          budgetAmount: createForm.budgetAmount ? Number(createForm.budgetAmount) : undefined,
          budgetCurrency: createForm.budgetCurrency,
          budgetLabel: createForm.budgetLabel,
          zoneId: createForm.zoneId || undefined,
          allowOutOfZone: createForm.allowOutOfZone,
          bidDeadline: createForm.bidDeadline || undefined,
          location: createForm.location,
          images: parseImages(createForm.imagesText),
          internalNotes: createForm.internalNotes,
          customer: {
            email: createForm.customerEmail,
            firstName: createForm.customerFirstName || undefined,
            lastName: createForm.customerLastName || undefined
          }
        };

        const created = await createCustomJob(payload);
        setCreateMode(false);
        setCreateForm(defaultCreateForm);
        await loadJobs(created?.id);
        if (created?.id) {
          setSelectedJobId(created.id);
          await loadJobDetail(created.id);
        }
      } catch (caught) {
        console.error('Failed to create custom job', caught);
        setCreateError(caught instanceof Error ? caught.message : 'Unable to create custom job');
      } finally {
        setSaving(false);
      }
    },
    [createForm, loadJobs, loadJobDetail]
  );

  const submitUpdate = useCallback(
    async (event) => {
      event.preventDefault();
      if (!selectedJobId || !editForm) {
        return;
      }
      setSaving(true);
      setError(null);
      try {
        const updated = await updateCustomJob(selectedJobId, buildUpdatePayload(editForm));
        setSelectedJob(updated);
        setEditForm(createInitialEditForm(updated));
        await loadJobs(selectedJobId);
      } catch (caught) {
        console.error('Failed to update custom job', caught);
        setError(caught instanceof Error ? caught.message : 'Unable to update custom job');
      } finally {
        setSaving(false);
      }
    },
    [selectedJobId, editForm, loadJobs]
  );

  const awardBid = useCallback(
    async (bidId) => {
      if (!selectedJobId || !bidId) {
        return;
      }
      setSaving(true);
      try {
        const updated = await awardCustomJob(selectedJobId, bidId);
        setSelectedJob(updated);
        setEditForm(createInitialEditForm(updated));
        await loadJobs(selectedJobId);
      } catch (caught) {
        console.error('Failed to award custom job', caught);
        setError(caught instanceof Error ? caught.message : 'Unable to award job');
      } finally {
        setSaving(false);
      }
    },
    [selectedJobId, loadJobs]
  );

  const addAttachment = useCallback((bidId) => {
    if (!bidId) {
      return;
    }
    setMessageAttachments((current) => {
      const existing = current[bidId] ?? [];
      if (existing.length >= 5) {
        return current;
      }
      return { ...current, [bidId]: [...existing, createAttachmentDraft()] };
    });
  }, []);

  const updateAttachment = useCallback((bidId, attachmentId, field, value) => {
    setMessageAttachments((current) => {
      const existing = current[bidId] ?? [];
      return {
        ...current,
        [bidId]: existing.map((attachment) =>
          attachment.id === attachmentId ? { ...attachment, [field]: value } : attachment
        )
      };
    });
  }, []);

  const removeAttachment = useCallback((bidId, attachmentId) => {
    setMessageAttachments((current) => {
      const existing = current[bidId] ?? [];
      return { ...current, [bidId]: existing.filter((attachment) => attachment.id !== attachmentId) };
    });
  }, []);

  const setMessageDraft = useCallback((bidId, value) => {
    setMessageDrafts((current) => ({ ...current, [bidId]: value }));
  }, []);

  const sendMessage = useCallback(
    async (bidId) => {
      if (!selectedJobId || !bidId) {
        return;
      }
      const draft = messageDrafts[bidId] ?? '';
      if (!draft.trim()) {
        setMessageStatus((current) => ({ ...current, [bidId]: { status: 'error', message: 'Message cannot be empty.' } }));
        return;
      }

      setMessageStatus((current) => ({ ...current, [bidId]: { status: 'loading' } }));
      try {
        const attachments = (messageAttachments[bidId] ?? [])
          .map((attachment) => {
            const url = (attachment.url ?? '').trim();
            if (!url) {
              return null;
            }
            const label = (attachment.label ?? '').trim();
            return label ? { url, label } : { url };
          })
          .filter(Boolean);

        await sendAdminBidMessage(selectedJobId, bidId, { body: draft.trim(), attachments });
        const refreshed = await fetchCustomJob(selectedJobId);
        setSelectedJob(refreshed);
        setEditForm(createInitialEditForm(refreshed));
        setMessageDrafts((current) => ({ ...current, [bidId]: '' }));
        setMessageAttachments((current) => ({ ...current, [bidId]: [] }));
        setMessageStatus((current) => ({ ...current, [bidId]: { status: 'success' } }));
      } catch (caught) {
        console.error('Failed to send bid message', caught);
        setMessageStatus((current) => ({
          ...current,
          [bidId]: {
            status: 'error',
            message: caught instanceof Error ? caught.message : 'Unable to send message'
          }
        }));
      }
    },
    [selectedJobId, messageDrafts, messageAttachments]
  );

  const refreshJobs = useCallback(
    (preferredSelection) => {
      void loadJobs(preferredSelection);
    },
    [loadJobs]
  );

  const filterHelpers = useMemo(
    () => ({
      setStatus: (status) => setFilters((current) => ({ ...current, status })),
      setZone: (zoneId) => setFilters((current) => ({ ...current, zoneId })),
      reset: () => setFilters(defaultFilters)
    }),
    []
  );

  return {
    filters,
    filterHelpers,
    searchInput,
    setSearchInput,
    jobs,
    summary,
    loading,
    error,
    selectedJobId,
    selectedJob,
    detailLoading,
    zones,
    createMode,
    createForm,
    createError,
    editForm,
    saving,
    messageDrafts,
    messageStatus,
    messageAttachments,
    actions: {
      selectJob,
      openJobWindow,
      openCreate,
      cancelCreate,
      resetEditForm,
      refreshJobs
    },
    handlers: {
      updateCreateField,
      submitCreate,
      updateEditField,
      submitUpdate,
      awardBid,
      addAttachment,
      updateAttachment,
      removeAttachment,
      setMessageDraft,
      sendMessage
    }
  };
}
