import PropTypes from 'prop-types';
import { Button, Card, SegmentedControl, StatusPill, TextInput } from '../../../components/ui/index.js';

export default function WalletAccountsSection({
  accountsState,
  loading,
  error,
  search,
  onSearchChange,
  statusFilter,
  statusOptions,
  onStatusFilterChange,
  onOpenEdit,
  onOpenLedger,
  onOpenTransaction,
  onPageChange,
  totalPages,
  formatCurrency
}) {
  return (
    <Card className="mt-10 space-y-6 border-slate-200 bg-white shadow-sm">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-primary">Wallet accounts</h2>
          <p className="text-sm text-slate-600">Search accounts, review balances, and open ledgers for manual adjustments.</p>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <TextInput
            label="Search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by name or owner ID"
          />
          <SegmentedControl
            name="Wallet status filter"
            value={statusFilter}
            options={statusOptions}
            onChange={onStatusFilterChange}
          />
        </div>
      </header>

      {error ? <StatusPill tone="danger">{error.message}</StatusPill> : null}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Balance</th>
              <th className="px-4 py-3">Pending payouts</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {accountsState.results.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                  {loading ? 'Loading wallet accounts…' : 'No wallet accounts match the current filters.'}
                </td>
              </tr>
            ) : (
              accountsState.results.map((account) => (
                <tr key={account.id} className="bg-white">
                  <td className="px-4 py-3 font-semibold text-slate-800">{account.displayName}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <p className="font-medium capitalize">{account.ownerType}</p>
                    <p className="text-xs text-slate-500">{account.ownerId}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-primary">{formatCurrency(account.balance, account.currency)}</p>
                    <p className="text-xs text-slate-500">Hold: {formatCurrency(account.holdBalance, account.currency)}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {account.pendingPayouts?.count > 0 ? (
                      <span>
                        {account.pendingPayouts.count} pending • {formatCurrency(account.pendingPayouts.totalAmount, account.currency)}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">None queued</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{account.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => onOpenLedger(account)}>
                        Ledger
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => onOpenTransaction(account)}>
                        Adjust
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onOpenEdit(account)}>
                        Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-4 text-sm text-slate-600 md:flex-row">
        <div>
          Showing{' '}
          {accountsState.results.length > 0
            ? `${(accountsState.page - 1) * accountsState.pageSize + 1}–${
                (accountsState.page - 1) * accountsState.pageSize + accountsState.results.length
              }`
            : '0'}{' '}
          of {accountsState.total} accounts
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={accountsState.page <= 1 || loading}
            onClick={() => onPageChange(accountsState.page - 1)}
          >
            Previous
          </Button>
          <span className="text-xs text-slate-500">Page {accountsState.page} of {totalPages}</span>
          <Button
            size="sm"
            variant="secondary"
            disabled={accountsState.page >= totalPages || loading}
            onClick={() => onPageChange(accountsState.page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
}

WalletAccountsSection.propTypes = {
  accountsState: PropTypes.shape({
    results: PropTypes.array.isRequired,
    page: PropTypes.number.isRequired,
    pageSize: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired
  }).isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.object,
  search: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  statusFilter: PropTypes.string.isRequired,
  statusOptions: PropTypes.array.isRequired,
  onStatusFilterChange: PropTypes.func.isRequired,
  onOpenEdit: PropTypes.func.isRequired,
  onOpenLedger: PropTypes.func.isRequired,
  onOpenTransaction: PropTypes.func.isRequired,
  onPageChange: PropTypes.func.isRequired,
  totalPages: PropTypes.number.isRequired,
  formatCurrency: PropTypes.func.isRequired
};
