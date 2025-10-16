import PropTypes from 'prop-types';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Button, StatusPill, TextInput } from '../../../components/ui/index.js';

export default function RentalCreateCard({ form, onChange, onSubmit, status }) {
  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary">Create rental agreement</h2>
          <p className="text-sm text-slate-600">
            Provision a new rental directly from the admin console. Item and renter identifiers are required.
          </p>
        </div>
        <Button type="submit" icon={PlusIcon} disabled={status.loading}>
          {status.loading ? 'Creating…' : 'Create rental'}
        </Button>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <TextInput
          label="Inventory item ID"
          value={form.itemId}
          onChange={(event) => onChange((current) => ({ ...current, itemId: event.target.value }))}
          required
        />
        <TextInput
          label="Renter ID"
          value={form.renterId}
          onChange={(event) => onChange((current) => ({ ...current, renterId: event.target.value }))}
          required
        />
        <TextInput
          label="Booking ID (optional)"
          value={form.bookingId}
          onChange={(event) => onChange((current) => ({ ...current, bookingId: event.target.value }))}
        />
        <TextInput
          label="Marketplace item ID (optional)"
          value={form.marketplaceItemId}
          onChange={(event) => onChange((current) => ({ ...current, marketplaceItemId: event.target.value }))}
        />
        <TextInput
          label="Quantity"
          type="number"
          min="1"
          value={form.quantity}
          onChange={(event) => onChange((current) => ({ ...current, quantity: event.target.value }))}
          required
        />
        <TextInput
          label="Rental start"
          type="datetime-local"
          value={form.rentalStartAt}
          onChange={(event) => onChange((current) => ({ ...current, rentalStartAt: event.target.value }))}
        />
        <TextInput
          label="Rental end"
          type="datetime-local"
          value={form.rentalEndAt}
          onChange={(event) => onChange((current) => ({ ...current, rentalEndAt: event.target.value }))}
        />
        <div className="md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Internal notes
            <textarea
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-600 focus:border-primary focus:outline-none"
              rows="3"
              value={form.notes}
              onChange={(event) => onChange((current) => ({ ...current, notes: event.target.value }))}
            />
          </label>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {status.error ? <StatusPill tone="danger">{status.error}</StatusPill> : null}
        {status.success ? <StatusPill tone="success">{status.success}</StatusPill> : null}
      </div>
    </form>
  );
}

RentalCreateCard.propTypes = {
  form: PropTypes.shape({
    itemId: PropTypes.string,
    renterId: PropTypes.string,
    bookingId: PropTypes.string,
    marketplaceItemId: PropTypes.string,
    quantity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    rentalStartAt: PropTypes.string,
    rentalEndAt: PropTypes.string,
    notes: PropTypes.string
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  status: PropTypes.shape({
    loading: PropTypes.bool,
    error: PropTypes.string,
    success: PropTypes.string
  }).isRequired
};
