import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ArchiveBoxIcon, PencilSquareIcon, PlusIcon } from '@heroicons/react/24/outline';
import Button from '../../../components/ui/Button.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';

function visibilityTone(visibility) {
  if (visibility === 'archived') return 'danger';
  if (visibility === 'private') return 'warning';
  return 'success';
}

const INITIAL_ITEM = {
  sku: '',
  name: '',
  summary: '',
  description: '',
  priceAmount: '',
  priceCurrency: 'GBP',
  stockOnHand: '',
  reorderPoint: '',
  visibility: 'public',
  featured: false,
  imageUrl: ''
};

function InventoryForm({ values, onChange, onSubmit, onCancel, submitting, submitLabel }) {
  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;
    onChange((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          SKU
          <input
            name="sku"
            value={values.sku}
            onChange={handleChange}
            required
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Name
          <input
            name="name"
            value={values.name}
            onChange={handleChange}
            required
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600 md:col-span-2">
          Summary
          <input
            name="summary"
            value={values.summary}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Visible in cards and promos"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600 md:col-span-2">
          Description
          <textarea
            name="description"
            value={values.description}
            onChange={handleChange}
            rows={3}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Price amount
          <input
            name="priceAmount"
            value={values.priceAmount}
            onChange={handleChange}
            type="number"
            min="0"
            step="0.01"
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Currency
          <input
            name="priceCurrency"
            value={values.priceCurrency}
            onChange={handleChange}
            maxLength={3}
            className="uppercase rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Stock on hand
          <input
            name="stockOnHand"
            value={values.stockOnHand}
            onChange={handleChange}
            type="number"
            min="0"
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Reorder point
          <input
            name="reorderPoint"
            value={values.reorderPoint}
            onChange={handleChange}
            type="number"
            min="0"
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Visibility
          <select
            name="visibility"
            value={values.visibility}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Image URL
          <input
            name="imageUrl"
            value={values.imageUrl}
            onChange={handleChange}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="https://cdn.fixnado.com/asset.jpg"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            name="featured"
            checked={values.featured}
            onChange={handleChange}
            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
          Featured in storefront hero
        </label>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={submitting} icon={PlusIcon} iconPosition="start">
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}

InventoryForm.propTypes = {
  values: PropTypes.shape({
    sku: PropTypes.string,
    name: PropTypes.string,
    summary: PropTypes.string,
    description: PropTypes.string,
    priceAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    priceCurrency: PropTypes.string,
    stockOnHand: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    reorderPoint: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    visibility: PropTypes.string,
    featured: PropTypes.bool,
    imageUrl: PropTypes.string
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  submitting: PropTypes.bool,
  submitLabel: PropTypes.string
};

InventoryForm.defaultProps = {
  onCancel: undefined,
  submitting: false,
  submitLabel: 'Save item'
};

export default function InventorySection({ inventory, meta, onCreate, onUpdate, onArchive, mutation }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [newItem, setNewItem] = useState(INITIAL_ITEM);
  const [errorMessage, setErrorMessage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editState, setEditState] = useState(null);

  const totals = useMemo(() => ({
    total: meta?.total ?? inventory.length,
    published: meta?.published ?? inventory.filter((item) => item.visibility === 'public').length,
    lowStock: meta?.lowStock ?? inventory.filter((item) => item.stockOnHand <= item.reorderPoint).length
  }), [inventory, meta]);

  const handleCreate = async () => {
    setErrorMessage(null);
    try {
      await onCreate({
        ...newItem,
        priceAmount: newItem.priceAmount === '' ? undefined : Number(newItem.priceAmount),
        stockOnHand: newItem.stockOnHand === '' ? undefined : Number(newItem.stockOnHand),
        reorderPoint: newItem.reorderPoint === '' ? undefined : Number(newItem.reorderPoint)
      });
      setNewItem(INITIAL_ITEM);
      setCreateOpen(false);
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to create inventory item');
    }
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditState({
      sku: item.sku,
      name: item.name,
      summary: item.summary || '',
      description: item.description || '',
      priceAmount: item.priceAmount ?? '',
      priceCurrency: item.priceCurrency || 'GBP',
      stockOnHand: item.stockOnHand ?? '',
      reorderPoint: item.reorderPoint ?? '',
      visibility: item.visibility || 'public',
      featured: Boolean(item.featured),
      imageUrl: item.imageUrl || ''
    });
    setErrorMessage(null);
  };

  const handleUpdate = async () => {
    if (!editingId) {
      return;
    }
    setErrorMessage(null);
    try {
      await onUpdate(editingId, {
        ...editState,
        priceAmount: editState.priceAmount === '' ? undefined : Number(editState.priceAmount),
        stockOnHand: editState.stockOnHand === '' ? undefined : Number(editState.stockOnHand),
        reorderPoint: editState.reorderPoint === '' ? undefined : Number(editState.reorderPoint)
      });
      setEditingId(null);
      setEditState(null);
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to update inventory item');
    }
  };

  const handleArchive = async (itemId) => {
    setErrorMessage(null);
    try {
      await onArchive(itemId);
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to archive inventory item');
    }
  };

  return (
    <section id="storefront-inventory" className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">Inventory management</h2>
          <p className="text-sm text-slate-600">
            Keep storefront listings accurate, highlight featured equipment, and monitor low stock alerts.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600">
            Total items: {totals.total}
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
            Published: {totals.published}
          </div>
          <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700">
            Low stock: {totals.lowStock}
          </div>
        </div>
      </header>

      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-6">
        {createOpen ? (
          <InventoryForm
            values={newItem}
            onChange={setNewItem}
            onSubmit={handleCreate}
            onCancel={() => {
              setCreateOpen(false);
              setNewItem(INITIAL_ITEM);
            }}
            submitting={mutation === 'create'}
            submitLabel="Add inventory item"
          />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">Add new inventory</p>
              <p className="text-xs text-slate-500">Create catalogue entries that sync with moderation and rental availability.</p>
            </div>
            <Button type="button" icon={PlusIcon} iconPosition="start" onClick={() => setCreateOpen(true)}>
              New item
            </Button>
          </div>
        )}
      </div>

      {errorMessage ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-600">{errorMessage}</div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {inventory.map((item) => {
          const lowStock = item.stockOnHand != null && item.reorderPoint != null && item.stockOnHand <= item.reorderPoint;
          const isEditing = editingId === item.id;
          return (
            <article key={item.id} className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-primary">{item.name}</h3>
                  <p className="text-xs text-slate-500">SKU {item.sku}</p>
                </div>
                <StatusPill tone={visibilityTone(item.visibility)}>{item.visibility}</StatusPill>
              </div>
              {item.summary ? <p className="mt-2 text-sm text-slate-600">{item.summary}</p> : null}
              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600">
                <div>
                  <dt className="font-semibold text-slate-500">Price</dt>
                  <dd className="mt-1 text-sm text-primary">
                    {item.priceAmount != null ? `${item.priceCurrency} ${Number(item.priceAmount).toLocaleString()}` : 'Not set'}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Stock on hand</dt>
                  <dd className="mt-1 text-sm text-primary">
                    {item.stockOnHand != null ? item.stockOnHand : 'Not set'}
                    {lowStock ? <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Low</span> : null}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Reorder point</dt>
                  <dd className="mt-1 text-sm text-primary">{item.reorderPoint != null ? item.reorderPoint : 'Not set'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Featured</dt>
                  <dd className="mt-1 text-sm text-primary">{item.featured ? 'Yes' : 'No'}</dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={PencilSquareIcon}
                  iconPosition="start"
                  onClick={() => startEditing(item)}
                >
                  Edit item
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={ArchiveBoxIcon}
                  iconPosition="start"
                  onClick={() => handleArchive(item.id)}
                  loading={mutation === item.id}
                >
                  Archive
                </Button>
              </div>

              {isEditing ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <InventoryForm
                    values={editState}
                    onChange={setEditState}
                    onSubmit={handleUpdate}
                    onCancel={() => {
                      setEditingId(null);
                      setEditState(null);
                    }}
                    submitting={mutation === item.id}
                    submitLabel="Save changes"
                  />
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {inventory.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
          No inventory items added yet. Create listings to populate your storefront catalogue and power marketplace placements.
        </div>
      ) : null}
    </section>
  );
}

InventorySection.propTypes = {
  inventory: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      sku: PropTypes.string,
      name: PropTypes.string,
      summary: PropTypes.string,
      description: PropTypes.string,
      priceAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      priceCurrency: PropTypes.string,
      stockOnHand: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      reorderPoint: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      visibility: PropTypes.string,
      featured: PropTypes.bool
    })
  ).isRequired,
  meta: PropTypes.shape({
    total: PropTypes.number,
    published: PropTypes.number,
    archived: PropTypes.number,
    lowStock: PropTypes.number
  }),
  onCreate: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
  mutation: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

InventorySection.defaultProps = {
  meta: null,
  mutation: null
};
