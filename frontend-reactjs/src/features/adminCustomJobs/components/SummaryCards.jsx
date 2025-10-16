import PropTypes from 'prop-types';
import { Card } from '../../../components/ui/index.js';
import { formatCurrency } from '../utils.js';

export default function SummaryCards({ summary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card padding="md" className="bg-white/90 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Open jobs</p>
        <p className="mt-2 text-2xl font-semibold text-primary">{(summary.openCount ?? 0).toLocaleString()}</p>
      </Card>
      <Card padding="md" className="bg-white/90 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Assigned</p>
        <p className="mt-2 text-2xl font-semibold text-primary">{(summary.assignedCount ?? 0).toLocaleString()}</p>
      </Card>
      <Card padding="md" className="bg-white/90 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Completed</p>
        <p className="mt-2 text-2xl font-semibold text-primary">{(summary.completedCount ?? 0).toLocaleString()}</p>
      </Card>
      <Card padding="md" className="bg-white/90 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Total bids</p>
        <p className="mt-2 text-2xl font-semibold text-primary">{(summary.totalBids ?? 0).toLocaleString()}</p>
        <p className="mt-1 text-xs text-slate-500">
          Active bids: {(summary.activeBidCount ?? 0).toLocaleString()} • Awarded value: {formatCurrency(summary.totalAwardValue, summary.awardCurrency || 'GBP')}
        </p>
      </Card>
    </div>
  );
}

SummaryCards.propTypes = {
  summary: PropTypes.shape({
    openCount: PropTypes.number,
    assignedCount: PropTypes.number,
    completedCount: PropTypes.number,
    totalBids: PropTypes.number,
    activeBidCount: PropTypes.number,
    totalAwardValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    awardCurrency: PropTypes.string
  })
};
