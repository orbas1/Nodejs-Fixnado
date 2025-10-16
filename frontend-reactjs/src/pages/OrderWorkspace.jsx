import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import Button from '../components/ui/Button.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import TextInput from '../components/ui/TextInput.jsx';
import SegmentedControl from '../components/ui/SegmentedControl.jsx';
import OrderHistoryTimeline from '../components/orders/OrderHistoryTimeline.jsx';
import OrderHistoryEntryForm from '../components/orders/OrderHistoryEntryForm.jsx';
import {
  ORDER_HISTORY_ENTRY_TYPES,
  ORDER_HISTORY_ACTOR_ROLES,
  ORDER_HISTORY_STATUSES,
  ORDER_HISTORY_ATTACHMENT_TYPES,
  BOOKING_STATUSES,
  HISTORY_SORT_OPTIONS
} from '../constants/orderHistory.js';
import {
  fetchOrder,
  fetchOrderHistory,
  createOrderHistoryEntry,
  updateOrderHistoryEntry,
  deleteOrderHistoryEntry,
  updateOrderStatus
} from '../api/orderHistoryClient.js';

const numberFormatter = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });

const formatCurrency = (value, currency) => {
  if (!Number.isFinite(value)) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency || 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  } catch (error) {
    console.warn('Failed to format currency', error);
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const HistoryFilters = ({ statusOptions, sort, status, limit, onChange }) => (
  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto]">
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="workspace-history-status">
        Filter by status
      </label>
      <select
        id="workspace-history-status"
        value={status}
        onChange={(event) => onChange('status', event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700">Sort</p>
      <SegmentedControl
        name="Sort history"
        value={sort}
        options={HISTORY_SORT_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
        onChange={(next) => onChange('sort', next)}
        size="sm"
        className="bg-secondary"
      />
    </div>
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="workspace-history-limit">
        Entries per fetch
      </label>
      <select
        id="workspace-history-limit"
        value={limit}
        onChange={(event) => onChange('limit', Number(event.target.value))}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {[10, 25, 50, 100].map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  </div>
);

function OrderWorkspace() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [historyFilters, setHistoryFilters] = useState({ status: 'all', sort: 'desc', limit: 50, offset: 0 });
  const [formState, setFormState] = useState({ open: false, mode: 'create', entry: null });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [deletionTarget, setDeletionTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [statusDraft, setStatusDraft] = useState('pending');
  const [statusReason, setStatusReason] = useState('');
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const entryTypeLookup = useMemo(() => new Map(ORDER_HISTORY_ENTRY_TYPES.map((entry) => [entry.value, entry])), []);
  const actorRoleLookup = useMemo(() => new Map(ORDER_HISTORY_ACTOR_ROLES.map((role) => [role.value, role])), []);
  const statusLookup = useMemo(() => new Map(ORDER_HISTORY_STATUSES.map((status) => [status.value, status])), []);

  const statusOptions = useMemo(() => [{ value: 'all', label: 'All statuses' }, ...ORDER_HISTORY_STATUSES.map((status) => ({ value: status.value, label: status.label }))], []);

  const loadWorkspace = useCallback(
    async (id) => {
      if (!id) {
        setError('Order not found.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [orderResponse, historyResponse] = await Promise.all([
          fetchOrder(id),
          fetchOrderHistory(id, historyFilters.status === 'all' ? { ...historyFilters, status: undefined } : historyFilters)
        ]);
        setOrder(orderResponse);
        setHistory(historyResponse.entries ?? []);
        setHistoryTotal(historyResponse.total ?? (historyResponse.entries ? historyResponse.entries.length : 0));
        setStatusDraft(orderResponse.status ?? 'pending');
      } catch (caught) {
        console.error('Failed to load order workspace', caught);
        setError(caught.message || 'Unable to load order workspace.');
      } finally {
        setLoading(false);
      }
    },
    [historyFilters]
  );

  const refreshHistory = useCallback(
    async (id, overrides = {}) => {
      if (!id) {
        return;
      }
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const params = { ...historyFilters, ...overrides };
        if (params.status === 'all') {
          delete params.status;
        }
        const response = await fetchOrderHistory(id, params);
        setHistory(response.entries ?? []);
        setHistoryTotal(response.total ?? (response.entries ? response.entries.length : 0));
      } catch (caught) {
        console.error('Failed to refresh history', caught);
        setHistoryError(caught.message || 'Unable to refresh history entries.');
      } finally {
        setHistoryLoading(false);
      }
    },
    [historyFilters]
  );

  useEffect(() => {
    loadWorkspace(orderId);
  }, [loadWorkspace, orderId]);

  useEffect(() => {
    if (orderId) {
      refreshHistory(orderId);
    }
  }, [orderId, refreshHistory]);

  const openCreateForm = () => {
    setFormState({ open: true, mode: 'create', entry: null });
    setFormError(null);
  };

  const openEditForm = (entry) => {
    setFormState({ open: true, mode: 'edit', entry });
    setFormError(null);
  };

  const closeForm = () => {
    if (formSubmitting) {
      return;
    }
    setFormState({ open: false, mode: 'create', entry: null });
    setFormError(null);
  };

  const handleSubmitEntry = async (payload) => {
    if (!orderId) {
      return;
    }
    setFormSubmitting(true);
    setFormError(null);
    try {
      if (formState.mode === 'edit' && formState.entry) {
        await updateOrderHistoryEntry(orderId, formState.entry.id, payload);
        setFeedback({ tone: 'success', message: 'Timeline entry updated.' });
      } else {
        await createOrderHistoryEntry(orderId, payload);
        setFeedback({ tone: 'success', message: 'Timeline entry added.' });
      }
      setFormState({ open: false, mode: 'create', entry: null });
      refreshHistory(orderId, { offset: 0 });
    } catch (caught) {
      console.error('Failed to save timeline entry', caught);
      setFormError(caught.message || 'Unable to save timeline entry.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!orderId || !deletionTarget) {
      return;
    }
    setDeleting(true);
    try {
      await deleteOrderHistoryEntry(orderId, deletionTarget.id);
      setFeedback({ tone: 'success', message: 'Timeline entry deleted.' });
      setDeletionTarget(null);
      refreshHistory(orderId, { offset: 0 });
    } catch (caught) {
      console.error('Failed to delete timeline entry', caught);
      setFeedback({ tone: 'error', message: caught.message || 'Unable to delete entry.' });
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusSubmit = async (event) => {
    event.preventDefault();
    if (!orderId) {
      return;
    }
    setStatusSubmitting(true);
    try {
      await updateOrderStatus(orderId, {
        status: statusDraft,
        actorId: order?.meta?.requesterId || order?.customerId || null,
        reason: statusReason || undefined
      });
      setFeedback({ tone: 'success', message: 'Order status updated.' });
      setStatusReason('');
      await loadWorkspace(orderId);
    } catch (caught) {
      console.error('Failed to update order status', caught);
      setFeedback({ tone: 'error', message: caught.message || 'Unable to update order status.' });
    } finally {
      setStatusSubmitting(false);
    }
  };

  const historyStatusOptions = useMemo(() => {
    const options = statusOptions;
    return options;
  }, [statusOptions]);

  const metadataEntries = useMemo(() => {
    if (!order?.meta || typeof order.meta !== 'object') {
      return [];
    }
    return Object.entries(order.meta);
  }, [order]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <div className="mx-auto mt-20 max-w-lg rounded-3xl border border-rose-200 bg-white p-8 text-center text-rose-700 shadow-sm">
          <ExclamationTriangleIcon aria-hidden="true" className="mx-auto h-10 w-10" />
          <h1 className="mt-4 text-xl font-semibold">Unable to load order</h1>
          <p className="mt-2 text-sm">{error}</p>
          <Button className="mt-6" variant="primary" icon={ArrowLeftIcon} onClick={() => navigate(-1)}>
            Go back
          </Button>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10">
        <div className="flex items-center justify-between">
          <Button variant="tertiary" icon={ArrowLeftIcon} onClick={() => navigate(-1)}>
            Back
          </Button>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 font-semibold text-primary">
              {numberFormatter.format(historyTotal)} entries
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-600">
              Order {order.reference ?? order.id}
            </span>
          </div>
        </div>

        {feedback ? (
          <div
            className={`flex items-start justify-between gap-4 rounded-2xl border p-4 text-sm shadow-sm ${
              feedback.tone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
            role="status"
          >
            <p>{feedback.message}</p>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="rounded-full p-1 text-current transition hover:bg-white/60"
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-accent/10 bg-white p-6 shadow-md">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold text-primary">{order.meta?.service || order.serviceTitle || 'Service order'}</h1>
                  <p className="text-sm text-slate-500">Reference {order.reference ?? order.id}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-primary/5 px-3 py-1 font-semibold text-primary">
                      {formatCurrency(Number.parseFloat(order.totalAmount ?? 0) || 0, order.currency)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold capitalize text-slate-700">
                      {order.status?.replace(/[_-]/g, ' ')}
                    </span>
                  </div>
                </div>
                <form className="space-y-3" onSubmit={handleStatusSubmit}>
                  <label className="text-sm font-semibold text-slate-700" htmlFor="workspace-status">
                    Update status
                  </label>
                  <select
                    id="workspace-status"
                    value={statusDraft}
                    onChange={(event) => setStatusDraft(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {BOOKING_STATUSES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <TextInput
                    label="Reason"
                    optionalLabel="Optional"
                    value={statusReason}
                    onChange={(event) => setStatusReason(event.target.value)}
                    placeholder="Add internal reasoning for this transition"
                  />
                  <Button type="submit" variant="secondary" loading={statusSubmitting}>
                    Save status
                  </Button>
                </form>
              </div>
              <dl className="mt-6 grid gap-4 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-3">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scheduled</dt>
                  <dd className="mt-1">{formatDate(order.scheduledStart ?? order.scheduledFor)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Window end</dt>
                  <dd className="mt-1">{formatDate(order.scheduledEnd)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last updated</dt>
                  <dd className="mt-1">{formatDate(order.lastStatusTransitionAt ?? order.updatedAt)}</dd>
                </div>
                {order.zoneId ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Zone</dt>
                    <dd className="mt-1">{order.zoneId}</dd>
                  </div>
                ) : null}
                {order.companyId ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Company</dt>
                    <dd className="mt-1">{order.companyId}</dd>
                  </div>
                ) : null}
                {order.customerId ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer</dt>
                    <dd className="mt-1">{order.customerId}</dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <div className="rounded-3xl border border-accent/10 bg-white p-6 shadow-md">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-primary">Timeline</h2>
                  <p className="text-sm text-slate-500">
                    Track every milestone, escalation, and follow-up. Entries sync with exports and partner dashboards instantly.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    icon={ArrowPathIcon}
                    loading={historyLoading}
                    onClick={() => refreshHistory(orderId, { offset: 0 })}
                  >
                    Refresh
                  </Button>
                  <Button type="button" variant="primary" icon={PlusIcon} onClick={openCreateForm}>
                    Add entry
                  </Button>
                </div>
              </div>

              <div className="mt-6">
                <HistoryFilters
                  statusOptions={historyStatusOptions}
                  sort={historyFilters.sort}
                  status={historyFilters.status}
                  limit={historyFilters.limit}
                  onChange={(key, value) => {
                    setHistoryFilters((prev) => ({ ...prev, [key]: value, offset: 0 }));
                  }}
                />
              </div>

              {historyError ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">
                  {historyError}
                </div>
              ) : null}

              <div className="mt-6">
                {historyLoading ? (
                  <div className="flex min-h-[240px] items-center justify-center">
                    <Spinner className="h-6 w-6 text-primary" />
                  </div>
                ) : (
                  <OrderHistoryTimeline
                    entries={history}
                    entryTypeLookup={entryTypeLookup}
                    statusLookup={statusLookup}
                    actorRoleLookup={actorRoleLookup}
                    canManage
                    onEdit={openEditForm}
                    onDelete={setDeletionTarget}
                    emptyState="No timeline entries yet. Start logging milestones and updates for this order."
                  />
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-accent/10 bg-white p-6 shadow-md">
              <div className="flex items-start gap-3 text-sm text-slate-600">
                <InformationCircleIcon aria-hidden="true" className="mt-0.5 h-5 w-5 text-primary" />
                <p>
                  Timeline entries are visible to authorised operations, finance, and support teams. Attachments are stored securely and
                  versioned for audit readiness.
                </p>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-accent/10 bg-white p-6 shadow-md">
              <h3 className="text-sm font-semibold text-primary">Metadata</h3>
              {metadataEntries.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">This order has no structured metadata yet.</p>
              ) : (
                <dl className="mt-3 space-y-3 text-sm text-slate-600">
                  {metadataEntries.map(([key, value]) => (
                    <div key={key} className="rounded-2xl border border-slate-200 bg-secondary/60 px-3 py-2">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{key}</dt>
                      <dd className="mt-1">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </aside>
        </div>
      </div>

      {formState.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-10">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <OrderHistoryEntryForm
              mode={formState.mode}
              entry={formState.entry}
              entryTypes={ORDER_HISTORY_ENTRY_TYPES}
              actorRoles={ORDER_HISTORY_ACTOR_ROLES}
              statusOptions={ORDER_HISTORY_STATUSES}
              attachmentConfig={{ acceptedTypes: ORDER_HISTORY_ATTACHMENT_TYPES, maxPerEntry: 6 }}
              submitting={formSubmitting}
              error={formError}
              onSubmit={handleSubmitEntry}
              onCancel={closeForm}
              defaultActorId={order?.customerId || ''}
            />
          </div>
        </div>
      ) : null}

      {deletionTarget ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3 text-rose-700">
              <ExclamationTriangleIcon aria-hidden="true" className="mt-0.5 h-6 w-6" />
              <div className="space-y-2 text-sm">
                <p className="text-base font-semibold">Delete timeline entry</p>
                <p>
                  Are you sure you want to delete “{deletionTarget.title}”? This action cannot be undone and removes the entry across
                  every workspace.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="tertiary" onClick={() => !deleting && setDeletionTarget(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button type="button" variant="danger" loading={deleting} onClick={confirmDelete}>
                Delete entry
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default OrderWorkspace;
