import { ArrowPathIcon, LinkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import Textarea from '../../../components/ui/Textarea.jsx';
import Checkbox from '../../../components/ui/Checkbox.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import { SUPPLIER_STATUS_OPTIONS } from '../constants.js';
import { useProviderInventory } from '../ProviderInventoryProvider.jsx';

const selectClassName =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30';

export default function SupplierManagementSection() {
  const {
    data: {
      selectedItem,
      supplierDirectory,
      supplierDirectoryLoading,
      supplierDirectoryError,
      itemSupplierLinks,
      supplierLinkForm,
      supplierLinkSaving,
      supplierLinkFeedback,
      supplierLinkError
    },
    actions: {
      loadSupplierDirectory,
      handleSupplierLinkFieldChange,
      handleSupplierLinkEdit,
      resetSupplierLinkForm,
      handleSupplierLinkSubmit,
      handleSupplierLinkDelete
    }
  } = useProviderInventory();

  const hasSelectedItem = Boolean(selectedItem?.id);

  return (
    <Card padding="lg" className="space-y-8 border-slate-200 bg-white/90 shadow-lg shadow-primary/5">
      <header className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-primary">Supplier pricing</h2>
            <p className="text-sm text-slate-600">
              Link approved suppliers to the active inventory item, capture negotiated rates, and flag the primary sourcing
              partner for each SKU.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" icon={PlusIcon} onClick={resetSupplierLinkForm}>
              New supplier link
            </Button>
            <Button type="button" variant="ghost" size="sm" icon={ArrowPathIcon} onClick={() => loadSupplierDirectory()}>
              Refresh directory
            </Button>
          </div>
        </div>
        {supplierLinkFeedback ? <StatusPill tone="success">{supplierLinkFeedback}</StatusPill> : null}
        {supplierLinkError ? <StatusPill tone="danger">{supplierLinkError}</StatusPill> : null}
        {!hasSelectedItem ? (
          <StatusPill tone="info">Select an inventory item to manage supplier relationships.</StatusPill>
        ) : null}
      </header>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
            <h3 className="text-sm font-semibold text-slate-700">Supplier directory</h3>
            <p className="mt-1 text-xs text-slate-500">
              Directory entries pull from the procurement workspace. Click a supplier to populate the linking form.
            </p>
            {supplierDirectoryError ? <StatusPill tone="danger">{supplierDirectoryError}</StatusPill> : null}
            {supplierDirectoryLoading ? (
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <Spinner className="h-3.5 w-3.5 text-primary" /> Loading suppliers…
              </div>
            ) : null}
            <ul className="mt-4 space-y-2">
              {supplierDirectory.length === 0 ? (
                <li className="text-xs text-slate-500">No suppliers registered yet.</li>
              ) : (
                supplierDirectory.map((supplier) => (
                  <li key={supplier.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2 text-left text-sm text-slate-700 transition hover:border-primary/40 hover:text-primary"
                      onClick={() => handleSupplierLinkFieldChange('supplierId', supplier.id)}
                    >
                      <span className="font-medium">{supplier.name}</span>
                      <span className="text-xs text-slate-500">{supplier.status ?? '—'}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
            <Button
              to="/admin/purchases"
              icon={LinkIcon}
              iconPosition="start"
              variant="ghost"
              size="xs"
              className="mt-3"
            >
              Open procurement workspace
            </Button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-100/80">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-semibold text-slate-600">Supplier</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Unit price</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Lead time</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                    <th className="px-4 py-3 font-semibold text-right text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itemSupplierLinks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                        {hasSelectedItem
                          ? 'No supplier pricing configured for this item yet.'
                          : 'Select an item to view linked suppliers.'}
                      </td>
                    </tr>
                  ) : (
                    itemSupplierLinks.map((link) => (
                      <tr key={link.id} className="bg-white/70">
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <p className="font-medium text-slate-800">{link.supplier?.name ?? link.supplierName ?? 'Unknown supplier'}</p>
                            <p className="text-xs text-slate-500">MOQ {link.minimumOrderQuantity ?? '—'} units</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {link.currency ?? 'GBP'} {Number(link.unitPrice ?? 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{link.leadTimeDays ?? '—'} days</td>
                        <td className="px-4 py-3">
                          <StatusPill tone={link.status === 'active' ? 'success' : 'warning'}>
                            {link.status ?? 'unknown'}
                          </StatusPill>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button type="button" size="xs" variant="secondary" onClick={() => handleSupplierLinkEdit(link)}>
                              Edit
                            </Button>
                            <Button
                              type="button"
                              size="xs"
                              variant="ghost"
                              onClick={() => handleSupplierLinkDelete(link.id)}
                              icon={TrashIcon}
                              iconPosition="start"
                            >
                              Remove
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
          <header>
            <h3 className="text-lg font-semibold text-primary">{supplierLinkForm.id ? 'Edit supplier link' : 'Link supplier'}</h3>
            <p className="text-xs text-slate-500">
              Capture current pricing and fulfilment terms. Mark a supplier as primary to surface in rental and purchase
              flows first.
            </p>
          </header>

          <FormField id="supplier-link-supplier" label="Supplier">
            <select
              id="supplier-link-supplier"
              className={selectClassName}
              value={supplierLinkForm.supplierId}
              onChange={(event) => handleSupplierLinkFieldChange('supplierId', event.target.value)}
              disabled={!hasSelectedItem}
            >
              <option value="">Select supplier</option>
              {supplierDirectory.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </FormField>
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Unit price"
              type="number"
              min="0"
              step="0.01"
              prefix={supplierLinkForm.currency || 'GBP'}
              value={supplierLinkForm.unitPrice}
              onChange={(event) => handleSupplierLinkFieldChange('unitPrice', event.target.value)}
              disabled={!hasSelectedItem}
            />
            <TextInput
              label="Currency"
              value={supplierLinkForm.currency}
              onChange={(event) => handleSupplierLinkFieldChange('currency', event.target.value)}
              disabled={!hasSelectedItem}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Minimum order quantity"
              type="number"
              min="1"
              value={supplierLinkForm.minimumOrderQuantity}
              onChange={(event) => handleSupplierLinkFieldChange('minimumOrderQuantity', event.target.value)}
              disabled={!hasSelectedItem}
            />
            <TextInput
              label="Lead time (days)"
              type="number"
              min="0"
              value={supplierLinkForm.leadTimeDays}
              onChange={(event) => handleSupplierLinkFieldChange('leadTimeDays', event.target.value)}
              disabled={!hasSelectedItem}
            />
          </div>
          <FormField id="supplier-link-status" label="Status">
            <select
              id="supplier-link-status"
              className={selectClassName}
              value={supplierLinkForm.status}
              onChange={(event) => handleSupplierLinkFieldChange('status', event.target.value)}
              disabled={!hasSelectedItem}
            >
              {SUPPLIER_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
          <Checkbox
            label="Primary supplier"
            checked={Boolean(supplierLinkForm.isPrimary)}
            onChange={(event) => handleSupplierLinkFieldChange('isPrimary', event.target.checked)}
            disabled={!hasSelectedItem}
          />
          <Textarea
            label="Notes"
            minRows={3}
            value={supplierLinkForm.notes}
            onChange={(event) => handleSupplierLinkFieldChange('notes', event.target.value)}
            disabled={!hasSelectedItem}
          />
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSupplierLinkSubmit}
              disabled={!hasSelectedItem || supplierLinkSaving}
            >
              {supplierLinkSaving ? 'Saving…' : 'Save supplier link'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={resetSupplierLinkForm}>
              Cancel
            </Button>
          </div>
        </section>
      </div>
    </Card>
  );
}
