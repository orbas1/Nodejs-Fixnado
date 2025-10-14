import PropTypes from 'prop-types';
import { UserCircleIcon, EnvelopeIcon, BuildingOffice2Icon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const metricConfig = [
  { key: 'bookings', label: 'Total bookings' },
  { key: 'activeBookings', label: 'Active jobs' },
  { key: 'spend', label: 'Spend this window' },
  { key: 'rentals', label: 'Rentals in field' },
  { key: 'disputes', label: 'Open disputes' },
  { key: 'conversations', label: 'Support threads' },
];

const DashboardPersonaSummary = ({ dashboard = null }) => {
  if (!dashboard || dashboard.persona !== 'user') {
    return null;
  }

  const user = dashboard.metadata?.user;
  const totals = dashboard.metadata?.totals ?? {};
  const companyId = dashboard.metadata?.companyId;

  return (
    <section
      className="rounded-3xl border border-accent/10 bg-white/95 p-8 shadow-glow"
      data-qa="dashboard-persona-summary"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-accent">
              <UserCircleIcon className="h-8 w-8" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary/60">Customer workspace</p>
              <h2 className="text-2xl font-semibold text-primary">{user?.name || 'Fixnado customer'}</h2>
            </div>
          </div>
          <dl className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2" data-qa="dashboard-persona-summary-metadata">
            <div className="flex items-center gap-2">
              <EnvelopeIcon className="h-4 w-4 text-accent" aria-hidden="true" />
              <span className="font-semibold text-primary/80">{user?.email || 'Not provided'}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              <span className="text-xs uppercase tracking-wide text-primary/60">
                {dashboard.metadata?.totals?.disputes > 0 ? 'Escalations active' : 'Workspace healthy'}
              </span>
            </div>
            {companyId ? (
              <div className="flex items-center gap-2">
                <BuildingOffice2Icon className="h-4 w-4 text-accent" aria-hidden="true" />
                <span className="font-semibold text-primary/80">Linked company workspace</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <BuildingOffice2Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <span className="font-semibold text-primary/80">Standalone account</span>
              </div>
            )}
          </dl>
        </div>
        <div className="flex-1">
          <div className="grid gap-4 sm:grid-cols-2" data-qa="dashboard-persona-summary-metrics">
            {metricConfig.map((metric) => (
              <div
                key={metric.key}
                className="rounded-2xl border border-accent/10 bg-secondary/70 px-4 py-5 text-sm shadow-sm"
              >
                <p className="text-xs uppercase tracking-wide text-primary/60">{metric.label}</p>
                <p className="mt-2 text-lg font-semibold text-primary">
                  {totals[metric.key] != null ? totals[metric.key] : '—'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

DashboardPersonaSummary.propTypes = {
  dashboard: PropTypes.shape({
    persona: PropTypes.string,
    metadata: PropTypes.shape({
      user: PropTypes.shape({
        name: PropTypes.string,
        email: PropTypes.string,
      }),
      totals: PropTypes.object,
      companyId: PropTypes.string,
    }),
  }),
};

export default DashboardPersonaSummary;
