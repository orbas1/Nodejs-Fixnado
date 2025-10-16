import PropTypes from 'prop-types';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import Button from '../../ui/Button.jsx';
import StatusPill from '../../ui/StatusPill.jsx';
import { PRIORITY_OPTIONS, STATUS_LABELS, STATUS_TONES } from './constants.js';
import { formatCurrency, formatDate } from './utils.js';

function OrderCard({ order, onOpenDetail, onStatusChange }) {
  const statusTone = STATUS_TONES[order.status] || 'neutral';
  const amountLabel = formatCurrency(order.totalAmount, order.currency);

  return (
    <div className="rounded-2xl border border-accent/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-primary">{order.title}</h3>
          <p className="mt-1 text-sm text-slate-500">{order.service?.title || 'Service selection pending'}</p>
        </div>
        <StatusPill tone={statusTone}>{STATUS_LABELS[order.status] || order.status}</StatusPill>
      </div>
      <div className="mt-4 space-y-3 text-sm text-slate-600">
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium text-primary">{amountLabel}</span>
          <span className="text-xs uppercase tracking-wide text-slate-500">{formatDate(order.scheduledFor)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <StatusPill tone={order.priority === 'urgent' ? 'danger' : order.priority === 'high' ? 'warning' : 'info'}>
            Priority: {PRIORITY_OPTIONS.find((option) => option.value === order.priority)?.label || 'Medium'}
          </StatusPill>
          {Array.isArray(order.tags)
            ? order.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="rounded-full border border-accent/20 bg-secondary px-2 py-0.5 font-medium text-primary/70">
                  #{tag}
                </span>
              ))
            : null}
        </div>
        {order.latestNote ? (
          <p className="rounded-xl border border-dashed border-accent/30 bg-secondary/60 p-3 text-xs text-slate-600">
            <span className="font-semibold text-primary">Latest note:</span> {order.latestNote.body}
          </p>
        ) : null}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span>Status</span>
          <select
            value={order.status}
            onChange={(event) => onStatusChange(order, event.target.value)}
            className="rounded-full border border-accent/30 bg-secondary px-3 py-1 text-xs font-semibold text-primary focus:outline-none focus:ring focus:ring-accent/40"
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <Button variant="secondary" size="sm" onClick={() => onOpenDetail(order)} icon={PencilSquareIcon}>
          Open details
        </Button>
      </div>
    </div>
  );
}

OrderCard.propTypes = {
  order: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    priority: PropTypes.string,
    totalAmount: PropTypes.number,
    currency: PropTypes.string,
    scheduledFor: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    latestNote: PropTypes.shape({
      body: PropTypes.string
    }),
    service: PropTypes.shape({
      title: PropTypes.string
    })
  }).isRequired,
  onOpenDetail: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired
};

export default OrderCard;
