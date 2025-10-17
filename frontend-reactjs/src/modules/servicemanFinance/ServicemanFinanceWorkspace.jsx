import PropTypes from 'prop-types';
import Button from '../../components/ui/Button.jsx';
import ServicemanFinanceProvider, { useServicemanFinance } from './ServicemanFinanceProvider.jsx';
import FinanceOverview from './components/FinanceOverview.jsx';
import ProfileSection from './components/ProfileSection.jsx';
import EarningsSection from './components/EarningsSection.jsx';
import ExpensesSection from './components/ExpensesSection.jsx';
import AllowancesSection from './components/AllowancesSection.jsx';

function PermissionBadge({ label, active }) {
  const baseClass =
    'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition';
  const activeClass = 'border-emerald-200 bg-emerald-50 text-emerald-700';
  const inactiveClass = 'border-slate-200 bg-slate-100 text-slate-500';

  return <span className={`${baseClass} ${active ? activeClass : inactiveClass}`}>{label}</span>;
}

function ServicemanFinanceHeader() {
  const { workspace } = useServicemanFinance();
  const serviceman = workspace?.context?.serviceman ?? {};
  const servicemanName = serviceman.name ?? serviceman.fullName ?? 'Serviceman';
  const servicemanRole = serviceman.role ?? serviceman.title ?? 'Crew member';
  const region = serviceman.region ?? workspace?.context?.region ?? null;

  const permissions = workspace?.permissions ?? {};
  const permissionPills = [
    {
      key: 'payments',
      label: permissions.canManagePayments ? 'Payouts: manage' : 'Payouts: view only',
      active: permissions.canManagePayments
    },
    {
      key: 'expenses',
      label: permissions.canSubmitExpenses ? 'Expenses: submit & approve' : 'Expenses: view only',
      active: permissions.canSubmitExpenses
    },
    {
      key: 'allowances',
      label: permissions.canManageAllowances ? 'Allowances: manage' : 'Allowances: view only',
      active: permissions.canManageAllowances
    }
  ];

  return (
    <header className="border-b border-slate-200 bg-gradient-to-br from-white via-secondary/60 to-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 md:flex-row md:items-start md:justify-between">
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Serviceman control centre</p>
            <h1 className="text-3xl font-semibold text-primary">Financial management</h1>
          </div>
          <p className="max-w-2xl text-sm text-slate-600">
            Coordinate payouts, reimbursements, and allowances for {servicemanName}
            {region ? ` · ${region}` : ''}. Updates sync with provider and finance dashboards instantly.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-white px-3 py-1 font-semibold text-primary/80">
              <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
              {servicemanRole}
            </span>
            {permissionPills.map((pill) => (
              <PermissionBadge key={pill.key} label={pill.label} active={pill.active} />
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button to="/dashboards/serviceman" variant="ghost" size="sm">
            Open crew dashboard
          </Button>
          <Button to="/dashboards/provider" variant="secondary" size="sm">
            Open provider studio
          </Button>
        </div>
      </div>
    </header>
  );
}

function ServicemanFinanceContent() {
  return (
    <div className="min-h-screen bg-slate-50 pb-24" data-qa="serviceman-finance-workspace">
      <ServicemanFinanceHeader />
      <div className="mx-auto max-w-7xl space-y-10 px-6 pt-12">
        <FinanceOverview />
        <ProfileSection />
        <div className="grid gap-8 xl:grid-cols-2">
          <EarningsSection />
          <ExpensesSection />
        </div>
        <AllowancesSection />
      </div>
    </div>
  );
}

PermissionBadge.propTypes = {
  label: PropTypes.string.isRequired,
  active: PropTypes.bool
};

PermissionBadge.defaultProps = {
  active: false
};

export default function ServicemanFinanceWorkspace({ initialData }) {
  return (
    <ServicemanFinanceProvider initialData={initialData ?? {}}>
      <ServicemanFinanceContent />
    </ServicemanFinanceProvider>
  );
}

ServicemanFinanceWorkspace.propTypes = {
  initialData: PropTypes.object
};

ServicemanFinanceWorkspace.defaultProps = {
  initialData: {}
};
