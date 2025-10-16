import PropTypes from 'prop-types';
import StatusPill from '../../ui/StatusPill.jsx';
import { depositTone, formatDate, rentalShape, statusTone } from './rentalUtils.js';

function RentalRow({ rental, timezone, onSelect }) {
  const tone = statusTone[rental.status] || 'neutral';
  const deposit = depositTone[rental.depositStatus] || 'neutral';

  return (
    <tr
      className="cursor-pointer bg-white transition hover:bg-slate-50"
      onClick={() => onSelect(rental.id)}
      data-qa={`rental-row-${rental.id}`}
    >
      <td className="px-4 py-3 text-sm font-medium text-primary">{rental.rentalNumber}</td>
      <td className="px-4 py-3 text-sm text-slate-600">{rental.item?.name || 'Asset'}</td>
      <td className="px-4 py-3">
        <StatusPill tone={tone}>{rental.status.replace(/_/g, ' ') || '—'}</StatusPill>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">{formatDate(rental.returnDueAt, timezone)}</td>
      <td className="px-4 py-3 text-sm">
        <StatusPill tone={deposit}>{rental.depositStatus.replace(/_/g, ' ') || '—'}</StatusPill>
      </td>
      <td className="px-4 py-3 text-sm text-slate-500">{rental.quantity}</td>
    </tr>
  );
}

RentalRow.propTypes = {
  rental: rentalShape.isRequired,
  timezone: PropTypes.string,
  onSelect: PropTypes.func.isRequired
};

RentalRow.defaultProps = {
  timezone: undefined
};

export default function RentalTable({ rentals, timezone, onSelect }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">Rental</th>
            <th className="px-4 py-3 text-left">Asset</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Return due</th>
            <th className="px-4 py-3 text-left">Deposit</th>
            <th className="px-4 py-3 text-left">Qty</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rentals.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                No rentals captured yet. Request a rental to populate this workspace.
              </td>
            </tr>
          ) : (
            rentals.map((rental) => (
              <RentalRow key={rental.id} rental={rental} timezone={timezone} onSelect={onSelect} />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

RentalTable.propTypes = {
  rentals: PropTypes.arrayOf(rentalShape),
  timezone: PropTypes.string,
  onSelect: PropTypes.func.isRequired
};

RentalTable.defaultProps = {
  rentals: [],
  timezone: undefined
};

