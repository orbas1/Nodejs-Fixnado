import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardShell from '../../components/dashboard/DashboardShell.jsx';
import DashboardRoleGuard from '../../components/dashboard/DashboardRoleGuard.jsx';
import useSession from '../../hooks/useSession.js';
import useRoleAccess from '../../hooks/useRoleAccess.js';
import { DASHBOARD_ROLES } from '../../constants/dashboardConfig.js';
import Spinner from '../../components/ui/Spinner.jsx';
import SummaryCards from './components/SummaryCards.jsx';
import OpportunitiesTable from './components/OpportunitiesTable.jsx';
import BidFormModal from './components/BidFormModal.jsx';
import BidManagementPanel from './components/BidManagementPanel.jsx';
import ReportManager from './components/ReportManager.jsx';
import CommunicationsPanel from './components/CommunicationsPanel.jsx';
import CustomJobComposer from './components/CustomJobComposer.jsx';
import ManagedJobsPanel from './components/ManagedJobsPanel.jsx';
import InvitationManager from './components/InvitationManager.jsx';
import { useProviderCustomJobs } from './hooks/useProviderCustomJobs.js';

export default function ProviderCustomJobsPage() {
  const session = useSession();
  const { role, hasAccess } = useRoleAccess(['provider'], { allowFallbackRoles: ['admin'] });
  const providerRoleMeta = useMemo(() => DASHBOARD_ROLES.find((item) => item.id === 'provider'), []);

  const {
    state,
    summary,
    communications,
    refreshWorkspace,
    searchOpportunities,
    submitBid,
    updateBid,
    withdrawBid,
    sendMessage,
    createReport,
    updateReport,
    deleteReport,
    createJob,
    inviteParticipant,
    updateInvitation
  } = useProviderCustomJobs({ autoLoad: true });

  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [editingBid, setEditingBid] = useState(null);

  useEffect(() => {
    if (state.workspace?.company?.tradingName && document.title.indexOf('Custom jobs') === -1) {
      document.title = `${state.workspace.company.tradingName} • Custom job control centre`;
    }
  }, [state.workspace?.company?.tradingName]);

  if (!session.isAuthenticated) {
    return <Navigate to="/login" replace state={{ redirectTo: '/provider/custom-jobs' }} />;
  }

  const allowDashboard = session.dashboards.includes('provider');
  if (!hasAccess || !allowDashboard) {
    return <DashboardRoleGuard roleMeta={providerRoleMeta} sessionRole={role || session.role} />;
  }

  const navigation = useMemo(
    () => [
      { id: 'provider-custom-jobs-summary', label: 'Overview', description: 'Summary metrics for custom jobs.' },
      { id: 'provider-custom-jobs-managed', label: 'Managed jobs', description: 'Jobs your team created for clients and crews.' },
      { id: 'provider-custom-jobs-opportunities', label: 'Opportunities', description: 'Filter and bid on live briefs.' },
      { id: 'provider-custom-jobs-bids', label: 'Bid management', description: 'Track bid status and outcomes.' },
      { id: 'provider-custom-jobs-reports', label: 'Reports', description: 'Saved insights and analytics.' },
      { id: 'provider-custom-jobs-communications', label: 'Communication hub', description: 'Conversations with buyers.' },
      { id: 'provider-custom-jobs-invitations', label: 'Invitations', description: 'Track invitations sent to users and crew.' }
    ],
    []
  );

  const company = state.workspace?.company ?? {};
  const jobs = state.opportunities.length ? state.opportunities : state.workspace?.jobs ?? [];
  const managedJobs = state.workspace?.managedJobs ?? [];
  const invitations = state.workspace?.invitations ?? [];
  const roster = state.workspace?.resources?.roster ?? [];

  const handleOpenBidModal = (job) => {
    setSelectedJob(job);
    setEditingBid(null);
    setShowBidModal(true);
  };

  const handleEditBid = (bid) => {
    setEditingBid(bid);
    setSelectedJob(bid.job ?? null);
    setShowBidModal(true);
  };

  const handleCloseBidModal = () => {
    setShowBidModal(false);
    setSelectedJob(null);
    setEditingBid(null);
  };

  const handleSubmitBid = async (payload) => {
    if (editingBid) {
      await updateBid(editingBid.id, payload);
    } else if (selectedJob) {
      await submitBid(selectedJob.id, payload);
    }
    handleCloseBidModal();
  };

  const handleCreateCustomJob = async (payload) => {
    await createJob(payload);
  };

  const handleInviteParticipant = async (postId, payload) => {
    await inviteParticipant(postId, payload);
  };

  const handleUpdateInvitation = async (invitationId, payload) => {
    await updateInvitation(invitationId, payload);
  };

  return (
    <div data-qa="provider-custom-jobs">
      <DashboardShell
        eyebrow="Provider control centre"
        title={company.tradingName || 'Custom job operations'}
        subtitle={company.region ? `Operating region: ${company.region}` : undefined}
        navigation={navigation}
        sidebar={{
          eyebrow: 'Custom job studio',
          title: company.tradingName || 'Provider',
          description: 'Bid, negotiate, and report on bespoke engagements in one workspace.',
          meta: [
            { label: 'Open jobs', value: summary.totalOpenJobs ?? 0 },
            { label: 'Managed jobs', value: summary.managedJobs ?? 0 },
            { label: 'Active bids', value: summary.activeBids ?? 0 },
            {
              label: 'Win rate',
              value: summary.winRate != null ? `${Math.round((summary.winRate || 0) * 100)}%` : '—'
            },
            { label: 'Pending invites', value: summary.pendingInvitations ?? 0 }
          ],
          extra: null
        }}
      >
        {state.loading && !state.workspace ? (
          <div className="flex min-h-[30vh] items-center justify-center" role="status">
            <Spinner className="h-8 w-8 text-primary" />
          </div>
        ) : null}

        <section id="provider-custom-jobs-summary" className="space-y-6">
          <SummaryCards summary={summary} loading={state.loading} onRefresh={refreshWorkspace} />
          <CustomJobComposer
            zones={state.workspace?.filters?.zones ?? []}
            roster={roster}
            submitting={state.creatingJob}
            onSubmit={handleCreateCustomJob}
          />
        </section>

        <section id="provider-custom-jobs-managed" className="mt-8">
          <ManagedJobsPanel
            jobs={managedJobs}
            invitations={invitations}
            roster={roster}
            loading={state.loading}
            invitingJobId={state.invitingJobId}
            onInvite={handleInviteParticipant}
          />
        </section>

        <OpportunitiesTable
          jobs={jobs}
          loading={state.loadingOpportunities}
          filters={state.filters}
          categories={state.workspace?.filters?.categories ?? []}
          zones={state.workspace?.filters?.zones ?? []}
          onFilterChange={searchOpportunities}
          onBid={handleOpenBidModal}
          onPreview={(job) => handleOpenBidModal(job)}
        />

        <BidManagementPanel
          bids={state.workspace?.bids ?? []}
          loading={state.loading}
          updatingBidId={state.updatingBidId}
          withdrawingBidId={state.withdrawingBidId}
          onEditBid={handleEditBid}
          onWithdrawBid={(bid) => withdrawBid(bid.id)}
        />

        <ReportManager
          reports={state.workspace?.reports ?? []}
          filters={state.workspace?.filters ?? { zones: [], categories: [] }}
          loading={state.loading}
          savingReport={state.savingReport}
          deletingReportId={state.deletingReportId}
          onCreate={createReport}
          onUpdate={updateReport}
          onDelete={deleteReport}
        />

        <CommunicationsPanel
          threads={communications}
          loading={state.loading}
          messagingBidId={state.messagingBidId}
          onSendMessage={sendMessage}
        />

        <section id="provider-custom-jobs-invitations" className="mt-8">
          <InvitationManager
            invitations={invitations}
            roster={roster}
            loading={state.loading}
            updatingInvitationId={state.updatingInvitationId}
            onUpdate={handleUpdateInvitation}
          />
        </section>
      </DashboardShell>

      <BidFormModal
        open={showBidModal}
        job={selectedJob}
        mode={editingBid ? 'edit' : 'create'}
        initialValues={editingBid ? editingBid : { currency: 'GBP', attachments: [] }}
        onClose={handleCloseBidModal}
        onSubmit={handleSubmitBid}
        submitting={state.savingBid || state.updatingBidId === editingBid?.id}
      />
    </div>
  );
}
