import { useState } from 'react';
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
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'reimbursed', label: 'Reimbursed' },
  { value: 'rejected', label: 'Rejected' }
];

const CATEGORY_OPTIONS = [
  { value: 'travel', label: 'Travel & mileage' },
  { value: 'equipment', label: 'Equipment & tools' },
  { value: 'meal', label: 'Meals & sustenance' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'training', label: 'Training' },
  { value: 'other', label: 'Other' }
];

const defaultDraft = (currency) => ({
  title: '',
  description: '',
  category: 'travel',
  amount: '',
  currency: currency || 'GBP',
  status: 'draft',
  submittedAt: '',
  approvedAt: '',
  receipts: [{ label: '', url: '' }],
  notes: ''
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

function ExpenseRow({ expense, onEdit, onApprove, onReimburse }) {
  return (
    <tr className="border-b border-slate-100 last:border-none">
      <td className="px-4 py-3 text-sm font-semibold text-slate-700">
        <div>{expense.title}</div>
        <div className="text-xs text-slate-500">{CATEGORY_OPTIONS.find((option) => option.value === expense.category)?.label}</div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(expense.amount, expense.currency)}</td>
      <td className="px-4 py-3 text-sm">
        <StatusPill status={expense.status} />
      </td>
      <td className="px-4 py-3 text-sm text-slate-500">{formatDate(expense.submittedAt)}</td>
      <td className="px-4 py-3 text-sm text-slate-500">{formatDate(expense.approvedAt)}</td>
      <td className="px-4 py-3 text-right text-sm">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(expense)}>
            Edit
          </Button>
          {expense.status === 'submitted' ? (
            <Button variant="secondary" size="sm" onClick={() => onApprove(expense)}>
              Approve
            </Button>
          ) : null}
          {expense.status === 'approved' ? (
            <Button variant="secondary" size="sm" onClick={() => onReimburse(expense)}>
              Mark reimbursed
            </Button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

ExpenseRow.propTypes = {
  expense: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string,
    status: PropTypes.string,
    submittedAt: PropTypes.string,
    approvedAt: PropTypes.string
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onApprove: PropTypes.func.isRequired,
  onReimburse: PropTypes.func.isRequired
};

export default function ExpensesSection() {
  const {
    workspace,
    expenses: { items, meta, loading, error, filters, setFilters, reload, create, update, updateStatus }
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

  const openEditModal = (expense) => {
    setEditingId(expense.id);
    setDraft({
      title: expense.title,
      description: expense.description ?? '',
      category: expense.category ?? 'travel',
      amount: expense.amount != null ? String(expense.amount) : '',
      currency: expense.currency ?? workspace?.profile?.currency ?? 'GBP',
      status: expense.status ?? 'draft',
      submittedAt: expense.submittedAt ? expense.submittedAt.slice(0, 10) : '',
      approvedAt: expense.approvedAt ? expense.approvedAt.slice(0, 10) : '',
      receipts: Array.isArray(expense.receipts) && expense.receipts.length ? expense.receipts : [{ label: '', url: '' }],
      notes: expense.notes ?? ''
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
      description: draft.description || null,
      category: draft.category,
      amount: Number.parseFloat(draft.amount || 0),
      currency: draft.currency,
      status: draft.status,
      submittedAt: draft.submittedAt ? new Date(draft.submittedAt).toISOString() : null,
      approvedAt: draft.approvedAt ? new Date(draft.approvedAt).toISOString() : null,
      receipts: (draft.receipts || [])
        .filter((receipt) => receipt.url)
        .map((receipt) => ({
          label: receipt.label || 'Receipt',
          url: receipt.url,
          uploadedAt: receipt.uploadedAt || new Date().toISOString()
        })),
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
      console.error('Failed to save expense', caught);
      setFormError(caught.message ?? 'Unable to save expense');
    } finally {
      setSaving(false);
    }
  };

  const markStatus = async (expense, status) => {
    try {
      await updateStatus(expense.id, status);
    } catch (caught) {
      console.error('Failed to update expense status', caught);
      setFormError(caught.message ?? 'Unable to update expense');
    }
  };

  const handleAddReceipt = () => {
    setDraft((current) => ({ ...current, receipts: [...current.receipts, { label: '', url: '' }] }));
  };

  const handleReceiptChange = (index, field, value) => {
    setDraft((current) => ({
      ...current,
      receipts: current.receipts.map((receipt, idx) => (idx === index ? { ...receipt, [field]: value } : receipt))
    }));
  };

  const handleRemoveReceipt = (index) => {
    setDraft((current) => ({
      ...current,
      receipts: current.receipts.filter((_, idx) => idx !== index)
    }));
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-primary">Expense reimbursements</h3>
          <p className="text-sm text-slate-600">Submit and approve crew reimbursement claims.</p>
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
              <option value="all">All statuses</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="secondary" size="sm" disabled={loading}>
              {loading ? 'Filtering…' : 'Apply'}
            </Button>
          </form>
          <Button onClick={openCreateModal}>Log expense</Button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Expense</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Approved</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-sm text-slate-500">
                  <div className="flex items-center justify-center gap-3">
                    <Spinner size="sm" /> Loading expenses…
                  </div>
                </td>
              </tr>
            ) : items.length ? (
              items.map((expense) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  onEdit={openEditModal}
                  onApprove={() => markStatus(expense, 'approved')}
                  onReimburse={() => markStatus(expense, 'reimbursed')}
                />
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-sm text-slate-500">
                  No expenses submitted yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-slate-500">
        {error ? (
          <span className="text-rose-600">{error.message ?? 'Unable to load expenses'}</span>
        ) : (
          <span>
            {meta.total ?? 0} total claims • Awaiting reimbursement {meta.awaitingReimbursement ?? 0} • Reimbursed {meta.reimbursed ?? 0}
          </span>
        )}
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editingId ? 'Edit expense' : 'Log expense'} size="lg">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <TextInput
            label="Title"
            required
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          />
          <TextArea
            label="Description"
            rows={3}
            value={draft.description}
            onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Category"
              value={draft.category}
              onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
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
          </div>
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
            <TextInput
              label="Submitted date"
              type="date"
              value={draft.submittedAt}
              onChange={(event) => setDraft((current) => ({ ...current, submittedAt: event.target.value }))}
            />
            <TextInput
              label="Approved date"
              type="date"
              value={draft.approvedAt}
              onChange={(event) => setDraft((current) => ({ ...current, approvedAt: event.target.value }))}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-primary">Receipts</h4>
              <Button type="button" variant="ghost" size="sm" onClick={handleAddReceipt}>
                Add receipt
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {draft.receipts.map((receipt, index) => (
                <div key={`receipt-${index}`} className="grid gap-3 md:grid-cols-[1fr_2fr_auto] md:items-center">
                  <TextInput
                    label="Label"
                    value={receipt.label}
                    onChange={(event) => handleReceiptChange(index, 'label', event.target.value)}
                  />
                  <TextInput
                    label="URL"
                    type="url"
                    required={!receipt.url && draft.receipts.length === 1}
                    value={receipt.url}
                    onChange={(event) => handleReceiptChange(index, 'url', event.target.value)}
                    placeholder="https://…"
                  />
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveReceipt(index)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <TextArea
            label="Internal notes"
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
              {saving ? 'Saving…' : editingId ? 'Update expense' : 'Create expense'}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
