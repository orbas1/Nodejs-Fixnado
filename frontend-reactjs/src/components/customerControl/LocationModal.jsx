import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { locationTemplate } from './constants.js';
import { CheckboxField, Field, TextArea, TextInput } from './FormControls.jsx';
import ModalShell from './ModalShell.jsx';

const emptyLocation = { ...locationTemplate };

const LocationModal = ({ open, location, onClose, onSubmit, saving }) => {
  const [form, setForm] = useState(emptyLocation);

  useEffect(() => {
    if (open) {
      setForm({ ...emptyLocation, ...(location ?? {}) });
    }
  }, [open, location]);

  const footer = useMemo(
    () => [
      <button
        key="cancel"
        type="button"
        onClick={onClose}
        className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-primary hover:border-slate-300"
      >
        Cancel
      </button>,
      <button
        key="save"
        type="submit"
        onClick={() => onSubmit(form)}
        disabled={saving}
        className="inline-flex items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-glow hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save location'}
      </button>
    ],
    [onClose, onSubmit, form, saving]
  );

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={form.id ? 'Edit service location' : 'Add service location'}
      description="Keep entrances, loading notes, and access contacts up to date for crews."
      footer={footer}
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(form);
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="location-label" label="Location label" description="Shown in dashboards and dispatch notes.">
            <TextInput
              id="location-label"
              value={form.label}
              onChange={(value) => setForm((previous) => ({ ...previous, label: value }))}
              placeholder="Headquarters"
            />
          </Field>
          <CheckboxField
            id="location-primary"
            checked={form.isPrimary}
            onChange={(value) => setForm((previous) => ({ ...previous, isPrimary: value }))}
            label="Primary workspace"
            description="Use as default for new bookings and asset deliveries."
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="location-address1" label="Address line 1">
            <TextInput
              id="location-address1"
              value={form.addressLine1}
              onChange={(value) => setForm((previous) => ({ ...previous, addressLine1: value }))}
              placeholder="120 Fleet Street"
            />
          </Field>
          <Field id="location-address2" label="Address line 2">
            <TextInput
              id="location-address2"
              value={form.addressLine2}
              onChange={(value) => setForm((previous) => ({ ...previous, addressLine2: value }))}
              placeholder="Level 4"
            />
          </Field>
          <Field id="location-city" label="City">
            <TextInput
              id="location-city"
              value={form.city}
              onChange={(value) => setForm((previous) => ({ ...previous, city: value }))}
              placeholder="London"
            />
          </Field>
          <Field id="location-region" label="Region / State">
            <TextInput
              id="location-region"
              value={form.region}
              onChange={(value) => setForm((previous) => ({ ...previous, region: value }))}
              placeholder="Greater London"
            />
          </Field>
          <Field id="location-postal" label="Postal code">
            <TextInput
              id="location-postal"
              value={form.postalCode}
              onChange={(value) => setForm((previous) => ({ ...previous, postalCode: value }))}
              placeholder="EC4A 2BE"
            />
          </Field>
          <Field id="location-country" label="Country">
            <TextInput
              id="location-country"
              value={form.country}
              onChange={(value) => setForm((previous) => ({ ...previous, country: value }))}
              placeholder="United Kingdom"
            />
          </Field>
        </div>
        <Field
          id="location-notes"
          label="Access notes"
          description="Delivery bays, security procedures, or onboarding guidance for crews."
        >
          <TextArea
            id="location-notes"
            rows={4}
            value={form.accessNotes}
            onChange={(value) => setForm((previous) => ({ ...previous, accessNotes: value }))}
            placeholder="Loading bay on Pilgrim Street. Security badge required after 18:00."
          />
        </Field>
      </form>
    </ModalShell>
  );
};

const locationPropType = PropTypes.shape({
  id: PropTypes.string,
  label: PropTypes.string,
  addressLine1: PropTypes.string,
  addressLine2: PropTypes.string,
  city: PropTypes.string,
  region: PropTypes.string,
  postalCode: PropTypes.string,
  country: PropTypes.string,
  accessNotes: PropTypes.string,
  isPrimary: PropTypes.bool
});

LocationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  location: locationPropType,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool
};

LocationModal.defaultProps = {
  location: null,
  saving: false
};

export default LocationModal;
export { locationPropType };
