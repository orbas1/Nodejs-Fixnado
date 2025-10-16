import PropTypes from 'prop-types';
import { Button, FormField, TextInput } from '../../ui/index.js';

const WalletConfigurationForm = ({
  currency,
  form,
  onChange,
  onSubmit,
  saving = false,
  message = null,
  canManage = true,
  autopayoutOptions = []
}) => (
  <form onSubmit={onSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
    <div>
      <h3 className="text-lg font-semibold text-primary">Wallet configuration</h3>
      <p className="text-sm text-slate-600">Control wallet naming, autopayout rules, and spending limits.</p>
    </div>

    <FormField id="wallet-alias" label="Wallet name">
      <TextInput
        id="wallet-alias"
        value={form.alias}
        onChange={(event) => onChange('alias', event.target.value)}
        placeholder="e.g. Facilities wallet"
        disabled={!canManage}
      />
    </FormField>

    <div className="space-y-3">
      <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
          checked={Boolean(form.autopayoutEnabled)}
          onChange={(event) => onChange('autopayoutEnabled', event.target.checked)}
          disabled={!canManage}
        />
        Enable autopayout automation
      </label>
      <p className="text-xs text-slate-500">
        When enabled, surplus funds above your threshold will be routed to the default payout method automatically.
      </p>
    </div>

    <FormField id="wallet-autopayout-method" label="Default payout destination">
      <select
        id="wallet-autopayout-method"
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm"
        value={form.autopayoutMethodId}
        onChange={(event) => onChange('autopayoutMethodId', event.target.value)}
        disabled={!canManage || autopayoutOptions.length <= 1}
      >
        {autopayoutOptions.map((option) => (
          <option key={option.value || 'none'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>

    <div className="grid gap-4 md:grid-cols-2">
      <FormField id="wallet-autopayout-threshold" label="Autopayout threshold">
        <TextInput
          id="wallet-autopayout-threshold"
          type="number"
          min="0"
          step="0.01"
          value={form.autopayoutThreshold}
          onChange={(event) => onChange('autopayoutThreshold', event.target.value)}
          disabled={!canManage}
          prefix={currency}
          hint="Release funds automatically once balance exceeds this amount."
        />
      </FormField>
      <FormField id="wallet-spending-limit" label="Spending cap">
        <TextInput
          id="wallet-spending-limit"
          type="number"
          min="0"
          step="0.01"
          value={form.spendingLimit}
          onChange={(event) => onChange('spendingLimit', event.target.value)}
          disabled={!canManage}
          prefix={currency}
          hint="Optional limit to prevent overfunding the wallet."
        />
      </FormField>
    </div>

    {message ? (
      <p className="text-sm text-slate-600">{message}</p>
    ) : (
      <p className="text-xs text-slate-500">
        Changes are audited and applied immediately. Autopayout requires at least one active payment method.
      </p>
    )}

    <div className="flex justify-end">
      <Button type="submit" disabled={!canManage || saving}>
        {saving ? 'Saving…' : 'Save configuration'}
      </Button>
    </div>
  </form>
);

WalletConfigurationForm.propTypes = {
  currency: PropTypes.string.isRequired,
  form: PropTypes.shape({
    alias: PropTypes.string,
    autopayoutEnabled: PropTypes.bool,
    autopayoutMethodId: PropTypes.string,
    autopayoutThreshold: PropTypes.string,
    spendingLimit: PropTypes.string
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  message: PropTypes.string,
  canManage: PropTypes.bool,
  autopayoutOptions: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })
  )
};

export default WalletConfigurationForm;
