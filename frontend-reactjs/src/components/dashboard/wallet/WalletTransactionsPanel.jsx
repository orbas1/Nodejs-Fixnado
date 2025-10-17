import PropTypes from 'prop-types';
import { Button, Spinner, StatusPill } from '../../ui/index.js';
import { formatCurrency } from '../../../utils/numberFormatters.js';

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

const TransactionRow = ({ transaction, currency }) => {
  const tone =
    transaction.type === 'credit'
      ? 'success'
      : transaction.type === 'debit'
      ? 'danger'
      : transaction.type === 'hold'
      ? 'warning'
      : 'info';

  return (
    <tr className="border-b border-slate-100">
      <td className="px-4 py-3 text-sm text-slate-600">{dateFormatter.format(new Date(transaction.occurredAt))}</td>
      <td className="px-4 py-3 text-sm font-semibold text-primary capitalize">{transaction.type}</td>
      <td className="px-4 py-3 text-sm">
        <StatusPill tone={tone}>{formatCurrency(transaction.amount, currency)}</StatusPill>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(transaction.balanceAfter, currency)}</td>
      <td className="px-4 py-3 text-sm text-slate-500">{transaction.referenceId || '—'}</td>
    </tr>
  );
};

TransactionRow.propTypes = {
  transaction: PropTypes.shape({
    id: PropTypes.string.isRequired,
    occurredAt: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    balanceAfter: PropTypes.number.isRequired,
    referenceId: PropTypes.string
  }).isRequired,
  currency: PropTypes.string.isRequired
};

const WalletTransactionsPanel = ({
  transactions = [],
  currency,
  loading = false,
  meta,
  filter,
  onFilterChange,
  onPaginate,
  onOpenLedger,
  onExport,
  exporting = false,
  exportError = null
}) => (
  <div className="space-y-5 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 className="text-lg font-semibold text-primary">Transaction history</h3>
        <p className="text-sm text-slate-600">Latest wallet activity including holds, releases, and adjustments.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-500" htmlFor="wallet-transaction-filter">
            Filter
          </label>
          <select
            id="wallet-transaction-filter"
            className="rounded-2xl border border-slate-200 bg-white px-3 py-1 text-sm"
            value={filter}
            onChange={(event) => onFilterChange(event.target.value)}
          >
            <option value="all">All activity</option>
            <option value="credit">Credits</option>
            <option value="debit">Debits</option>
            <option value="hold">Holds</option>
            <option value="release">Releases</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onOpenLedger}>
            Open full ledger
          </Button>
          <Button type="button" size="sm" onClick={onExport} disabled={exporting}>
            {exporting ? 'Exporting…' : 'Download CSV'}
          </Button>
        </div>
      </div>
    </div>

    {exportError ? <p className="text-xs text-rose-600">{exportError}</p> : null}

    {loading ? (
      <div className="flex items-center justify-center py-10">
        <Spinner className="h-5 w-5 text-primary" />
      </div>
    ) : transactions.length === 0 ? (
      <p className="text-sm text-slate-600">
        No transactions captured yet. Manual adjustments and automated holds will appear here.
      </p>
    ) : (
      <div className="overflow-hidden rounded-2xl border border-slate-100">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Balance after</th>
              <th className="px-4 py-3">Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} currency={currency} />
            ))}
          </tbody>
        </table>
      </div>
    )}

    {meta.total > meta.limit ? (
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing {meta.offset + 1}–
          {Math.min(meta.offset + transactions.length, meta.total)} of {meta.total}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={meta.offset === 0 || loading}
            onClick={() =>
              onPaginate(Math.max(meta.offset - meta.limit, 0))
            }
          >
            Previous
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={meta.offset + meta.limit >= meta.total || loading}
            onClick={() =>
              onPaginate(meta.offset + meta.limit)
            }
          >
            Next
          </Button>
        </div>
      </div>
    ) : null}
  </div>
);

WalletTransactionsPanel.propTypes = {
  transactions: PropTypes.arrayOf(PropTypes.object),
  currency: PropTypes.string.isRequired,
  loading: PropTypes.bool,
  meta: PropTypes.shape({
    total: PropTypes.number,
    limit: PropTypes.number,
    offset: PropTypes.number
  }).isRequired,
  filter: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onPaginate: PropTypes.func.isRequired,
  onOpenLedger: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  exporting: PropTypes.bool,
  exportError: PropTypes.string
};

WalletTransactionsPanel.defaultProps = {
  exporting: false,
  exportError: null
};

export default WalletTransactionsPanel;
