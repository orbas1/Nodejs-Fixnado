import {
  ArrowLeftOnRectangleIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  PaperClipIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import SegmentedControl from '../../../components/ui/SegmentedControl.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_OPTIONS,
  STATUS_TONES
} from '../constants.js';
import { usePurchaseManagement } from '../PurchaseManagementProvider.jsx';

export default function OrdersSection() {
  const {
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
      supplierOptions,
      budgetOptions,
      selectedBudget,
      orderTotals,
      orderTotalAmount,
      receivingDraft,
      receivingSaving,
      attachmentSaving
    },
    actions: {
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
      refreshOrderDetail
    },
    helpers: { allowedTransitions, formatCurrency }
  } = usePurchaseManagement();

  const budgetTagClass = selectedBudget?.tone === 'danger'
    ? 'bg-rose-100 text-rose-700'
    : selectedBudget?.tone === 'warning'
      ? 'bg-amber-100 text-amber-700'
      : selectedBudget?.tone === 'success'
        ? 'bg-emerald-100 text-emerald-700'
        : 'bg-slate-100 text-slate-700';

  const currentCommit = orderBudgetImpact?.committed ?? 0;
  const currentSpent = orderBudgetImpact?.spent ?? 0;
  const projectedCommit = Math.max(orderTotalAmount - currentSpent, 0);
  const commitmentDelta = projectedCommit - currentCommit;
  const budgetRemainingRaw =
    selectedBudget?.id && typeof selectedBudget.remainingRaw === 'number'
      ? selectedBudget.remainingRaw
      : null;
  const projectedRemaining =
    selectedBudget?.id && budgetRemainingRaw != null ? budgetRemainingRaw - commitmentDelta : null;
  const projectedRemainingTone =
    projectedRemaining != null && projectedRemaining < 0 ? 'text-rose-600' : 'text-slate-800';

  return (
    <section className="space-y-12">
      <Card padding="lg" className="space-y-8 border-slate-200 bg-white/90 shadow-lg shadow-primary/5">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-primary">Purchase order workspace</h2>
            <p className="text-sm text-slate-600">
              Filter live orders, open a record to edit, and generate new purchase flows.
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.35em] text-slate-400">
              {ordersMeta?.total ? `${ordersMeta.total} orders tracked` : 'No purchase orders recorded yet'}
            </p>
          </div>
          <Button type="button" variant="primary" size="sm" icon={PlusIcon} onClick={resetOrderForm}>
            New purchase order
          </Button>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Filters</p>
              <SegmentedControl
                name="Purchase order status"
                value={orderFilters.status}
                options={ORDER_STATUS_OPTIONS}
                onChange={(value) => handleFilterChange('status', value)}
                size="sm"
              />
              <form onSubmit={handleSearchSubmit} className="space-y-2">
                <FormField id="purchase-search" label="Search" hint="Search by reference or supplier">
                  <input
                    id="purchase-search"
                    type="search"
                    value={orderFilters.search}
                    onChange={handleSearchChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Search purchase orders"
                  />
                </FormField>
                <Button type="submit" variant="secondary" size="sm" icon={DocumentArrowDownIcon} iconPosition="start">
                  Apply filters
                </Button>
              </form>
              {ordersError ? <StatusPill tone="danger">{ordersError}</StatusPill> : null}
              {ordersLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Spinner className="h-4 w-4 text-primary" /> Loading orders…
                </div>
              ) : null}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/70">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-100/80">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-semibold text-slate-600">Reference</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Supplier</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Budget</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Total</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Expected</th>
                    <th className="px-4 py-3 font-semibold text-right text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                        No purchase orders found. Create your first procurement request.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id} className="bg-white/60">
                        <td className="px-4 py-3 font-medium text-slate-800">{order.reference}</td>
                        <td className="px-4 py-3 text-slate-600">{order.supplierName}</td>
                        <td className="px-4 py-3 text-slate-500">
                          {order.budget ? `${order.budget.category} • FY${order.budget.fiscalYear}` : 'Unassigned'}
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill tone={STATUS_TONES[order.status] ?? 'neutral'}>
                            {ORDER_STATUS_LABELS[order.status] ?? order.status}
                          </StatusPill>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatCurrency(order.total, order.currency)}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {order.expectedAt ? new Date(order.expectedAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant={activeOrderId === order.id ? 'primary' : 'ghost'}
                            onClick={() => handleSelectOrder(order.id)}
                          >
                            {activeOrderId === order.id ? 'Viewing' : 'Open'}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>

      <Card padding="lg" className="space-y-8 border-slate-200 bg-white/90 shadow-lg shadow-primary/5">
        <header className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-primary">
                {orderForm.id ? `Edit purchase order ${orderForm.reference || ''}` : 'Create purchase order'}
              </h2>
              <p className="text-sm text-slate-600">
                Maintain line items, supplier data, and attachments for this procurement.
              </p>
            </div>
            {orderForm.id ? (
              <StatusPill tone={STATUS_TONES[orderForm.status] ?? 'neutral'}>
                {ORDER_STATUS_LABELS[orderForm.status] ?? orderForm.status}
              </StatusPill>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" size="sm" icon={ArrowLeftOnRectangleIcon} onClick={resetOrderForm}>
              Reset form
            </Button>
            <Button type="button" variant="secondary" size="sm" icon={ArrowPathIcon} onClick={() => refreshOrderDetail(orderForm.id)}>
              Refresh record
            </Button>
          </div>
          {orderFeedback ? <StatusPill tone="success">{orderFeedback}</StatusPill> : null}
          {orderError ? <StatusPill tone="danger">{orderError}</StatusPill> : null}
        </header>

        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
          <span>Budget line</span>
          <span className={`rounded-full px-3 py-1 text-[0.7rem] font-semibold normal-case ${budgetTagClass}`}>
            {selectedBudget?.label ?? 'Unassigned'}
          </span>
        </div>

        <form className="space-y-10" onSubmit={handleOrderSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            <FormField id="supplier-select" label="Supplier">
              <select
                id="supplier-select"
                value={orderForm.supplierId}
                onChange={handleSupplierSelect}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {supplierOptions.map((supplier) => (
                  <option key={supplier.id || 'manual'} value={supplier.id || ''}>
                    {supplier.id ? supplier.name : 'Manual entry'}
                  </option>
                ))}
              </select>
            </FormField>
            <TextInput
              label="Supplier name"
              value={orderForm.supplierName}
              onChange={(event) => handleOrderFieldChange('supplierName', event.target.value)}
              hint="Auto-populated when selecting an existing supplier"
            />
            <FormField id="budget-select" label="Budget line" optionalLabel="optional">
              <select
                id="budget-select"
                value={orderForm.budgetId}
                onChange={(event) => handleOrderFieldChange('budgetId', event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {budgetOptions.map((budget) => (
                  <option key={budget.id || 'unassigned'} value={budget.id}>
                    {budget.label}
                  </option>
                ))}
              </select>
            </FormField>
            <TextInput
              label="Currency"
              value={orderForm.currency}
              onChange={(event) => handleOrderFieldChange('currency', event.target.value.toUpperCase())}
            />
            <TextInput
              label="Expected delivery"
              type="date"
              value={orderForm.expectedAt}
              onChange={(event) => handleOrderFieldChange('expectedAt', event.target.value)}
            />
            <TextInput
              label="Reference"
              value={orderForm.reference}
              onChange={(event) => handleOrderFieldChange('reference', event.target.value)}
              optionalLabel="optional"
            />
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={orderForm.approvalRequired}
                  onChange={(event) => handleOrderFieldChange('approvalRequired', event.target.checked)}
                  className="mr-2 rounded border-slate-300 text-primary focus:ring-primary"
                />
                Approval required
              </label>
            </div>
            <FormField id="order-notes" label="Internal notes" optionalLabel="optional">
              <textarea
                id="order-notes"
                value={orderForm.notes}
                onChange={(event) => handleOrderFieldChange('notes', event.target.value)}
                className="min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </FormField>
          </div>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            <header className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-primary">Line items</h3>
                <p className="text-xs text-slate-500">Add materials, equipment, or services that require purchasing.</p>
              </div>
              <Button type="button" variant="ghost" size="sm" icon={PlusIcon} onClick={handleAddItem}>
                Add line
              </Button>
            </header>
            <div className="space-y-4">
              {orderForm.items.map((item, index) => (
                <div key={item.id ?? index} className="space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextInput
                      label="Item name"
                      value={item.itemName}
                      onChange={(event) => handleItemChange(index, 'itemName', event.target.value)}
                      required
                    />
                    <TextInput
                      label="SKU"
                      value={item.sku}
                      onChange={(event) => handleItemChange(index, 'sku', event.target.value)}
                      optionalLabel="optional"
                    />
                    <FormField id={`item-description-${index}`} label="Description" optionalLabel="optional">
                      <textarea
                        id={`item-description-${index}`}
                        value={item.description}
                        onChange={(event) => handleItemChange(index, 'description', event.target.value)}
                        className="min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </FormField>
                    <TextInput
                      label="Image URL"
                      value={item.imageUrl}
                      onChange={(event) => handleItemChange(index, 'imageUrl', event.target.value)}
                      optionalLabel="optional"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-4">
                    <TextInput
                      label="Quantity"
                      type="number"
                      min="0"
                      value={item.quantity}
                      onChange={(event) => handleItemChange(index, 'quantity', event.target.value)}
                    />
                    <TextInput
                      label="Unit cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitCost}
                      onChange={(event) => handleItemChange(index, 'unitCost', event.target.value)}
                    />
                    <TextInput
                      label="Tax rate %"
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.taxRate}
                      onChange={(event) => handleItemChange(index, 'taxRate', event.target.value)}
                    />
                    <TextInput
                      label="Expected"
                      type="date"
                      value={item.expectedAt}
                      onChange={(event) => handleItemChange(index, 'expectedAt', event.target.value)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveItem(index)}>
                      Remove line
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Order totals</p>
                <p className="mt-2 text-sm text-slate-600">
                  Subtotal {formatCurrency(orderTotals.subtotal, orderForm.currency)} • Tax {formatCurrency(orderTotals.taxTotal, orderForm.currency)}
                </p>
                <p className="mt-3 text-lg font-semibold text-primary">
                  Total {formatCurrency(orderTotalAmount, orderForm.currency)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Budget coverage</p>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  {selectedBudget?.label ?? 'Unassigned'}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-600">
                  <div>
                    <dt>Budget remaining</dt>
                    <dd className="mt-1 font-semibold text-slate-800">
                      {selectedBudget?.id
                        ? formatCurrency(Math.max(selectedBudget.remaining ?? 0, 0), selectedBudget.currency)
                        : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt>Projected remaining</dt>
                    <dd className={`mt-1 font-semibold ${projectedRemainingTone}`}>
                      {selectedBudget?.id
                        ? formatCurrency(projectedRemaining ?? 0, selectedBudget.currency)
                        : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt>Outstanding on order</dt>
                    <dd className="mt-1 font-semibold text-slate-800">
                      {selectedBudget?.id
                        ? `${formatCurrency(orderBudgetImpact?.committed ?? 0, selectedBudget.currency)}${
                            orderForm.status === 'draft' ? ' (draft)' : ''
                          }`
                        : formatCurrency(orderTotalAmount, orderForm.currency)}
                    </dd>
                  </div>
                  <div>
                    <dt>Recorded spend</dt>
                    <dd className="mt-1 font-semibold text-slate-800">
                      {selectedBudget?.id
                        ? formatCurrency(orderBudgetImpact?.spent ?? 0, selectedBudget.currency)
                        : formatCurrency(0, orderForm.currency)}
                    </dd>
                  </div>
                  <div>
                    <dt>Budget signal</dt>
                    <dd className="mt-1 capitalize text-slate-700">
                      {selectedBudget?.id
                        ? orderForm.status === 'draft'
                          ? 'Draft — not committed'
                          : selectedBudget.tone === 'danger'
                            ? 'Over-allocated'
                            : selectedBudget.tone === 'warning'
                              ? 'Approaching limit'
                              : 'On track'
                        : 'Unassigned'}
                    </dd>
                  </div>
                </dl>
                {selectedBudget?.id ? (
                  <p
                    className={`mt-3 text-xs ${
                      projectedRemaining != null && projectedRemaining < 0 ? 'text-rose-600' : 'text-slate-500'
                    }`}
                  >
                    {projectedRemaining != null && projectedRemaining < 0
                      ? 'This change will exceed the allocated budget. Consider revising quantities or selecting another budget line.'
                      : 'Changes are within the selected budget guardrails.'}
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">
                    Assign this order to a budget to unlock guardrail and reporting automation.
                  </p>
                )}
              </div>
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="primary" size="md" disabled={orderSaving}>
              {orderSaving ? 'Saving…' : orderForm.id ? 'Save updates' : 'Create purchase order'}
            </Button>
            {allowedTransitions(orderForm.status).length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Progress status</span>
                {allowedTransitions(orderForm.status).map((status) => (
                  <Button
                    key={status}
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleStatusTransition(status)}
                    disabled={orderSaving}
                  >
                    {ORDER_STATUS_LABELS[status] ?? status}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
        </form>

        {orderForm.id ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <header className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-primary">Receiving</h3>
                  <p className="text-xs text-slate-500">Capture quantities as deliveries arrive.</p>
                </div>
              </header>
              <form className="space-y-4" onSubmit={handleReceivingSubmit}>
                <div className="space-y-3">
                  {receivingDraft.map((line) => {
                    const item = orderForm.items.find((entry) => entry.id === line.id);
                    if (!item) return null;
                    return (
                      <div key={line.id} className="rounded-xl border border-slate-200 bg-white/80 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-slate-700">{item.itemName}</p>
                            <p className="text-xs text-slate-500">Ordered {item.quantity}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Received</label>
                            <input
                              type="number"
                              min="0"
                              max={Number.parseFloat(item.quantity) || undefined}
                              value={line.receivedQuantity}
                              onChange={(event) => handleReceivingDraftChange(line.id, event.target.value)}
                              className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <FormField id="receiving-note" label="Receiving note" optionalLabel="optional">
                  <textarea
                    id="receiving-note"
                    name="note"
                    className="min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Add context for warehouse or finance teams"
                  />
                </FormField>
                <Button type="submit" variant="secondary" size="sm" disabled={receivingSaving}>
                  {receivingSaving ? 'Saving…' : 'Record receipt'}
                </Button>
              </form>
            </section>

            <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <header className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-primary">Attachments</h3>
                  <p className="text-xs text-slate-500">Link invoices, quotes, or delivery dockets.</p>
                </div>
              </header>
              <div className="space-y-3">
                {orderForm.attachments?.length ? (
                  orderForm.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/80 px-3 py-2">
                      <div className="flex items-center gap-3">
                        <PaperClipIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        <div>
                          <p className="text-sm font-medium text-slate-700">{attachment.fileName}</p>
                          <p className="text-xs text-slate-500">{attachment.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={attachment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          View
                        </a>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          icon={TrashIcon}
                          onClick={() => handleAttachmentDelete(attachment.id)}
                          disabled={attachmentSaving}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No attachments added yet.</p>
                )}
              </div>
              <form className="space-y-3" onSubmit={handleAttachmentSubmit}>
                <TextInput name="fileName" label="File name" placeholder="quote.pdf" />
                <TextInput name="fileUrl" label="URL" placeholder="https://" />
                <FormField id="attachment-category" label="Category">
                  <select
                    id="attachment-category"
                    name="category"
                    defaultValue="quote"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="quote">Quote</option>
                    <option value="invoice">Invoice</option>
                    <option value="packing_slip">Packing slip</option>
                    <option value="receiving">Receiving</option>
                    <option value="other">Other</option>
                  </select>
                </FormField>
                <FormField id="attachment-notes" label="Notes" optionalLabel="optional">
                  <textarea
                    id="attachment-notes"
                    name="attachmentNotes"
                    className="min-h-[60px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </FormField>
                <Button type="submit" variant="secondary" size="sm" disabled={attachmentSaving}>
                  {attachmentSaving ? 'Saving…' : 'Upload reference'}
                </Button>
              </form>
            </section>
          </div>
        ) : null}
      </Card>
    </section>
  );
}
