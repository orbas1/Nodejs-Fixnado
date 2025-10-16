import { useMemo } from 'react';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import PageHeader from '../../components/blueprints/PageHeader.jsx';
import { Card, Spinner, StatusPill } from '../../components/ui/index.js';
import { useAdminCustomJobs } from './hooks/useAdminCustomJobs.js';
import SummaryCards from './components/SummaryCards.jsx';
import JobFilters from './components/JobFilters.jsx';
import JobListPanel from './components/JobListPanel.jsx';
import JobCreatePanel from './components/JobCreatePanel.jsx';
import JobDetailPanel from './components/JobDetailPanel.jsx';
import { buildMeta } from './utils.js';

export default function AdminCustomJobsPage() {
  const {
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
    actions,
    handlers
  } = useAdminCustomJobs();

  const headerActions = useMemo(
    () => [
      {
        label: 'New custom job',
        variant: 'primary',
        icon: PlusIcon,
        onClick: actions.openCreate
      },
      {
        label: 'Refresh jobs',
        variant: 'secondary',
        icon: ArrowPathIcon,
        onClick: () => actions.refreshJobs(selectedJobId)
      }
    ],
    [actions, selectedJobId]
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        eyebrow="Admin Control Tower"
        title="Custom Job Management"
        description="Track bespoke work requests, negotiations, and awards across Fixnado."
        breadcrumbs={[
          { label: 'Admin', to: '/admin/dashboard' },
          { label: 'Custom jobs' }
        ]}
        actions={headerActions}
        meta={buildMeta(summary)}
      />

      <div className="mx-auto max-w-7xl px-6 py-10 space-y-8">
        <SummaryCards summary={summary} />

        <JobFilters
          filters={filters}
          onStatusChange={filterHelpers.setStatus}
          onZoneChange={filterHelpers.setZone}
          zones={zones}
          searchInput={searchInput}
          onSearchChange={setSearchInput}
        />

        {error ? (
          <div className="mb-6">
            <StatusPill tone="danger" icon={ExclamationTriangleIcon}>
              {error}
            </StatusPill>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
          <JobListPanel
            jobs={jobs}
            loading={loading}
            selectedJobId={selectedJobId}
            onSelect={actions.selectJob}
          />

          <div className="space-y-6">
            {createMode ? (
              <JobCreatePanel
                createForm={createForm}
                createError={createError}
                zones={zones}
                saving={saving}
                onFieldChange={handlers.updateCreateField}
                onSubmit={handlers.submitCreate}
                onCancel={actions.cancelCreate}
              />
            ) : null}

            {!createMode && selectedJob ? (
              <JobDetailPanel
                job={selectedJob}
                editForm={editForm}
                zones={zones}
                saving={saving}
                onFieldChange={handlers.updateEditField}
                onSubmit={handlers.submitUpdate}
                onReset={actions.resetEditForm}
                onOpenWindow={actions.openJobWindow}
                onAward={handlers.awardBid}
                messageDrafts={messageDrafts}
                messageStatus={messageStatus}
                messageAttachments={messageAttachments}
                onDraftChange={handlers.setMessageDraft}
                onAddAttachment={handlers.addAttachment}
                onAttachmentChange={handlers.updateAttachment}
                onRemoveAttachment={handlers.removeAttachment}
                onSendMessage={handlers.sendMessage}
              />
            ) : null}

            {!createMode && !selectedJob && !detailLoading ? (
              <Card className="bg-white/95">
                <div className="flex flex-col items-center gap-3 p-8 text-center">
                  <h3 className="text-lg font-semibold text-primary">Select a custom job</h3>
                  <p className="text-sm text-slate-500">
                    Choose a job from the list to manage bids, send messages, and update scheduling details.
                  </p>
                </div>
              </Card>
            ) : null}

            {detailLoading && !createMode ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <Spinner className="h-6 w-6 text-primary" />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
