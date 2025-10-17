import { useMemo } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../../components/ui/Button.jsx';
import { useServicemanTax } from '../ServicemanTaxProvider.jsx';

function SummaryCard({ title, value, helper, accent }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${accent} p-5 shadow-sm transition hover:shadow-md`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-primary">{value}</p>
      {helper ? <p className="mt-1 text-sm text-slate-600">{helper}</p> : null}
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

export default function TaxSummary() {
  const { workspace, loading, refreshWorkspace } = useServicemanTax();
  const summary = workspace?.summary ?? {};
  const profile = workspace?.profile ?? {};

  const currency = profile?.currency ?? 'GBP';

  const formatter = useMemo(() => {
    try {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } catch (error) {
      console.warn('Falling back to GBP formatter for tax summary', error);
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
  }, [currency]);

  const statusBreakdown = Object.entries(summary?.filings?.byStatus ?? {})
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .slice(0, 5);

  const documentBreakdown = Object.entries(summary?.documents?.byType ?? {})
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .slice(0, 5);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-primary">Tax compliance overview</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Stay ahead of submission deadlines, reconcile liabilities, and keep compliance records centralised for this serviceman.
            All data updates instantly across dashboards and exports.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => refreshWorkspace({ silent: false })} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh workspace'}
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Active filings"
          value={summary?.filings?.total ?? 0}
          helper={`${summary?.filings?.overdue ?? 0} overdue`}
          accent="from-amber-100 via-white to-white"
        />
        <SummaryCard
          title="Liability outstanding"
          value={formatter.format(summary?.filings?.amountDueTotal ?? 0)}
          helper={`Paid ${formatter.format(summary?.filings?.amountPaidTotal ?? 0)} to date`}
          accent="from-rose-100 via-white to-white"
        />
        <SummaryCard
          title="Open tax tasks"
          value={summary?.tasks?.open ?? 0}
          helper={`${summary?.tasks?.total ?? 0} total / ${summary?.tasks?.overdue ?? 0} overdue`}
          accent="from-emerald-100 via-white to-white"
        />
        <SummaryCard
          title="Records on file"
          value={summary?.documents?.total ?? 0}
          helper={`${documentBreakdown.length} document categories`}
          accent="from-sky-100 via-white to-white"
        />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Submission health</h3>
          {statusBreakdown.length ? (
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {statusBreakdown.map(([status, count]) => (
                <li key={status} className="flex items-center justify-between rounded-xl border border-transparent bg-white/80 px-4 py-2">
                  <span className="font-medium capitalize text-primary">{status.replace(/_/g, ' ')}</span>
                  <span className="text-slate-500">{count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No filings have been recorded yet.</p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Compliance library</h3>
          {documentBreakdown.length ? (
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {documentBreakdown.map(([type, count]) => (
                <li key={type} className="flex items-center justify-between rounded-xl border border-transparent bg-white/80 px-4 py-2">
                  <span className="font-medium capitalize text-primary">{type.replace(/_/g, ' ')}</span>
                  <span className="text-slate-500">{count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No documents captured yet. Upload statements, receipts, and evidence to start building the archive.</p>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-primary/10 bg-primary/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">Next deadline</p>
          <p className="mt-2 text-lg font-semibold text-primary">
            {profile?.nextDeadlineAt ? new Date(profile.nextDeadlineAt).toLocaleString() : 'Not scheduled'}
          </p>
          <p className="mt-2 text-sm text-primary/80">Keep this date updated so reminders and escalation rules stay accurate.</p>
        </div>
        <div className="rounded-2xl border border-primary/10 bg-primary/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">Last submission</p>
          <p className="mt-2 text-lg font-semibold text-primary">
            {profile?.lastFilingSubmittedAt ? new Date(profile.lastFilingSubmittedAt).toLocaleString() : 'Not recorded'}
          </p>
          <p className="mt-2 text-sm text-primary/80">Log completed filings so the compliance audit trail remains complete.</p>
        </div>
        <div className="rounded-2xl border border-primary/10 bg-primary/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">Filing status</p>
          <p className="mt-2 text-lg font-semibold text-primary capitalize">
            {profile?.filingStatus ? profile.filingStatus.replace(/_/g, ' ') : 'Not configured'}
          </p>
          <p className="mt-2 text-sm text-primary/80">Configure profile status to tailor obligations and document templates.</p>
        </div>
      </div>
    </section>
  );
}
