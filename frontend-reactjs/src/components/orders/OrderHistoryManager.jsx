import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import Button from '../ui/Button.jsx';
import TextInput from '../ui/TextInput.jsx';
import SegmentedControl from '../ui/SegmentedControl.jsx';
import Spinner from '../ui/Spinner.jsx';
import OrderHistoryEntryForm from './OrderHistoryEntryForm.jsx';
import OrderHistoryTimeline from './OrderHistoryTimeline.jsx';
import {
  ORDER_HISTORY_ENTRY_TYPES,
  ORDER_HISTORY_ACTOR_ROLES,
  ORDER_HISTORY_STATUSES,
  HISTORY_SORT_OPTIONS
} from '../../constants/orderHistory.js';
import {
  fetchOrders,
  fetchOrderHistory,
  createOrderHistoryEntry,
  updateOrderHistoryEntry,
  deleteOrderHistoryEntry
} from '../../api/orderHistoryClient.js';

const SectionHeader = ({ section }) => (
  <header className="space-y-2">
    <h2 className="text-2xl font-semibold text-primary">{section.label ?? 'Order history'}</h2>
    {section.description ? <p className="text-sm text-slate-600 max-w-2xl">{section.description}</p> : null}
  </header>
);

SectionHeader.propTypes = {
  section: PropTypes.shape({
    label: PropTypes.string,
    description: PropTypes.string
  }).isRequired
};

const numberFormatter = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });

const currencyFormatter = (currency = 'GBP') =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 });

const formatCurrency = (value, currency) => {
  if (!Number.isFinite(value)) {
    return '—';
  }
  try {
    return currencyFormatter(currency || 'GBP').format(value);
  } catch (error) {
    console.warn('Failed to format currency', error);
    return currencyFormatter('GBP').format(value);
  }
};

const formatDate = (value) => {
  if (!value) {
    return '—';
  }
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

const humanise = (value) => {
  if (!value) return '';
  return value
    .toString()
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (token) => token.toUpperCase());
};

const resolveAccess = (access = {}) => {
  const level = (access.level || 'manage').toLowerCase();
  const readOnlyLevels = new Set(['view', 'readonly', 'read']);
  const featureSet = new Set(access.features || []);
  const featureAllowsWrite =
    featureSet.size === 0 || featureSet.has('order-history:write') || featureSet.has('history:write') || featureSet.has('all');
  const canManage = !readOnlyLevels.has(level) && featureAllowsWrite;
  return { canManage, level };
};

const statusColours = {
  pending: 'bg-slate-100 text-slate-700 border-slate-200',
  awaiting_assignment: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  scheduled: 'bg-sky-50 text-sky-700 border-sky-200',
  in_progress: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
  disputed: 'bg-amber-100 text-amber-700 border-amber-200',
  default: 'bg-slate-100 text-slate-600 border-slate-200'
};

const OrderListItem = ({ order, isActive, onSelect }) => {
  const totalAmount = Number.parseFloat(order.totalAmount ?? 0) || 0;
  const statusTone = statusColours[order.status] ?? statusColours.default;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        'w-full rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
        isActive ? 'border-primary/40 bg-primary/5 shadow-sm' : 'border-slate-200 bg-white hover:border-primary/30'
      )}
      aria-pressed={isActive}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-primary">{order.serviceTitle ?? 'Service order'}</p>
          <p className="text-xs text-slate-500">{order.serviceCategory ?? 'General maintenance'}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-mono text-slate-500">{order.reference ?? order.id.slice(0, 8)}</span>
            <span className={`inline-flex items-center gap-2 rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${statusTone}`}>
              {humanise(order.status)}
            </span>
          </div>
        </div>
        <div className="text-right text-sm text-primary">
          <p className="font-semibold">{formatCurrency(totalAmount, order.currency)}</p>
          <p className="text-xs text-slate-500">Scheduled {formatDate(order.scheduledFor)}</p>
        </div>
      </div>
    </button>
  );
};

OrderListItem.propTypes = {
  order: PropTypes.shape({
    id: PropTypes.string.isRequired,
    reference: PropTypes.string,
    serviceTitle: PropTypes.string,
    serviceCategory: PropTypes.string,
    status: PropTypes.string,
    totalAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string,
    scheduledFor: PropTypes.string
  }).isRequired,
  isActive: PropTypes.bool,
  onSelect: PropTypes.func.isRequired
};

OrderListItem.defaultProps = {
  isActive: false
};

const HistoryFilters = ({ statusOptions, sort, status, limit, onChange }) => (
  <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto]">
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="history-status-filter">
        Filter entries by status
      </label>
      <select
        id="history-status-filter"
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
      <p className="mb-2 text-sm font-medium text-slate-700">Sort timeline</p>
      <SegmentedControl
        name="Sort timeline"
        value={sort}
        options={HISTORY_SORT_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
        onChange={(next) => onChange('sort', next)}
        size="sm"
        className="bg-secondary"
      />
    </div>
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="history-limit">
        Entries per fetch
      </label>
      <select
        id="history-limit"
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

HistoryFilters.propTypes = {
  statusOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  sort: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  limit: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  onChange: PropTypes.func.isRequired
};

function OrderHistoryManager({ section }) {
  const navigate = useNavigate();
  const data = section.data || {};
  const ordersFromServer = Array.isArray(data.orders) ? data.orders : [];
  const sampleEntries = Array.isArray(data.entries) ? data.entries : [];

  const [orders, setOrders] = useState(ordersFromServer);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  const defaultFilters = data.defaultFilters || { status: 'all', sort: 'desc', limit: 25 };
  const [historyFilters, setHistoryFilters] = useState({ ...defaultFilters, offset: 0 });
  const [selectedOrderId, setSelectedOrderId] = useState(() => ordersFromServer[0]?.id ?? null);
  const [history, setHistory] = useState(sampleEntries);
  const [historyTotal, setHistoryTotal] = useState(sampleEntries.length);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const [formState, setFormState] = useState({ open: false, mode: 'create', entry: null });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [deletionTarget, setDeletionTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const selectedOrderIdRef = useRef(ordersFromServer[0]?.id ?? null);
  const searchRef = useRef(orderSearch);
  const statusRef = useRef(orderStatusFilter);

  const { canManage } = useMemo(() => resolveAccess(section.access), [section.access]);

  const entryTypes = Array.isArray(data.entryTypes) && data.entryTypes.length > 0 ? data.entryTypes : ORDER_HISTORY_ENTRY_TYPES;
  const actorRoles = Array.isArray(data.actorRoles) && data.actorRoles.length > 0 ? data.actorRoles : ORDER_HISTORY_ACTOR_ROLES;
  const statusOptions = useMemo(() => {
    const options = Array.isArray(data.statusOptions) && data.statusOptions.length > 0 ? data.statusOptions : [];
    if (options.some((option) => option.value === 'all')) {
      return options;
    }
    return [{ value: 'all', label: 'All statuses' }, ...options];
  }, [data.statusOptions]);

  const timelineStatusOptions = useMemo(() => {
    if (statusOptions.length > 0) {
      return statusOptions;
    }
    return [{ value: 'all', label: 'All statuses' }, ...ORDER_HISTORY_STATUSES.map((status) => ({ value: status.value, label: status.label }))];
  }, [statusOptions]);

  const entryTypeLookup = useMemo(() => new Map(entryTypes.map((type) => [type.value, type])), [entryTypes]);
  const actorRoleLookup = useMemo(() => new Map(actorRoles.map((role) => [role.value, role])), [actorRoles]);
  const timelineStatusLookup = useMemo(
    () =>
      new Map(
        ORDER_HISTORY_STATUSES.map((status) => [status.value, status]).concat(
          timelineStatusOptions.filter((option) => option.value !== 'all').map((option) => [option.value, option])
        )
      ),
    [timelineStatusOptions]
  );

  useEffect(() => {
    setOrders(ordersFromServer);
    if (!selectedOrderId && ordersFromServer.length > 0) {
      setSelectedOrderId(ordersFromServer[0].id);
    }
  }, [ordersFromServer, selectedOrderId]);

  useEffect(() => {
    selectedOrderIdRef.current = selectedOrderId;
  }, [selectedOrderId]);

  useEffect(() => {
    searchRef.current = orderSearch;
  }, [orderSearch]);

  useEffect(() => {
    statusRef.current = orderStatusFilter;
  }, [orderStatusFilter]);

  const selectedOrder = useMemo(() => orders.find((order) => order.id === selectedOrderId) || null, [orders, selectedOrderId]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        if (orderStatusFilter !== 'all' && order.status !== orderStatusFilter) {
          return false;
        }
        if (!orderSearch.trim()) {
          return true;
        }
        const haystack = [order.reference, order.serviceTitle, order.serviceCategory, order.meta?.customerName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(orderSearch.trim().toLowerCase());
      })
      .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0));
  }, [orderSearch, orderStatusFilter, orders]);

  const refreshOrders = useCallback(
    async (overrides = {}) => {
      setOrdersLoading(true);
      setOrdersError(null);
      try {
        const params = {
          ...overrides,
          ...(data.context?.companyId ? { companyId: data.context.companyId } : {}),
          ...(data.context?.customerId ? { customerId: data.context.customerId } : {})
        };

        const statusFilter = overrides.status ?? statusRef.current;
        if (!statusFilter || statusFilter === 'all') {
          delete params.status;
        } else {
          params.status = statusFilter;
        }

        const searchTerm = overrides.search ?? searchRef.current;
        if (!searchTerm || !searchTerm.trim()) {
          delete params.search;
        } else {
          params.search = searchTerm.trim();
        }

        if (params.limit === undefined) {
          const defaultLimit = data.defaultFilters?.limit;
          if (typeof defaultLimit === 'number' && Number.isFinite(defaultLimit)) {
            params.limit = defaultLimit;
          }
        }

        const nextOrders = await fetchOrders(params);
        setOrders(nextOrders);
        const currentSelected = selectedOrderIdRef.current;
        if (nextOrders.length > 0 && !nextOrders.some((order) => order.id === currentSelected)) {
          setSelectedOrderId(nextOrders[0].id);
        }
      } catch (error) {
        console.error('Failed to refresh orders', error);
        setOrdersError(error.message || 'Unable to load orders.');
      } finally {
        setOrdersLoading(false);
      }
    },
    [data.context?.companyId, data.context?.customerId]
  );

  useEffect(() => {
    refreshOrders({});
  }, [orderStatusFilter, refreshOrders]);

  const fetchHistory = useCallback(
    async (orderId, overrides = {}) => {
      if (!orderId) {
        return;
      }
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const params = { ...historyFilters, ...overrides };
        if (params.status === 'all') {
          delete params.status;
        }
        if (params.limit === 'all') {
          delete params.limit;
        }
        const response = await fetchOrderHistory(orderId, params);
        setHistory(response.entries ?? []);
        setHistoryTotal(response.total ?? (response.entries ? response.entries.length : 0));
      } catch (error) {
        console.error('Failed to fetch order history', error);
        setHistoryError(error.message || 'Unable to load history entries.');
        if (sampleEntries.length > 0) {
          setHistory(sampleEntries);
          setHistoryTotal(sampleEntries.length);
        }
      } finally {
        setHistoryLoading(false);
      }
    },
    [historyFilters, sampleEntries]
  );

  useEffect(() => {
    fetchHistory(selectedOrderId);
  }, [fetchHistory, selectedOrderId]);

  const handleHistoryFilterChange = (key, value) => {
    setHistoryFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key !== 'offset') {
        next.offset = 0;
      }
      return next;
    });
  };

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
    if (!selectedOrderId) {
      return;
    }
    setFormSubmitting(true);
    setFormError(null);
    try {
      if (formState.mode === 'edit' && formState.entry) {
        await updateOrderHistoryEntry(selectedOrderId, formState.entry.id, payload);
        setFeedback({ tone: 'success', message: 'History entry updated successfully.' });
      } else {
        await createOrderHistoryEntry(selectedOrderId, payload);
        setFeedback({ tone: 'success', message: 'History entry added successfully.' });
      }
      setFormState({ open: false, mode: 'create', entry: null });
      fetchHistory(selectedOrderId, { offset: 0 });
    } catch (error) {
      console.error('Failed to save history entry', error);
      setFormError(error.message || 'Unable to save history entry. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedOrderId || !deletionTarget) {
      return;
    }
    setDeleting(true);
    try {
      await deleteOrderHistoryEntry(selectedOrderId, deletionTarget.id);
      setFeedback({ tone: 'success', message: 'History entry deleted.' });
      setDeletionTarget(null);
      fetchHistory(selectedOrderId, { offset: 0 });
    } catch (error) {
      console.error('Failed to delete history entry', error);
      setFeedback({ tone: 'error', message: error.message || 'Unable to delete history entry.' });
    } finally {
      setDeleting(false);
    }
  };

  const orderMetrics = useMemo(() => {
    const total = orders.length;
    const escalated = orders.filter((order) => ['disputed', 'cancelled'].includes(order.status)).length;
    const completed = orders.filter((order) => order.status === 'completed').length;
    const inFlight = Math.max(total - completed, 0);
    return { total, escalated, completed, inFlight };
  }, [orders]);

  return (
    <section className="space-y-6">
      <SectionHeader section={section} />

      {feedback ? (
        <div
          className={clsx(
            'flex items-start justify-between gap-4 rounded-2xl border p-4 text-sm shadow-sm',
            feedback.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          )}
          role="status"
        >
          <div className="flex items-start gap-2">
            {feedback.tone === 'success' ? (
              <ClipboardDocumentListIcon aria-hidden="true" className="mt-0.5 h-5 w-5" />
            ) : (
              <ExclamationTriangleIcon aria-hidden="true" className="mt-0.5 h-5 w-5" />
            )}
            <p>{feedback.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="rounded-full p-1 text-current transition hover:bg-white/60"
            aria-label="Dismiss message"
          >
            <XMarkIcon aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,360px)_1fr]">
        <aside className="space-y-4">
          <div className="rounded-3xl border border-accent/10 bg-white p-5 shadow-md">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-primary">Order library</h3>
              <Button
                type="button"
                variant="tertiary"
                size="sm"
                icon={ArrowPathIcon}
                loading={ordersLoading}
                onClick={() => refreshOrders({ search: orderSearch })}
              >
                Refresh
              </Button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {numberFormatter.format(orderMetrics.total)} tracked orders · {numberFormatter.format(orderMetrics.inFlight)} in delivery ·
              {numberFormatter.format(orderMetrics.escalated)} escalated
            </p>
            <div className="mt-4 space-y-3">
              <TextInput
                label="Search orders"
                value={orderSearch}
                onChange={(event) => setOrderSearch(event.target.value)}
                placeholder="Search by title, reference, or customer"
                prefix={<MagnifyingGlassIcon aria-hidden="true" className="h-4 w-4 text-slate-400" />}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    refreshOrders({ search: event.currentTarget.value });
                  }
                }}
              />
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="order-status-filter">
                  Filter orders by status
                </label>
                <select
                  id="order-status-filter"
                  value={orderStatusFilter}
                  onChange={(event) => setOrderStatusFilter(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">All statuses</option>
                  {Array.from(new Set(orders.map((order) => order.status))).map((status) => (
                    <option key={status} value={status}>
                      {humanise(status)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {ordersError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">
                {ordersError}
              </div>
            ) : null}
            {ordersLoading ? (
              <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
                <Spinner className="h-5 w-5 text-primary" />
              </div>
            ) : null}
            {!ordersLoading && filteredOrders.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-secondary/60 p-6 text-sm text-slate-500">
                No orders match this filter. Adjust your filters or refresh.
              </p>
            ) : null}
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <OrderListItem
                  key={order.id}
                  order={order}
                  isActive={order.id === selectedOrderId}
                  onSelect={() => setSelectedOrderId(order.id)}
                />
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <div className="rounded-3xl border border-accent/10 bg-white p-6 shadow-md">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-primary">Timeline workspace</h3>
                <p className="text-sm text-slate-500">
                  Maintain the audit trail for every work order. Entries sync to analytics exports, notifications, and partner workspaces.
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                    {numberFormatter.format(historyTotal)} entries tracked
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                    {selectedOrder ? `Order ${selectedOrder.reference ?? selectedOrder.id.slice(0, 8)}` : 'Select an order'}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  icon={ArrowTopRightOnSquareIcon}
                  onClick={() => selectedOrderId && navigate(`/dashboards/orders/${selectedOrderId}`)}
                  disabled={!selectedOrderId}
                >
                  Open workspace
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  icon={PlusIcon}
                  onClick={openCreateForm}
                  disabled={!canManage || !selectedOrderId}
                >
                  New timeline entry
                </Button>
              </div>
            </div>

            <div className="mt-6">
              <HistoryFilters
                statusOptions={timelineStatusOptions}
                sort={historyFilters.sort}
                status={historyFilters.status}
                limit={historyFilters.limit}
                onChange={(key, value) => {
                  handleHistoryFilterChange(key, value);
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
                  statusLookup={timelineStatusLookup}
                  actorRoleLookup={actorRoleLookup}
                  canManage={canManage}
                  onEdit={openEditForm}
                  onDelete={canManage ? setDeletionTarget : undefined}
                  emptyState="No history captured yet. Add your first entry to anchor the audit trail."
                />
              )}
            </div>
          </div>

          {selectedOrder ? (
            <div className="rounded-3xl border border-accent/10 bg-white p-6 shadow-md">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-primary">Order summary</h3>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Reference</p>
                  <p className="font-mono text-sm text-slate-600">{selectedOrder.reference ?? selectedOrder.id}</p>
                </div>
                <div className="text-sm text-right text-primary">
                  <p className="font-semibold">{formatCurrency(Number.parseFloat(selectedOrder.totalAmount ?? 0) || 0, selectedOrder.currency)}</p>
                  <p className="text-xs text-slate-500">Created {formatDate(selectedOrder.createdAt)}</p>
                </div>
              </div>
              <dl className="mt-4 grid gap-4 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</dt>
                  <dd className="mt-1 capitalize">{humanise(selectedOrder.status)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scheduled for</dt>
                  <dd className="mt-1">{formatDate(selectedOrder.scheduledFor)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last update</dt>
                  <dd className="mt-1">{formatDate(selectedOrder.lastStatusTransitionAt || selectedOrder.updatedAt)}</dd>
                </div>
                {selectedOrder.zoneId ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Zone</dt>
                    <dd className="mt-1">{selectedOrder.zoneId}</dd>
                  </div>
                ) : null}
                {selectedOrder.meta?.serviceOwner ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Service owner</dt>
                    <dd className="mt-1">{selectedOrder.meta.serviceOwner}</dd>
                  </div>
                ) : null}
                {selectedOrder.meta?.location ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</dt>
                    <dd className="mt-1">{selectedOrder.meta.location}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : null}

          <div className={clsx('rounded-3xl border p-6 shadow-md', canManage ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-700')}>
            <div className="flex items-start gap-3">
              <InformationCircleIcon aria-hidden="true" className="h-5 w-5" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold">{canManage ? 'You can create and edit history entries.' : 'You currently have read-only access.'}</p>
                <p>
                  {canManage
                    ? 'Timeline updates notify downstream teams and sync with reporting exports instantly.'
                    : 'Contact an administrator to request edit permission for the order history workspace.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {formState.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-10">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <OrderHistoryEntryForm
              mode={formState.mode}
              entry={formState.entry}
              entryTypes={entryTypes}
              actorRoles={actorRoles}
              statusOptions={ORDER_HISTORY_STATUSES}
              attachmentConfig={data.attachments}
              submitting={formSubmitting}
              error={formError}
              onSubmit={handleSubmitEntry}
              onCancel={closeForm}
              defaultActorId={data.context?.customerId || ''}
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
                  Are you sure you want to delete “{deletionTarget.title}”? This action removes the entry for every workspace and cannot
                  be undone.
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
    </section>
  );
}

OrderHistoryManager.propTypes = {
  section: PropTypes.shape({
    label: PropTypes.string,
    description: PropTypes.string,
    data: PropTypes.shape({
      orders: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          reference: PropTypes.string,
          serviceTitle: PropTypes.string,
          serviceCategory: PropTypes.string,
          status: PropTypes.string,
          totalAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          currency: PropTypes.string,
          scheduledFor: PropTypes.string,
          createdAt: PropTypes.string,
          updatedAt: PropTypes.string,
          lastStatusTransitionAt: PropTypes.string,
          meta: PropTypes.object
        })
      ),
      entries: PropTypes.arrayOf(PropTypes.object),
      statusOptions: PropTypes.arrayOf(
        PropTypes.shape({
          value: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired
        })
      ),
      entryTypes: PropTypes.arrayOf(
        PropTypes.shape({
          value: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired
        })
      ),
      actorRoles: PropTypes.arrayOf(
        PropTypes.shape({
          value: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired
        })
      ),
      defaultFilters: PropTypes.shape({
        status: PropTypes.string,
        sort: PropTypes.string,
        limit: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
      }),
      attachments: PropTypes.shape({
        acceptedTypes: PropTypes.arrayOf(PropTypes.string),
        maxPerEntry: PropTypes.number
      }),
      context: PropTypes.object
    }),
    access: PropTypes.shape({
      level: PropTypes.string,
      features: PropTypes.arrayOf(PropTypes.string)
    })
  }).isRequired
};

export default OrderHistoryManager;
