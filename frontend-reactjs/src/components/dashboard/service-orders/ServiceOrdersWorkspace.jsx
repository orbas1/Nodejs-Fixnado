import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowPathIcon, ExclamationTriangleIcon, PlusIcon } from '@heroicons/react/24/outline';
import Button from '../../ui/Button.jsx';
import TextInput from '../../ui/TextInput.jsx';
import Spinner from '../../ui/Spinner.jsx';
import {
  listServiceOrders,
  getServiceOrder,
  createServiceOrder,
  updateServiceOrder,
  updateServiceOrderStatus,
  addServiceOrderNote,
  deleteServiceOrderNote
} from '../../../api/serviceOrdersClient.js';
import { listServices } from '../../../api/servicesClient.js';
import {
  DEFAULT_FORM_STATE,
  PRIORITY_OPTIONS,
  STATUS_COLUMNS,
  STATUS_LABELS
} from './constants.js';
import { normaliseTagsInput, toFormState } from './utils.js';
import SummaryChips from './SummaryChips.jsx';
import OrderCard from './OrderCard.jsx';
import OrderEditorModal from './OrderEditorModal.jsx';
import OrderDetailDrawer from './OrderDetailDrawer.jsx';

const normaliseMeta = (meta, orders = []) => {
  const orderCount = Array.isArray(orders) ? orders.length : 0;
  if (!meta || typeof meta !== 'object') {
    return {
      statusCounts: {},
      total: orderCount,
      limit: orderCount,
      offset: 0
    };
  }

  const totalValue = Number(meta.total);
  const limitValue = Number(meta.limit);
  const offsetValue = Number(meta.offset);

  return {
    ...meta,
    total: Number.isFinite(totalValue) ? totalValue : orderCount,
    limit: Number.isFinite(limitValue) ? limitValue : orderCount,
    offset: Number.isFinite(offsetValue) ? offsetValue : 0,
    statusCounts:
      meta.statusCounts && typeof meta.statusCounts === 'object' ? meta.statusCounts : {}
  };
};

function ServiceOrdersWorkspace({ section }) {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ statusCounts: {}, total: 0 });
  const [filters, setFilters] = useState({ status: 'all', priority: 'all', search: '' });
  const [searchDraft, setSearchDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('create');
  const [editorForm, setEditorForm] = useState({ ...DEFAULT_FORM_STATE });
  const [editorSaving, setEditorSaving] = useState(false);
  const [editorError, setEditorError] = useState(null);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [noteAttachments, setNoteAttachments] = useState([]);
  const [noteSaving, setNoteSaving] = useState(false);

  const groupedOrders = useMemo(
    () =>
      STATUS_COLUMNS.map((column) => ({
        ...column,
        items: orders.filter((order) => column.statuses.includes(order.status))
      })),
    [orders]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => {
        if (prev.search === searchDraft) {
          return prev;
        }
        return { ...prev, search: searchDraft };
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchDraft]);

  const loadServicesCatalogue = useCallback(async () => {
    setServicesLoading(true);
    try {
      const catalogue = await listServices({ limit: 100 });
      if (Array.isArray(catalogue)) {
        setServices(catalogue);
      } else if (Array.isArray(catalogue?.items)) {
        setServices(catalogue.items);
      } else {
        setServices([]);
      }
    } catch (caught) {
      console.warn('Failed to load services catalogue', caught);
      setServices([]);
    } finally {
      setServicesLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    listServiceOrders(filters, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) {
          return;
        }
        const nextOrders = Array.isArray(result?.orders) ? result.orders : [];
        setOrders(nextOrders);
        setMeta(normaliseMeta(result?.meta, nextOrders));
      })
      .catch((caught) => {
        if (controller.signal.aborted) {
          return;
        }
        setError(caught instanceof Error ? caught.message : 'Failed to load service orders');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [filters]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listServiceOrders(filters);
      const nextOrders = Array.isArray(result?.orders) ? result.orders : [];
      setOrders(nextOrders);
      setMeta(normaliseMeta(result?.meta, nextOrders));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to refresh service orders');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const openCreate = () => {
    setEditorMode('create');
    setEditorForm({ ...DEFAULT_FORM_STATE });
    setEditorError(null);
    setEditingOrderId(null);
    setEditorOpen(true);
    if (services.length === 0 && !servicesLoading) {
      loadServicesCatalogue();
    }
  };

  const openEdit = (order) => {
    setEditorMode('edit');
    setEditorForm(toFormState(order));
    setEditorError(null);
    setEditingOrderId(order.id);
    setEditorOpen(true);
    if (services.length === 0 && !servicesLoading) {
      loadServicesCatalogue();
    }
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditorForm({ ...DEFAULT_FORM_STATE });
    setEditingOrderId(null);
  };

  const handleStatusFilterChange = (event) => {
    const value = event.target.value;
    setFilters((prev) => (prev.status === value ? prev : { ...prev, status: value }));
  };

  const handlePriorityFilterChange = (event) => {
    const value = event.target.value;
    setFilters((prev) => (prev.priority === value ? prev : { ...prev, priority: value }));
  };

  const handleStatusChange = async (order, nextStatus) => {
    try {
      await updateServiceOrderStatus(order.id, nextStatus);
      await refresh();
      if (detail?.id === order.id) {
        const refreshed = await getServiceOrder(order.id);
        setDetail(refreshed);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to update status');
    }
  };

  const handleOrderSubmit = async (event) => {
    event.preventDefault();
    setEditorSaving(true);
    setEditorError(null);

    const totalAmountValue = editorForm.totalAmount === '' ? undefined : Number.parseFloat(editorForm.totalAmount);
    const payload = {
      title: editorForm.title,
      serviceId: editorForm.serviceId,
      status: editorForm.status,
      priority: editorForm.priority,
      totalAmount: Number.isFinite(totalAmountValue) ? totalAmountValue : undefined,
      currency: editorForm.currency,
      scheduledFor: editorForm.scheduledFor ? new Date(editorForm.scheduledFor).toISOString() : null,
      summary: editorForm.summary,
      tags: normaliseTagsInput(editorForm.tagsInput),
      attachments: editorForm.attachments,
      metadata: {
        siteAddress: editorForm.siteAddress || null,
        contactName: editorForm.contactName || null,
        contactPhone: editorForm.contactPhone || null,
        poNumber: editorForm.poNumber || null,
        approvalStatus: editorForm.approvalStatus || 'not_requested'
      }
    };

    try {
      if (editorMode === 'create') {
        await createServiceOrder(payload);
      } else if (editingOrderId) {
        await updateServiceOrder(editingOrderId, payload);
      }
      await refresh();
      closeEditor();
      if (editingOrderId) {
        const refreshed = await getServiceOrder(editingOrderId);
        setDetail(refreshed);
      }
    } catch (caught) {
      setEditorError(caught instanceof Error ? caught.message : 'Unable to save service order');
    } finally {
      setEditorSaving(false);
    }
  };

  const openDetail = async (order) => {
    setDetailError(null);
    setDetailLoading(true);
    setDetail(null);
    setNoteDraft('');
    setNoteAttachments([]);
    try {
      const full = await getServiceOrder(order.id);
      setDetail(full);
    } catch (caught) {
      setDetailError(caught instanceof Error ? caught.message : 'Failed to load order detail');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetail(null);
    setDetailError(null);
    setNoteDraft('');
    setNoteAttachments([]);
  };

  const handleNoteSubmit = async (event) => {
    event.preventDefault();
    if (!detail?.id || !noteDraft.trim()) {
      return;
    }
    setNoteSaving(true);
    setDetailError(null);
    try {
      const note = await addServiceOrderNote(detail.id, {
        body: noteDraft,
        attachments: noteAttachments
      });
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              notes: [note, ...(prev.notes || [])]
            }
          : prev
      );
      setOrders((prev) =>
        prev.map((order) =>
          order.id === detail.id
            ? {
                ...order,
                latestNote: note
              }
            : order
        )
      );
      setNoteDraft('');
      setNoteAttachments([]);
    } catch (caught) {
      setDetailError(caught instanceof Error ? caught.message : 'Failed to add note');
    } finally {
      setNoteSaving(false);
    }
  };

  const handleNoteDelete = async (note) => {
    if (!detail?.id) {
      return;
    }
    try {
      await deleteServiceOrderNote(detail.id, note.id);
      const updatedNotes = (detail.notes || []).filter((item) => item.id !== note.id);
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              notes: updatedNotes
            }
          : prev
      );
      setOrders((prev) =>
        prev.map((order) =>
          order.id === detail.id
            ? {
                ...order,
                latestNote:
                  order.latestNote && order.latestNote.id === note.id ? updatedNotes[0] || null : order.latestNote
              }
            : order
        )
      );
    } catch (caught) {
      setDetailError(caught instanceof Error ? caught.message : 'Failed to remove note');
    }
  };

  const detailOpen = detailLoading || Boolean(detail);
  const activeOrders = groupedOrders.reduce((count, column) => count + column.items.length, 0);

  return (
    <section className="space-y-8">
      <header className="space-y-4 rounded-3xl border border-accent/10 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-primary">{section.label}</h2>
            <p className="text-sm text-slate-600">Coordinate every service order from intake to inspection.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" icon={ArrowPathIcon} onClick={refresh} disabled={loading}>
              Refresh
            </Button>
            <Button icon={PlusIcon} onClick={openCreate}>
              New service order
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-semibold text-slate-500">
              Status
              <select
                value={filters.status}
                onChange={handleStatusFilterChange}
                className="ml-2 rounded-full border border-accent/30 bg-secondary px-3 py-1 text-xs font-semibold text-primary focus:outline-none focus:ring focus:ring-accent/40"
              >
                <option value="all">All statuses</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-500">
              Priority
              <select
                value={filters.priority}
                onChange={handlePriorityFilterChange}
                className="ml-2 rounded-full border border-accent/30 bg-secondary px-3 py-1 text-xs font-semibold text-primary focus:outline-none focus:ring focus:ring-accent/40"
              >
                <option value="all">All priorities</option>
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex-1 min-w-[200px]">
            <TextInput
              label="Search orders"
              placeholder="Search by title, service, or summary"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SummaryChips meta={meta} />
          <p className="text-xs text-slate-500">{meta?.total ?? activeOrders} orders in view</p>
        </div>
      </header>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-6 w-6" aria-hidden="true" />
            <div>
              <h3 className="text-base font-semibold">We could not load service orders</h3>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center rounded-3xl border border-accent/10 bg-white/80 p-10">
          <Spinner />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {groupedOrders.map((column) => (
            <div key={column.id} className="flex h-full flex-col gap-4 rounded-3xl border border-accent/10 bg-white/95 p-5 shadow-sm">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">{column.label}</h3>
                <p className="mt-1 text-xs text-slate-500">{column.helper}</p>
                <p className="mt-2 text-xs text-slate-400">{column.items.length} order{column.items.length === 1 ? '' : 's'}</p>
              </div>
              <div className="flex-1 space-y-4">
                {column.items.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-accent/20 bg-secondary/60 p-4 text-sm text-slate-500">
                    No orders in this stage.
                  </p>
                ) : (
                  column.items.map((order) => (
                    <OrderCard key={order.id} order={order} onOpenDetail={openDetail} onStatusChange={handleStatusChange} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <OrderEditorModal
        open={editorOpen}
        mode={editorMode}
        form={editorForm}
        setForm={setEditorForm}
        services={services}
        servicesLoading={servicesLoading}
        error={editorError}
        saving={editorSaving}
        onClose={closeEditor}
        onSubmit={handleOrderSubmit}
      />

      <OrderDetailDrawer
        open={detailOpen}
        detail={detail}
        loading={detailLoading}
        error={detailError}
        onClose={closeDetail}
        onEdit={openEdit}
        onStatusChange={handleStatusChange}
        noteDraft={noteDraft}
        setNoteDraft={setNoteDraft}
        noteAttachments={noteAttachments}
        setNoteAttachments={setNoteAttachments}
        noteSaving={noteSaving}
        onNoteSubmit={handleNoteSubmit}
        onNoteDelete={handleNoteDelete}
      />
    </section>
  );
}

ServiceOrdersWorkspace.propTypes = {
  section: PropTypes.shape({
    label: PropTypes.string
  }).isRequired
};

export default ServiceOrdersWorkspace;
