import PropTypes from 'prop-types';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { Button, Card } from '../../../components/ui/index.js';

function ComplianceNotices({ notices }) {
  if (!notices || notices.length === 0) return null;
  return (
    <Card className="border-amber-200 bg-amber-50/80 shadow-none">
      <div className="flex items-start gap-4">
        <ShieldCheckIcon aria-hidden="true" className="mt-1 h-6 w-6 text-amber-500" />
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-amber-700">Compliance reminders</h3>
          <ul className="space-y-3 text-sm text-amber-800">
            {notices.map((notice) => (
              <li key={notice.id}>
                <p className="font-semibold">{notice.title}</p>
                <p className="text-amber-700/90">{notice.message}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}

ComplianceNotices.propTypes = {
  notices: PropTypes.array
};

export default function WalletActivityRail({
  complianceNotices,
  payoutQueue,
  recentTransactions,
  formatCurrency,
  onViewLedger
}) {
  return (
    <div className="space-y-6">
      <ComplianceNotices notices={complianceNotices} />

      <Card className="space-y-4 border-slate-200 bg-white shadow-sm">
        <header className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-primary">Upcoming payouts</h3>
            <p className="text-sm text-slate-600">Queued releases to provider wallets.</p>
          </div>
        </header>
        <ul className="space-y-3 text-sm text-slate-600">
          {payoutQueue.length === 0 ? (
            <li className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
              No pending payouts. Approved releases will appear here.
            </li>
          ) : (
            payoutQueue.map((payout) => (
              <li key={payout.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="font-semibold text-slate-800">{formatCurrency(payout.amount, payout.currency)}</p>
                <p className="text-xs text-slate-500">Provider: {payout.providerId}</p>
                <p className="text-xs text-slate-500">
                  Status: {payout.status}{' '}
                  {payout.scheduledFor ? `• Scheduled ${new Date(payout.scheduledFor).toLocaleDateString()}` : null}
                </p>
              </li>
            ))
          )}
        </ul>
      </Card>

      <Card className="space-y-4 border-slate-200 bg-white shadow-sm">
        <header className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-primary">Latest ledger activity</h3>
            <p className="text-sm text-slate-600">Real-time log of credits, debits, and holds.</p>
          </div>
        </header>
        <ul className="space-y-3">
          {recentTransactions.length === 0 ? (
            <li className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
              No transactions captured yet.
            </li>
          ) : (
            recentTransactions.map((transaction) => (
              <li key={transaction.id} className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-800">{transaction.accountName || transaction.accountId}</span>
                  <span className="text-xs uppercase tracking-wide text-slate-500">{transaction.type}</span>
                </div>
                <p className="text-sm text-slate-600">
                  {formatCurrency(transaction.amount, transaction.currency)} •{' '}
                  {new Date(transaction.occurredAt).toLocaleString()}
                </p>
                {transaction.description ? (
                  <p className="text-xs text-slate-500">{transaction.description}</p>
                ) : null}
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      onViewLedger({ id: transaction.accountId, displayName: transaction.accountName || transaction.accountId })
                    }
                  >
                    View ledger
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  );
}

WalletActivityRail.propTypes = {
  complianceNotices: PropTypes.array,
  payoutQueue: PropTypes.array.isRequired,
  recentTransactions: PropTypes.array.isRequired,
  formatCurrency: PropTypes.func.isRequired,
  onViewLedger: PropTypes.func.isRequired
};
