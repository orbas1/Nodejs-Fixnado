import PropTypes from 'prop-types';
import { Button, FormField, TextInput } from '../ui/index.js';

function CreateOrderForm({ form, catalogue, creating, onFieldChange, onSubmit }) {
  const services = catalogue.services ?? [];
  const zones = catalogue.zones ?? [];

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit();
  };

  const handleServiceChange = (event) => {
    const { value } = event.target;
    const selectedService = services.find((service) => service.id === value);
    onFieldChange('serviceId', value, {
      currency: selectedService?.currency ?? form.currency
    });
  };

  const handleBookingTypeChange = (event) => {
    const { value } = event.target;
    onFieldChange('bookingType', value, value === 'on_demand' ? { scheduledStart: '', scheduledEnd: '' } : {});
  };

  const isScheduled = form.bookingType === 'scheduled';
  const canSubmit =
    Boolean(form.serviceId && form.zoneId) && (!isScheduled || (form.scheduledStart && form.scheduledEnd));

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-primary">Create a service order</h3>
        <Button type="submit" variant="primary" size="sm" loading={creating} disabled={!canSubmit}>
          Create order
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField id="serviceId" label="Service">
          <select
            id="serviceId"
            value={form.serviceId}
            onChange={handleServiceChange}
            className="w-full rounded-xl border border-accent/20 bg-white px-3 py-2 text-sm"
            required
          >
            <option value="">Select a service</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.title} • {service.companyName ?? 'Provider'}
              </option>
            ))}
          </select>
        </FormField>
        <FormField id="zoneId" label="Service zone">
          <select
            id="zoneId"
            value={form.zoneId}
            onChange={(event) => onFieldChange('zoneId', event.target.value)}
            className="w-full rounded-xl border border-accent/20 bg-white px-3 py-2 text-sm"
            required
          >
            <option value="">Select a zone</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name} • {zone.demandLevel}
              </option>
            ))}
          </select>
        </FormField>
        <FormField id="bookingType" label="Booking type">
          <select
            id="bookingType"
            value={form.bookingType}
            onChange={handleBookingTypeChange}
            className="w-full rounded-xl border border-accent/20 bg-white px-3 py-2 text-sm"
          >
            <option value="scheduled">Scheduled</option>
            <option value="on_demand">On demand</option>
          </select>
        </FormField>
        <FormField id="demandLevel" label="Demand level">
          <select
            id="demandLevel"
            value={form.demandLevel}
            onChange={(event) => onFieldChange('demandLevel', event.target.value)}
            className="w-full rounded-xl border border-accent/20 bg-white px-3 py-2 text-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </FormField>
        {isScheduled ? (
          <>
            <FormField id="scheduledStart" label="Start" hint="Provide a local start time">
              <input
                id="scheduledStart"
                type="datetime-local"
                value={form.scheduledStart}
                onChange={(event) => onFieldChange('scheduledStart', event.target.value)}
                className="w-full rounded-xl border border-accent/20 bg-white px-3 py-2 text-sm"
                required
              />
            </FormField>
            <FormField id="scheduledEnd" label="End" hint="Provide a local end time">
              <input
                id="scheduledEnd"
                type="datetime-local"
                value={form.scheduledEnd}
                onChange={(event) => onFieldChange('scheduledEnd', event.target.value)}
                className="w-full rounded-xl border border-accent/20 bg-white px-3 py-2 text-sm"
                required
              />
            </FormField>
          </>
        ) : null}
        <TextInput
          label="Base amount"
          type="number"
          min="0"
          step="0.01"
          value={form.baseAmount}
          onChange={(event) => onFieldChange('baseAmount', event.target.value)}
        />
        <TextInput
          label="Currency"
          maxLength={3}
          value={form.currency}
          onChange={(event) => onFieldChange('currency', event.target.value.toUpperCase())}
        />
      </div>
      <FormField id="notes" label="Notes" optionalLabel="Optional">
        <textarea
          id="notes"
          value={form.notes}
          onChange={(event) => onFieldChange('notes', event.target.value)}
          className="min-h-[80px] w-full rounded-xl border border-accent/20 bg-white px-3 py-2 text-sm"
        />
      </FormField>
    </form>
  );
}

CreateOrderForm.propTypes = {
  form: PropTypes.shape({
    serviceId: PropTypes.string,
    zoneId: PropTypes.string,
    bookingType: PropTypes.string,
    scheduledStart: PropTypes.string,
    scheduledEnd: PropTypes.string,
    baseAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string,
    demandLevel: PropTypes.string,
    notes: PropTypes.string
  }).isRequired,
  catalogue: PropTypes.shape({
    services: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        companyName: PropTypes.string,
        currency: PropTypes.string
      })
    ),
    zones: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        demandLevel: PropTypes.string
      })
    )
  }).isRequired,
  creating: PropTypes.bool,
  onFieldChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

CreateOrderForm.defaultProps = {
  creating: false
};

export default CreateOrderForm;
