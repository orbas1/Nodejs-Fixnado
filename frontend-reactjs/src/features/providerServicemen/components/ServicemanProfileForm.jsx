import PropTypes from 'prop-types';
import FormField from '../../../components/ui/FormField.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import TextArea from '../../../components/ui/TextArea.jsx';
import Button from '../../../components/ui/Button.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';

export default function ServicemanProfileForm({
  form,
  onChange,
  onSubmit,
  enums,
  isNew,
  saving,
  message,
  error
}) {
  const statuses = enums?.statuses ?? [];
  const availabilityStatuses = enums?.availabilityStatuses ?? [];
  const currencies = enums?.currencies ?? ['GBP'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-primary">Profile</h4>
        {message ? <StatusPill tone="success">{message}</StatusPill> : null}
      </div>
      {error ? <StatusPill tone="danger">{error}</StatusPill> : null}
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="serviceman-name" label="Full name" required>
            <TextInput
              id="serviceman-name"
              value={form.name}
              onChange={(event) => onChange({ name: event.target.value })}
              required
            />
          </FormField>
          <FormField id="serviceman-role" label="Role / specialism">
            <TextInput
              id="serviceman-role"
              value={form.role}
              onChange={(event) => onChange({ role: event.target.value })}
            />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="serviceman-email" label="Email">
            <TextInput
              id="serviceman-email"
              type="email"
              value={form.email}
              onChange={(event) => onChange({ email: event.target.value })}
            />
          </FormField>
          <FormField id="serviceman-phone" label="Phone">
            <TextInput
              id="serviceman-phone"
              value={form.phone}
              onChange={(event) => onChange({ phone: event.target.value })}
            />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="serviceman-status" label="Status">
            <select
              id="serviceman-status"
              value={form.status}
              onChange={(event) => onChange({ status: event.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {statuses.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField id="serviceman-availability-status" label="Availability status">
            <select
              id="serviceman-availability-status"
              value={form.availabilityStatus}
              onChange={(event) => onChange({ availabilityStatus: event.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {availabilityStatuses.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField id="serviceman-availability-percentage" label="Availability %" hint="Approximate free capacity">
            <TextInput
              id="serviceman-availability-percentage"
              type="number"
              min="0"
              max="100"
              value={form.availabilityPercentage}
              onChange={(event) => onChange({ availabilityPercentage: event.target.value })}
            />
          </FormField>
          <FormField id="serviceman-hourly-rate" label="Hourly rate">
            <TextInput
              id="serviceman-hourly-rate"
              type="number"
              step="0.01"
              value={form.hourlyRate}
              onChange={(event) => onChange({ hourlyRate: event.target.value })}
            />
          </FormField>
          <FormField id="serviceman-currency" label="Currency">
            <select
              id="serviceman-currency"
              value={form.currency}
              onChange={(event) => onChange({ currency: event.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {currencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        <FormField id="serviceman-avatar" label="Avatar URL">
          <TextInput
            id="serviceman-avatar"
            value={form.avatarUrl}
            onChange={(event) => onChange({ avatarUrl: event.target.value })}
          />
        </FormField>
        <FormField id="serviceman-bio" label="Bio / summary">
          <TextArea
            id="serviceman-bio"
            rows={4}
            value={form.bio}
            onChange={(event) => onChange({ bio: event.target.value })}
          />
        </FormField>
        <FormField id="serviceman-notes" label="Internal notes">
          <TextArea
            id="serviceman-notes"
            rows={3}
            value={form.notes}
            onChange={(event) => onChange({ notes: event.target.value })}
          />
        </FormField>
        <FormField
          id="serviceman-skills"
          label="Skills"
          hint="Comma separated skills or certifications visible to schedulers"
        >
          <TextArea
            id="serviceman-skills"
            rows={3}
            value={form.skillsInput}
            onChange={(event) => onChange({ skillsInput: event.target.value })}
          />
        </FormField>
        <FormField id="serviceman-certifications" label="Certifications">
          <TextArea
            id="serviceman-certifications"
            rows={3}
            value={form.certifications}
            onChange={(event) => onChange({ certifications: event.target.value })}
          />
        </FormField>
        <div className="flex items-center justify-end gap-2">
          <Button type="submit" variant="primary" loading={saving}>
            {isNew ? 'Create serviceman' : 'Save profile'}
          </Button>
        </div>
      </form>
    </div>
  );
}

ServicemanProfileForm.propTypes = {
  form: PropTypes.shape({
    name: PropTypes.string,
    role: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    status: PropTypes.string,
    availabilityStatus: PropTypes.string,
    availabilityPercentage: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    hourlyRate: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string,
    avatarUrl: PropTypes.string,
    bio: PropTypes.string,
    notes: PropTypes.string,
    skillsInput: PropTypes.string,
    certifications: PropTypes.string
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  enums: PropTypes.shape({
    statuses: PropTypes.array,
    availabilityStatuses: PropTypes.array,
    currencies: PropTypes.array
  }),
  isNew: PropTypes.bool,
  saving: PropTypes.bool,
  message: PropTypes.string,
  error: PropTypes.string
};

ServicemanProfileForm.defaultProps = {
  enums: {},
  isNew: false,
  saving: false,
  message: null,
  error: null
};
