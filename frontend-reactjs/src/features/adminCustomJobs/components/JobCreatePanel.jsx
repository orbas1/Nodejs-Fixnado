import PropTypes from 'prop-types';
import {
  Button,
  Card,
  Checkbox,
  FormField,
  StatusPill,
  TextInput
} from '../../../components/ui/index.js';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

export default function JobCreatePanel({
  createForm,
  createError,
  zones,
  saving,
  onFieldChange,
  onSubmit,
  onCancel
}) {
  return (
    <Card className="bg-white/95">
      <form onSubmit={onSubmit} className="space-y-5">
        <header className="flex flex-col gap-2 border-b border-slate-200 pb-4">
          <h2 className="text-xl font-semibold text-primary">Create custom job</h2>
          <p className="text-sm text-slate-500">
            Launch a bespoke job brief and invite providers to bid directly from the control tower.
          </p>
          {createError ? <StatusPill tone="danger">{createError}</StatusPill> : null}
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="create-title" label="Job title">
            <TextInput
              id="create-title"
              value={createForm.title}
              onChange={(event) => onFieldChange('title', event.target.value)}
              placeholder="High-rise HVAC retrofit"
            />
          </FormField>
          <FormField id="create-budget-label" label="Budget label" optionalLabel="Optional">
            <TextInput
              id="create-budget-label"
              value={createForm.budgetLabel}
              onChange={(event) => onFieldChange('budgetLabel', event.target.value)}
              placeholder="£12,500"
            />
          </FormField>
        </div>
        <FormField id="create-description" label="Brief">
          <textarea
            id="create-description"
            rows={4}
            value={createForm.description}
            onChange={(event) => onFieldChange('description', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-accent focus:outline-none"
            placeholder="Outline scope, access requirements, compliance notes, and handover expectations."
          />
        </FormField>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField id="create-budget-amount" label="Budget amount" optionalLabel="Optional">
            <input
              id="create-budget-amount"
              type="number"
              min="0"
              step="1"
              value={createForm.budgetAmount}
              onChange={(event) => onFieldChange('budgetAmount', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-accent focus:outline-none"
              placeholder="12500"
            />
          </FormField>
          <FormField id="create-currency" label="Currency">
            <input
              id="create-currency"
              type="text"
              maxLength={3}
              value={createForm.budgetCurrency}
              onChange={(event) => onFieldChange('budgetCurrency', event.target.value.toUpperCase())}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm uppercase shadow-sm focus:border-accent focus:outline-none"
              placeholder="GBP"
            />
          </FormField>
          <FormField id="create-bid-deadline" label="Bid deadline" optionalLabel="Optional">
            <input
              id="create-bid-deadline"
              type="datetime-local"
              value={createForm.bidDeadline}
              onChange={(event) => onFieldChange('bidDeadline', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-accent focus:outline-none"
            />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="create-zone" label="Service zone" optionalLabel="Optional">
            <select
              id="create-zone"
              value={createForm.zoneId}
              onChange={(event) => onFieldChange('zoneId', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-accent focus:outline-none"
            >
              <option value="">Select a zone</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField id="create-location" label="Location" optionalLabel="Optional">
            <TextInput
              id="create-location"
              value={createForm.location}
              onChange={(event) => onFieldChange('location', event.target.value)}
              placeholder="Tower 3, Test City"
            />
          </FormField>
        </div>
        <div className="flex items-center gap-3">
          <Checkbox
            id="create-allow-out-of-zone"
            checked={createForm.allowOutOfZone}
            onChange={(event) => onFieldChange('allowOutOfZone', event.target.checked)}
          />
          <label htmlFor="create-allow-out-of-zone" className="text-sm text-slate-600">
            Allow trusted providers outside this zone to bid
          </label>
        </div>
        <FormField id="create-images" label="Image URLs" optionalLabel="Optional">
          <textarea
            id="create-images"
            rows={3}
            value={createForm.imagesText}
            onChange={(event) => onFieldChange('imagesText', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-accent focus:outline-none"
            placeholder="https://cdn.fixnado.com/jobs/hvac.jpg"
          />
        </FormField>
        <FormField id="create-customer-email" label="Customer email">
          <TextInput
            id="create-customer-email"
            type="email"
            value={createForm.customerEmail}
            onChange={(event) => onFieldChange('customerEmail', event.target.value)}
            placeholder="jess.lee@example.com"
          />
        </FormField>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="create-customer-first" label="Customer first name" optionalLabel="Optional">
            <TextInput
              id="create-customer-first"
              value={createForm.customerFirstName}
              onChange={(event) => onFieldChange('customerFirstName', event.target.value)}
            />
          </FormField>
          <FormField id="create-customer-last" label="Customer last name" optionalLabel="Optional">
            <TextInput
              id="create-customer-last"
              value={createForm.customerLastName}
              onChange={(event) => onFieldChange('customerLastName', event.target.value)}
            />
          </FormField>
        </div>
        <FormField id="create-notes" label="Internal notes" optionalLabel="Optional">
          <textarea
            id="create-notes"
            rows={3}
            value={createForm.internalNotes}
            onChange={(event) => onFieldChange('internalNotes', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-accent focus:outline-none"
            placeholder="Share context for compliance, ops, or finance reviewers."
          />
        </FormField>
        <div className="flex items-center gap-3">
          <Button type="submit" icon={CheckCircleIcon} loading={saving}>
            Publish custom job
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

JobCreatePanel.propTypes = {
  createForm: PropTypes.shape({
    title: PropTypes.string,
    budgetLabel: PropTypes.string,
    description: PropTypes.string,
    budgetAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    budgetCurrency: PropTypes.string,
    bidDeadline: PropTypes.string,
    zoneId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    location: PropTypes.string,
    allowOutOfZone: PropTypes.bool,
    imagesText: PropTypes.string,
    customerEmail: PropTypes.string,
    customerFirstName: PropTypes.string,
    customerLastName: PropTypes.string,
    internalNotes: PropTypes.string
  }).isRequired,
  createError: PropTypes.string,
  zones: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  saving: PropTypes.bool.isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

JobCreatePanel.defaultProps = {
  createError: null
};
