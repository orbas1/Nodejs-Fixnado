import { Link } from 'react-router-dom';
import { DASHBOARD_ROLES } from '../constants/dashboardConfig.js';

const featureCopy = {
  user: 'Custom jobs, service and marketplace control built for clients.',
  serviceman: 'Run crews, bids and Fixnado Ads optimisations in one lane.',
  provider: 'Operate your SME marketplace business end-to-end.',
  enterprise: 'Enterprise-level observability, AI automation and insights.'
};

const DashboardHub = () => {
  const registered = DASHBOARD_ROLES.filter((role) => role.registered);
  const pending = DASHBOARD_ROLES.filter((role) => !role.registered);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-12">
        <div className="space-y-4 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-accent">Fixnado Dashboards</p>
          <h1 className="text-4xl font-semibold text-slate-900">Choose the workspace that fits your mission</h1>
          <p className="mx-auto max-w-3xl text-base text-slate-600">
            Each dashboard is tuned to the workflows, intelligence and automations your role depends on. Access only the
            workspaces you are provisioned for, and jump back to the public experience at any time.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {registered.map((role) => (
            <div key={role.id} className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60">
              <div className="absolute inset-x-6 top-6 h-24 rounded-3xl bg-gradient-to-br from-accent/20 to-indigo-400/10 blur-3xl" />
              <div className="relative space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{role.persona}</p>
                    <h2 className="text-2xl font-semibold text-slate-900">{role.name}</h2>
                  </div>
                  <span className="rounded-full border border-emerald-400/40 bg-emerald-100 px-4 py-1 text-xs font-semibold text-emerald-600">
                    Active
                  </span>
                </div>
                <p className="text-sm text-slate-600">{featureCopy[role.id]}</p>
                <div className="grid gap-3 text-sm text-slate-600">
                  {(role.navigation ?? []).slice(0, 4).map((item) => (
                    <div key={item.id} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-accent" />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 pt-4">
                  <Link
                    to={`/dashboards/${role.id}`}
                    className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-accent/40 hover:bg-accent/90"
                  >
                    Enter {role.name}
                  </Link>
                  <Link
                    to={`/dashboards/${role.id}`}
                    className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:border-accent hover:text-accent"
                  >
                    View capabilities
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {pending.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">Other workspaces</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {pending.map((role) => (
                <div key={role.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{role.persona}</p>
                      <h3 className="text-xl font-semibold text-slate-900">{role.name}</h3>
                    </div>
                    <span className="rounded-full border border-amber-400/40 bg-amber-100 px-4 py-1 text-xs font-semibold text-amber-600">
                      Request access
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-slate-600">{featureCopy[role.id]}</p>
                  <ul className="mt-4 space-y-2 text-xs text-slate-500">
                    {(role.navigation ?? []).slice(0, 4).map((item) => (
                      <li key={item.id}>{item.label}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Need to pivot back?</h2>
          <p className="mt-2 text-sm text-slate-600">
            Every dashboard keeps a persistent control in the left menu to jump back to the Fixnado public site. You can
            also use the role selector inside any workspace to pivot between dashboards you are provisioned for.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardHub;
