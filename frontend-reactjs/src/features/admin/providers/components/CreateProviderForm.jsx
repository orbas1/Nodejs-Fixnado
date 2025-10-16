import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, TextInput, FormField } from '../../../../components/ui/index.js';

function CreateProviderForm({ enums, onSubmit, onCancel, saving, error }) {
  const [form, setForm] = useState({
    ownerFirstName: '',
    ownerLastName: '',
    ownerEmail: '',
    ownerPassword: '',
    ownerPhone: '',
    displayName: '',
    tradingName: '',
    status: 'onboarding',
    onboardingStage: 'intake',
    tier: 'standard',
    riskRating: 'medium',
    supportEmail: '',
    regionId: ''
  });

  useEffect(() => {
    setForm((current) => ({
      ...current,
      status: enums?.statuses?.[0]?.value ?? 'onboarding',
      onboardingStage: enums?.onboardingStages?.[0]?.value ?? 'intake',
      tier: enums?.tiers?.[0]?.value ?? 'standard',
      riskRating: enums?.riskLevels?.[0]?.value ?? 'medium',
      regionId: enums?.regions?.[0]?.id ?? ''
    }));
  }, [enums]);

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-accent/10 bg-white p-5 shadow-sm">
      <div className="space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-primary">Create provider</h4>
        <p className="text-xs text-slate-500">Provision a new SME with owner access and profile defaults.</p>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="create-owner-first" label="Owner first name">
          <TextInput id="create-owner-first" value={form.ownerFirstName} onChange={handleChange('ownerFirstName')} required />
        </FormField>
        <FormField id="create-owner-last" label="Owner last name">
          <TextInput id="create-owner-last" value={form.ownerLastName} onChange={handleChange('ownerLastName')} required />
        </FormField>
        <FormField id="create-owner-email" label="Owner email">
          <TextInput
            id="create-owner-email"
            type="email"
            value={form.ownerEmail}
            onChange={handleChange('ownerEmail')}
            required
          />
        </FormField>
        <FormField id="create-owner-password" label="Temporary password">
          <TextInput
            id="create-owner-password"
            type="password"
            value={form.ownerPassword}
            onChange={handleChange('ownerPassword')}
            required
          />
        </FormField>
        <FormField id="create-owner-phone" label="Owner phone">
          <TextInput id="create-owner-phone" value={form.ownerPhone} onChange={handleChange('ownerPhone')} />
        </FormField>
        <FormField id="create-display" label="Display name">
          <TextInput id="create-display" value={form.displayName} onChange={handleChange('displayName')} required />
        </FormField>
        <FormField id="create-trading" label="Trading name">
          <TextInput id="create-trading" value={form.tradingName} onChange={handleChange('tradingName')} />
        </FormField>
        <FormField id="create-status" label="Status">
          <select
            id="create-status"
            value={form.status}
            onChange={handleChange('status')}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            {enums?.statuses?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField id="create-stage" label="Onboarding stage">
          <select
            id="create-stage"
            value={form.onboardingStage}
            onChange={handleChange('onboardingStage')}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            {enums?.onboardingStages?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField id="create-tier" label="Tier">
          <select
            id="create-tier"
            value={form.tier}
            onChange={handleChange('tier')}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            {enums?.tiers?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField id="create-risk" label="Risk rating">
          <select
            id="create-risk"
            value={form.riskRating}
            onChange={handleChange('riskRating')}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            {enums?.riskLevels?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField id="support-email" label="Support email">
          <TextInput id="support-email" type="email" value={form.supportEmail} onChange={handleChange('supportEmail')} />
        </FormField>
        <FormField id="create-region" label="Primary region">
          <select
            id="create-region"
            value={form.regionId}
            onChange={handleChange('regionId')}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Select region
            </option>
            {enums?.regions?.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Creating…' : 'Create provider'}
        </Button>
      </div>
    </form>
  );
}

CreateProviderForm.propTypes = {
  enums: PropTypes.shape({
    statuses: PropTypes.array,
    onboardingStages: PropTypes.array,
    tiers: PropTypes.array,
    riskLevels: PropTypes.array,
    regions: PropTypes.array
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  error: PropTypes.string
};

CreateProviderForm.defaultProps = {
  enums: null,
  saving: false,
  error: null
};

export default CreateProviderForm;
