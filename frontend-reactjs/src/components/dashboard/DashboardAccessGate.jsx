import PropTypes from 'prop-types';
import { ShieldExclamationIcon, ArrowPathIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const stateCopy = {
  disabled: {
    title: 'Analytics dashboards are not yet enabled for this workspace',
    body: 'Your organisation has not been provisioned for the governed analytics workspace. Request access so we can align rollout approvals, compliance evidence, and telemetry rehearsals before enabling the explore.'
  },
  sunset: {
    title: 'This analytics workspace has been sunset',
    body: 'The dashboard is no longer available because the feature toggle has been retired. Review the analytics runbook for successor explores or contact analytics ops if this is unexpected.'
  },
  pilot: {
    title: 'You are not yet part of the pilot cohort',
    body: 'The analytics workspace is in controlled rollout. Add your organisation to the pilot request so we can allocate the correct Looker explores, QA coverage, and support cadence.'
  },
  staging: {
    title: 'Dashboard limited to staging environments',
    body: 'This explore is restricted to staging. Switch to the staging stack or request a production promotion after the analytics rehearsal is complete.'
  }
};

const formatState = (state) => {
  if (!state) return 'unknown';
  return state.replace(/_/g, ' ');
};

const formatDate = (iso) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const DashboardAccessGate = ({
  roleMeta = null,
  toggle = null,
  reason = null,
  cohort = null,
  onRetry = () => {},
}) => {
  const copy = stateCopy[toggle?.state] ?? stateCopy.disabled;
  const rollout = toggle?.rollout != null ? Math.round(Number(toggle.rollout) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm" data-qa="dashboard-access-gate">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <ShieldExclamationIcon className="h-7 w-7" aria-hidden="true" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-amber-500">Access pending</p>
                <h1 className="text-2xl font-semibold text-slate-900">{copy.title}</h1>
                <p className="text-sm text-slate-600">{copy.body}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2" data-qa="dashboard-access-metadata">
                <div className="rounded-2xl border border-white/70 bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Feature toggle</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">analytics-dashboards</p>
                  <dl className="mt-3 space-y-1 text-xs text-slate-500">
                    <div className="flex items-center justify-between">
                      <dt className="font-medium text-slate-600">State</dt>
                      <dd className="capitalize" data-qa="dashboard-toggle-state">{formatState(toggle?.state)}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="font-medium text-slate-600">Rollout</dt>
                      <dd data-qa="dashboard-toggle-rollout">{rollout}%</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="font-medium text-slate-600">Owner</dt>
                      <dd>{toggle?.owner || '—'}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="font-medium text-slate-600">Ticket</dt>
                      <dd>{toggle?.ticket || '—'}</dd>
                    </div>
                  </dl>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Last change</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(toggle?.lastModifiedAt)}</p>
                  <dl className="mt-3 space-y-1 text-xs text-slate-500">
                    <div className="flex items-center justify-between">
                      <dt className="font-medium text-slate-600">Changed by</dt>
                      <dd>{toggle?.lastModifiedBy || '—'}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="font-medium text-slate-600">Reason</dt>
                      <dd className="capitalize">{reason?.replace('-', ' ') || 'pending'}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="font-medium text-slate-600">Cohort assignment</dt>
                      <dd>{cohort != null ? cohort.toFixed(4) : '—'}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="font-medium text-slate-600">Workspace</dt>
                      <dd>{roleMeta?.name ?? '—'}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center" data-qa="dashboard-access-actions">
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-amber-950 shadow hover:bg-amber-400"
                >
                  <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
                  Check toggle status again
                </button>
                <a
                  href="mailto:analytics-ops@fixnado.com?subject=Dashboard%20access%20request"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:border-amber-400 hover:text-amber-600"
                  data-qa="dashboard-access-request"
                >
                  <EnvelopeIcon className="h-4 w-4" aria-hidden="true" />
                  Request pilot access
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

DashboardAccessGate.propTypes = {
  roleMeta: PropTypes.shape({
    name: PropTypes.string
  }),
  toggle: PropTypes.shape({
    state: PropTypes.string,
    rollout: PropTypes.number,
    owner: PropTypes.string,
    ticket: PropTypes.string,
    lastModifiedAt: PropTypes.string,
    lastModifiedBy: PropTypes.string
  }),
  reason: PropTypes.string,
  cohort: PropTypes.number,
  onRetry: PropTypes.func
};

export default DashboardAccessGate;
