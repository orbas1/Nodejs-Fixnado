import PropTypes from 'prop-types';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { Button, TextInput, Textarea } from '../../../../components/ui/index.js';
import FormStatus from './FormStatus.jsx';

function IdentityForm({ form, onChange, onSubmit, saving, status, storefrontUrl }) {
  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Identity</p>
          <h3 className="mt-1 text-2xl font-semibold text-primary">Profile & support details</h3>
        </div>
        {storefrontUrl ? (
          <Button
            as="a"
            href={storefrontUrl}
            variant="secondary"
            size="sm"
            className="gap-2"
            icon={ArrowTopRightOnSquareIcon}
            iconPosition="end"
            target="_blank"
            rel="noreferrer"
          >
            View storefront
          </Button>
        ) : null}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <TextInput
          label="Display name"
          value={form.displayName}
          onChange={(event) => onChange('displayName', event.target.value)}
          required
        />
        <TextInput
          label="Trading name"
          value={form.tradingName}
          onChange={(event) => onChange('tradingName', event.target.value)}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <TextInput
          label="Tagline"
          value={form.tagline}
          onChange={(event) => onChange('tagline', event.target.value)}
          placeholder="Trusted SME partner"
        />
        <TextInput
          label="Website"
          value={form.websiteUrl}
          onChange={(event) => onChange('websiteUrl', event.target.value)}
          placeholder="https://"
        />
      </div>

      <Textarea
        label="Mission statement"
        value={form.missionStatement}
        onChange={(event) => onChange('missionStatement', event.target.value)}
        rows={4}
        placeholder="Share what makes your teams different, what guarantees you offer, or how you collaborate with Fixnado."
      />

      <div className="grid gap-5 md:grid-cols-2">
        <TextInput
          label="Support email"
          type="email"
          value={form.supportEmail}
          onChange={(event) => onChange('supportEmail', event.target.value)}
          required
        />
        <TextInput
          label="Support phone"
          value={form.supportPhone}
          onChange={(event) => onChange('supportPhone', event.target.value)}
          placeholder="+44 20 7946 0000"
        />
        <TextInput
          label="Billing email"
          type="email"
          value={form.billingEmail}
          onChange={(event) => onChange('billingEmail', event.target.value)}
        />
        <TextInput
          label="Billing phone"
          value={form.billingPhone}
          onChange={(event) => onChange('billingPhone', event.target.value)}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <TextInput
          label="Operations playbook URL"
          value={form.operationsPlaybookUrl}
          onChange={(event) => onChange('operationsPlaybookUrl', event.target.value)}
          placeholder="https://"
        />
        <TextInput
          label="Insurance policy URL"
          value={form.insurancePolicyUrl}
          onChange={(event) => onChange('insurancePolicyUrl', event.target.value)}
          placeholder="https://"
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <TextInput
          label="Dispatch radius (km)"
          type="number"
          min={0}
          max={1000}
          value={form.dispatchRadiusKm ?? ''}
          onChange={(event) => onChange('dispatchRadiusKm', event.target.value)}
        />
        <TextInput
          label="Preferred response time (minutes)"
          type="number"
          min={5}
          max={1440}
          value={form.preferredResponseMinutes ?? ''}
          onChange={(event) => onChange('preferredResponseMinutes', event.target.value)}
        />
      </div>

      <Textarea
        label="Service regions"
        value={form.serviceRegionsText}
        onChange={(event) => onChange('serviceRegionsText', event.target.value)}
        rows={3}
        placeholder={`Greater London\nSouth East`}
        hint="Enter one region per line."
      />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FormStatus status={status} />
        <Button type="submit" loading={saving} disabled={saving} className="sm:w-auto">
          Save profile
        </Button>
      </div>
    </form>
  );
}

IdentityForm.propTypes = {
  form: PropTypes.shape({
    displayName: PropTypes.string,
    tradingName: PropTypes.string,
    tagline: PropTypes.string,
    missionStatement: PropTypes.string,
    supportEmail: PropTypes.string,
    supportPhone: PropTypes.string,
    billingEmail: PropTypes.string,
    billingPhone: PropTypes.string,
    websiteUrl: PropTypes.string,
    operationsPlaybookUrl: PropTypes.string,
    insurancePolicyUrl: PropTypes.string,
    dispatchRadiusKm: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    preferredResponseMinutes: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    serviceRegionsText: PropTypes.string
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool.isRequired,
  status: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']),
    message: PropTypes.string
  }),
  storefrontUrl: PropTypes.string
};

IdentityForm.defaultProps = {
  status: null,
  storefrontUrl: null
};

export default IdentityForm;
