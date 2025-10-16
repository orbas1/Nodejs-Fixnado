import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { ClockIcon, ChatBubbleLeftEllipsisIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Button from '../../../components/ui/Button.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';
import Skeleton from '../../../components/ui/Skeleton.jsx';

const STATUS_TONE = {
  pending: { tone: 'info', label: 'Pending' },
  accepted: { tone: 'success', label: 'Accepted' },
  rejected: { tone: 'danger', label: 'Rejected' },
  withdrawn: { tone: 'neutral', label: 'Withdrawn' }
};

function BidRow({ bid, onEdit, onWithdraw, updating, withdrawing }) {
  const status = STATUS_TONE[bid.status] ?? { tone: 'neutral', label: bid.status };
  const amountLabel = bid.amount != null ? `£${Number(bid.amount).toLocaleString(undefined, { minimumFractionDigits: 0 })}` : '—';
  const updatedAt = bid.updatedAt ? new Date(bid.updatedAt).toLocaleString() : null;
  return (
    <article className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
      <header className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-base font-semibold text-primary">{bid.job?.title ?? 'Custom job'}</h3>
          {bid.job?.category ? <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{bid.job.category}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone={status.tone}>{status.label}</StatusPill>
          <span className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500">{amountLabel}</span>
        </div>
      </header>
      {bid.message ? <p className="text-sm text-slate-600">{bid.message}</p> : null}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
        {bid.job?.zone ? (
          <span className="inline-flex items-center gap-1">
            <CheckCircleIcon className="h-4 w-4 text-primary" aria-hidden="true" />
            {bid.job.zone.name}
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1">
          <ClockIcon className="h-4 w-4 text-primary" aria-hidden="true" />
          Updated {updatedAt ?? 'recently'}
        </span>
        <span className="inline-flex items-center gap-1">
          <ChatBubbleLeftEllipsisIcon className="h-4 w-4 text-primary" aria-hidden="true" />
          {bid.messageCount ?? 0} message{(bid.messageCount ?? 0) === 1 ? '' : 's'}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {bid.canEdit ? (
          <Button size="sm" variant="secondary" onClick={() => onEdit(bid)} disabled={updating}>
            Edit bid
          </Button>
        ) : null}
        {bid.canWithdraw ? (
          <Button size="sm" variant="danger" onClick={() => onWithdraw(bid)} disabled={withdrawing}>
            Withdraw
          </Button>
        ) : null}
      </div>
    </article>
  );
}

BidRow.propTypes = {
  bid: PropTypes.shape({
    id: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    amount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    message: PropTypes.string,
    job: PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string,
      category: PropTypes.string,
      zone: PropTypes.shape({ id: PropTypes.string, name: PropTypes.string })
    }),
    messageCount: PropTypes.number,
    updatedAt: PropTypes.string,
    canEdit: PropTypes.bool,
    canWithdraw: PropTypes.bool
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onWithdraw: PropTypes.func.isRequired,
  updating: PropTypes.bool,
  withdrawing: PropTypes.bool
};

BidRow.defaultProps = {
  updating: false,
  withdrawing: false
};

export default function BidManagementPanel({ bids, loading, updatingBidId, withdrawingBidId, onEditBid, onWithdrawBid }) {
  const sortedBids = useMemo(() => bids.slice().sort((a, b) => new Date(b.updatedAt ?? 0) - new Date(a.updatedAt ?? 0)), [bids]);

  return (
    <section id="provider-custom-jobs-bids" className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">Bid management</h2>
          <p className="text-sm text-slate-500">Track active, awarded, and withdrawn custom job bids.</p>
        </div>
      </header>
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-48 rounded-3xl" />
          ))}
        </div>
      ) : sortedBids.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center text-sm text-slate-500">
          No bids yet. Submit bids on custom job opportunities to see them here.
        </div>
      ) : (
        <div className="space-y-4">
          {sortedBids.map((bid) => (
            <BidRow
              key={bid.id}
              bid={bid}
              onEdit={onEditBid}
              onWithdraw={onWithdrawBid}
              updating={updatingBidId === bid.id}
              withdrawing={withdrawingBidId === bid.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}

BidManagementPanel.propTypes = {
  bids: PropTypes.arrayOf(BidRow.propTypes.bid),
  loading: PropTypes.bool,
  updatingBidId: PropTypes.string,
  withdrawingBidId: PropTypes.string,
  onEditBid: PropTypes.func.isRequired,
  onWithdrawBid: PropTypes.func.isRequired
};

BidManagementPanel.defaultProps = {
  bids: [],
  loading: false,
  updatingBidId: null,
  withdrawingBidId: null
};
