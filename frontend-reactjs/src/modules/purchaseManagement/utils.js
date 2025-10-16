import { STATUS_TRANSITIONS } from './constants.js';

export function formatCurrency(amount, currency = 'GBP') {
  const parsed = Number.parseFloat(amount ?? 0);
  const numeric = Number.isFinite(parsed) ? parsed : 0;
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(numeric);
}

export function computeTotals(items) {
  return items.reduce(
    (acc, item) => {
      const quantity = Number.parseFloat(item.quantity ?? 0) || 0;
      const unitCost = Number.parseFloat(item.unitCost ?? 0) || 0;
      const taxRate = Number.parseFloat(item.taxRate ?? 0) || 0;
      const subtotal = quantity * unitCost;
      const tax = subtotal * (taxRate / 100);
      acc.subtotal += subtotal;
      acc.taxTotal += tax;
      return acc;
    },
    { subtotal: 0, taxTotal: 0 }
  );
}

export function normaliseItemsForPayload(items) {
  return items
    .map((item) => ({
      id: item.id || undefined,
      itemName: item.itemName.trim(),
      description: item.description ? item.description.trim() : undefined,
      sku: item.sku ? item.sku.trim() : undefined,
      quantity: Number.parseFloat(item.quantity ?? 0) || 0,
      unitCost: Number.parseFloat(item.unitCost ?? 0) || 0,
      taxRate: Number.parseFloat(item.taxRate ?? 0) || 0,
      expectedAt: item.expectedAt || undefined,
      imageUrl: item.imageUrl ? item.imageUrl.trim() : undefined,
      receivedQuantity: Number.parseFloat(item.receivedQuantity ?? 0) || 0
    }))
    .filter((item) => item.itemName);
}

export function toOrderForm(order, createEmptyOrderForm) {
  if (!order) return createEmptyOrderForm();
  return {
    id: order.id,
    supplierId: order.supplierId ?? '',
    supplierName: order.supplierName ?? '',
    budgetId: order.budgetId ?? '',
    currency: order.currency ?? 'GBP',
    expectedAt: order.expectedAt ? order.expectedAt.slice(0, 10) : '',
    notes: order.notes ?? '',
    approvalRequired: Boolean(order.approvalRequired),
    status: order.status ?? 'draft',
    reference: order.reference ?? '',
    items: (order.items ?? []).map((item) => ({
      id: item.id ?? null,
      itemName: item.itemName ?? '',
      description: item.description ?? '',
      sku: item.sku ?? '',
      quantity: (item.quantity ?? 0).toString(),
      unitCost: (item.unitCost ?? 0).toString(),
      taxRate: (item.taxRate ?? 0).toString(),
      expectedAt: item.expectedAt ? item.expectedAt.slice(0, 10) : '',
      imageUrl: item.imageUrl ?? '',
      receivedQuantity: (item.receivedQuantity ?? 0).toString()
    })),
    attachments: order.attachments ?? []
  };
}

export function validateOrderForm(form) {
  if (!form.supplierId && !form.supplierName.trim()) {
    return 'Select an existing supplier or provide a supplier name.';
  }
  if (!form.items.some((item) => item.itemName.trim())) {
    return 'Provide at least one line item with a name.';
  }
  const invalidQuantity = form.items.find((item) => (Number.parseFloat(item.quantity ?? 0) || 0) <= 0 && item.itemName.trim());
  if (invalidQuantity) {
    return `Quantity must be greater than zero for ${invalidQuantity.itemName || 'a line item'}.`;
  }
  return null;
}

export function allowedTransitions(status) {
  return STATUS_TRANSITIONS[status] ?? [];
}
