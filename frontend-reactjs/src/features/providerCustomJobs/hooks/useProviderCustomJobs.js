import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getProviderCustomJobWorkspace,
  searchProviderJobOpportunities,
  submitProviderJobBid,
  updateProviderJobBid,
  withdrawProviderJobBid,
  sendProviderBidMessage,
  createProviderCustomJobReport,
  updateProviderCustomJobReport,
  deleteProviderCustomJobReport,
  createProviderCustomJob,
  inviteProviderJobParticipant,
  updateProviderJobInvitation
} from '../../../api/providerCustomJobsClient.js';

function normaliseFilters(filters = {}) {
  return {
    search: filters.search ?? '',
    zoneId: filters.zoneId ?? '',
    category: filters.category ?? ''
  };
}

export function useProviderCustomJobs({ autoLoad = true, initialFilters = {} } = {}) {
  const [state, setState] = useState({
    loading: Boolean(autoLoad),
    workspace: null,
    opportunities: [],
    pagination: { total: 0, limit: 20, offset: 0 },
    filters: normaliseFilters(initialFilters),
    error: null,
    loadingOpportunities: false,
    savingBid: false,
    updatingBidId: null,
    withdrawingBidId: null,
    messagingBidId: null,
    savingReport: false,
    deletingReportId: null,
    creatingJob: false,
    invitingJobId: null,
    updatingInvitationId: null
  });
  const abortRef = useRef(null);

  const abortOngoing = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const loadWorkspace = useCallback(
    async (filters = {}) => {
      abortOngoing();
      const controller = new AbortController();
      abortRef.current = controller;
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const payload = await getProviderCustomJobWorkspace({ ...filters }, { signal: controller.signal });
        setState((current) => ({
          ...current,
          loading: false,
          workspace: payload?.data ?? null,
          filters: normaliseFilters(filters),
          error: null
        }));
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }
        setState((current) => ({ ...current, loading: false, error }));
      }
    },
    [abortOngoing]
  );

  useEffect(() => {
    if (autoLoad) {
      loadWorkspace(initialFilters);
    }
    return () => abortOngoing();
  }, [autoLoad, initialFilters, loadWorkspace, abortOngoing]);

  const searchOpportunities = useCallback(async (filters = {}, options = {}) => {
    const { signal } = options;
    setState((current) => ({
      ...current,
      error: null,
      filters: normaliseFilters(filters),
      loadingOpportunities: true
    }));
    try {
      const result = await searchProviderJobOpportunities({ ...filters }, { signal });
      setState((current) => ({
        ...current,
        opportunities: Array.isArray(result?.jobs) ? result.jobs : [],
        pagination: result?.pagination ?? { total: 0, limit: 20, offset: 0 },
        error: null,
        loadingOpportunities: false
      }));
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }
      setState((current) => ({ ...current, error, loadingOpportunities: false }));
    }
  }, []);

  const refreshWorkspace = useCallback(async () => {
    await loadWorkspace(state.filters);
  }, [loadWorkspace, state.filters]);

  const handleSubmitBid = useCallback(
    async (postId, payload) => {
      setState((current) => ({ ...current, savingBid: true, error: null }));
      try {
        const bid = await submitProviderJobBid(postId, payload);
        await refreshWorkspace();
        return bid;
      } catch (error) {
        setState((current) => ({ ...current, error }));
        throw error;
      } finally {
        setState((current) => ({ ...current, savingBid: false }));
      }
    },
    [refreshWorkspace]
  );

  const handleUpdateBid = useCallback(
    async (bidId, payload) => {
      setState((current) => ({ ...current, updatingBidId: bidId, error: null }));
      try {
        const bid = await updateProviderJobBid(bidId, payload);
        await refreshWorkspace();
        return bid;
      } catch (error) {
        setState((current) => ({ ...current, error }));
        throw error;
      } finally {
        setState((current) => ({ ...current, updatingBidId: null }));
      }
    },
    [refreshWorkspace]
  );

  const handleWithdrawBid = useCallback(
    async (bidId) => {
      setState((current) => ({ ...current, withdrawingBidId: bidId, error: null }));
      try {
        const result = await withdrawProviderJobBid(bidId);
        await refreshWorkspace();
        return result;
      } catch (error) {
        setState((current) => ({ ...current, error }));
        throw error;
      } finally {
        setState((current) => ({ ...current, withdrawingBidId: null }));
      }
    },
    [refreshWorkspace]
  );

  const handleSendMessage = useCallback(
    async (bidId, payload) => {
      setState((current) => ({ ...current, messagingBidId: bidId, error: null }));
      try {
        const result = await sendProviderBidMessage(bidId, payload);
        await refreshWorkspace();
        return result;
      } catch (error) {
        setState((current) => ({ ...current, error }));
        throw error;
      } finally {
        setState((current) => ({ ...current, messagingBidId: null }));
      }
    },
    [refreshWorkspace]
  );

  const handleCreateJob = useCallback(
    async (payload) => {
      setState((current) => ({ ...current, creatingJob: true, error: null }));
      try {
        const job = await createProviderCustomJob(payload);
        await refreshWorkspace();
        return job;
      } catch (error) {
        setState((current) => ({ ...current, error }));
        throw error;
      } finally {
        setState((current) => ({ ...current, creatingJob: false }));
      }
    },
    [refreshWorkspace]
  );

  const handleInviteParticipant = useCallback(
    async (postId, payload) => {
      setState((current) => ({ ...current, invitingJobId: postId, error: null }));
      try {
        const invitation = await inviteProviderJobParticipant(postId, payload);
        await refreshWorkspace();
        return invitation;
      } catch (error) {
        setState((current) => ({ ...current, error }));
        throw error;
      } finally {
        setState((current) => ({ ...current, invitingJobId: null }));
      }
    },
    [refreshWorkspace]
  );

  const handleUpdateInvitation = useCallback(
    async (invitationId, payload) => {
      setState((current) => ({ ...current, updatingInvitationId: invitationId, error: null }));
      try {
        const invitation = await updateProviderJobInvitation(invitationId, payload);
        await refreshWorkspace();
        return invitation;
      } catch (error) {
        setState((current) => ({ ...current, error }));
        throw error;
      } finally {
        setState((current) => ({ ...current, updatingInvitationId: null }));
      }
    },
    [refreshWorkspace]
  );

  const handleCreateReport = useCallback(
    async (payload) => {
      setState((current) => ({ ...current, savingReport: true, error: null }));
      try {
        const report = await createProviderCustomJobReport(payload);
        await refreshWorkspace();
        return report;
      } catch (error) {
        setState((current) => ({ ...current, error }));
        throw error;
      } finally {
        setState((current) => ({ ...current, savingReport: false }));
      }
    },
    [refreshWorkspace]
  );

  const handleUpdateReport = useCallback(
    async (reportId, payload) => {
      setState((current) => ({ ...current, savingReport: true, error: null }));
      try {
        const report = await updateProviderCustomJobReport(reportId, payload);
        await refreshWorkspace();
        return report;
      } catch (error) {
        setState((current) => ({ ...current, error }));
        throw error;
      } finally {
        setState((current) => ({ ...current, savingReport: false }));
      }
    },
    [refreshWorkspace]
  );

  const handleDeleteReport = useCallback(
    async (reportId) => {
      setState((current) => ({ ...current, deletingReportId: reportId, error: null }));
      try {
        const result = await deleteProviderCustomJobReport(reportId);
        await refreshWorkspace();
        return result;
      } catch (error) {
        setState((current) => ({ ...current, error }));
        throw error;
      } finally {
        setState((current) => ({ ...current, deletingReportId: null }));
      }
    },
    [refreshWorkspace]
  );

  const summary = useMemo(() => state.workspace?.summary ?? {}, [state.workspace]);
  const communications = useMemo(() => state.workspace?.communications?.threads ?? [], [state.workspace]);

  return {
    state,
    summary,
    communications,
    loadWorkspace,
    refreshWorkspace,
    searchOpportunities,
    submitBid: handleSubmitBid,
    updateBid: handleUpdateBid,
    withdrawBid: handleWithdrawBid,
    sendMessage: handleSendMessage,
    createReport: handleCreateReport,
    updateReport: handleUpdateReport,
    deleteReport: handleDeleteReport,
    createJob: handleCreateJob,
    inviteParticipant: handleInviteParticipant,
    updateInvitation: handleUpdateInvitation
  };
}

export default useProviderCustomJobs;
