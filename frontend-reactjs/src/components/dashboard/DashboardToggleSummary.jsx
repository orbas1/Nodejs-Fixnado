import PropTypes from 'prop-types';

const stateBadgeMap = {
  enabled: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pilot: 'bg-amber-100 text-amber-700 border-amber-200',
  staging: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  disabled: 'bg-slate-100 text-slate-600 border-slate-200',
  sunset: 'bg-rose-100 text-rose-700 border-rose-200'
};

const formatToggleDate = (iso) => {
  if (!iso) return '—';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }
  return parsed.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const DashboardToggleSummary = ({ toggle = null, reason = null }) => {
  if (!toggle) {
    return null;
  }

  const badgeClass = stateBadgeMap[toggle.state] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  const parsedRollout = Number.parseFloat(toggle.rollout ?? 0);
  const rolloutValue = Number.isFinite(parsedRollout) ? parsedRollout : 0;

  return (
    <div className="mt-4 max-w-md rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm" data-qa="dashboard-toggle-summary">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Feature toggle</p>
          <p className="text-sm font-semibold text-slate-900">analytics-dashboards</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${badgeClass}`} data-qa="dashboard-toggle-chip">
          {toggle.state ?? 'unknown'}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-500">
        <div>
          <dt className="font-medium text-slate-600">Owner</dt>
          <dd className="mt-1" data-qa="dashboard-toggle-owner">
            {toggle.owner || '—'}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-600">Ticket</dt>
          <dd className="mt-1" data-qa="dashboard-toggle-ticket">
            {toggle.ticket || '—'}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-600">Last modified</dt>
          <dd className="mt-1" data-qa="dashboard-toggle-modified">
            {formatToggleDate(toggle.lastModifiedAt)}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-600">Rollout</dt>
          <dd className="mt-1" data-qa="dashboard-toggle-rollout">
            {Math.round(rolloutValue * 100)}%
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="font-medium text-slate-600">Reason</dt>
          <dd className="mt-1 capitalize" data-qa="dashboard-toggle-reason">
            {reason?.replace('-', ' ') || 'enabled'}
          </dd>
        </div>
      </dl>
    </div>
  );
};

DashboardToggleSummary.propTypes = {
  toggle: PropTypes.shape({
    state: PropTypes.string,
    rollout: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    owner: PropTypes.string,
    ticket: PropTypes.string,
    lastModifiedAt: PropTypes.string
  }),
  reason: PropTypes.string
};

DashboardToggleSummary.defaultProps = {
  toggle: null,
  reason: null
};

export default DashboardToggleSummary;
