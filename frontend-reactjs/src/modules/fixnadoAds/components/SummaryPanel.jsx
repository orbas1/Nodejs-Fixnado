import PropTypes from 'prop-types';
import { ArrowPathIcon, ChartBarIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import { Button, Card } from '../../../components/ui/index.js';
import { formatCurrency, formatNumber } from '../utils/formatters.js';

function SummaryStat({ label, value, caption }) {
  return (
    <Card padding="lg" className="border border-slate-200 bg-white/80 shadow-sm">
      <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{label}</dt>
      <dd className="mt-2 text-2xl font-semibold text-primary">{value}</dd>
      {caption ? <p className="mt-2 text-sm text-slate-500">{caption}</p> : null}
    </Card>
  );
}

SummaryStat.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  caption: PropTypes.string
};

SummaryStat.defaultProps = {
  caption: undefined
};

export default function SummaryPanel({ summary, campaignCount, activeCampaigns, creativeCount, onRefresh }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Fixnado network snapshot</p>
          <h2 className="mt-2 text-2xl font-semibold text-primary">Campaign delivery overview</h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-600">
            Review live pacing, surface rapid-response ads, and jump into the dedicated marketing workspace for deeper
            optimisation. All metrics below respect your Serviceman role controls.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={ArrowPathIcon}
            onClick={onRefresh}
            aria-label="Refresh Fixnado metrics"
          >
            Refresh metrics
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={ChartBarIcon}
            to="/dashboards/analytics/fixnado"
            target="_blank"
            rel="noreferrer"
          >
            Open analytics suite
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={RocketLaunchIcon}
            to="/campaigns/fixnado"
            target="_blank"
            rel="noreferrer"
          >
            Launch marketing studio
          </Button>
        </div>
      </div>

      <dl className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <SummaryStat label="Tracked campaigns" value={formatNumber(campaignCount)} caption="Across the Fixnado service areas" />
        <SummaryStat label="Active campaigns" value={formatNumber(activeCampaigns)} caption="Live deliverables this week" />
        <SummaryStat
          label="Creatives ready"
          value={formatNumber(creativeCount)}
          caption="Approved assets ready for rotation"
        />
        <SummaryStat
          label={summary?.window ? `Window · ${summary.window}` : '30-day captured revenue'}
          value={summary?.revenue != null ? formatCurrency(summary.revenue, summary?.currency ?? 'GBP') : '—'}
          caption={summary?.adsJobs ? `${formatNumber(summary.adsJobs)} jobs sourced via Fixnado placements` : undefined}
        />
      </dl>
    </section>
  );
}

SummaryPanel.propTypes = {
  summary: PropTypes.shape({
    window: PropTypes.string,
    adsJobs: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    autoMatches: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    revenue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string
  }),
  campaignCount: PropTypes.number.isRequired,
  activeCampaigns: PropTypes.number.isRequired,
  creativeCount: PropTypes.number.isRequired,
  onRefresh: PropTypes.func
};

SummaryPanel.defaultProps = {
  summary: null,
  onRefresh: undefined
};
