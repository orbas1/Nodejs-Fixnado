import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  listPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrder,
  updatePurchaseOrderStatus,
  recordPurchaseReceipt,
  addPurchaseOrderAttachment,
  deletePurchaseOrderAttachment,
  listSuppliers,
  upsertSupplier,
  updateSupplierStatus,
  listBudgets,
  upsertBudget
} from '../../../api/purchaseManagementClient.js';
import {
  ORDER_STATUS_LABELS,
  SUPPLIER_STATUS_OPTIONS,
  createDefaultItem,
  createEmptyBudgetForm,
  createEmptyOrderForm,
  createEmptySupplierForm
} from '../constants.js';
import {
  allowedTransitions,
  computeTotals,
  formatCurrency,
  normaliseItemsForPayload,
  toOrderForm,
  validateOrderForm
} from '../utils.js';

export function usePurchaseManagementState() {
  const [orders, setOrders] = useState([]);
  const [ordersMeta, setOrdersMeta] = useState({ total: 0 });
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);
  const [orderFilters, setOrderFilters] = useState({ status: 'all', search: '' });
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [orderForm, setOrderForm] = useState(() => createEmptyOrderForm());
  const [orderSaving, setOrderSaving] = useState(false);
  const [orderFeedback, setOrderFeedback] = useState(null);
  const [orderError, setOrderError] = useState(null);
  const [orderBudgetImpact, setOrderBudgetImpact] = useState({ committed: 0, spent: 0 });
  const [receivingDraft, setReceivingDraft] = useState([]);
  const [receivingSaving, setReceivingSaving] = useState(false);
  const [attachmentSaving, setAttachmentSaving] = useState(false);

  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [suppliersError, setSuppliersError] = useState(null);
  const [supplierForm, setSupplierForm] = useState(() => createEmptySupplierForm());
  const [supplierSaving, setSupplierSaving] = useState(false);
  const [supplierFeedback, setSupplierFeedback] = useState(null);
  const [supplierFilters, setSupplierFilters] = useState({ status: 'all', search: '' });

  const [budgets, setBudgets] = useState([]);
  const [budgetForm, setBudgetForm] = useState(() => createEmptyBudgetForm());
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [budgetFeedback, setBudgetFeedback] = useState(null);
  const [budgetError, setBudgetError] = useState(null);
  const [budgetFilters, setBudgetFilters] = useState({ fiscalYear: 'all' });

  const loadOrders = useCallback(
    async (options = {}) => {
      setOrdersLoading(true);
      setOrdersError(null);
      try {
        const response = await listPurchaseOrders({ status: orderFilters.status, search: orderFilters.search, ...options });
        setOrders(response?.data ?? []);
        setOrdersMeta(response?.meta ?? { total: 0 });
      } catch (error) {
        console.error('Failed to load purchase orders', error);
        setOrdersError(error?.message ?? 'Unable to load purchase orders');
      } finally {
        setOrdersLoading(false);
      }
    },
    [orderFilters]
  );

  const loadSuppliers = useCallback(async () => {
    setSuppliersLoading(true);
    setSuppliersError(null);
    try {
      const response = await listSuppliers({
        status: supplierFilters.status === 'all' ? undefined : supplierFilters.status,
        search: supplierFilters.search || undefined
      });
      setSuppliers(response?.data ?? []);
    } catch (error) {
      console.error('Failed to load suppliers', error);
      setSuppliersError(error?.message ?? 'Unable to load suppliers');
    } finally {
      setSuppliersLoading(false);
    }
  }, [supplierFilters]);

  const loadBudgets = useCallback(async () => {
    setBudgetError(null);
    try {
      const response = await listBudgets({
        fiscalYear: budgetFilters.fiscalYear === 'all' ? undefined : budgetFilters.fiscalYear
      });
      setBudgets(response?.data ?? []);
    } catch (error) {
      console.error('Failed to load budgets', error);
      setBudgetError(error?.message ?? 'Unable to load budgets');
    }
  }, [budgetFilters]);

  const refreshOrderDetail = useCallback(
    async (orderId) => {
      if (!orderId) {
        setOrderForm(createEmptyOrderForm());
        setReceivingDraft([]);
        setOrderBudgetImpact({ committed: 0, spent: 0 });
        return;
      }
      setOrderSaving(true);
      try {
        const response = await getPurchaseOrder(orderId);
        const form = toOrderForm(response?.data, createEmptyOrderForm);
        setOrderForm(form);
        setOrderBudgetImpact(response?.data?.budgetImpact ?? { committed: 0, spent: 0 });
        setReceivingDraft(
          form.items.map((item) => ({
            id: item.id,
            receivedQuantity: item.receivedQuantity ?? '0',
            quantity: item.quantity
          }))
        );
      } catch (error) {
        console.error('Failed to load purchase order', error);
        setOrderError(error?.message ?? 'Unable to load purchase order');
      } finally {
        setOrderSaving(false);
      }
    },
    []
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  useEffect(() => {
    refreshOrderDetail(activeOrderId);
  }, [activeOrderId, refreshOrderDetail]);

  const handleFilterChange = useCallback((name, value) => {
    setOrderFilters((current) => ({ ...current, [name]: value }));
  }, []);

  const handleSearchChange = useCallback(
    (event) => {
      handleFilterChange('search', event.target.value);
    },
    [handleFilterChange]
  );

  const handleSearchSubmit = useCallback(
    (event) => {
      event.preventDefault();
      loadOrders();
    },
    [loadOrders]
  );

  const resetOrderForm = useCallback(() => {
    setActiveOrderId(null);
    setOrderForm(createEmptyOrderForm());
    setReceivingDraft([]);
    setOrderFeedback(null);
    setOrderError(null);
    setOrderBudgetImpact({ committed: 0, spent: 0 });
  }, []);

  const handleSelectOrder = useCallback((orderId) => {
    setActiveOrderId(orderId);
    setOrderFeedback(null);
    setOrderError(null);
  }, []);

  const handleOrderFieldChange = useCallback((field, value) => {
    setOrderForm((current) => ({ ...current, [field]: value }));
  }, []);

  const handleSupplierSelect = useCallback(
    (event) => {
      const supplierId = event.target.value;
      if (supplierId) {
        const supplier = suppliers.find((entry) => entry.id === supplierId);
        handleOrderFieldChange('supplierId', supplierId);
        handleOrderFieldChange('supplierName', supplier?.name ?? '');
      } else {
        handleOrderFieldChange('supplierId', '');
      }
    },
    [suppliers, handleOrderFieldChange]
  );

  const handleItemChange = useCallback((index, field, value) => {
    setOrderForm((current) => {
      const items = current.items.map((item, idx) => (idx === index ? { ...item, [field]: value } : item));
      return { ...current, items };
    });
  }, []);

  const handleAddItem = useCallback(() => {
    setOrderForm((current) => ({ ...current, items: [...current.items, createDefaultItem()] }));
  }, []);

  const handleRemoveItem = useCallback((index) => {
    setOrderForm((current) => {
      const next = current.items.filter((_, idx) => idx !== index);
      return { ...current, items: next.length > 0 ? next : [createDefaultItem()] };
    });
  }, []);

  const handleOrderSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setOrderError(null);
      const validation = validateOrderForm(orderForm);
      if (validation) {
        setOrderError(validation);
        return;
      }
      setOrderSaving(true);
      try {
        const payload = {
          ...orderForm,
          budgetId: orderForm.budgetId || null,
          items: normaliseItemsForPayload(orderForm.items)
        };
        let response;
        if (orderForm.id) {
          response = await updatePurchaseOrder(orderForm.id, payload);
        } else {
          response = await createPurchaseOrder(payload);
          setActiveOrderId(response?.data?.id ?? null);
        }
        const updated = toOrderForm(response?.data, createEmptyOrderForm);
        setOrderForm(updated);
        setOrderBudgetImpact(response?.data?.budgetImpact ?? { committed: 0, spent: 0 });
        setReceivingDraft(
          updated.items.map((item) => ({
            id: item.id,
            receivedQuantity: item.receivedQuantity ?? '0',
            quantity: item.quantity
          }))
        );
        setOrderFeedback(`Purchase order ${orderForm.id ? 'updated' : 'created'} successfully.`);
        await Promise.all([loadOrders(), loadSuppliers(), loadBudgets()]);
      } catch (error) {
        console.error('Failed to save purchase order', error);
        setOrderError(error?.message ?? 'Unable to save purchase order');
      } finally {
        setOrderSaving(false);
      }
    },
    [orderForm, loadOrders, loadSuppliers, loadBudgets]
  );

  const handleStatusTransition = useCallback(
    async (nextStatus) => {
      if (!orderForm.id) return;
      setOrderSaving(true);
      setOrderFeedback(null);
      setOrderError(null);
      try {
        const response = await updatePurchaseOrderStatus(orderForm.id, { status: nextStatus });
        const updated = toOrderForm(response?.data, createEmptyOrderForm);
        setOrderForm(updated);
        setOrderBudgetImpact(response?.data?.budgetImpact ?? { committed: 0, spent: 0 });
        setReceivingDraft(
          updated.items.map((item) => ({
            id: item.id,
            receivedQuantity: item.receivedQuantity ?? '0',
            quantity: item.quantity
          }))
        );
        setOrderFeedback(`Order status updated to ${ORDER_STATUS_LABELS[nextStatus] ?? nextStatus}.`);
        await Promise.all([loadOrders(), loadBudgets()]);
      } catch (error) {
        console.error('Failed to update purchase order status', error);
        setOrderError(error?.message ?? 'Unable to update order status');
      } finally {
        setOrderSaving(false);
      }
    },
    [orderForm.id, loadOrders, loadBudgets]
  );

  const handleAttachmentSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!orderForm.id) return;
      const formData = new FormData(event.target);
      const fileName = formData.get('fileName');
      const fileUrl = formData.get('fileUrl');
      if (!fileName || !fileUrl) {
        setOrderError('Attachment name and link are required.');
        return;
      }
      setAttachmentSaving(true);
      setOrderError(null);
      try {
        await addPurchaseOrderAttachment(orderForm.id, {
          fileName,
          fileUrl,
          category: formData.get('category'),
          notes: formData.get('attachmentNotes')
        });
        await refreshOrderDetail(orderForm.id);
        event.target.reset();
        setOrderFeedback('Attachment added.');
      } catch (error) {
        console.error('Failed to add attachment', error);
        setOrderError(error?.message ?? 'Unable to add attachment');
      } finally {
        setAttachmentSaving(false);
      }
    },
    [orderForm.id, refreshOrderDetail]
  );

  const handleAttachmentDelete = useCallback(
    async (attachmentId) => {
      if (!orderForm.id) return;
      setAttachmentSaving(true);
      setOrderError(null);
      try {
        await deletePurchaseOrderAttachment(orderForm.id, attachmentId);
        await refreshOrderDetail(orderForm.id);
        setOrderFeedback('Attachment removed.');
      } catch (error) {
        console.error('Failed to remove attachment', error);
        setOrderError(error?.message ?? 'Unable to remove attachment');
      } finally {
        setAttachmentSaving(false);
      }
    },
    [orderForm.id, refreshOrderDetail]
  );

  const handleReceivingDraftChange = useCallback((lineId, quantity) => {
    setReceivingDraft((current) => current.map((entry) => (entry.id === lineId ? { ...entry, receivedQuantity: quantity } : entry)));
  }, []);

  const handleReceivingSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!orderForm.id) return;
      setReceivingSaving(true);
      setOrderError(null);
      try {
        const payload = {
          note: event.target.note?.value || undefined,
          items: receivingDraft.map((entry) => ({
            id: entry.id,
            receivedQuantity: Number.parseFloat(entry.receivedQuantity ?? 0) || 0
          }))
        };
        const response = await recordPurchaseReceipt(orderForm.id, payload);
        const updated = toOrderForm(response?.data, createEmptyOrderForm);
        setOrderForm(updated);
        setOrderBudgetImpact(response?.data?.budgetImpact ?? { committed: 0, spent: 0 });
        setReceivingDraft(
          updated.items.map((item) => ({
            id: item.id,
            receivedQuantity: item.receivedQuantity ?? '0',
            quantity: item.quantity
          }))
        );
        setOrderFeedback('Receiving record saved.');
        event.target.reset();
        await Promise.all([loadOrders(), loadBudgets()]);
      } catch (error) {
        console.error('Failed to record receipt', error);
        setOrderError(error?.message ?? 'Unable to record receipt');
      } finally {
        setReceivingSaving(false);
      }
    },
    [orderForm.id, receivingDraft, loadOrders, loadBudgets]
  );

  const handleSupplierFieldChange = useCallback((field, value) => {
    setSupplierForm((current) => ({ ...current, [field]: value }));
  }, []);

  const handleSupplierFilterChange = useCallback((field, value) => {
    setSupplierFilters((current) => ({ ...current, [field]: value }));
  }, []);

  const handleSupplierSearchChange = useCallback(
    (event) => {
      handleSupplierFilterChange('search', event.target.value);
    },
    [handleSupplierFilterChange]
  );

  const handleSupplierSearchSubmit = useCallback(
    (event) => {
      event.preventDefault();
      loadSuppliers();
    },
    [loadSuppliers]
  );

  const handleSupplierEdit = useCallback((supplier) => {
    if (!supplier) {
      setSupplierForm(createEmptySupplierForm());
      return;
    }
    setSupplierForm({
      id: supplier.id ?? null,
      name: supplier.name ?? '',
      contactEmail: supplier.contactEmail ?? '',
      contactPhone: supplier.contactPhone ?? '',
      website: supplier.website ?? '',
      tags: Array.isArray(supplier.tags) ? supplier.tags.filter(Boolean).join(', ') : supplier.tags ?? '',
      leadTimeDays: supplier.leadTimeDays === 0 || supplier.leadTimeDays ? String(supplier.leadTimeDays) : '',
      paymentTermsDays:
        supplier.paymentTermsDays === 0 || supplier.paymentTermsDays ? String(supplier.paymentTermsDays) : '',
      status: supplier.status ?? 'active',
      notes: supplier.notes ?? ''
    });
    setSupplierFeedback(null);
  }, []);

  const handleSupplierReset = useCallback(() => {
    setSupplierForm(createEmptySupplierForm());
    setSupplierFeedback(null);
  }, []);

  const handleSupplierSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setSupplierSaving(true);
      setSupplierFeedback(null);
      try {
        const payload = {
          ...supplierForm,
          leadTimeDays: supplierForm.leadTimeDays ? Number.parseInt(supplierForm.leadTimeDays, 10) : undefined,
          paymentTermsDays: supplierForm.paymentTermsDays ? Number.parseInt(supplierForm.paymentTermsDays, 10) : undefined,
          tags: supplierForm.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
            .join(', ')
        };
        const response = await upsertSupplier(payload);
        setSupplierForm(createEmptySupplierForm());
        setSupplierFeedback(`Supplier ${response?.data?.name ?? 'saved'} successfully.`);
        await loadSuppliers();
      } catch (error) {
        console.error('Failed to save supplier', error);
        setSuppliersError(error?.message ?? 'Unable to save supplier');
      } finally {
        setSupplierSaving(false);
      }
    },
    [supplierForm, loadSuppliers]
  );

  const handleSupplierActivate = useCallback(
    async (supplierId, nextStatus) => {
      try {
        await updateSupplierStatus(supplierId, { status: nextStatus });
        await loadSuppliers();
        setSupplierFeedback(`Supplier marked as ${nextStatus}.`);
      } catch (error) {
        console.error('Failed to update supplier status', error);
        setSuppliersError(error?.message ?? 'Unable to update supplier status');
      }
    },
    [loadSuppliers]
  );

  const handleBudgetFieldChange = useCallback((field, value) => {
    setBudgetForm((current) => ({ ...current, [field]: value }));
  }, []);

  const handleBudgetFilterChange = useCallback((field, value) => {
    setBudgetFilters((current) => ({ ...current, [field]: value }));
  }, []);

  const handleBudgetEdit = useCallback((budget) => {
    if (!budget) {
      setBudgetForm(createEmptyBudgetForm());
      return;
    }
    setBudgetForm({
      id: budget.id ?? null,
      category: budget.category ?? '',
      fiscalYear: budget.fiscalYear ? String(budget.fiscalYear) : new Date().getFullYear().toString(),
      allocated: budget.allocated === 0 || budget.allocated ? String(budget.allocated) : '',
      spent: budget.spent === 0 || budget.spent ? String(budget.spent) : '',
      committed: budget.committed === 0 || budget.committed ? String(budget.committed) : '',
      currency: budget.currency ?? 'GBP',
      owner: budget.owner ?? '',
      notes: budget.notes ?? ''
    });
    setBudgetFeedback(null);
  }, []);

  const handleBudgetReset = useCallback(() => {
    setBudgetForm(createEmptyBudgetForm());
    setBudgetFeedback(null);
  }, []);

  const handleBudgetSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setBudgetSaving(true);
      setBudgetFeedback(null);
      setBudgetError(null);
      try {
        const payload = {
          ...budgetForm,
          fiscalYear: Number.parseInt(budgetForm.fiscalYear, 10) || undefined,
          allocated: budgetForm.allocated ? Number.parseFloat(budgetForm.allocated) : undefined,
          spent: budgetForm.spent ? Number.parseFloat(budgetForm.spent) : undefined,
          committed: budgetForm.committed ? Number.parseFloat(budgetForm.committed) : undefined
        };
        const response = await upsertBudget(payload);
        setBudgetFeedback(`Budget saved for ${response?.data?.category ?? payload.category}.`);
        setBudgetForm(createEmptyBudgetForm());
        await loadBudgets();
      } catch (error) {
        console.error('Failed to save budget', error);
        setBudgetError(error?.message ?? 'Unable to save budget');
      } finally {
        setBudgetSaving(false);
      }
    },
    [budgetForm, loadBudgets]
  );

  const orderTotals = useMemo(() => computeTotals(orderForm.items), [orderForm.items]);
  const orderTotalAmount = orderTotals.subtotal + orderTotals.taxTotal;

  const filteredSuppliers = useMemo(() => {
    const search = supplierFilters.search.trim().toLowerCase();
    return suppliers.filter((supplier) => {
      const statusMatch = supplierFilters.status === 'all' || (supplier.status ?? 'all') === supplierFilters.status;
      if (!statusMatch) return false;
      if (!search) return true;
      const haystack = [supplier.name, supplier.contactEmail, supplier.tags]
        .flat()
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [suppliers, supplierFilters]);

  const supplierStatusCounts = useMemo(
    () =>
      suppliers.reduce(
        (acc, supplier) => {
          const status = supplier.status ?? 'unknown';
          acc[status] = (acc[status] || 0) + 1;
          acc.total += 1;
          return acc;
        },
        { total: 0 }
      ),
    [suppliers]
  );

  const supplierOptions = useMemo(
    () => [{ id: '', name: 'Manual entry', status: 'active' }, ...suppliers],
    [suppliers]
  );

  const fiscalYearOptions = useMemo(() => {
    const years = new Set();
    budgets.forEach((budget) => {
      if (budget?.fiscalYear) {
        years.add(String(budget.fiscalYear));
      }
    });
    return ['all', ...Array.from(years).sort((a, b) => Number(b) - Number(a))];
  }, [budgets]);

  const enrichedBudgets = useMemo(
    () =>
      budgets.map((budget) => {
        const allocated = Number.parseFloat(budget.allocated ?? 0) || 0;
        const spent = Number.parseFloat(budget.spent ?? 0) || 0;
        const committed = Number.parseFloat(budget.committed ?? 0) || 0;
        const utilisationRaw = allocated > 0 ? (spent + committed) / allocated : 0;
        const remainingRaw = allocated - (spent + committed);
        let tone = 'neutral';
        if (allocated > 0) {
          if (spent + committed >= allocated) {
            tone = 'danger';
          } else if (utilisationRaw >= 0.85) {
            tone = 'warning';
          } else {
            tone = 'success';
          }
        }
        return {
          ...budget,
          allocated,
          spent,
          committed,
          remaining: Math.max(remainingRaw, 0),
          remainingRaw,
          utilisation: Math.min(Math.max(utilisationRaw, 0), 1.5),
          tone
        };
      }),
    [budgets]
  );

  const filteredBudgets = useMemo(() => {
    if (budgetFilters.fiscalYear === 'all') {
      return enrichedBudgets;
    }
    return enrichedBudgets.filter((budget) => String(budget.fiscalYear) === budgetFilters.fiscalYear);
  }, [enrichedBudgets, budgetFilters]);

  const budgetOptions = useMemo(
    () => [
      {
        id: '',
        label: 'Unassigned',
        allocated: 0,
        committed: 0,
        spent: 0,
        remaining: null,
        remainingRaw: null,
        currency: orderForm.currency,
        tone: 'neutral'
      },
      ...enrichedBudgets.map((budget) => ({
        id: budget.id,
        label: `${budget.category} • FY${budget.fiscalYear}`,
        allocated: budget.allocated,
        committed: budget.committed,
        spent: budget.spent,
        remaining: budget.remaining,
        remainingRaw: budget.remainingRaw,
        currency: budget.currency,
        tone: budget.tone
      }))
    ],
    [enrichedBudgets, orderForm.currency]
  );

  const budgetTotals = useMemo(
    () =>
      enrichedBudgets.reduce(
        (acc, budget) => {
          acc.allocated += budget.allocated;
          acc.spent += budget.spent;
          acc.committed += budget.committed;
          acc.remaining += budget.remaining;
          return acc;
        },
        { allocated: 0, spent: 0, committed: 0, remaining: 0 }
      ),
    [enrichedBudgets]
  );

  const selectedBudget = useMemo(
    () => budgetOptions.find((option) => option.id === orderForm.budgetId) ?? budgetOptions[0],
    [budgetOptions, orderForm.budgetId]
  );

  return {
    data: {
      orders,
      ordersMeta,
      ordersLoading,
      ordersError,
      orderFilters,
      activeOrderId,
      orderForm,
      orderSaving,
      orderFeedback,
      orderError,
      orderBudgetImpact,
      receivingDraft,
      receivingSaving,
      attachmentSaving,
      suppliers,
      suppliersLoading,
      suppliersError,
      supplierForm,
      supplierSaving,
      supplierFeedback,
      supplierFilters,
      budgets,
      budgetForm,
      budgetSaving,
      budgetFeedback,
      budgetError,
      budgetFilters,
      supplierOptions,
      budgetOptions,
      selectedBudget,
      supplierStatusCounts,
      filteredSuppliers,
      orderTotals,
      orderTotalAmount,
      fiscalYearOptions,
      enrichedBudgets,
      filteredBudgets,
      budgetTotals
    },
    actions: {
      loadOrders,
      loadSuppliers,
      loadBudgets,
      refreshOrderDetail,
      handleFilterChange,
      handleSearchChange,
      handleSearchSubmit,
      resetOrderForm,
      handleSelectOrder,
      handleOrderFieldChange,
      handleSupplierSelect,
      handleItemChange,
      handleAddItem,
      handleRemoveItem,
      handleOrderSubmit,
      handleStatusTransition,
      handleAttachmentSubmit,
      handleAttachmentDelete,
      handleReceivingDraftChange,
      handleReceivingSubmit,
      handleSupplierFieldChange,
      handleSupplierFilterChange,
      handleSupplierSearchChange,
      handleSupplierSearchSubmit,
      handleSupplierEdit,
      handleSupplierReset,
      handleSupplierSubmit,
      handleSupplierActivate,
      handleBudgetFieldChange,
      handleBudgetFilterChange,
      handleBudgetEdit,
      handleBudgetReset,
      handleBudgetSubmit
    },
    helpers: {
      allowedTransitions,
      formatCurrency,
      SUPPLIER_STATUS_OPTIONS
    }
  };
}
