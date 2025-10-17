import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  listServicemanCustomJobs,
  getServicemanCustomJob,
  getServicemanCustomJobReports,
  createServicemanCustomJobBid,
  updateServicemanCustomJobBid,
  withdrawServicemanCustomJobBid,
  sendServicemanCustomJobBidMessage
} from '../../../api/servicemanCustomJobsClient.js';
import {
  defaultFilters,
  defaultBidForm,
  defaultMessageForm,
  createAttachmentDraft
} from '../constants.js';

function createBidFormFromBid(bid) {
  if (!bid) {
    return { ...defaultBidForm };
  }

  return {
    amount: bid.amount != null ? String(bid.amount) : '',
    currency: bid.currency || 'GBP',
    message: bid.message || '',
    attachments: Array.isArray(bid.attachments)
      ? bid.attachments.map((attachment) => ({
          id: createAttachmentDraft().id,
          url: attachment.url || '',
          label: attachment.label || ''
        }))
      : []
  };
}

function createMessageState(bid) {
  const messages = Array.isArray(bid?.messages) ? bid.messages : [];
  const lastMessage = messages.length ? messages[messages.length - 1] : null;
  return {
    body: '',
    attachments: [],
    history: messages,
    lastAuthor: lastMessage?.author ?? null
  };
}

export function useServicemanCustomJobs({ initialSummary = null, initialBoard = null } = {}) {
  const [filters, setFilters] = useState(defaultFilters);
  const [searchInput, setSearchInput] = useState(defaultFilters.search);
  const [jobs, setJobs] = useState([]);
  const [summary, setSummary] = useState(initialSummary ?? {});
  const [boardSnapshot] = useState(initialBoard ?? null);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [bidForm, setBidForm] = useState({ ...defaultBidForm });
  const [messageForm, setMessageForm] = useState({ ...defaultMessageForm });
  const [messageStatus, setMessageStatus] = useState('idle');
  const [reports, setReports] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [actionState, setActionState] = useState({ state: 'idle', message: null });

  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters((current) => ({ ...current, search: searchInput }));
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const loadJobs = useCallback(
    async (preferredSelection) => {
      setLoading(true);
      setError(null);
      try {
        const payload = await listServicemanCustomJobs(filters);
        const list = Array.isArray(payload?.jobs) ? payload.jobs : [];
        setJobs(list);
        setSummary(payload?.summary ?? {});
        setZones(Array.isArray(payload?.zones) ? payload.zones : []);

        if (!preferredSelection) {
          const first = list[0]?.id ?? null;
          setSelectedJobId((current) => current ?? first);
        } else {
          setSelectedJobId(preferredSelection);
        }
      } catch (caught) {
        console.error('[ServicemanCustomJobs] Failed to load jobs', caught);
        setError(caught instanceof Error ? caught.message : 'Unable to load custom jobs');
        setJobs([]);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  const loadJobDetail = useCallback(
    async (jobId) => {
      if (!jobId) {
        setSelectedJob(null);
        setBidForm({ ...defaultBidForm });
        setMessageForm({ ...defaultMessageForm });
        return;
      }
      setDetailLoading(true);
      setError(null);
      try {
        const detail = await getServicemanCustomJob(jobId);
        setSelectedJob(detail);
        setBidForm(createBidFormFromBid(detail?.providerBid));
        setMessageForm(createMessageState(detail?.providerBid));
      } catch (caught) {
        console.error('[ServicemanCustomJobs] Failed to load job detail', caught);
        setError(caught instanceof Error ? caught.message : 'Unable to load job detail');
        setSelectedJob(null);
      } finally {
        setDetailLoading(false);
      }
    },
    []
  );

  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const payload = await getServicemanCustomJobReports();
      setReports(payload);
    } catch (caught) {
      console.warn('[ServicemanCustomJobs] Failed to load reports', caught);
      setReports(null);
    } finally {
      setReportsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs().catch((error) => console.error(error));
  }, [loadJobs]);

  useEffect(() => {
    if (selectedJobId) {
      loadJobDetail(selectedJobId).catch((error) => console.error(error));
    }
  }, [selectedJobId, loadJobDetail]);

  useEffect(() => {
    loadReports().catch((error) => console.error(error));
  }, [loadReports]);

  const refresh = useCallback(() => {
    loadJobs(selectedJobId).catch((error) => console.error(error));
    if (selectedJobId) {
      loadJobDetail(selectedJobId).catch((error) => console.error(error));
    }
    loadReports().catch((error) => console.error(error));
  }, [selectedJobId, loadJobs, loadJobDetail, loadReports]);

  const selectJob = useCallback((jobId) => {
    setSelectedJobId(jobId);
  }, []);

  const updateBidField = useCallback((field, value) => {
    setBidForm((current) => ({ ...current, [field]: value }));
  }, []);

  const addBidAttachment = useCallback(() => {
    setBidForm((current) => {
      if (current.attachments.length >= 5) {
        return current;
      }
      return {
        ...current,
        attachments: [...current.attachments, createAttachmentDraft()]
      };
    });
  }, []);

  const updateBidAttachment = useCallback((attachmentId, field, value) => {
    setBidForm((current) => ({
      ...current,
      attachments: current.attachments.map((attachment) =>
        attachment.id === attachmentId ? { ...attachment, [field]: value } : attachment
      )
    }));
  }, []);

  const removeBidAttachment = useCallback((attachmentId) => {
    setBidForm((current) => ({
      ...current,
      attachments: current.attachments.filter((attachment) => attachment.id !== attachmentId)
    }));
  }, []);

  const submitBid = useCallback(
    async (event) => {
      event.preventDefault();
      if (!selectedJobId) {
        return;
      }
      setActionState({ state: 'loading', message: null });
      try {
        const attachments = bidForm.attachments
          .map((attachment) => ({
            url: attachment.url?.trim(),
            label: attachment.label?.trim()
          }))
          .filter((attachment) => attachment.url);

        const payload = {
          amount: bidForm.amount ? Number.parseFloat(bidForm.amount) : undefined,
          currency: bidForm.currency,
          message: bidForm.message,
          attachments
        };

        if (selectedJob?.providerBid?.id) {
          await updateServicemanCustomJobBid(selectedJobId, selectedJob.providerBid.id, payload);
        } else {
          await createServicemanCustomJobBid(selectedJobId, payload);
        }

        await loadJobs(selectedJobId);
        await loadJobDetail(selectedJobId);
        setActionState({ state: 'success', message: 'Bid updated successfully' });
      } catch (caught) {
        console.error('[ServicemanCustomJobs] Failed to submit bid', caught);
        setActionState({
          state: 'error',
          message: caught instanceof Error ? caught.message : 'Unable to submit bid'
        });
      }
    },
    [selectedJobId, bidForm, selectedJob, loadJobs, loadJobDetail]
  );

  const withdrawBid = useCallback(
    async (reason = '') => {
      if (!selectedJobId || !selectedJob?.providerBid?.id) {
        return;
      }
      setActionState({ state: 'loading', message: null });
      try {
        await withdrawServicemanCustomJobBid(selectedJobId, selectedJob.providerBid.id, {
          reason: reason?.trim()
        });
        await loadJobs(selectedJobId);
        await loadJobDetail(selectedJobId);
        setActionState({ state: 'success', message: 'Bid withdrawn' });
      } catch (caught) {
        console.error('[ServicemanCustomJobs] Failed to withdraw bid', caught);
        setActionState({
          state: 'error',
          message: caught instanceof Error ? caught.message : 'Unable to withdraw bid'
        });
      }
    },
    [selectedJobId, selectedJob, loadJobs, loadJobDetail]
  );

  const updateMessageField = useCallback((field, value) => {
    setMessageForm((current) => ({ ...current, [field]: value }));
  }, []);

  const addMessageAttachment = useCallback(() => {
    setMessageForm((current) => {
      if (current.attachments.length >= 5) {
        return current;
      }
      return {
        ...current,
        attachments: [...current.attachments, createAttachmentDraft()]
      };
    });
  }, []);

  const updateMessageAttachment = useCallback((attachmentId, field, value) => {
    setMessageForm((current) => ({
      ...current,
      attachments: current.attachments.map((attachment) =>
        attachment.id === attachmentId ? { ...attachment, [field]: value } : attachment
      )
    }));
  }, []);

  const removeMessageAttachment = useCallback((attachmentId) => {
    setMessageForm((current) => ({
      ...current,
      attachments: current.attachments.filter((attachment) => attachment.id !== attachmentId)
    }));
  }, []);

  const sendMessage = useCallback(
    async () => {
      if (!selectedJobId || !selectedJob?.providerBid?.id) {
        return;
      }
      const trimmed = messageForm.body.trim();
      if (!trimmed) {
        setMessageStatus('error');
        return;
      }
      setMessageStatus('loading');
      try {
        const attachments = messageForm.attachments
          .map((attachment) => ({
            url: attachment.url?.trim(),
            label: attachment.label?.trim()
          }))
          .filter((attachment) => attachment.url);

        await sendServicemanCustomJobBidMessage(selectedJobId, selectedJob.providerBid.id, {
          body: trimmed,
          attachments
        });
        await loadJobDetail(selectedJobId);
        setMessageForm({ ...defaultMessageForm, history: selectedJob?.providerBid?.messages ?? [] });
        setMessageStatus('success');
      } catch (caught) {
        console.error('[ServicemanCustomJobs] Failed to send message', caught);
        setMessageStatus('error');
      }
    },
    [selectedJobId, selectedJob, messageForm, loadJobDetail]
  );

  const filterHelpers = useMemo(
    () => ({
      setStatus: (status) => setFilters((current) => ({ ...current, status })),
      setZone: (zoneId) => setFilters((current) => ({ ...current, zoneId })),
      reset: () => {
        setFilters(defaultFilters);
        setSearchInput(defaultFilters.search);
      }
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
    boardSnapshot,
    zones,
    loading,
    error,
    selectedJobId,
    selectedJob,
    detailLoading,
    bidForm,
    messageForm,
    messageStatus,
    reports,
    reportsLoading,
    actionState,
    actions: {
      refresh,
      selectJob,
      addBidAttachment,
      updateBidAttachment,
      removeBidAttachment,
      addMessageAttachment,
      updateMessageAttachment,
      removeMessageAttachment,
      withdrawBid
    },
    handlers: {
      updateBidField,
      submitBid,
      updateMessageField,
      sendMessage
    }
  };
}

export default useServicemanCustomJobs;
