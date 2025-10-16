import {
  ArrowPathIcon,
  ArrowsUpDownIcon,
  PlusIcon,
  Squares2X2Icon,
  TrashIcon
} from '@heroicons/react/24/outline';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import Textarea from '../../../components/ui/Textarea.jsx';
import Checkbox from '../../../components/ui/Checkbox.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import { CONDITION_OPTIONS, FULFILMENT_TYPES, ITEM_TYPES, STATUS_OPTIONS } from '../constants.js';
import { useProviderInventory } from '../ProviderInventoryProvider.jsx';

const selectClassName =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30';

export default function InventoryItemsSection() {
  const {
    data: {
      filteredItems,
      itemsLoading,
      itemsError,
      itemFilters,
      selectedItem,
      itemForm,
      itemMetadataDraft,
      itemSaving,
      itemDeleting,
      itemDetailLoading,
      itemFeedback,
      itemError,
      itemStats,
      adjustmentForm,
      adjustmentSaving,
      adjustmentFeedback,
      categories,
      zones,
      tags
    },
    actions: {
      loadItems,
      handleItemFilterChange,
      handleItemSearchChange,
      handleItemSearchSubmit,
      handleSelectItem,
      handleItemFieldChange,
      handleItemTagToggle,
      handleItemMetadataChange,
      handleItemSubmit,
      handleItemDelete,
      resetItemForm,
      handleAdjustmentFieldChange,
      handleAdjustmentSubmit
    }
  } = useProviderInventory();

  const renderStatusPill = (status) => {
    if (!status) return null;
    const tone =
      status === 'active' ? 'success' : status === 'draft' ? 'neutral' : status === 'inactive' ? 'warning' : 'danger';
    return <StatusPill tone={tone}>{status.replace(/_/g, ' ')}</StatusPill>;
  };

  return (
    <Card padding="lg" className="space-y-10 border-slate-200 bg-white/90 shadow-lg shadow-primary/5">
      <header className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Provider inventory control</p>
            <h2 className="text-3xl font-semibold text-primary">Inventory catalogue</h2>
            <p className="max-w-2xl text-sm text-slate-600">
              Maintain every rentable tool and consumable with live pricing, stock posture, and descriptive content. Use the
              filters to surface specific SKUs and the editor to update pricing, availability, or positioning.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" icon={PlusIcon} onClick={resetItemForm}>
              New inventory item
            </Button>
            <Button type="button" variant="ghost" size="sm" icon={ArrowPathIcon} onClick={() => loadItems()}>
              Refresh list
            </Button>
            <Button type="button" variant="ghost" size="sm" icon={Squares2X2Icon} to="/dashboards/provider/panel">
              Open provider control tower
            </Button>
          </div>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <dt className="text-xs uppercase tracking-[0.35em] text-slate-500">Items tracked</dt>
            <dd className="mt-2 text-2xl font-semibold text-slate-900">{itemStats.total}</dd>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
            <dt className="text-xs uppercase tracking-[0.35em] text-emerald-600">Available units</dt>
            <dd className="mt-2 text-2xl font-semibold text-emerald-700">{itemStats.totalAvailable}</dd>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
            <dt className="text-xs uppercase tracking-[0.35em] text-amber-600">Draft SKUs</dt>
            <dd className="mt-2 text-2xl font-semibold text-amber-700">{itemStats.byStatus.draft ?? 0}</dd>
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4">
            <dt className="text-xs uppercase tracking-[0.35em] text-indigo-600">Estimated stock value</dt>
            <dd className="mt-2 text-2xl font-semibold text-indigo-700">
              £{itemStats.estimatedStockValue.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
            </dd>
          </div>
        </dl>

        {itemFeedback ? <StatusPill tone="success">{itemFeedback}</StatusPill> : null}
        {itemError ? <StatusPill tone="danger">{itemError}</StatusPill> : null}
        {itemsError ? <StatusPill tone="danger">{itemsError}</StatusPill> : null}
      </header>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="space-y-6">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Filter catalogue</p>
            <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" onSubmit={handleItemSearchSubmit}>
              <FormField id="inventory-search" label="Search" className="md:col-span-2 xl:col-span-1">
                <input
                  id="inventory-search"
                  type="search"
                  value={itemFilters.search}
                  onChange={handleItemSearchChange}
                  className={selectClassName}
                  placeholder="Find by name or SKU"
                />
              </FormField>
              <FormField id="inventory-status" label="Status">
                <select
                  id="inventory-status"
                  className={selectClassName}
                  value={itemFilters.status}
                  onChange={(event) => handleItemFilterChange('status', event.target.value)}
                >
                  <option value="all">All statuses</option>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField id="inventory-type" label="Item type">
                <select
                  id="inventory-type"
                  className={selectClassName}
                  value={itemFilters.itemType}
                  onChange={(event) => handleItemFilterChange('itemType', event.target.value)}
                >
                  <option value="all">All types</option>
                  {ITEM_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField id="inventory-fulfilment" label="Rental / purchase">
                <select
                  id="inventory-fulfilment"
                  className={selectClassName}
                  value={itemFilters.fulfilmentType}
                  onChange={(event) => handleItemFilterChange('fulfilmentType', event.target.value)}
                >
                  <option value="all">All fulfilment models</option>
                  {FULFILMENT_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField id="inventory-category" label="Category">
                <select
                  id="inventory-category"
                  className={selectClassName}
                  value={itemFilters.category}
                  onChange={(event) => handleItemFilterChange('category', event.target.value)}
                >
                  <option value="all">All categories</option>
                  <option value="uncategorised">Uncategorised items</option>
                  {categories.map((category) => (
                    <option key={category.id ?? category.name} value={category.id ?? category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <div className="md:col-span-2 xl:col-span-1">
                <Button type="submit" variant="secondary" size="sm" icon={ArrowsUpDownIcon} iconPosition="start">
                  Apply filters
                </Button>
              </div>
            </form>
            {itemsLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Spinner className="h-4 w-4 text-primary" /> Loading catalogue…
              </div>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-100/80">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-semibold text-slate-600">Item</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Category</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Type</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Availability</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Zone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                        No inventory items match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const availability = (item.quantityOnHand ?? 0) - (item.quantityReserved ?? 0);
                      const isSelected = selectedItem?.id === item.id;
                      return (
                        <tr
                          key={item.id}
                          className={`cursor-pointer bg-white/70 transition hover:bg-primary/5 ${
                            isSelected ? 'bg-primary/10 font-semibold text-primary' : ''
                          }`}
                          onClick={() => handleSelectItem(item.id)}
                        >
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <p>{item.name}</p>
                              <p className="text-xs text-slate-500">SKU {item.sku}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{item.categoryRef?.name ?? item.category ?? '—'}</td>
                          <td className="px-4 py-3 text-slate-600 capitalize">{item.itemType ?? '—'}</td>
                          <td className="px-4 py-3 text-slate-600">{availability} units</td>
                          <td className="px-4 py-3">{renderStatusPill(item.status)}</td>
                          <td className="px-4 py-3 text-slate-600">{item.locationZone?.name ?? '—'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="space-y-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-6">
          <header className="space-y-2">
            <h3 className="text-xl font-semibold text-primary">{itemForm.id ? 'Edit inventory item' : 'Create inventory item'}</h3>
            <p className="text-xs text-slate-500">
              Update commercial details, asset tagging, and availability. Changes are synced immediately to downstream
              order, rental, and marketplace views.
            </p>
            {itemDetailLoading ? (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Spinner className="h-4 w-4 text-primary" /> Loading item detail…
              </div>
            ) : null}
          </header>

          <div className="space-y-4">
            <TextInput
              label="Display name"
              value={itemForm.name}
              onChange={(event) => handleItemFieldChange('name', event.target.value)}
              required
            />
            <TextInput
              label="Company ID"
              value={itemForm.companyId}
              onChange={(event) => handleItemFieldChange('companyId', event.target.value)}
              hint="Assign the owning provider or franchise. Required for creation."
              required={!itemForm.id}
            />
            <TextInput
              label="SKU"
              value={itemForm.sku}
              onChange={(event) => handleItemFieldChange('sku', event.target.value)}
              required
            />
            <TextInput
              label="Tagline"
              value={itemForm.tagline}
              onChange={(event) => handleItemFieldChange('tagline', event.target.value)}
              hint="Short marketing copy displayed on storefronts"
            />
            <Textarea
              label="Description"
              minRows={4}
              value={itemForm.description}
              onChange={(event) => handleItemFieldChange('description', event.target.value)}
            />
            <FormField id="item-category" label="Category">
              <select
                id="item-category"
                className={selectClassName}
                value={itemForm.categoryId || itemForm.category || ''}
                onChange={(event) => {
                  const value = event.target.value;
                  const selectedCategory = categories.find((category) => category.id === value || category.name === value);
                  handleItemFieldChange('categoryId', selectedCategory?.id ?? '');
                  handleItemFieldChange('category', selectedCategory?.name ?? value);
                }}
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id ?? category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </FormField>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField id="item-type" label="Item type">
                <select
                  id="item-type"
                  className={selectClassName}
                  value={itemForm.itemType}
                  onChange={(event) => handleItemFieldChange('itemType', event.target.value)}
                >
                  {ITEM_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField id="item-fulfilment" label="Rental or buy">
                <select
                  id="item-fulfilment"
                  className={selectClassName}
                  value={itemForm.fulfilmentType}
                  onChange={(event) => handleItemFieldChange('fulfilmentType', event.target.value)}
                >
                  {FULFILMENT_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <TextInput
                label="Quantity on hand"
                type="number"
                min="0"
                value={itemForm.quantityOnHand}
                onChange={(event) => handleItemFieldChange('quantityOnHand', event.target.value)}
              />
              <TextInput
                label="Reserved quantity"
                type="number"
                min="0"
                value={itemForm.quantityReserved}
                onChange={(event) => handleItemFieldChange('quantityReserved', event.target.value)}
              />
              <TextInput
                label="Safety stock"
                type="number"
                min="0"
                value={itemForm.safetyStock}
                onChange={(event) => handleItemFieldChange('safetyStock', event.target.value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <TextInput
                label="Rental rate"
                type="number"
                min="0"
                step="0.01"
                prefix={itemForm.rentalRateCurrency}
                value={itemForm.rentalRate}
                onChange={(event) => handleItemFieldChange('rentalRate', event.target.value)}
              />
              <TextInput
                label="Deposit"
                type="number"
                min="0"
                step="0.01"
                prefix={itemForm.depositCurrency}
                value={itemForm.depositAmount}
                onChange={(event) => handleItemFieldChange('depositAmount', event.target.value)}
              />
              <TextInput
                label="Purchase price"
                type="number"
                min="0"
                step="0.01"
                prefix={itemForm.purchasePriceCurrency}
                value={itemForm.purchasePrice}
                onChange={(event) => handleItemFieldChange('purchasePrice', event.target.value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField id="item-status" label="Status">
                <select
                  id="item-status"
                  className={selectClassName}
                  value={itemForm.status}
                  onChange={(event) => handleItemFieldChange('status', event.target.value)}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField id="item-condition" label="Condition rating">
                <select
                  id="item-condition"
                  className={selectClassName}
                  value={itemForm.conditionRating}
                  onChange={(event) => handleItemFieldChange('conditionRating', event.target.value)}
                >
                  {CONDITION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
            <FormField id="item-zone" label="Zone">
              <select
                id="item-zone"
                className={selectClassName}
                value={itemForm.locationZoneId ?? ''}
                onChange={(event) => handleItemFieldChange('locationZoneId', event.target.value)}
              >
                <option value="">Unassigned</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </FormField>
            <Checkbox
              label="Insurance required for rental"
              checked={Boolean(itemForm.insuranceRequired)}
              onChange={(event) => handleItemFieldChange('insuranceRequired', event.target.checked)}
            />
            <FormField id="item-tags" label="Word tagging">
              <div className="flex flex-wrap gap-2">
                {tags.length === 0 ? (
                  <p className="text-xs text-slate-500">No tags defined yet. Use the tagging manager below.</p>
                ) : (
                  tags.map((tag) => (
                    <label
                      key={tag.id}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition ${
                        itemForm.tagIds.includes(tag.id)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-primary"
                        checked={itemForm.tagIds.includes(tag.id)}
                        onChange={() => handleItemTagToggle(tag.id)}
                      />
                      <span>{tag.name}</span>
                    </label>
                  ))
                )}
              </div>
            </FormField>
            <FormField id="item-metadata" label="Metadata JSON" hint="Advanced: extend with custom properties">
              <textarea
                id="item-metadata"
                className={`${selectClassName} font-mono text-xs`}
                rows={6}
                value={itemMetadataDraft}
                onChange={(event) => handleItemMetadataChange(event.target.value)}
              />
            </FormField>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="primary" size="sm" onClick={handleItemSubmit} disabled={itemSaving}>
              {itemSaving ? 'Saving…' : 'Save inventory item'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={TrashIcon}
              onClick={handleItemDelete}
              disabled={!itemForm.id || itemDeleting}
            >
              {itemDeleting ? 'Removing…' : 'Delete'}
            </Button>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-4">
            <header>
              <h4 className="text-sm font-semibold text-primary">Quick quantity adjustment</h4>
              <p className="text-xs text-slate-500">
                Record inbound receipts or usage. Adjustments are appended to the ledger and update availability instantly.
              </p>
            </header>
            {adjustmentFeedback ? <StatusPill tone="info">{adjustmentFeedback}</StatusPill> : null}
            <div className="grid gap-3 md:grid-cols-[minmax(0,160px)_minmax(0,1fr)]">
              <FormField id="adjustment-type" label="Movement">
                <select
                  id="adjustment-type"
                  className={selectClassName}
                  value={adjustmentForm.type}
                  onChange={(event) => handleAdjustmentFieldChange('type', event.target.value)}
                >
                  <option value="increment">Increase stock</option>
                  <option value="decrement">Decrease stock</option>
                </select>
              </FormField>
              <TextInput
                label="Quantity"
                type="number"
                min="1"
                value={adjustmentForm.quantity}
                onChange={(event) => handleAdjustmentFieldChange('quantity', event.target.value)}
              />
            </div>
            <Textarea
              label="Adjustment note"
              minRows={2}
              value={adjustmentForm.note}
              onChange={(event) => handleAdjustmentFieldChange('note', event.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAdjustmentSubmit}
              disabled={adjustmentSaving}
            >
              {adjustmentSaving ? 'Recording…' : 'Record adjustment'}
            </Button>
          </div>
        </section>
      </div>
    </Card>
  );
}
