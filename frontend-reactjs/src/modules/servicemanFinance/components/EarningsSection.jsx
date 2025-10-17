import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../components/ui/Button.jsx';
import Modal from '../../../components/ui/Modal.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import Select from '../../../components/ui/Select.jsx';
import TextArea from '../../../components/ui/TextArea.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import { useServicemanFinance } from '../ServicemanFinanceProvider.jsx';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'payable', label: 'Payable' },
  { value: 'paid', label: 'Paid' },
  { value: 'withheld', label: 'Withheld' }
];

const defaultDraft = (currency) => ({
  title: '',
  reference: '',
  amount: '',
  currency: currency || 'GBP',
  status: 'pending',
  dueAt: '',
  paidAt: '',
  notes: ''
});

const formatDate = (value) => {
  if (!value) return '—';
  try {
    const date = new Date(value);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return value;
  }
};

function EarningsTableRow({ earning, onEdit, onMarkPaid }) {
  const amount = useMemo(() => {
    try {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: earning.currency || 'GBP',
        minimumFractionDigits: 2
      }).format(Number(earning.amount ?? 0));
    } catch {
      return `${earning.currency ?? '£'}${earning.amount ?? 0}`;
    }
  }, [earning.amount, earning.currency]);

  return (
    <tr className="border-b border-slate-100 last:border-none">
      <td className="px-4 py-3 text-sm font-semibold text-slate-700">
        <div>{earning.title}</div>
        {earning.reference ? <div className="text-xs text-slate-500">Ref: {earning.reference}</div> : null}
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">{amount}</td>
      <td className="px-4 py-3 text-sm">
        <StatusPill status={earning.status} />
      </td>
      <td className="px-4 py-3 text-sm text-slate-500">{formatDate(earning.dueAt)}</td>
      <td className="px-4 py-3 text-sm text-slate-500">{formatDate(earning.paidAt)}</td>
      <td className="px-4 py-3 text-sm text-right">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(earning)}>
            Edit
          </Button>
          {earning.status !== 'paid' ? (
            <Button variant="secondary" size="sm" onClick={() => onMarkPaid(earning)}>
              Mark paid
            </Button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

EarningsTableRow.propTypes = {
  earning: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    reference: PropTypes.string,
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string,
    status: PropTypes.string,
    dueAt: PropTypes.string,
    paidAt: PropTypes.string
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onMarkPaid: PropTypes.func.isRequired
};

export default function EarningsSection() {
  const {
    workspace,
    earnings: { items, meta, loading, error, filters, setFilters, reload, create, update, updateStatus }
  } = useServicemanFinance();
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState(() => defaultDraft(workspace?.profile?.currency));
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const openCreateModal = () => {
    setEditingId(null);
    setDraft(defaultDraft(workspace?.profile?.currency));
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (earning) => {
    setEditingId(earning.id);
    setDraft({
      title: earning.title,
      reference: earning.reference ?? '',
      amount: earning.amount != null ? String(earning.amount) : '',
      currency: earning.currency ?? workspace?.profile?.currency ?? 'GBP',
      status: earning.status ?? 'pending',
      dueAt: earning.dueAt ? earning.dueAt.slice(0, 10) : '',
      paidAt: earning.paidAt ? earning.paidAt.slice(0, 10) : '',
      notes: earning.notes ?? ''
    });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormError(null);
    setSaving(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    const payload = {
      title: draft.title,
      reference: draft.reference || null,
      amount: Number.parseFloat(draft.amount || 0),
      currency: draft.currency,
      status: draft.status,
      dueAt: draft.dueAt ? new Date(draft.dueAt).toISOString() : null,
      paidAt: draft.paidAt ? new Date(draft.paidAt).toISOString() : null,
      notes: draft.notes || null
    };

    try {
      if (!payload.title || Number.isNaN(payload.amount)) {
        throw new Error('Please provide a title and valid amount.');
      }
      if (editingId) {
        await update(editingId, payload);
      } else {
        await create(payload);
      }
      closeModal();
    } catch (caught) {
      console.error('Failed to save earning', caught);
      setFormError(caught.message ?? 'Unable to save earning');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async (earning) => {
    try {
      await updateStatus(earning.id, 'paid');
    } catch (caught) {
      console.error('Failed to mark earning as paid', caught);
      setFormError(caught.message ?? 'Unable to update earning status');
    }
  };

  const statusFilterOptions = [{ value: 'all', label: 'All statuses' }, ...STATUS_OPTIONS];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-primary">Earnings & payouts</h3>
          <p className="text-sm text-slate-600">Review recorded commissions and create manual adjustments.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              reload();
            }}
          >
            <Select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            >
              {statusFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <TextInput
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Search reference or title"
            />
            <Button type="submit" variant="secondary" size="sm" disabled={loading}>
              {loading ? 'Filtering…' : 'Apply'}
            </Button>
          </form>
          <Button onClick={openCreateModal}>Record earning</Button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Earning</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Paid</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-sm text-slate-500">
                  <div className="flex items-center justify-center gap-3">
                    <Spinner size="sm" /> Loading earnings…
                  </div>
                </td>
              </tr>
            ) : items.length ? (
              items.map((earning) => (
                <EarningsTableRow key={earning.id} earning={earning} onEdit={openEditModal} onMarkPaid={handleMarkPaid} />
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-sm text-slate-500">
                  No earnings recorded yet. Create an entry to start tracking payouts.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-slate-500">
        {error ? (
          <span className="text-rose-600">{error.message ?? 'Unable to load earnings'}</span>
        ) : (
          <span>
            {meta.total ?? 0} total records • Outstanding {meta.outstanding ?? 0} • Payable {meta.payable ?? 0} • Paid {meta.paid ?? 0}
          </span>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit earning' : 'Record earning'}
        size="lg"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <TextInput
            label="Title"
            required
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
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
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Status"
              value={draft.status}
              onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <TextInput
              label="Reference"
              value={draft.reference}
              onChange={(event) => setDraft((current) => ({ ...current, reference: event.target.value }))}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Due date"
              type="date"
              value={draft.dueAt}
              onChange={(event) => setDraft((current) => ({ ...current, dueAt: event.target.value }))}
            />
            <TextInput
              label="Paid date"
              type="date"
              value={draft.paidAt}
              onChange={(event) => setDraft((current) => ({ ...current, paidAt: event.target.value }))}
            />
          </div>
          <TextArea
            label="Notes"
            rows={3}
            value={draft.notes}
            onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
          />

          {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Update earning' : 'Create earning'}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
