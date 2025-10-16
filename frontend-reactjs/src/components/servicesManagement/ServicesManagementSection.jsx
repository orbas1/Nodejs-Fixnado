import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  fetchCustomerServices,
  fetchCustomerOrderDetail,
  createCustomerServiceOrder,
  updateCustomerOrderSchedule,
  releaseCustomerEscrow,
  startCustomerDispute
} from '../../api/customerServicesClient.js';
import SummaryMetrics from './SummaryMetrics.jsx';
import CreateOrderForm from './CreateOrderForm.jsx';
import StatusControls from './StatusControls.jsx';
import OrdersList from './OrdersList.jsx';
import TimelineModal from './TimelineModal.jsx';

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Funded', value: 'funded' },
  { label: 'In delivery', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Disputed', value: 'disputed' }
];

const DEFAULT_FORM = {
  serviceId: '',
  zoneId: '',
  bookingType: 'scheduled',
  scheduledStart: '',
  scheduledEnd: '',
  baseAmount: '',
  currency: 'GBP',
  demandLevel: 'medium',
  notes: ''
};

const DEFAULT_DATA = {
  metrics: { activeOrders: 0, fundedEscrows: 0, disputedOrders: 0, totalOrders: 0, totalSpend: 0 },
  orders: [],
  catalogue: { services: [], zones: [] }
};

function buildCreatePayload(form) {
  return {
    serviceId: form.serviceId || undefined,
    zoneId: form.zoneId || undefined,
    bookingType: form.bookingType,
    scheduledStart: form.bookingType === 'scheduled' ? form.scheduledStart || null : null,
    scheduledEnd: form.bookingType === 'scheduled' ? form.scheduledEnd || null : null,
    baseAmount: form.baseAmount ? Number(form.baseAmount) : undefined,
    currency: form.currency || undefined,
    demandLevel: form.demandLevel,
    notes: form.notes?.trim() ? form.notes.trim() : undefined
  };
}

function ServicesManagementSection({ section }) {
  const initialData = section.data ?? DEFAULT_DATA;
  const [orders, setOrders] = useState(initialData.orders ?? []);
  const [metrics, setMetrics] = useState(initialData.metrics ?? DEFAULT_DATA.metrics);
  const [catalogue, setCatalogue] = useState(initialData.catalogue ?? DEFAULT_DATA.catalogue);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [createForm, setCreateForm] = useState(DEFAULT_FORM);
  const [creating, setCreating] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [activeTabs, setActiveTabs] = useState({});
  const [scheduleDrafts, setScheduleDrafts] = useState({});
  const [disputeDrafts, setDisputeDrafts] = useState({});
  const [savingOrderId, setSavingOrderId] = useState(null);
  const [releasingOrderId, setReleasingOrderId] = useState(null);
  const [disputeOrderId, setDisputeOrderId] = useState(null);
  const [detailOrderId, setDetailOrderId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const displayCurrency = useMemo(
    () => orders[0]?.currency ?? initialData.orders?.[0]?.currency ?? 'GBP',
    [orders, initialData.orders]
  );

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') {
      return orders;
    }
    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  const refreshFromServer = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCustomerServices();
      setOrders(data?.orders ?? []);
      setMetrics(data?.metrics ?? DEFAULT_DATA.metrics);
      setCatalogue(data?.catalogue ?? DEFAULT_DATA.catalogue);
    } catch (caught) {
      console.error('Failed to load services management data', caught);
      setError(caught instanceof Error ? caught.message : 'Unable to load services data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData.orders?.length) {
      refreshFromServer();
    } else {
      setCreateForm((prev) => ({ ...prev, currency: initialData.orders?.[0]?.currency ?? prev.currency }));
    }
  }, [initialData.orders, refreshFromServer]);

  useEffect(() => {
    const services = catalogue.services ?? [];
    if (!services.length) {
      return;
    }
    const preferredCurrency = services.find((service) => service.currency)?.currency;
    if (!preferredCurrency) {
      return;
    }
    setCreateForm((prev) => {
      if (!prev || prev.currency === preferredCurrency || (prev.currency && prev.currency !== 'GBP')) {
        return prev;
      }
      return { ...prev, currency: preferredCurrency };
    });
  }, [catalogue.services]);

  const updateCreateForm = useCallback((field, value, extra = {}) => {
    setCreateForm((prev) => ({ ...prev, ...extra, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setCreateForm((prev) => ({ ...DEFAULT_FORM, currency: prev.currency }));
  }, []);

  const handleCreateSubmit = useCallback(async () => {
    setCreating(true);
    setError(null);
    setMessage(null);
    try {
      const payload = buildCreatePayload(createForm);
      await createCustomerServiceOrder(payload);
      setMessage('Service order created successfully.');
      resetForm();
      await refreshFromServer();
    } catch (caught) {
      console.error('Failed to create service order', caught);
      setError(caught instanceof Error ? caught.message : 'Unable to create service order.');
    } finally {
      setCreating(false);
    }
  }, [createForm, refreshFromServer, resetForm]);

  const getScheduleDraft = useCallback(
    (order) => {
      const draft = scheduleDrafts[order.id];
      return {
        scheduledStart:
          draft?.scheduledStart ?? (order.booking?.scheduledStart ? order.booking.scheduledStart.slice(0, 16) : ''),
        scheduledEnd:
          draft?.scheduledEnd ?? (order.booking?.scheduledEnd ? order.booking.scheduledEnd.slice(0, 16) : '')
      };
    },
    [scheduleDrafts]
  );

  const handleScheduleChange = useCallback((orderId, field, value) => {
    setScheduleDrafts((prev) => ({
      ...prev,
      [orderId]: { ...prev[orderId], [field]: value }
    }));
  }, []);

  const handleSaveSchedule = useCallback(
    async (order) => {
      setSavingOrderId(order.id);
      setError(null);
      setMessage(null);
      const draft = getScheduleDraft(order);
      if (!draft.scheduledStart || !draft.scheduledEnd) {
        setError('Provide both start and end times before saving the schedule.');
        setSavingOrderId(null);
        return;
      }
      try {
        await updateCustomerOrderSchedule(order.id, {
          scheduledStart: draft.scheduledStart,
          scheduledEnd: draft.scheduledEnd
        });
        setMessage('Schedule updated successfully.');
        await refreshFromServer();
        setExpandedOrderId(null);
      } catch (caught) {
        console.error('Failed to update schedule', caught);
        setError(caught instanceof Error ? caught.message : 'Unable to update schedule.');
      } finally {
        setSavingOrderId(null);
      }
    },
    [getScheduleDraft, refreshFromServer]
  );

  const handleReleaseEscrow = useCallback(
    async (orderId) => {
      setReleasingOrderId(orderId);
      setError(null);
      setMessage(null);
      try {
        await releaseCustomerEscrow(orderId);
        setMessage('Escrow release requested successfully.');
        await refreshFromServer();
      } catch (caught) {
        console.error('Failed to release escrow', caught);
        setError(caught instanceof Error ? caught.message : 'Unable to release escrow.');
      } finally {
        setReleasingOrderId(null);
      }
    },
    [refreshFromServer]
  );

  const getDisputeDraft = useCallback((orderId) => disputeDrafts[orderId] ?? '', [disputeDrafts]);

  const handleDisputeChange = useCallback((orderId, value) => {
    setDisputeDrafts((prev) => ({
      ...prev,
      [orderId]: value
    }));
  }, []);

  const handleStartDispute = useCallback(
    async (orderId) => {
      setDisputeOrderId(orderId);
      setError(null);
      setMessage(null);
      const reason = getDisputeDraft(orderId);
      try {
        await startCustomerDispute(orderId, { reason });
        setMessage('Dispute opened successfully. A concierge will follow up shortly.');
        setDisputeDrafts((prev) => ({ ...prev, [orderId]: '' }));
        await refreshFromServer();
        setExpandedOrderId(null);
      } catch (caught) {
        console.error('Failed to start dispute', caught);
        setError(caught instanceof Error ? caught.message : 'Unable to start dispute.');
      } finally {
        setDisputeOrderId(null);
      }
    },
    [getDisputeDraft, refreshFromServer]
  );

  const handleToggleOrder = useCallback((orderId) => {
    setExpandedOrderId((current) => (current === orderId ? null : orderId));
    setActiveTabs((prev) => ({ ...prev, [orderId]: 'schedule' }));
  }, []);

  const getActiveTab = useCallback((orderId) => activeTabs[orderId] ?? 'schedule', [activeTabs]);

  const handleTabChange = useCallback((orderId, tab) => {
    setActiveTabs((prev) => ({ ...prev, [orderId]: tab }));
  }, []);

  const handleOpenTimeline = useCallback(async (orderId) => {
    setDetailOrderId(orderId);
    setDetailLoading(true);
    setDetailError(null);
    setDetailData(null);
    try {
      const data = await fetchCustomerOrderDetail(orderId);
      setDetailData(data);
    } catch (caught) {
      console.error('Failed to load order detail', caught);
      setDetailError(caught instanceof Error ? caught.message : 'Unable to load details.');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleCloseTimeline = useCallback(() => {
    setDetailOrderId(null);
    setDetailData(null);
    setDetailError(null);
  }, []);

  return (
    <section className="space-y-8">
      <header className="space-y-3">
        <h2 className="text-2xl font-semibold text-primary">{section.label}</h2>
        <p className="text-sm text-slate-600">{section.description}</p>
        <SummaryMetrics metrics={metrics} currency={displayCurrency} />
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex-1">
          <CreateOrderForm
            form={createForm}
            catalogue={catalogue}
            creating={creating}
            onFieldChange={updateCreateForm}
            onSubmit={handleCreateSubmit}
          />
        </div>
        <StatusControls
          statusFilter={statusFilter}
          statusOptions={STATUS_OPTIONS}
          onFilterChange={setStatusFilter}
          onRefresh={refreshFromServer}
          loading={loading}
          message={message}
          error={error}
        />
      </div>

      <div className="space-y-4">
        <OrdersList
          orders={filteredOrders}
          loading={loading}
          expandedOrderId={expandedOrderId}
          onToggleOrder={handleToggleOrder}
          onOpenTimeline={handleOpenTimeline}
          onReleaseEscrow={handleReleaseEscrow}
          releasingOrderId={releasingOrderId}
          getScheduleDraft={getScheduleDraft}
          onScheduleChange={handleScheduleChange}
          onSaveSchedule={handleSaveSchedule}
          savingOrderId={savingOrderId}
          getActiveTab={getActiveTab}
          onTabChange={handleTabChange}
          getDisputeDraft={getDisputeDraft}
          onDisputeChange={handleDisputeChange}
          onStartDispute={handleStartDispute}
          disputeOrderId={disputeOrderId}
        />
      </div>

      <TimelineModal
        open={Boolean(detailOrderId)}
        onClose={handleCloseTimeline}
        loading={detailLoading}
        data={detailData}
        error={detailError}
      />
    </section>
  );
}

ServicesManagementSection.propTypes = {
  section: PropTypes.shape({
    label: PropTypes.string,
    description: PropTypes.string,
    data: PropTypes.shape({
      metrics: PropTypes.shape({
        activeOrders: PropTypes.number,
        fundedEscrows: PropTypes.number,
        disputedOrders: PropTypes.number,
        totalOrders: PropTypes.number,
        totalSpend: PropTypes.number
      }),
      orders: PropTypes.arrayOf(PropTypes.object),
      catalogue: PropTypes.shape({
        services: PropTypes.array,
        zones: PropTypes.array
      })
    })
  }).isRequired
};

export default ServicesManagementSection;
