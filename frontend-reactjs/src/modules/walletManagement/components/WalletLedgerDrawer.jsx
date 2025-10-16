import PropTypes from 'prop-types';
import { Spinner, StatusPill } from '../../../components/ui/index.js';
import WalletDrawer from './WalletDrawer.jsx';

export default function WalletLedgerDrawer({ ledger, onClose, formatCurrency }) {
  return (
    <WalletDrawer open={ledger.open} onClose={onClose} title="Wallet ledger">
      {ledger.loading ? (
        <div className="flex items-center justify-center py-6">
          <Spinner className="h-6 w-6 text-primary" />
        </div>
      ) : ledger.error ? (
        <StatusPill tone="danger">{ledger.error}</StatusPill>
      ) : ledger.account ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-sm font-semibold text-slate-700">{ledger.account.displayName}</p>
            <p className="text-xs text-slate-500">
              Owner: {ledger.account.ownerType} • {ledger.account.ownerId}
            </p>
            <p className="text-xs text-slate-500">
              Balance: {formatCurrency(ledger.account.balance, ledger.account.currency)}
            </p>
          </div>
          <ul className="space-y-3">
            {ledger.transactions.length === 0 ? (
              <li className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
                No transactions recorded.
              </li>
            ) : (
              ledger.transactions.map((transaction) => (
                <li key={transaction.id} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{transaction.type}</span>
                    <span>{formatCurrency(transaction.amount, transaction.currency)}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(transaction.occurredAt).toLocaleString()} • Balance after:{' '}
                    {formatCurrency(transaction.runningBalance, transaction.currency)}
                  </p>
                  {transaction.description ? (
                    <p className="mt-1 text-xs text-slate-500">{transaction.description}</p>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </WalletDrawer>
  );
}

WalletLedgerDrawer.propTypes = {
  ledger: PropTypes.shape({
    open: PropTypes.bool.isRequired,
    loading: PropTypes.bool.isRequired,
    account: PropTypes.object,
    transactions: PropTypes.array.isRequired,
    error: PropTypes.string
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  formatCurrency: PropTypes.func.isRequired
};
