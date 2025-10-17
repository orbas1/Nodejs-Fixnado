import PropTypes from 'prop-types';
import Button from '../../../components/ui/Button.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';

function MetricCard({ label, value, helper }) {
  return (
    <div className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-primary/60">{label}</p>
      <p className="text-2xl font-semibold text-primary">{value}</p>
      {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

MetricCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  helper: PropTypes.node
};

MetricCard.defaultProps = {
  helper: null
};

export default function AdsOverview({ overview, onCreateCampaign, onRefresh, mutating }) {
  const spend = overview?.spendMonthToDate ?? 0;
  const revenue = overview?.revenueMonthToDate ?? 0;
  const roas = overview?.roas ?? 0;
  const conversions = overview?.conversions ?? 0;
  const ctr = overview?.ctr ?? 0;
  const cvr = overview?.cvr ?? 0;
  const impressions = overview?.impressions ?? 0;
  const clicks = overview?.clicks ?? 0;
  const lastMetricAt = overview?.lastMetricAt ? new Date(overview.lastMetricAt).toLocaleString() : 'n/a';

  const roasTone = roas >= 2 ? 'success' : roas >= 1 ? 'info' : 'warning';

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary">Gigvora ads control centre</h2>
          <p className="text-sm text-slate-600">
            Launch, optimise, and audit marketplace campaigns without leaving the provider workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" onClick={onRefresh} disabled={mutating}>
            Refresh metrics
          </Button>
          <Button size="sm" onClick={onCreateCampaign} disabled={mutating}>
            New campaign
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Spend MTD"
          value={`£${spend.toLocaleString()}`}
          helper={`Conversions: ${conversions.toLocaleString()}`}
        />
        <MetricCard label="Revenue MTD" value={`£${revenue.toLocaleString()}`} helper={`ROAS ${(roas || 0).toFixed(2)}x`} />
        <MetricCard
          label="Engagement"
          value={`${clicks.toLocaleString()} clicks`}
          helper={`CTR ${(ctr * 100).toFixed(2)}% · ${impressions.toLocaleString()} impressions`}
        />
        <MetricCard
          label="Conversion ratio"
          value={`${(cvr * 100).toFixed(2)}%`}
          helper={<StatusPill tone={roasTone}>ROAS {(roas || 0).toFixed(2)}x</StatusPill>}
        />
      </div>

      <p className="text-xs text-slate-500">Last metric ingest: {lastMetricAt}</p>
    </section>
  );
}

AdsOverview.propTypes = {
  overview: PropTypes.shape({
    spendMonthToDate: PropTypes.number,
    revenueMonthToDate: PropTypes.number,
    impressions: PropTypes.number,
    clicks: PropTypes.number,
    conversions: PropTypes.number,
    ctr: PropTypes.number,
    cvr: PropTypes.number,
    roas: PropTypes.number,
    lastMetricAt: PropTypes.string
  }),
  onCreateCampaign: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  mutating: PropTypes.bool
};

AdsOverview.defaultProps = {
  overview: null,
  mutating: false
};
