import PropTypes from 'prop-types';
import Button from '../../components/ui/Button.jsx';
import TextInput from '../../components/ui/TextInput.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';

const conditionOptions = [
  { value: 'new', label: 'New' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'needs_service', label: 'Needs service' }
];

export default function MarketplaceInventoryForm({
  title,
  draft,
  onChange,
  onSubmit,
  onReset,
  saving,
  successMessage,
  errorMessage,
  mode,
  classification
}) {
  return (
    <section aria-labelledby={`${classification}-form-heading`} className="space-y-6">
      <header className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h2 id={`${classification}-form-heading`} className="text-2xl font-semibold text-primary">
            {title}
          </h2>
          <p className="text-sm text-slate-600">
            {classification === 'tool'
              ? 'Register inspection-ready tools and rental rates. All fields update instantly across the control centre.'
              : 'Track consumables, suppliers, and safety stock levels for materials governance.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-primary" />
            {mode === 'edit' ? 'Editing existing record' : 'Creating new record'}
          </span>
        </div>
      </header>

      <form
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <TextInput
          label="Company ID"
          value={draft.companyId}
          onChange={(event) => onChange('companyId', event.target.value)}
          required
          placeholder="00000000-0000-0000-0000-000000000000"
        />
        <TextInput
          label="Name"
          value={draft.name}
          onChange={(event) => onChange('name', event.target.value)}
          required
          placeholder={classification === 'tool' ? 'Thermal imaging kit' : 'Cat6A drum'}
        />
        <TextInput
          label="SKU"
          value={draft.sku}
          onChange={(event) => onChange('sku', event.target.value)}
          required
          placeholder="SKU identifier"
        />
        <TextInput
          label="Category"
          value={draft.category}
          onChange={(event) => onChange('category', event.target.value)}
          placeholder={classification === 'tool' ? 'Tools' : 'Materials'}
        />
        <TextInput
          label="Unit type"
          value={draft.unitType}
          onChange={(event) => onChange('unitType', event.target.value)}
          placeholder={classification === 'tool' ? 'unit' : 'case'}
        />
        <TextInput
          label="Quantity on hand"
          type="number"
          min="0"
          value={draft.quantityOnHand}
          onChange={(event) => onChange('quantityOnHand', event.target.value)}
        />
        <TextInput
          label="Quantity reserved"
          type="number"
          min="0"
          value={draft.quantityReserved}
          onChange={(event) => onChange('quantityReserved', event.target.value)}
        />
        <TextInput
          label="Safety stock"
          type="number"
          min="0"
          value={draft.safetyStock}
          onChange={(event) => onChange('safetyStock', event.target.value)}
        />
        <TextInput
          label="Rental rate (£)"
          type="number"
          min="0"
          step="0.01"
          value={draft.rentalRate}
          onChange={(event) => onChange('rentalRate', event.target.value)}
        />
        <TextInput
          label="Rental currency"
          value={draft.rentalRateCurrency}
          onChange={(event) => onChange('rentalRateCurrency', event.target.value.toUpperCase())}
        />
        <TextInput
          label="Deposit amount (£)"
          type="number"
          min="0"
          step="0.01"
          value={draft.depositAmount}
          onChange={(event) => onChange('depositAmount', event.target.value)}
        />
        <TextInput
          label="Deposit currency"
          value={draft.depositCurrency}
          onChange={(event) => onChange('depositCurrency', event.target.value.toUpperCase())}
        />
        <TextInput
          label="Replacement cost (£)"
          type="number"
          min="0"
          step="0.01"
          value={draft.replacementCost}
          onChange={(event) => onChange('replacementCost', event.target.value)}
        />
        <div>
          <label className="block text-sm font-medium text-primary">Condition rating</label>
          <select
            className="mt-1 w-full rounded-2xl border border-accent/20 bg-white px-4 py-2 text-sm text-primary shadow-sm focus:border-primary focus:outline-none"
            value={draft.conditionRating}
            onChange={(event) => onChange('conditionRating', event.target.value)}
          >
            {conditionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-accent/20 bg-white px-4 py-3 shadow-sm">
          <input
            id={`${classification}-insurance-required`}
            type="checkbox"
            checked={draft.insuranceRequired}
            onChange={(event) => onChange('insuranceRequired', event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
          <label htmlFor={`${classification}-insurance-required`} className="text-sm text-primary">
            Insurance required for checkout
          </label>
        </div>
        <TextInput
          label="Image URL"
          value={draft.imageUrl}
          onChange={(event) => onChange('imageUrl', event.target.value)}
          placeholder="https://"
        />
        <TextInput
          label="Datasheet URL"
          value={draft.datasheetUrl}
          onChange={(event) => onChange('datasheetUrl', event.target.value)}
          placeholder="https://"
        />
        <div className="md:col-span-2 xl:col-span-3">
          <label className="block text-sm font-medium text-primary" htmlFor={`${classification}-notes`}>
            Notes
          </label>
          <textarea
            id={`${classification}-notes`}
            className="mt-1 w-full rounded-2xl border border-accent/20 bg-white px-4 py-2 text-sm text-primary shadow-sm focus:border-primary focus:outline-none"
            rows={3}
            value={draft.notes}
            onChange={(event) => onChange('notes', event.target.value)}
            placeholder="Maintenance history, supplier context, escalation notes"
          />
        </div>
        <TextInput
          label="Tags"
          value={draft.tags}
          onChange={(event) => onChange('tags', event.target.value)}
          placeholder="Comma-separated keywords"
        />
        <div className="md:col-span-2 xl:col-span-3 flex flex-wrap items-center gap-3">
          <Button type="submit" loading={saving} disabled={saving}>
            {mode === 'edit' ? 'Update record' : 'Create record'}
          </Button>
          <Button type="button" variant="secondary" onClick={onReset} disabled={saving}>
            Reset form
          </Button>
          {successMessage ? <StatusPill tone="success">{successMessage}</StatusPill> : null}
          {errorMessage ? <StatusPill tone="danger">{errorMessage}</StatusPill> : null}
        </div>
      </form>
    </section>
  );
}

MarketplaceInventoryForm.propTypes = {
  title: PropTypes.string.isRequired,
  draft: PropTypes.shape({
    companyId: PropTypes.string,
    name: PropTypes.string,
    sku: PropTypes.string,
    category: PropTypes.string,
    unitType: PropTypes.string,
    quantityOnHand: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    quantityReserved: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    safetyStock: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    rentalRate: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    rentalRateCurrency: PropTypes.string,
    depositAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    depositCurrency: PropTypes.string,
    replacementCost: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    insuranceRequired: PropTypes.bool,
    conditionRating: PropTypes.string,
    imageUrl: PropTypes.string,
    datasheetUrl: PropTypes.string,
    notes: PropTypes.string,
    tags: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)])
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  successMessage: PropTypes.string,
  errorMessage: PropTypes.string,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  classification: PropTypes.oneOf(['tool', 'material']).isRequired
};

MarketplaceInventoryForm.defaultProps = {
  saving: false,
  successMessage: null,
  errorMessage: null
};
