import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const defaultRoleMeta = {
  id: 'provider',
  name: 'Provider Operations Studio',
  persona: 'Service Provider Leadership Teams'
};

function DashboardRoleGuard({ roleMeta, sessionRole }) {
  const resolved = roleMeta ?? defaultRoleMeta;
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <article className="space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-10 shadow-2xl shadow-primary/10" data-qa="dashboard-role-guard">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheckIcon className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Access restricted</p>
                <h1 className="text-2xl font-semibold text-slate-900">
                  {resolved.name} is reserved for authorised provider teams
                </h1>
              </div>
            </div>
            <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-2 text-xs text-slate-600">
              <p className="font-semibold text-primary">Active role</p>
              <p className="mt-1 uppercase tracking-[0.2em] text-slate-500">{sessionRole ?? 'unknown'}</p>
            </div>
          </header>
          <p className="text-sm leading-6 text-slate-600">
            Fixnado safeguards every dashboard so only vetted operating companies can review mission-critical telemetry and
            revenue performance. Request access through your programme lead or switch to a role that has an authorised workspace.
          </p>
          <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-600 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Workspace</p>
              <p className="mt-2 font-semibold text-slate-900">{resolved.name}</p>
              <p className="mt-1 text-xs text-slate-500">{resolved.persona}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">How to get access</p>
              <ul className="mt-2 space-y-2 text-xs text-slate-500">
                <li>Confirm your organisation is registered as a Fixnado provider tenant.</li>
                <li>Ensure provider admins assign you to the Provider Operations Studio workspace.</li>
                <li>Complete onboarding and MFA requirements before requesting access.</li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/dashboards"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90"
            >
              Go to dashboard hub
            </Link>
            <a
              href="mailto:providers@fixnado.com?subject=Provider%20dashboard%20access"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-primary transition hover:border-primary/40 hover:text-primary"
            >
              Contact provider success
            </a>
          </div>
        </article>
      </div>
    </div>
  );
}

DashboardRoleGuard.propTypes = {
  roleMeta: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    persona: PropTypes.string
  }),
  sessionRole: PropTypes.string
};

DashboardRoleGuard.defaultProps = {
  roleMeta: null,
  sessionRole: 'guest'
};

export default DashboardRoleGuard;
