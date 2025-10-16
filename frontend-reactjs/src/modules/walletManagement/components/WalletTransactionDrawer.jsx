import PropTypes from 'prop-types';
import { BanknotesIcon } from '@heroicons/react/24/outline';
import { Button, StatusPill, TextInput } from '../../../components/ui/index.js';
import WalletDrawer from './WalletDrawer.jsx';

export default function WalletTransactionDrawer({
  drawer,
  onClose,
  onSubmit,
  onUpdateForm,
  transactionTypes
}) {
  return (
    <WalletDrawer open={drawer.open} onClose={onClose} title="Record wallet transaction">
      {drawer.account ? (
        <form className="space-y-5" onSubmit={onSubmit}>
          <p className="text-sm text-slate-600">
            {drawer.account.displayName} • {drawer.account.ownerType} • {drawer.account.ownerId}
          </p>
          <label className="block text-sm font-semibold text-slate-700">
            Transaction type
            <select
              value={drawer.form.type}
              onChange={(event) => onUpdateForm({ type: event.target.value })}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {transactionTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <TextInput
              label="Amount"
              type="number"
              step="0.01"
              value={drawer.form.amount}
              onChange={(event) => onUpdateForm({ amount: event.target.value })}
              required
            />
            <TextInput
              label="Currency"
              value={drawer.form.currency}
              onChange={(event) => onUpdateForm({ currency: event.target.value.toUpperCase() })}
              maxLength={3}
            />
          </div>
          <TextInput
            label="Description"
            value={drawer.form.description}
            onChange={(event) => onUpdateForm({ description: event.target.value })}
            placeholder="Visible in ledger exports"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Reference type"
              value={drawer.form.referenceType}
              onChange={(event) => onUpdateForm({ referenceType: event.target.value })}
              placeholder="e.g. dispute, payout, adjustment"
            />
            <TextInput
              label="Reference ID"
              value={drawer.form.referenceId}
              onChange={(event) => onUpdateForm({ referenceId: event.target.value })}
              placeholder="Optional external reference"
            />
          </div>
          {drawer.error ? <StatusPill tone="danger">{drawer.error}</StatusPill> : null}
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" icon={BanknotesIcon} loading={drawer.saving}>
              Post transaction
            </Button>
          </div>
        </form>
      ) : null}
    </WalletDrawer>
  );
}

WalletTransactionDrawer.propTypes = {
  drawer: PropTypes.shape({
    open: PropTypes.bool.isRequired,
    account: PropTypes.object,
    form: PropTypes.object.isRequired,
    saving: PropTypes.bool.isRequired,
    error: PropTypes.string
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onUpdateForm: PropTypes.func.isRequired,
  transactionTypes: PropTypes.array.isRequired
};
