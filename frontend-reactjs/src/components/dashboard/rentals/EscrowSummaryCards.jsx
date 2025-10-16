import PropTypes from 'prop-types';
import { formatCurrency } from './rentalUtils.js';

export default function EscrowSummaryCards({ buckets, currency, total }) {
  if (!Array.isArray(buckets) || buckets.length === 0) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-primary">Escrow deposits</h3>
          <p className="text-sm text-slate-500">Track held, released, and forfeited deposits.</p>
        </div>
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Base currency: {currency}
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {buckets.map((bucket) => (
          <div key={bucket.id} className="rounded-2xl border border-slate-200 bg-secondary/40 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{bucket.label}</p>
            <p className="mt-2 text-xl font-semibold text-primary">
              {formatCurrency(bucket.amount, currency)}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-600">
        <p className="font-semibold text-primary">Total deposits tracked</p>
        <p className="mt-1">{formatCurrency(total, currency)} held across all active rentals.</p>
      </div>
    </div>
  );
}

EscrowSummaryCards.propTypes = {
  buckets: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      amount: PropTypes.number
    })
  ),
  currency: PropTypes.string,
  total: PropTypes.number
};

EscrowSummaryCards.defaultProps = {
  buckets: [],
  currency: 'GBP',
  total: 0
};

