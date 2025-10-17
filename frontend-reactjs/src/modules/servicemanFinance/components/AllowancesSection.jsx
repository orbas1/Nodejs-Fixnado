import { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../components/ui/Button.jsx';
import Modal from '../../../components/ui/Modal.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import Select from '../../../components/ui/Select.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';
import { useServicemanFinance } from '../ServicemanFinanceProvider.jsx';

const CADENCE_OPTIONS = [
  { value: 'per_job', label: 'Per job' },
  { value: 'per_day', label: 'Per day' },
  { value: 'per_week', label: 'Per week' },
  { value: 'per_month', label: 'Per month' }
];

const defaultDraft = (currency) => ({
  id: null,
  name: '',
  amount: '',
  currency: currency || 'GBP',
  cadence: 'per_job',
  effectiveFrom: '',
  effectiveTo: '',
  isActive: true
});

const formatCurrency = (value, currency = 'GBP') => {
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    }).format(Number(value ?? 0));
  } catch {
    return `${currency} ${value ?? 0}`;
  }
};

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return value;
  }
};

function AllowanceRow({ allowance, onEdit, onToggle, onDelete }) {
  return (
    <tr className="border-b border-slate-100 last:border-none">
      <td className="px-4 py-3 text-sm font-semibold text-slate-700">{allowance.name}</td>
      <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(allowance.amount, allowance.currency)}</td>
      <td className="px-4 py-3 text-sm text-slate-500">
        {CADENCE_OPTIONS.find((option) => option.value === allowance.cadence)?.label ?? allowance.cadence}
      </td>
      <td className="px-4 py-3 text-sm text-slate-500">{formatDate(allowance.effectiveFrom)}</td>
      <td className="px-4 py-3 text-sm text-slate-500">{formatDate(allowance.effectiveTo)}</td>
      <td className="px-4 py-3 text-sm">
        <StatusPill status={allowance.isActive ? 'active' : 'inactive'} />
      </td>
      <td className="px-4 py-3 text-right text-sm">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(allowance)}>
            Edit
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onToggle(allowance)}>
            {allowance.isActive ? 'Archive' : 'Activate'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(allowance)}>
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}

AllowanceRow.propTypes = {
  allowance: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    currency: PropTypes.string,
    cadence: PropTypes.string,
    effectiveFrom: PropTypes.string,
    effectiveTo: PropTypes.string,
    isActive: PropTypes.bool
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onToggle: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default function AllowancesSection() {
  const {
    workspace,
    allowances: { items, loading, error, reload, save, remove }
  } = useServicemanFinance();
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState(() => defaultDraft(workspace?.profile?.currency));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const openCreateModal = () => {
    setDraft(defaultDraft(workspace?.profile?.currency));
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (allowance) => {
    setDraft({
      id: allowance.id,
      name: allowance.name,
      amount: allowance.amount != null ? String(allowance.amount) : '',
      currency: allowance.currency ?? workspace?.profile?.currency ?? 'GBP',
      cadence: allowance.cadence ?? 'per_job',
      effectiveFrom: allowance.effectiveFrom ? allowance.effectiveFrom.slice(0, 10) : '',
      effectiveTo: allowance.effectiveTo ? allowance.effectiveTo.slice(0, 10) : '',
      isActive: allowance.isActive ?? true
    });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSaving(false);
    setFormError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    const payload = {
      id: draft.id,
      name: draft.name,
      amount: Number.parseFloat(draft.amount || 0),
      currency: draft.currency,
      cadence: draft.cadence,
      effectiveFrom: draft.effectiveFrom ? new Date(draft.effectiveFrom).toISOString() : null,
      effectiveTo: draft.effectiveTo ? new Date(draft.effectiveTo).toISOString() : null,
      isActive: draft.isActive
    };

    try {
      if (!payload.name || Number.isNaN(payload.amount)) {
        throw new Error('Please provide a name and valid amount.');
      }
      await save(payload);
      closeModal();
    } catch (caught) {
      console.error('Failed to save allowance', caught);
      setFormError(caught.message ?? 'Unable to save allowance');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (allowance) => {
    try {
      await save({ ...allowance, isActive: !allowance.isActive });
    } catch (caught) {
      console.error('Failed to toggle allowance', caught);
      setFormError(caught.message ?? 'Unable to update allowance');
    }
  };

  const deleteAllowance = async (allowance) => {
    if (!window.confirm(`Remove allowance “${allowance.name}”?`)) {
      return;
    }
    try {
      await remove(allowance.id);
    } catch (caught) {
      console.error('Failed to delete allowance', caught);
      setFormError(caught.message ?? 'Unable to delete allowance');
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-primary">Allowances & premiums</h3>
          <p className="text-sm text-slate-600">Manage recurring allowances applied to bookings.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => reload({ includeInactive: true })} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
          <Button onClick={openCreateModal}>Add allowance</Button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Cadence</th>
              <th className="px-4 py-3">Starts</th>
              <th className="px-4 py-3">Ends</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-sm text-slate-500">
                  <div className="flex items-center justify-center gap-3">
                    <Spinner size="sm" /> Loading allowances…
                  </div>
                </td>
              </tr>
            ) : items.length ? (
              items.map((allowance) => (
                <AllowanceRow
                  key={allowance.id}
                  allowance={allowance}
                  onEdit={openEditModal}
                  onToggle={toggleActive}
                  onDelete={deleteAllowance}
                />
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-sm text-slate-500">
                  No allowances configured yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-slate-500">
        {error ? <span className="text-rose-600">{error.message ?? 'Unable to load allowances'}</span> : null}
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={draft.id ? 'Edit allowance' : 'Add allowance'} size="lg">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <TextInput
            label="Name"
            required
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Amount"
              type="number"
              min="0"
              step="0.01"
              required
              value={draft.amount}
              onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))}
            />
            <TextInput
              label="Currency"
              value={draft.currency}
              onChange={(event) => setDraft((current) => ({ ...current, currency: event.target.value.toUpperCase() }))}
            />
          </div>
          <Select
            label="Cadence"
            value={draft.cadence}
            onChange={(event) => setDraft((current) => ({ ...current, cadence: event.target.value }))}
          >
            {CADENCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Effective from"
              type="date"
              value={draft.effectiveFrom}
              onChange={(event) => setDraft((current) => ({ ...current, effectiveFrom: event.target.value }))}
            />
            <TextInput
              label="Effective to"
              type="date"
              value={draft.effectiveTo}
              onChange={(event) => setDraft((current) => ({ ...current, effectiveTo: event.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="allowance-active"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              checked={draft.isActive}
              onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))}
            />
            <label htmlFor="allowance-active" className="text-sm text-slate-600">
              Active allowance
            </label>
          </div>

          {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : draft.id ? 'Update allowance' : 'Create allowance'}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
