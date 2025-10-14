import PropTypes from 'prop-types';
import { ShieldExclamationIcon, ArrowPathIcon, ArrowLeftOnRectangleIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const DashboardUnauthorized = ({ roleMeta, onNavigateHome = () => {}, onRetry = () => {} }) => (
  <div className="min-h-screen bg-gradient-to-br from-white via-secondary/60 to-white py-24 text-primary">
    <div className="mx-auto max-w-3xl px-6">
      <div className="rounded-3xl border border-rose-200 bg-white/95 p-10 shadow-glow">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-sm">
              <ShieldExclamationIcon className="h-8 w-8" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-rose-500">Access restricted</p>
              <h1 className="text-3xl font-semibold text-primary">You need permission to open {roleMeta?.name}</h1>
              <p className="text-sm text-slate-600">
                Your Fixnado account is not provisioned for this workspace yet. Ask an administrator to add your role or
                request access from analytics operations so we can approve the rollout cohort and security policies.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2" data-qa="dashboard-unauthorised-metadata">
            <div className="rounded-2xl border border-accent/10 bg-secondary/70 p-6">
              <p className="text-xs uppercase tracking-wide text-primary/60">Workspace</p>
              <p className="mt-2 text-lg font-semibold text-primary">{roleMeta?.name}</p>
              <p className="mt-1 text-sm text-slate-600">{roleMeta?.headline}</p>
            </div>
            <div className="rounded-2xl border border-accent/10 bg-white p-6 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-primary/60">How to get access</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-accent" />
                  Ask a workspace administrator to assign you the correct dashboard role.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-accent" />
                  Confirm multi-factor authentication is enabled so security automation can approve access.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-accent" />
                  Contact analytics operations if this restriction is unexpected.
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3" data-qa="dashboard-unauthorised-actions">
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-white px-5 py-2 text-sm font-semibold text-primary transition hover:border-accent hover:text-accent"
            >
              <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
              Check again
            </button>
            <button
              type="button"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-primary/90"
            >
              <ArrowLeftOnRectangleIcon className="h-4 w-4" aria-hidden="true" />
              Dashboard hub
            </button>
            <a
              href="mailto:analytics-ops@fixnado.com?subject=Dashboard%20access%20request"
              className="inline-flex items-center gap-2 rounded-full border border-accent/20 px-5 py-2 text-sm font-semibold text-accent transition hover:border-accent hover:text-primary"
            >
              <EnvelopeIcon className="h-4 w-4" aria-hidden="true" />
              Email analytics ops
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
);

DashboardUnauthorized.propTypes = {
  roleMeta: PropTypes.shape({
    name: PropTypes.string,
    headline: PropTypes.string,
  }).isRequired,
  onNavigateHome: PropTypes.func,
  onRetry: PropTypes.func,
};

export default DashboardUnauthorized;
