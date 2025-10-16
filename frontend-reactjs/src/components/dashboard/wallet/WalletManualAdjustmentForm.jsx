import PropTypes from 'prop-types';
import { Button, FormField, SegmentedControl, TextInput } from '../../ui/index.js';

const WalletManualAdjustmentForm = ({
  currency,
  form,
  onFieldChange,
  onSubmit,
  saving = false,
  message = null,
  canTransact = true,
  onTypeChange
}) => (
  <form onSubmit={onSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
    <div>
      <h3 className="text-lg font-semibold text-primary">Manual adjustment</h3>
      <p className="text-sm text-slate-600">
        Top up the wallet, place holds for upcoming work, release funds, or debit balances when refunds are due.
      </p>
    </div>

    <SegmentedControl
      name="wallet-transaction-type"
      value={form.type}
      onChange={onTypeChange}
      options={[
        { value: 'credit', label: 'Add funds' },
        { value: 'hold', label: 'Hold funds' },
        { value: 'release', label: 'Release hold' },
        { value: 'debit', label: 'Debit' }
      ]}
    />

    <FormField id="wallet-transaction-amount" label="Amount">
      <TextInput
        id="wallet-transaction-amount"
        type="number"
        min="0"
        step="0.01"
        required
        value={form.amount}
        onChange={(event) => onFieldChange('amount', event.target.value)}
        prefix={currency}
        disabled={!canTransact}
      />
    </FormField>

    <FormField id="wallet-transaction-reference" label="Reference">
      <TextInput
        id="wallet-transaction-reference"
        value={form.referenceId}
        onChange={(event) => onFieldChange('referenceId', event.target.value)}
        placeholder="Work order, invoice, or note"
        disabled={!canTransact}
      />
    </FormField>

    <FormField id="wallet-transaction-description" label="Internal notes" optionalLabel="Optional">
      <TextInput
        id="wallet-transaction-description"
        value={form.description}
        onChange={(event) => onFieldChange('description', event.target.value)}
        placeholder="e.g. Emergency deployment top-up"
        disabled={!canTransact}
      />
    </FormField>

    <FormField id="wallet-transaction-note" label="Customer-facing note" optionalLabel="Optional">
      <TextInput
        id="wallet-transaction-note"
        value={form.note}
        onChange={(event) => onFieldChange('note', event.target.value)}
        placeholder="Visible in booking history"
        disabled={!canTransact}
      />
    </FormField>

    {message ? (
      <p className="text-sm text-slate-600">{message}</p>
    ) : (
      <p className="text-xs text-slate-500">
        Holds reduce available balance but not total balance. Releases return held funds to the available pool.
      </p>
    )}

    <div className="flex justify-end">
      <Button type="submit" disabled={!canTransact || saving}>
        {saving ? 'Recording…' : 'Record transaction'}
      </Button>
    </div>
  </form>
);

WalletManualAdjustmentForm.propTypes = {
  currency: PropTypes.string.isRequired,
  form: PropTypes.shape({
    type: PropTypes.string,
    amount: PropTypes.string,
    description: PropTypes.string,
    referenceId: PropTypes.string,
    note: PropTypes.string
  }).isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  message: PropTypes.string,
  canTransact: PropTypes.bool,
  onTypeChange: PropTypes.func.isRequired
};

export default WalletManualAdjustmentForm;
