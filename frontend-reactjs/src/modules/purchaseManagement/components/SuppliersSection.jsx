import { ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import SegmentedControl from '../../../components/ui/SegmentedControl.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import {
  SUPPLIER_STATUS_OPTIONS,
  SUPPLIER_STATUS_TONES,
  SUPPLIER_STATUS_TRANSITIONS
} from '../constants.js';
import { usePurchaseManagement } from '../PurchaseManagementProvider.jsx';

export default function SuppliersSection() {
  const {
    data: {
      suppliersLoading,
      suppliersError,
      supplierFeedback,
      supplierFilters,
      supplierForm,
      supplierSaving,
      supplierStatusCounts,
      filteredSuppliers
    },
    actions: {
      loadSuppliers,
      handleSupplierFilterChange,
      handleSupplierSearchChange,
      handleSupplierSearchSubmit,
      handleSupplierEdit,
      handleSupplierReset,
      handleSupplierFieldChange,
      handleSupplierSubmit,
      handleSupplierActivate
    }
  } = usePurchaseManagement();

  return (
    <Card padding="lg" className="space-y-8 border-slate-200 bg-white/90 shadow-lg shadow-primary/5">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-primary">Supplier directory</h2>
            <p className="text-sm text-slate-600">
              Maintain a living record of vendors, service notes, and compliance readiness.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" icon={PlusIcon} onClick={handleSupplierReset}>
              New supplier
            </Button>
            <Button type="button" variant="ghost" size="sm" icon={ArrowPathIcon} onClick={() => loadSuppliers()}>
              Refresh suppliers
            </Button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Suppliers tracked</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{supplierStatusCounts.total}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-600">Active</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-700">{supplierStatusCounts.active ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <p className="text-xs uppercase tracking-[0.35em] text-amber-600">On hold</p>
            <p className="mt-1 text-2xl font-semibold text-amber-700">{supplierStatusCounts.on_hold ?? 0}</p>
          </div>
        </div>
        {supplierFeedback ? <StatusPill tone="success">{supplierFeedback}</StatusPill> : null}
        {suppliersError ? <StatusPill tone="danger">{suppliersError}</StatusPill> : null}
      </header>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <section className="space-y-4">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Directory filters</p>
            <SegmentedControl
              name="Supplier status"
              size="sm"
              value={supplierFilters.status}
              options={SUPPLIER_STATUS_OPTIONS}
              onChange={(value) => handleSupplierFilterChange('status', value)}
            />
            <form onSubmit={handleSupplierSearchSubmit} className="space-y-2">
              <FormField id="supplier-search" label="Search" hint="Search by vendor name, email or tag">
                <input
                  id="supplier-search"
                  type="search"
                  value={supplierFilters.search}
                  onChange={handleSupplierSearchChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Find a supplier"
                />
              </FormField>
              <Button type="submit" variant="secondary" size="sm" icon={ArrowPathIcon} iconPosition="start">
                Apply search
              </Button>
            </form>
            {suppliersLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Spinner className="h-4 w-4 text-primary" /> Loading suppliers…
              </div>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-100/80">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-semibold text-slate-600">Supplier</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Contact</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Tags</th>
                    <th className="px-4 py-3 font-semibold text-right text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                        No suppliers captured yet.
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map((supplier) => (
                      <tr key={supplier.id} className="bg-white/70">
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <p className="font-medium text-slate-800">{supplier.name}</p>
                            <p className="text-xs text-slate-500">
                              Lead time {supplier.leadTimeDays ?? '—'} days • Payment terms {supplier.paymentTermsDays ?? '—'} days
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <div className="space-y-1">
                            <p>{supplier.contactEmail || '—'}</p>
                            <p className="text-xs text-slate-500">{supplier.contactPhone || '—'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill tone={SUPPLIER_STATUS_TONES[supplier.status] ?? 'neutral'}>
                            {supplier.status?.replace('_', ' ') ?? 'unknown'}
                          </StatusPill>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{supplier.tags || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button type="button" size="xs" variant="secondary" onClick={() => handleSupplierEdit(supplier)}>
                              Edit
                            </Button>
                            {(SUPPLIER_STATUS_TRANSITIONS[supplier.status] ?? []).map((transition) => (
                              <Button
                                key={transition.value}
                                type="button"
                                size="xs"
                                variant="ghost"
                                onClick={() => handleSupplierActivate(supplier.id, transition.value)}
                              >
                                {transition.label}
                              </Button>
                            ))}
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
          <header className="space-y-1">
            <h3 className="text-lg font-semibold text-primary">{supplierForm.id ? 'Edit supplier' : 'Register supplier'}</h3>
            <p className="text-xs text-slate-500">
              Capture onboarding details and access notes. All fields sync with the procurement API.
            </p>
          </header>
          <form className="space-y-4" onSubmit={handleSupplierSubmit}>
            <TextInput
              label="Supplier name"
              value={supplierForm.name}
              onChange={(event) => handleSupplierFieldChange('name', event.target.value)}
              required
            />
            <TextInput
              label="Contact email"
              type="email"
              value={supplierForm.contactEmail}
              onChange={(event) => handleSupplierFieldChange('contactEmail', event.target.value)}
              hint="Used for purchase order dispatch and alerts"
            />
            <TextInput
              label="Contact phone"
              value={supplierForm.contactPhone}
              onChange={(event) => handleSupplierFieldChange('contactPhone', event.target.value)}
              optionalLabel="optional"
            />
            <TextInput
              label="Website"
              type="url"
              value={supplierForm.website}
              onChange={(event) => handleSupplierFieldChange('website', event.target.value)}
              optionalLabel="optional"
            />
            <TextInput
              label="Tags"
              value={supplierForm.tags}
              onChange={(event) => handleSupplierFieldChange('tags', event.target.value)}
              hint="Comma separated e.g. steel, iso9001, local"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                label="Lead time (days)"
                type="number"
                min="0"
                value={supplierForm.leadTimeDays}
                onChange={(event) => handleSupplierFieldChange('leadTimeDays', event.target.value)}
              />
              <TextInput
                label="Payment terms (days)"
                type="number"
                min="0"
                value={supplierForm.paymentTermsDays}
                onChange={(event) => handleSupplierFieldChange('paymentTermsDays', event.target.value)}
              />
            </div>
            <FormField id="supplier-status" label="Status">
              <select
                id="supplier-status"
                value={supplierForm.status}
                onChange={(event) => handleSupplierFieldChange('status', event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="active">Active</option>
                <option value="on_hold">On hold</option>
                <option value="inactive">Inactive</option>
              </select>
            </FormField>
            <FormField id="supplier-notes" label="Notes" optionalLabel="optional">
              <textarea
                id="supplier-notes"
                value={supplierForm.notes}
                onChange={(event) => handleSupplierFieldChange('notes', event.target.value)}
                className="min-h-[90px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Delivery preferences, escalation contacts, certifications…"
              />
            </FormField>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="primary" size="sm" disabled={supplierSaving}>
                {supplierSaving ? 'Saving…' : supplierForm.id ? 'Update supplier' : 'Save supplier'}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={handleSupplierReset}>
                Clear form
              </Button>
            </div>
          </form>
        </section>
      </div>
    </Card>
  );
}
