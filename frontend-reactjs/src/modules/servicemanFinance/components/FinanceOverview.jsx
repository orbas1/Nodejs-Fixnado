import PropTypes from 'prop-types';
import Button from '../../../components/ui/Button.jsx';
import { useServicemanFinance } from '../ServicemanFinanceProvider.jsx';

function SummaryCard({ title, value, helper, accent }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${accent} p-5 shadow-sm transition hover:shadow-md`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-primary">{value}</p>
      {helper ? <p className="mt-1 text-sm text-slate-500">{helper}</p> : null}
    </div>
  );
}

SummaryCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  helper: PropTypes.string,
  accent: PropTypes.string
};

SummaryCard.defaultProps = {
  helper: undefined,
  accent: 'from-white via-secondary to-slate-50'
};

export default function FinanceOverview() {
  const { workspace, loading, refreshWorkspace, earnings, expenses, allowances } = useServicemanFinance();
  const summary = workspace?.summary ?? {};
  const currency = workspace?.profile?.currency ?? 'GBP';

  const formatCurrency = (value) => {
    try {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(Number(value ?? 0));
    } catch {
      return `£${Number(value ?? 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
    }
  };

  const earningsMeta = earnings?.meta ?? summary?.earnings ?? {};
  const expenseMeta = expenses?.meta ?? summary?.expenses ?? {};
  const allowanceMeta = summary?.allowances ?? { active: allowances?.items?.length ?? 0, inactive: 0 };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-primary">Financial control centre</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Monitor real-time earnings, reimbursements, and allowance schedules for this serviceman. Updates apply instantly
            across mobile and web dashboards.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => refreshWorkspace()} variant="secondary" disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh workspace'}
          </Button>
          <Button to="/dashboards/finance" variant="ghost">
            Open finance dashboard
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Outstanding earnings"
          value={formatCurrency(earningsMeta.outstanding ?? 0)}
          helper={`${earnings?.items?.length ?? 0} tracked payouts`}
          accent="from-amber-100 via-white to-white"
        />
        <SummaryCard
          title="Payable now"
          value={formatCurrency(earningsMeta.payable ?? 0)}
          helper={`${earningsMeta.total ?? 0} total recorded`}
          accent="from-emerald-100 via-white to-white"
        />
        <SummaryCard
          title="Reimbursable expenses"
          value={formatCurrency(expenseMeta.awaitingReimbursement ?? 0)}
          helper={`${expenses?.items?.length ?? 0} claims awaiting review`}
          accent="from-sky-100 via-white to-white"
        />
        <SummaryCard
          title="Active allowances"
          value={`${allowanceMeta.active ?? 0}`}
          helper={`${allowanceMeta.inactive ?? 0} archived`}
          accent="from-violet-100 via-white to-white"
        />
      </div>

      {workspace?.documents?.receipts?.length ? (
        <div className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent receipts</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {workspace.documents.receipts.map((receipt) => (
              <a
                key={receipt.url ?? receipt.id}
                href={receipt.url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-primary hover:border-primary/40 hover:bg-primary/5"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary/20">
                  📄
                </span>
                <span className="flex-1">
                  <span className="block font-semibold text-slate-700 group-hover:text-primary">
                    {receipt.label || 'Receipt'}
                  </span>
                  <span className="block text-xs text-slate-500 truncate">{receipt.url}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
