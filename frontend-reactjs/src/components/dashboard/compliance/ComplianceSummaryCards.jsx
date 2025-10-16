import PropTypes from 'prop-types';
import { formatSummaryValue } from './helpers.js';

function ComplianceSummaryCards({ summary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-accent/10 bg-white p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-primary/60">Total controls</p>
        <p className="mt-2 text-2xl font-semibold text-primary">{formatSummaryValue(summary.total)}</p>
      </div>
      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-700">Due soon (14d)</p>
        <p className="mt-2 text-2xl font-semibold text-amber-700">{formatSummaryValue(summary.dueSoon)}</p>
      </div>
      <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-rose-700">Overdue</p>
        <p className="mt-2 text-2xl font-semibold text-rose-700">{formatSummaryValue(summary.overdue)}</p>
      </div>
      <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-700">Monitoring</p>
        <p className="mt-2 text-2xl font-semibold text-sky-700">{formatSummaryValue(summary.monitoring)}</p>
      </div>
    </div>
  );
}

ComplianceSummaryCards.propTypes = {
  summary: PropTypes.shape({
    total: PropTypes.number,
    dueSoon: PropTypes.number,
    overdue: PropTypes.number,
    monitoring: PropTypes.number
  }).isRequired
};

export default ComplianceSummaryCards;
