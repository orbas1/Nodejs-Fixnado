import PropTypes from 'prop-types';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { Button, StatusPill, TextInput } from '../../../components/ui/index.js';
import WalletDrawer from './WalletDrawer.jsx';

export default function WalletAccountDrawer({
  drawer,
  onClose,
  onSubmit,
  onUpdateForm,
  ownerOptions,
  statusOptions
}) {
  return (
    <WalletDrawer
      open={drawer.open}
      onClose={onClose}
      title={drawer.mode === 'create' ? 'Create wallet account' : 'Edit wallet account'}
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        <TextInput
          label="Account name"
          value={drawer.form.displayName}
          onChange={(event) => onUpdateForm({ displayName: event.target.value })}
          required
        />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700">
            Owner type
            <select
              value={drawer.form.ownerType}
              onChange={(event) => onUpdateForm({ ownerType: event.target.value })}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              disabled={drawer.mode === 'edit'}
            >
              {ownerOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <TextInput
            label="Owner ID"
            value={drawer.form.ownerId}
            onChange={(event) => onUpdateForm({ ownerId: event.target.value })}
            required
            disabled={drawer.mode === 'edit'}
            hint="Provide the provider, company, or tenant identifier linked to this wallet."
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Currency"
            value={drawer.form.currency}
            onChange={(event) => onUpdateForm({ currency: event.target.value.toUpperCase() })}
            maxLength={3}
          />
          <label className="block text-sm font-semibold text-slate-700">
            Status
            <select
              value={drawer.form.status}
              onChange={(event) => onUpdateForm({ status: event.target.value })}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block text-sm font-semibold text-slate-700">
          Operational note
          <textarea
            value={drawer.form.metadataNote}
            onChange={(event) => onUpdateForm({ metadataNote: event.target.value })}
            rows={3}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Optional note visible to finance operators."
          />
        </label>
        {drawer.error ? <StatusPill tone="danger">{drawer.error}</StatusPill> : null}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" icon={ShieldCheckIcon} loading={drawer.saving}>
            {drawer.mode === 'create' ? 'Create account' : 'Save changes'}
          </Button>
        </div>
      </form>
    </WalletDrawer>
  );
}

WalletAccountDrawer.propTypes = {
  drawer: PropTypes.shape({
    open: PropTypes.bool.isRequired,
    mode: PropTypes.oneOf(['create', 'edit']).isRequired,
    form: PropTypes.object.isRequired,
    accountId: PropTypes.string,
    saving: PropTypes.bool.isRequired,
    error: PropTypes.string
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onUpdateForm: PropTypes.func.isRequired,
  ownerOptions: PropTypes.array.isRequired,
  statusOptions: PropTypes.array.isRequired
};
