import PropTypes from 'prop-types';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Spinner from '../../ui/Spinner.jsx';
import SettingsPanelShell from './SettingsPanelShell.jsx';
import StatusBanner from './StatusBanner.jsx';

function BillingSettingsPanel({
  form,
  onFieldChange,
  onAddRecipient,
  onUpdateRecipient,
  onRemoveRecipient,
  onSubmit,
  saving,
  status,
  currencyOptions
}) {
  const recipients = form.invoiceRecipients ?? [];

  return (
    <SettingsPanelShell
      id="billing-settings"
      title="Billing preferences"
      description="Control currency, payment methods, and who receives invoices."
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
            Preferred currency
            <select
              value={form.preferredCurrency}
              onChange={(event) => onFieldChange('preferredCurrency', event.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {currencyOptions.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
            Default payment method
            <input
              type="text"
              value={form.defaultPaymentMethod}
              onChange={(event) => onFieldChange('defaultPaymentMethod', event.target.value)}
              placeholder="Visa ending •••• 4242"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
          Billing notes
          <textarea
            value={form.paymentNotes}
            onChange={(event) => onFieldChange('paymentNotes', event.target.value)}
            rows={3}
            placeholder="PO required? Internal cost centre? Add those notes here."
            className="rounded-3xl border border-slate-200 px-4 py-3 text-sm text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">Invoice recipients</p>
              <p className="text-xs text-slate-500">Every invoice email includes these recipients in CC.</p>
            </div>
            <button
              type="button"
              onClick={onAddRecipient}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-3 py-1 text-xs font-semibold text-primary shadow-sm transition hover:border-primary/40"
            >
              <PlusIcon className="h-4 w-4" aria-hidden="true" /> Add recipient
            </button>
          </div>
          {recipients.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
              No invoice recipients yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {recipients.map((recipient) => (
                <li
                  key={recipient.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex-row md:items-center md:gap-4"
                >
                  <input
                    type="text"
                    value={recipient.name}
                    onChange={(event) => onUpdateRecipient(recipient.id, 'name', event.target.value)}
                    placeholder="Name"
                    className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    type="email"
                    value={recipient.email}
                    onChange={(event) => onUpdateRecipient(recipient.id, 'email', event.target.value)}
                    placeholder="email@example.com"
                    className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveRecipient(recipient.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-600 shadow-sm transition hover:bg-rose-50"
                  >
                    <TrashIcon className="h-4 w-4" aria-hidden="true" /> Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <StatusBanner status={status} />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={saving}
          >
            {saving && <Spinner className="h-4 w-4 text-white" />}
            {saving ? 'Saving…' : 'Save billing'}
          </button>
        </div>
      </form>
    </SettingsPanelShell>
  );
}

BillingSettingsPanel.propTypes = {
  form: PropTypes.shape({
    preferredCurrency: PropTypes.string,
    defaultPaymentMethod: PropTypes.string,
    paymentNotes: PropTypes.string,
    invoiceRecipients: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string,
        email: PropTypes.string
      })
    )
  }).isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onAddRecipient: PropTypes.func.isRequired,
  onUpdateRecipient: PropTypes.func.isRequired,
  onRemoveRecipient: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool.isRequired,
  status: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']).isRequired,
    message: PropTypes.string.isRequired
  }),
  currencyOptions: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default BillingSettingsPanel;
