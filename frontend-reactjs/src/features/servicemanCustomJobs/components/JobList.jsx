import PropTypes from 'prop-types';
import clsx from 'clsx';
import { Button } from '../../../components/ui/index.js';

function formatCurrency(value, currency) {
  if (!Number.isFinite(value)) {
    return '—';
  }
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'GBP' }).format(value);
  } catch {
    return `${currency || 'GBP'} ${value.toFixed(2)}`;
  }
}

export default function JobList({ jobs, selectedJobId, onSelect, loading }) {
  if (loading) {
    return (
      <div className="rounded-3xl border border-accent/10 bg-white/90 p-6 shadow-sm">
        <p className="text-sm text-slate-500">Loading custom jobs…</p>
      </div>
    );
  }

  if (!jobs.length) {
    return (
      <div className="rounded-3xl border border-accent/10 bg-white/90 p-6 shadow-sm">
        <p className="text-sm text-slate-500">No custom jobs match your filters yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => {
        const isActive = job.id === selectedJobId;
        const budgetLabel = job.budgetLabel ? `${job.budgetLabel}` : formatCurrency(job.budgetAmount, job.budgetCurrency);
        const statusLabel = job.providerBid?.status || job.status;
        const lastUpdated = formatRelativeTime(job.lastActivityAt);

        return (
          <button
            key={job.id}
            type="button"
            onClick={() => onSelect(job.id)}
            className={clsx(
              'w-full rounded-3xl border p-5 text-left shadow-sm transition hover:border-accent/50',
              isActive
                ? 'border-accent bg-accent/5 text-primary shadow-md'
                : 'border-accent/10 bg-white/90 text-slate-700'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-primary">{job.title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{statusLabel}</p>
              </div>
              <div className="text-right text-sm text-slate-500">
                <p>{budgetLabel}</p>
                <p className="text-xs">Updated {lastUpdated}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              {job.zone?.name ? (
                <span className="rounded-full bg-secondary px-3 py-1 font-semibold text-primary/80">
                  Zone • {job.zone.name}
                </span>
              ) : null}
              <span className="rounded-full bg-secondary px-3 py-1 font-semibold text-primary/80">
                {job.totalBids} bids · {job.pendingBids} pending
              </span>
              {job.providerBid ? (
                <span className="rounded-full bg-secondary px-3 py-1 font-semibold text-primary/80">
                  Your bid • {formatCurrency(job.providerBid.amount, job.providerBid.currency)}
                </span>
              ) : (
                <span className="rounded-full bg-secondary px-3 py-1 font-semibold text-primary/80">
                  No bid submitted
                </span>
              )}
            </div>
          </button>
        );
      })}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => onSelect(null)}>
          Clear selection
        </Button>
      </div>
    </div>
  );
}

JobList.propTypes = {
  jobs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      status: PropTypes.string,
      budgetLabel: PropTypes.string,
      budgetAmount: PropTypes.number,
      budgetCurrency: PropTypes.string,
      zone: PropTypes.shape({ id: PropTypes.string, name: PropTypes.string }),
      totalBids: PropTypes.number,
      pendingBids: PropTypes.number,
      providerBid: PropTypes.shape({
        id: PropTypes.string,
        status: PropTypes.string,
        amount: PropTypes.number,
        currency: PropTypes.string
      }),
      lastActivityAt: PropTypes.string
    })
  ),
  selectedJobId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

JobList.defaultProps = {
  jobs: [],
  selectedJobId: null,
  loading: false
};
function formatRelativeTime(timestamp) {
  if (!timestamp) {
    return '—';
  }
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes === 1 ? '' : 's'} ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
}
