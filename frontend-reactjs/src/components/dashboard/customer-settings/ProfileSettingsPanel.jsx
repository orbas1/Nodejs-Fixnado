import PropTypes from 'prop-types';
import Spinner from '../../ui/Spinner.jsx';
import SettingsPanelShell from './SettingsPanelShell.jsx';
import StatusBanner from './StatusBanner.jsx';

function ProfileSettingsPanel({
  form,
  onFieldChange,
  onSubmit,
  saving,
  status,
  timezoneOptions,
  languageOptions
}) {
  return (
    <SettingsPanelShell
      id="profile-settings"
      title="Profile & identity"
      description="Update the information shared with crews, providers, invoices, and support teams."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
            First name
            <input
              type="text"
              value={form.firstName}
              onChange={(event) => onFieldChange('firstName', event.target.value)}
              required
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
            Last name
            <input
              type="text"
              value={form.lastName}
              onChange={(event) => onFieldChange('lastName', event.target.value)}
              required
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
            Preferred name
            <input
              type="text"
              value={form.preferredName}
              onChange={(event) => onFieldChange('preferredName', event.target.value)}
              placeholder="What should teammates see?"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
            Job title
            <input
              type="text"
              value={form.jobTitle}
              onChange={(event) => onFieldChange('jobTitle', event.target.value)}
              placeholder="Facilities Director"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
            Contact email
            <input
              type="email"
              value={form.email}
              onChange={(event) => onFieldChange('email', event.target.value)}
              required
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
            Phone number
            <input
              type="tel"
              value={form.phoneNumber}
              onChange={(event) => onFieldChange('phoneNumber', event.target.value)}
              placeholder="+44 7700 900123"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
            Timezone
            <select
              value={form.timezone}
              onChange={(event) => onFieldChange('timezone', event.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {timezoneOptions.map((timezone) => (
                <option key={timezone} value={timezone}>
                  {timezone}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
            Language
            <select
              value={form.language}
              onChange={(event) => onFieldChange('language', event.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {languageOptions.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
          Avatar URL
          <input
            type="url"
            value={form.avatarUrl}
            onChange={(event) => onFieldChange('avatarUrl', event.target.value)}
            placeholder="https://cdn.fixnado.com/avatars/you.png"
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <div className="flex items-center justify-between gap-3">
          <StatusBanner status={status} />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={saving}
          >
            {saving && <Spinner className="h-4 w-4 text-white" />}
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </form>
    </SettingsPanelShell>
  );
}

ProfileSettingsPanel.propTypes = {
  form: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    preferredName: PropTypes.string,
    jobTitle: PropTypes.string,
    email: PropTypes.string,
    phoneNumber: PropTypes.string,
    timezone: PropTypes.string,
    language: PropTypes.string,
    avatarUrl: PropTypes.string
  }).isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool.isRequired,
  status: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']).isRequired,
    message: PropTypes.string.isRequired
  }),
  timezoneOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  languageOptions: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default ProfileSettingsPanel;
