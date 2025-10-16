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
        <div className="grid gap-4 md:grid-cols-3">
          <Field
            id="location-zoneLabel"
            label="Zone label"
            description="Name used in dispatch, analytics, and matching."
          >
            <TextInput
              id="location-zoneLabel"
              value={form.zoneLabel}
              onChange={(value) => setForm((previous) => ({ ...previous, zoneLabel: value }))}
              placeholder="Central campus"
            />
          </Field>
          <Field
            id="location-zoneCode"
            label="Zone code"
            description="Internal identifier for cross-system reference."
          >
            <TextInput
              id="location-zoneCode"
              value={form.zoneCode}
              onChange={(value) => setForm((previous) => ({ ...previous, zoneCode: value }))}
              placeholder="ZONE-12A"
            />
          </Field>
          <Field
            id="location-serviceCatalogues"
            label="Service catalogues"
            description="Comma separated list of enabled catalogues for this site."
          >
            <TextInput
              id="location-serviceCatalogues"
              value={form.serviceCatalogues}
              onChange={(value) => setForm((previous) => ({ ...previous, serviceCatalogues: value }))}
              placeholder="Electrical, HVAC, Cleaning"
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field
            id="location-onsiteContactName"
            label="On-site contact"
            description="Primary person crews should reach on arrival."
          >
            <TextInput
              id="location-onsiteContactName"
              value={form.onsiteContactName}
              onChange={(value) => setForm((previous) => ({ ...previous, onsiteContactName: value }))}
              placeholder="Alex Morgan"
            />
          </Field>
          <Field id="location-onsiteContactPhone" label="On-site phone">
            <TextInput
              id="location-onsiteContactPhone"
              value={form.onsiteContactPhone}
              onChange={(value) => setForm((previous) => ({ ...previous, onsiteContactPhone: value }))}
              placeholder="+44 7700 900789"
            />
          </Field>
          <Field id="location-onsiteContactEmail" label="On-site email">
            <TextInput
              id="location-onsiteContactEmail"
              type="email"
              value={form.onsiteContactEmail}
              onChange={(value) => setForm((previous) => ({ ...previous, onsiteContactEmail: value }))}
              placeholder="alex.morgan@example.com"
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="location-accessStart" label="Access window start">
            <TextInput
              id="location-accessStart"
              value={form.accessWindowStart}
              onChange={(value) => setForm((previous) => ({ ...previous, accessWindowStart: value }))}
              placeholder="08:00"
            />
          </Field>
          <Field id="location-accessEnd" label="Access window end">
            <TextInput
              id="location-accessEnd"
              value={form.accessWindowEnd}
              onChange={(value) => setForm((previous) => ({ ...previous, accessWindowEnd: value }))}
              placeholder="18:00"
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            id="location-parking"
            label="Parking information"
            description="Permits, loading bays, or visitor parking notes."
          >
            <TextInput
              id="location-parking"
              value={form.parkingInformation}
              onChange={(value) => setForm((previous) => ({ ...previous, parkingInformation: value }))}
              placeholder="Visitor bays in basement, ticket validated at reception"
            />
          </Field>
          <Field
            id="location-loadingDock"
            label="Loading dock details"
            description="Dock numbers, service lifts, or equipment staging areas."
          >
            <TextInput
              id="location-loadingDock"
              value={form.loadingDockDetails}
              onChange={(value) => setForm((previous) => ({ ...previous, loadingDockDetails: value }))}
              placeholder="Dock 4 – Service lift key at security"
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            id="location-floorLevel"
            label="Floor / suite"
            description="Specify building level or suite for crews."
          >
            <TextInput
              id="location-floorLevel"
              value={form.floorLevel}
              onChange={(value) => setForm((previous) => ({ ...previous, floorLevel: value }))}
              placeholder="Level 8, Suite 3"
            />
          </Field>
          <Field
            id="location-mapImage"
            label="Map or floorplan URL"
            description="Link to annotated map or navigation asset."
          >
            <TextInput
              id="location-mapImage"
              value={form.mapImageUrl}
              onChange={(value) => setForm((previous) => ({ ...previous, mapImageUrl: value }))}
              placeholder="https://cdn.fixnado.com/maps/campus-a-level8.png"
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
        <Field
          id="location-security"
          label="Security & compliance notes"
          description="Badges, inductions, or hazard information specific to this zone."
        >
          <TextArea
            id="location-security"
            rows={3}
            value={form.securityNotes}
            onChange={(value) => setForm((previous) => ({ ...previous, securityNotes: value }))}
            placeholder="Blue badge required after 19:00. Induction video in portal before site access."
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
  zoneLabel: PropTypes.string,
  zoneCode: PropTypes.string,
  serviceCatalogues: PropTypes.string,
  onsiteContactName: PropTypes.string,
  onsiteContactPhone: PropTypes.string,
  onsiteContactEmail: PropTypes.string,
  accessWindowStart: PropTypes.string,
  accessWindowEnd: PropTypes.string,
  parkingInformation: PropTypes.string,
  loadingDockDetails: PropTypes.string,
  securityNotes: PropTypes.string,
  floorLevel: PropTypes.string,
  mapImageUrl: PropTypes.string,
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
