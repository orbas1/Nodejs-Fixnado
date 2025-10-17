import PropTypes from 'prop-types';
import useServicemanCustomJobs from './hooks/useServicemanCustomJobs.js';
import SummaryStats from './components/SummaryStats.jsx';
import JobFilters from './components/JobFilters.jsx';
import JobList from './components/JobList.jsx';
import JobDetail from './components/JobDetail.jsx';
import ReportsPanel from './components/ReportsPanel.jsx';

function BidBoard({ board }) {
  if (!board?.columns?.length) {
    return null;
  }
  return (
    <div className="rounded-3xl border border-accent/10 bg-white/95 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-primary">Snapshot board</h3>
      <p className="text-sm text-slate-500">Visualise where live bids sit today.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {board.columns.map((column) => (
          <div key={column.title} className="rounded-2xl border border-accent/10 bg-secondary/30 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-primary">{column.title}</p>
              <span className="text-xs text-slate-500">{column.items?.length ?? 0}</span>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-slate-600">
              {(column.items ?? []).slice(0, 4).map((item) => (
                <li key={item.title} className="rounded-xl bg-white/90 p-3 shadow-inner">
                  <p className="font-semibold text-primary">{item.title}</p>
                  <p>{item.owner}</p>
                  <p className="text-accent font-semibold">{item.value}</p>
                  <p className="text-slate-500">{item.eta}</p>
                </li>
              ))}
              {(column.items?.length ?? 0) > 4 ? (
                <li className="text-slate-500">{column.items.length - 4} more…</li>
              ) : null}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

BidBoard.propTypes = {
  board: PropTypes.shape({
    columns: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string.isRequired,
        items: PropTypes.arrayOf(
          PropTypes.shape({
            title: PropTypes.string.isRequired,
            owner: PropTypes.string,
            value: PropTypes.string,
            eta: PropTypes.string
          })
        )
      })
    )
  })
};

BidBoard.defaultProps = {
  board: null
};

export default function ServicemanCustomJobsWorkspace({ summary, board }) {
  const {
    filters,
    filterHelpers,
    searchInput,
    setSearchInput,
    jobs,
    summary: liveSummary,
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
    actions,
    handlers
  } = useServicemanCustomJobs({ initialSummary: summary, initialBoard: board });

  return (
    <div className="space-y-8">
      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-rose-600">
          <p className="font-semibold">{error}</p>
        </div>
      ) : null}
      <SummaryStats summary={{ ...summary, ...liveSummary }} />
      <JobFilters
        filters={filters}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        onStatusChange={filterHelpers.setStatus}
        onZoneChange={filterHelpers.setZone}
        zones={zones}
        onRefresh={actions.refresh}
      />
      <BidBoard board={boardSnapshot} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)]">
        <JobList jobs={jobs} selectedJobId={selectedJobId} onSelect={actions.selectJob} loading={loading} />
        <JobDetail
          job={selectedJob}
          bidForm={bidForm}
          messageForm={messageForm}
          detailLoading={detailLoading}
          actionState={actionState}
          messageStatus={messageStatus}
          onBidFieldChange={handlers.updateBidField}
          onAddBidAttachment={actions.addBidAttachment}
          onUpdateBidAttachment={actions.updateBidAttachment}
          onRemoveBidAttachment={actions.removeBidAttachment}
          onSubmitBid={handlers.submitBid}
          onWithdrawBid={actions.withdrawBid}
          onMessageFieldChange={handlers.updateMessageField}
          onAddMessageAttachment={actions.addMessageAttachment}
          onUpdateMessageAttachment={actions.updateMessageAttachment}
          onRemoveMessageAttachment={actions.removeMessageAttachment}
          onSendMessage={handlers.sendMessage}
        />
      </div>
      <ReportsPanel reports={reports} loading={reportsLoading} />
    </div>
  );
}

ServicemanCustomJobsWorkspace.propTypes = {
  summary: PropTypes.object,
  board: PropTypes.object
};

ServicemanCustomJobsWorkspace.defaultProps = {
  summary: null,
  board: null
};
