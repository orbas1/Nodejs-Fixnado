import PropTypes from 'prop-types';
import clsx from 'clsx';
import { TextInput } from '../../ui/index.js';

export default function ProfileDetailsForm({ values, onChange, timezoneOptions }) {
  return (
    <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Contact details</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="First name"
            value={values.firstName}
            onChange={(event) => onChange('firstName', event.target.value)}
            required
          />
          <TextInput
            label="Last name"
            value={values.lastName}
            onChange={(event) => onChange('lastName', event.target.value)}
            required
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Job title"
            value={values.jobTitle}
            onChange={(event) => onChange('jobTitle', event.target.value)}
          />
          <TextInput
            label="Team / Department"
            value={values.department}
            onChange={(event) => onChange('department', event.target.value)}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Primary email"
            value={values.email}
            readOnly
            hint="Managed in the identity provider"
          />
          <TextInput
            label="Direct phone"
            type="tel"
            value={values.phoneNumber}
            onChange={(event) => onChange('phoneNumber', event.target.value)}
            hint="Include country code for global routing"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="fx-field">
            <label className="fx-field__label" htmlFor="admin-timezone">
              Default time zone
            </label>
            <select
              id="admin-timezone"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-primary shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              value={values.timezone}
              onChange={(event) => onChange('timezone', event.target.value)}
            >
              {timezoneOptions.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
            <p className="fx-field__hint">Used for scheduling, reminders, and exported reports.</p>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Profile image</h3>
        <div className="flex items-center gap-4">
          <div
            className={clsx(
              'flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-accent/30 bg-secondary text-sm font-semibold text-primary',
              values.avatarUrl && 'border-solid border-accent'
            )}
          >
            {values.avatarUrl ? (
              <img src={values.avatarUrl} alt="Admin avatar preview" className="h-full w-full rounded-full object-cover" />
            ) : (
              <span>
                {values.firstName?.[0] ?? 'A'}
                {values.lastName?.[0] ?? ''}
              </span>
            )}
          </div>
          <div className="flex-1">
            <TextInput
              label="Avatar URL"
              value={values.avatarUrl}
              onChange={(event) => onChange('avatarUrl', event.target.value)}
              placeholder="https://cdn.fixnado.com/admin/avatar.jpg"
              hint="Hosted image used across admin dashboards."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

ProfileDetailsForm.propTypes = {
  values: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
    jobTitle: PropTypes.string,
    department: PropTypes.string,
    phoneNumber: PropTypes.string,
    avatarUrl: PropTypes.string,
    timezone: PropTypes.string
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  timezoneOptions: PropTypes.arrayOf(PropTypes.string).isRequired
};
