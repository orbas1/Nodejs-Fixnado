import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { Button, FormField, Spinner, StatusPill, TextInput } from '../../ui/index.js';

const MethodCard = ({
  method,
  onSetDefault,
  onToggleStatus,
  onEdit,
  onDelete,
  isDefault,
  isEditing,
  disabled
}) => {
  const statusTone =
    method.status === 'active'
      ? 'success'
      : method.status === 'pending'
      ? 'warning'
      : method.status === 'rejected'
      ? 'danger'
      : 'neutral';

  const summary = method.details || {};
  const cardTone = isEditing
    ? 'border-primary/40 ring-2 ring-primary/20 bg-primary/5'
    : 'border-slate-200 bg-white/90';

  return (
    <article className={`flex flex-col justify-between rounded-2xl border p-5 shadow-sm transition ${cardTone}`}>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-semibold text-primary">{method.label}</h4>
          <StatusPill tone={statusTone}>{method.status}</StatusPill>
        </div>
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{method.type.replace('_', ' ')}</p>
        {method.maskedIdentifier ? <p className="text-sm text-slate-600">{method.maskedIdentifier}</p> : null}
        {summary.bankName ? <p className="text-xs text-slate-500">{summary.bankName}</p> : null}
        {summary.provider ? <p className="text-xs text-slate-500">{summary.provider}</p> : null}
        {summary.handle ? <p className="text-xs text-slate-500">{summary.handle}</p> : null}
        {summary.notes ? <p className="text-xs text-slate-500">{summary.notes}</p> : null}
        {method.supportingDocumentUrl ? (
          <a
            href={method.supportingDocumentUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-accent hover:underline"
          >
            View supporting document
          </a>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => onEdit(method)} disabled={disabled}>
          {isEditing ? 'Editing…' : 'Edit details'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(method)} disabled={disabled}>
          Remove
        </Button>
        {!isDefault ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onSetDefault(method)}
            disabled={disabled}
          >
            Set as default payout
          </Button>
        ) : (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Default payout
          </span>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleStatus(method)}
          disabled={disabled}
        >
          {method.status === 'active' ? 'Disable' : 'Activate'}
        </Button>
      </div>
    </article>
  );
};

MethodCard.propTypes = {
  method: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    maskedIdentifier: PropTypes.string,
    supportingDocumentUrl: PropTypes.string,
    details: PropTypes.object
  }).isRequired,
  onSetDefault: PropTypes.func.isRequired,
  onToggleStatus: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  isDefault: PropTypes.bool,
  isEditing: PropTypes.bool,
  disabled: PropTypes.bool
};

MethodCard.defaultProps = {
  isDefault: false,
  isEditing: false,
  disabled: false
};

const WalletPaymentMethods = ({
  form,
  mode,
  editingMethodId,
  onFieldChange,
  onSubmit,
  onCancelEdit,
  onEdit,
  onDelete,
  saving,
  message,
  canEditMethods,
  methods,
  methodsLoading,
  onRefresh,
  onSetDefault,
  onToggleStatus,
  autopayoutMethodId
}) => {
  const methodType = form.type;
  const bankFieldsVisible = methodType === 'bank_account';
  const cardFieldsVisible = methodType === 'card';
  const walletFieldsVisible = methodType === 'external_wallet';

  const methodOptions = useMemo(
    () => [
      { value: 'bank_account', label: 'Bank account' },
      { value: 'card', label: 'Card' },
      { value: 'external_wallet', label: 'External wallet' }
    ],
    []
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-primary">
              {mode === 'edit' ? 'Update payout destination' : 'Add payout destination'}
            </h3>
            <p className="text-sm text-slate-600">
              Register a bank account, card, or external wallet to receive surplus funds and dispute releases.
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onRefresh} disabled={methodsLoading}>
            Refresh
          </Button>
        </div>

        {mode === 'edit' ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            Editing <span className="font-semibold">{form.label || 'selected payout method'}</span>. Changes update automation instantly.
            <Button type="button" variant="link" size="xs" className="ml-2" onClick={onCancelEdit}>
              Cancel edit
            </Button>
          </div>
        ) : null}

        <FormField id="wallet-method-label" label="Display name">
          <TextInput
            id="wallet-method-label"
            value={form.label}
            onChange={(event) => onFieldChange('label', event.target.value)}
            required
            disabled={!canEditMethods}
          />
        </FormField>

        <FormField id="wallet-method-type" label="Method type">
          <select
            id="wallet-method-type"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm"
            value={methodType}
            onChange={(event) => onFieldChange('type', event.target.value)}
            disabled={!canEditMethods}
          >
            {methodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        {bankFieldsVisible ? (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField id="wallet-method-holder" label="Account holder">
              <TextInput
                id="wallet-method-holder"
                value={form.accountHolder}
                onChange={(event) => onFieldChange('accountHolder', event.target.value)}
                disabled={!canEditMethods}
              />
            </FormField>
            <FormField id="wallet-method-bank" label="Bank name" optionalLabel="Optional">
              <TextInput
                id="wallet-method-bank"
                value={form.bankName}
                onChange={(event) => onFieldChange('bankName', event.target.value)}
                disabled={!canEditMethods}
              />
            </FormField>
            <FormField id="wallet-method-account" label="Account number">
              <TextInput
                id="wallet-method-account"
                value={form.accountNumber}
                onChange={(event) => onFieldChange('accountNumber', event.target.value)}
                disabled={!canEditMethods}
              />
            </FormField>
            <FormField id="wallet-method-sort" label="Sort code / routing" optionalLabel="Optional">
              <TextInput
                id="wallet-method-sort"
                value={form.sortCode}
                onChange={(event) => onFieldChange('sortCode', event.target.value)}
                disabled={!canEditMethods}
              />
            </FormField>
          </div>
        ) : null}

        {cardFieldsVisible ? (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField id="wallet-method-brand" label="Card brand">
              <TextInput
                id="wallet-method-brand"
                value={form.brand}
                onChange={(event) => onFieldChange('brand', event.target.value)}
                disabled={!canEditMethods}
              />
            </FormField>
            <FormField id="wallet-method-expiry" label="Expiry (MM/YY)">
              <div className="grid grid-cols-2 gap-3">
                <TextInput
                  id="wallet-method-expiry-month"
                  value={form.expiryMonth}
                  onChange={(event) => onFieldChange('expiryMonth', event.target.value)}
                  placeholder="MM"
                  maxLength={2}
                  disabled={!canEditMethods}
                />
                <TextInput
                  id="wallet-method-expiry-year"
                  value={form.expiryYear}
                  onChange={(event) => onFieldChange('expiryYear', event.target.value)}
                  placeholder="YY"
                  maxLength={2}
                  disabled={!canEditMethods}
                />
              </div>
            </FormField>
          </div>
        ) : null}

        {walletFieldsVisible ? (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField id="wallet-method-provider" label="Provider">
              <TextInput
                id="wallet-method-provider"
                value={form.provider}
                onChange={(event) => onFieldChange('provider', event.target.value)}
                disabled={!canEditMethods}
              />
            </FormField>
            <FormField id="wallet-method-handle" label="Handle or address">
              <TextInput
                id="wallet-method-handle"
                value={form.handle}
                onChange={(event) => onFieldChange('handle', event.target.value)}
                disabled={!canEditMethods}
              />
            </FormField>
          </div>
        ) : null}

        <FormField id="wallet-method-notes" label="Internal notes" optionalLabel="Optional">
          <TextInput
            id="wallet-method-notes"
            value={form.notes}
            onChange={(event) => onFieldChange('notes', event.target.value)}
            disabled={!canEditMethods}
          />
        </FormField>

        <FormField id="wallet-method-document" label="Supporting document URL" optionalLabel="Optional">
          <TextInput
            id="wallet-method-document"
            value={form.supportingDocumentUrl}
            onChange={(event) => onFieldChange('supportingDocumentUrl', event.target.value)}
            placeholder="https://"
            disabled={!canEditMethods}
          />
        </FormField>

        <label className="flex items-center gap-3 text-sm text-slate-600">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            checked={Boolean(form.isDefaultPayout)}
            onChange={(event) => onFieldChange('isDefaultPayout', event.target.checked)}
            disabled={!canEditMethods}
          />
          Set as default payout destination
        </label>

        {message ? (
          <p className="text-sm text-slate-600">{message}</p>
        ) : (
          <p className="text-xs text-slate-500">
            Only non-sensitive account metadata is stored—card numbers and bank details are truncated automatically.
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={!canEditMethods || saving}>
            {saving ? 'Saving…' : mode === 'edit' ? 'Update method' : 'Add method'}
          </Button>
        </div>
      </form>

      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primary">Payment methods</h3>
          <Button type="button" variant="ghost" size="sm" onClick={onRefresh} disabled={methodsLoading}>
            Refresh
          </Button>
        </div>
        {methodsLoading ? (
          <div className="flex items-center justify-center py-6">
            <Spinner className="h-4 w-4 text-primary" />
          </div>
        ) : methods.length === 0 ? (
          <p className="text-sm text-slate-600">
            No payout destinations registered yet. Add a bank account, card, or wallet above to enable automation.
          </p>
        ) : (
          <div className="grid gap-4">
            {methods.map((method) => (
              <MethodCard
                key={method.id}
                method={method}
                onSetDefault={onSetDefault}
                onToggleStatus={onToggleStatus}
                onEdit={onEdit}
                onDelete={onDelete}
                isDefault={autopayoutMethodId === method.id}
                isEditing={mode === 'edit' && editingMethodId === method.id}
                disabled={!canEditMethods || saving}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

WalletPaymentMethods.propTypes = {
  form: PropTypes.object.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']),
  editingMethodId: PropTypes.string,
  onFieldChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancelEdit: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  message: PropTypes.string,
  canEditMethods: PropTypes.bool,
  methods: PropTypes.arrayOf(PropTypes.object),
  methodsLoading: PropTypes.bool,
  onRefresh: PropTypes.func.isRequired,
  onSetDefault: PropTypes.func.isRequired,
  onToggleStatus: PropTypes.func.isRequired,
  autopayoutMethodId: PropTypes.string
};

WalletPaymentMethods.defaultProps = {
  mode: 'create',
  editingMethodId: null,
  saving: false,
  message: null,
  canEditMethods: true,
  methods: [],
  methodsLoading: false,
  autopayoutMethodId: null
};

export default WalletPaymentMethods;
