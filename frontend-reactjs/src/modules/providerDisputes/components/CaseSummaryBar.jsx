import PropTypes from 'prop-types';
import { Card } from '../../../components/ui/index.js';
import { formatCurrency } from '../utils.js';

export default function CaseSummaryBar({ metrics, currency }) {
  const statusCounts = metrics?.statusCounts ?? {};
  const openCases =
    Number(statusCounts.open ?? 0) +
    Number(statusCounts.under_review ?? 0) +
    Number(statusCounts.awaiting_customer ?? 0);

  const summary = [
    { label: 'Open', value: openCases },
    { label: 'Follow', value: Number(metrics?.requiresFollowUp ?? 0) },
    { label: 'Tasks', value: Number(metrics?.activeTasks ?? 0) },
    { label: 'Amount', value: formatCurrency(Number(metrics?.totalDisputedAmount ?? 0), currency) }
  ];

  return (
    <Card className="grid gap-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm md:grid-cols-4">
      {summary.map((item) => (
        <div key={item.label} className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{item.label}</p>
          <p className="text-2xl font-semibold text-primary">
            {typeof item.value === 'number' && !Number.isNaN(item.value)
              ? item.value.toLocaleString()
              : item.value}
          </p>
        </div>
      ))}
    </Card>
  );
}

CaseSummaryBar.propTypes = {
  metrics: PropTypes.shape({
    statusCounts: PropTypes.object,
    requiresFollowUp: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    activeTasks: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    totalDisputedAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  }).isRequired,
  currency: PropTypes.string
};

CaseSummaryBar.defaultProps = {
  currency: 'GBP'
};
