import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../api/providerCustomJobsClient.js', () => ({
  __esModule: true,
  getProviderCustomJobWorkspace: vi.fn(),
  searchProviderJobOpportunities: vi.fn(),
  submitProviderJobBid: vi.fn(),
  updateProviderJobBid: vi.fn(),
  withdrawProviderJobBid: vi.fn(),
  sendProviderBidMessage: vi.fn(),
  createProviderCustomJobReport: vi.fn(),
  updateProviderCustomJobReport: vi.fn(),
  deleteProviderCustomJobReport: vi.fn(),
  createProviderCustomJob: vi.fn(),
  inviteProviderJobParticipant: vi.fn(),
  updateProviderJobInvitation: vi.fn()
}));

import { useProviderCustomJobs } from '../useProviderCustomJobs.js';
import {
  getProviderCustomJobWorkspace as getWorkspaceMock,
  searchProviderJobOpportunities as searchOpportunitiesMock,
  submitProviderJobBid as submitBidMock,
  updateProviderJobBid as updateBidMock,
  withdrawProviderJobBid as withdrawBidMock,
  sendProviderBidMessage as sendMessageMock,
  createProviderCustomJobReport as createReportMock,
  updateProviderCustomJobReport as updateReportMock,
  deleteProviderCustomJobReport as deleteReportMock,
  createProviderCustomJob as createJobMock,
  inviteProviderJobParticipant as inviteParticipantMock,
  updateProviderJobInvitation as updateInvitationMock
} from '../../../../api/providerCustomJobsClient.js';

const baseWorkspace = {
  company: { id: 'company-1', tradingName: 'ACME', region: 'North' },
  summary: { totalOpenJobs: 2, activeBids: 1, winRate: 0.25 },
  jobs: [],
  managedJobs: [],
  bids: [],
  reports: [],
  communications: { threads: [] },
  filters: { categories: [], zones: [] },
  invitations: [],
  resources: { roster: [] }
};

describe('useProviderCustomJobs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads workspace data on mount when autoLoad is enabled', async () => {
    getWorkspaceMock.mockResolvedValueOnce({ data: baseWorkspace });

    const { result } = renderHook(() => useProviderCustomJobs({ autoLoad: true }));

    await waitFor(() => expect(result.current.state.loading).toBe(false));
    expect(getWorkspaceMock).toHaveBeenCalledTimes(1);
    expect(result.current.state.workspace).toEqual(baseWorkspace);
    expect(result.current.summary.totalOpenJobs).toBe(2);
  });

  it('deletes a report and refreshes workspace state', async () => {
    const firstWorkspace = {
      ...baseWorkspace,
      reports: [{ id: 'report-1', name: 'Open bids', filters: {}, metrics: { totalBids: 1 } }]
    };
    const secondWorkspace = {
      ...baseWorkspace,
      reports: [{ id: 'report-2', name: 'Wins', filters: {}, metrics: { totalBids: 0 } }]
    };

    getWorkspaceMock
      .mockResolvedValueOnce({ data: firstWorkspace })
      .mockResolvedValueOnce({ data: secondWorkspace });
    deleteReportMock.mockResolvedValue({ id: 'report-1', deleted: true });

    const { result } = renderHook(() => useProviderCustomJobs({ autoLoad: true }));
    await waitFor(() => expect(result.current.state.loading).toBe(false));

    await act(async () => {
      const promise = result.current.deleteReport('report-1');
      expect(result.current.state.deletingReportId).toBe('report-1');
      await promise;
    });

    await waitFor(() => expect(getWorkspaceMock).toHaveBeenCalledTimes(2));
    expect(result.current.state.deletingReportId).toBe(null);
    expect(result.current.state.workspace.reports[0].id).toBe('report-2');
  });

  it('creates a custom job and refreshes the workspace', async () => {
    const initialWorkspace = { ...baseWorkspace };
    const refreshedWorkspace = {
      ...baseWorkspace,
      managedJobs: [{ id: 'job-1', title: 'Roof repair', status: 'open' }]
    };

    getWorkspaceMock
      .mockResolvedValueOnce({ data: initialWorkspace })
      .mockResolvedValueOnce({ data: refreshedWorkspace });
    createJobMock.mockResolvedValue({ id: 'job-1' });

    const { result } = renderHook(() => useProviderCustomJobs({ autoLoad: true }));
    await waitFor(() => expect(result.current.state.loading).toBe(false));

    await act(async () => {
      const promise = result.current.createJob({ title: 'Roof repair' });
      expect(result.current.state.creatingJob).toBe(true);
      await promise;
    });

    await waitFor(() => expect(getWorkspaceMock).toHaveBeenCalledTimes(2));
    expect(result.current.state.creatingJob).toBe(false);
    expect(result.current.state.workspace.managedJobs).toHaveLength(1);
  });

  it('invites a participant and refreshes managed jobs', async () => {
    const initialWorkspace = { ...baseWorkspace, managedJobs: [{ id: 'job-1', title: 'Roof repair' }] };
    const refreshedWorkspace = {
      ...initialWorkspace,
      invitations: [{ id: 'invite-1', postId: 'job-1', status: 'pending' }]
    };

    getWorkspaceMock
      .mockResolvedValueOnce({ data: initialWorkspace })
      .mockResolvedValueOnce({ data: refreshedWorkspace });
    inviteParticipantMock.mockResolvedValue({ id: 'invite-1' });

    const { result } = renderHook(() => useProviderCustomJobs({ autoLoad: true }));
    await waitFor(() => expect(result.current.state.loading).toBe(false));

    await act(async () => {
      const promise = result.current.inviteParticipant('job-1', { targetHandle: 'demo' });
      expect(result.current.state.invitingJobId).toBe('job-1');
      await promise;
    });

    await waitFor(() => expect(getWorkspaceMock).toHaveBeenCalledTimes(2));
    expect(result.current.state.invitingJobId).toBe(null);
    expect(result.current.state.workspace.invitations).toHaveLength(1);
  });

  it('updates an invitation and clears the loading flag', async () => {
    const initialWorkspace = {
      ...baseWorkspace,
      invitations: [{ id: 'invite-1', status: 'pending', postId: 'job-1' }]
    };
    const refreshedWorkspace = {
      ...initialWorkspace,
      invitations: [{ id: 'invite-1', status: 'accepted', postId: 'job-1' }]
    };

    getWorkspaceMock
      .mockResolvedValueOnce({ data: initialWorkspace })
      .mockResolvedValueOnce({ data: refreshedWorkspace });
    updateInvitationMock.mockResolvedValue({ id: 'invite-1', status: 'accepted' });

    const { result } = renderHook(() => useProviderCustomJobs({ autoLoad: true }));
    await waitFor(() => expect(result.current.state.loading).toBe(false));

    await act(async () => {
      const promise = result.current.updateInvitation('invite-1', { status: 'accepted' });
      expect(result.current.state.updatingInvitationId).toBe('invite-1');
      await promise;
    });

    await waitFor(() => expect(getWorkspaceMock).toHaveBeenCalledTimes(2));
    expect(result.current.state.updatingInvitationId).toBe(null);
    expect(result.current.state.workspace.invitations[0].status).toBe('accepted');
  });

  it('captures errors when updating an invitation fails', async () => {
    const initialWorkspace = {
      ...baseWorkspace,
      invitations: [{ id: 'invite-1', status: 'pending', postId: 'job-1' }]
    };

    getWorkspaceMock.mockResolvedValue({ data: initialWorkspace });
    updateInvitationMock.mockRejectedValueOnce(new Error('Unable to update'));

    const { result } = renderHook(() => useProviderCustomJobs({ autoLoad: true }));
    await waitFor(() => expect(result.current.state.loading).toBe(false));

    await act(async () => {
      await expect(result.current.updateInvitation('invite-1', { status: 'accepted' })).rejects.toThrow(
        'Unable to update'
      );
    });

    expect(result.current.state.updatingInvitationId).toBe(null);
    expect(result.current.state.error).toBeInstanceOf(Error);
    expect(result.current.state.error.message).toBe('Unable to update');
  });
});
