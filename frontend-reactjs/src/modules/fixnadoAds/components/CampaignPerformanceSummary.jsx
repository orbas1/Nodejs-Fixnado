import PropTypes from 'prop-types';
import { Card } from '../../../components/ui/index.js';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters.js';

export default function CampaignPerformanceSummary({ summary, currency }) {
  if (!summary) {
    return null;
  }

  const totals = summary.totals ?? {};

  return (
    <Card padding="lg" className="border border-slate-200 bg-white/70 shadow-sm">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Campaign performance</p>
          <h3 className="text-xl font-semibold text-primary">Delivery outcomes</h3>
        </div>
        <div className="text-sm text-slate-500">
          <span className="font-semibold text-primary">{summary.openFraudSignals}</span> open fraud signals require
          review
        </div>
      </header>
      <dl className="grid gap-6 md:grid-cols-3 xl:grid-cols-6">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Impressions</dt>
          <dd className="mt-2 text-lg font-semibold text-primary">{formatNumber(totals.impressions)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Clicks</dt>
          <dd className="mt-2 text-lg font-semibold text-primary">{formatNumber(totals.clicks)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Conversions</dt>
          <dd className="mt-2 text-lg font-semibold text-primary">{formatNumber(totals.conversions)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Spend</dt>
          <dd className="mt-2 text-lg font-semibold text-primary">{formatCurrency(totals.spend, currency)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Revenue</dt>
          <dd className="mt-2 text-lg font-semibold text-primary">{formatCurrency(totals.revenue, currency)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">ROI</dt>
          <dd className="mt-2 text-lg font-semibold text-primary">{formatPercent(totals.roi)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">CTR</dt>
          <dd className="mt-2 text-lg font-semibold text-primary">{formatPercent(totals.ctr)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">CVR</dt>
          <dd className="mt-2 text-lg font-semibold text-primary">{formatPercent(totals.cvr)}</dd>
        </div>
      </dl>
    </Card>
  );
}

CampaignPerformanceSummary.propTypes = {
  summary: PropTypes.shape({
    totals: PropTypes.shape({
      impressions: PropTypes.number,
      clicks: PropTypes.number,
      conversions: PropTypes.number,
      spend: PropTypes.number,
      revenue: PropTypes.number,
      ctr: PropTypes.number,
      cvr: PropTypes.number,
      roi: PropTypes.number
    }),
    openFraudSignals: PropTypes.number
  }),
  currency: PropTypes.string
};

CampaignPerformanceSummary.defaultProps = {
  summary: null,
  currency: 'GBP'
};
