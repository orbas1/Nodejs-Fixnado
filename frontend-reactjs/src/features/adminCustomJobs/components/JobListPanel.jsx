import PropTypes from 'prop-types';
import clsx from 'clsx';
import { Card, Spinner } from '../../../components/ui/index.js';
import { formatCurrency, formatRelativeTime } from '../utils.js';
import StatusBadge from './StatusBadge.jsx';

export default function JobListPanel({ jobs, loading, selectedJobId, onSelect, emptyMessage }) {
  return (
    <Card padding="sm" className="bg-white/90">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h2 className="text-lg font-semibold text-primary">Live custom jobs</h2>
        {loading ? <Spinner className="h-5 w-5 text-primary" /> : null}
      </div>
      <div className="mt-4 space-y-2">
        {jobs.length === 0 && !loading ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            {emptyMessage}
          </div>
        ) : null}
        {jobs.map((job) => (
          <button
            key={job.id}
            type="button"
            onClick={() => onSelect(job.id)}
            className={clsx(
              'w-full rounded-2xl border px-4 py-4 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent',
              selectedJobId === job.id
                ? 'border-accent bg-accent/10'
                : 'border-slate-200 bg-white hover:border-accent/40 hover:bg-secondary/80'
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-primary">{job.title}</p>
                <p className="text-xs text-slate-500">{job.customer?.email || 'Customer assigned'}</p>
              </div>
              <StatusBadge status={job.status} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
              <div>
                <span className="font-semibold text-slate-600">Budget</span>
                <p className="mt-1 text-sm text-primary">{formatCurrency(job.budgetAmount, job.budgetCurrency)}</p>
              </div>
              <div>
                <span className="font-semibold text-slate-600">Bids</span>
                <p className="mt-1 text-sm text-primary">{job.bidCount ?? 0}</p>
              </div>
              <div>
                <span className="font-semibold text-slate-600">Messages</span>
                <p className="mt-1 text-sm text-primary">{job.messageCount ?? 0}</p>
              </div>
              <div>
                <span className="font-semibold text-slate-600">Updated</span>
                <p className="mt-1 text-sm text-primary">{formatRelativeTime(job.updatedAt || job.createdAt)}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}

JobListPanel.propTypes = {
  jobs: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool.isRequired,
  selectedJobId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelect: PropTypes.func.isRequired,
  emptyMessage: PropTypes.string
};

JobListPanel.defaultProps = {
  emptyMessage: 'No custom jobs match your filters yet.'
};
