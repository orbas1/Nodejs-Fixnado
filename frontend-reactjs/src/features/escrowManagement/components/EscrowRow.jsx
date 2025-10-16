import PropTypes from 'prop-types';
import { StatusPill } from '../../../components/ui/index.js';
import { formatDate } from '../utils/formatters.js';

function resolveStatusTone(escrow) {
  if (escrow.status === 'disputed') {
    return 'danger';
  }
  if (escrow.onHold) {
    return 'warning';
  }
  if (escrow.status === 'released') {
    return 'success';
  }
  return 'info';
}

export default function EscrowRow({ escrow, isSelected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(escrow.id)}
      className={`w-full rounded-2xl border ${
        isSelected ? 'border-primary bg-primary/5 shadow-glow' : 'border-transparent hover:border-accent/40'
      } text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70`}
    >
      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_auto] items-center gap-4 p-5 text-sm text-slate-700">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-primary">{escrow.order?.service?.title ?? 'Escrow record'}</span>
          <span className="text-xs text-slate-500">Order {escrow.order?.id ?? '—'}</span>
        </div>
        <div className="font-semibold text-slate-900">{escrow.amountFormatted}</div>
        <div className="text-xs text-slate-500">
          <p className="font-semibold text-slate-700">
            {escrow.order?.buyer?.firstName} {escrow.order?.buyer?.lastName}
          </p>
          <p>{escrow.order?.buyer?.email ?? '—'}</p>
        </div>
        <div className="flex flex-col gap-1 text-xs text-slate-500">
          <span>Updated {formatDate(escrow.updatedAt)}</span>
          <span>Policy {escrow.policyId ? escrow.policyId : 'not set'}</span>
        </div>
        <StatusPill tone={resolveStatusTone(escrow)}>{escrow.onHold ? 'On hold' : escrow.status}</StatusPill>
      </div>
    </button>
  );
}

EscrowRow.propTypes = {
  escrow: PropTypes.shape({
    id: PropTypes.string.isRequired,
    status: PropTypes.string,
    onHold: PropTypes.bool,
    policyId: PropTypes.string,
    amountFormatted: PropTypes.string,
    updatedAt: PropTypes.string,
    order: PropTypes.shape({
      id: PropTypes.string,
      buyer: PropTypes.shape({
        firstName: PropTypes.string,
        lastName: PropTypes.string,
        email: PropTypes.string
      }),
      service: PropTypes.shape({
        title: PropTypes.string
      })
    })
  }).isRequired,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func.isRequired
};

EscrowRow.defaultProps = {
  isSelected: false
};
