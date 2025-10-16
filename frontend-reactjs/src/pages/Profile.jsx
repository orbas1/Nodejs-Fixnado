import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../hooks/useSession.js';
import { useProfile } from '../hooks/useProfile.js';

const TIMEZONE_OPTIONS = [
  'UTC',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Singapore'
];

export default function Profile() {
  const session = useSession();
  const { profile, updateProfile, defaults } = useProfile();
  const [form, setForm] = useState(profile);
  const [status, setStatus] = useState('');

  useEffect(() => {
    setForm(profile);
  }, [profile]);

  const handleChange = (patch) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const handlePreferenceChange = (key, value) => {
    setForm((current) => ({
      ...current,
      communicationPreferences: {
        ...current.communicationPreferences,
        [key]: value
      }
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    updateProfile(form);
    setStatus('Profile updated successfully.');
    window.setTimeout(() => setStatus(''), 1500);
  };

  const personaSummary = session.dashboards?.length
    ? `Provisioned dashboards: ${session.dashboards.join(', ')}`
    : 'No dashboards provisioned yet.';

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="rounded-3xl border border-slate-200 bg-white/95 p-10 shadow-2xl shadow-accent/10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-accent">Account</p>
            <h1 className="text-3xl font-semibold text-primary">Profile & settings</h1>
            <p className="mt-2 text-sm text-slate-500">Keep your contact details and notification preferences up to date.</p>
          </div>
          <Link
            to="/dashboards"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-accent/40 hover:text-accent"
          >
            View dashboards
          </Link>
        </div>

        <form className="mt-10 grid gap-6" onSubmit={handleSubmit}>
          <section className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-primary">Contact information</h2>
              <p className="text-xs text-slate-500">We use this information to personalise dashboard experiences and notifications.</p>
            </div>
            <div className="grid gap-4">
              <label className="text-sm font-medium text-slate-600">
                First name
                <input
                  type="text"
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
                  value={form.firstName}
                  onChange={(event) => handleChange({ firstName: event.target.value })}
                  placeholder={defaults.firstName}
                  autoComplete="given-name"
                />
              </label>
              <label className="text-sm font-medium text-slate-600">
                Last name
                <input
                  type="text"
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
                  value={form.lastName}
                  onChange={(event) => handleChange({ lastName: event.target.value })}
                  placeholder={defaults.lastName}
                  autoComplete="family-name"
                />
              </label>
              <label className="text-sm font-medium text-slate-600">
                Organisation
                <input
                  type="text"
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
                  value={form.organisation}
                  onChange={(event) => handleChange({ organisation: event.target.value })}
                  placeholder="Fixnado"
                  autoComplete="organization"
                />
              </label>
            </div>
            <div className="grid gap-4">
              <label className="text-sm font-medium text-slate-600">
                Email
                <input
                  type="email"
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500"
                  value={form.email || session.userId || ''}
                  readOnly
                />
              </label>
              <label className="text-sm font-medium text-slate-600">
                Phone number
                <input
                  type="tel"
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
                  value={form.phone}
                  onChange={(event) => handleChange({ phone: event.target.value })}
                  placeholder="+44 20 0000 0000"
                  autoComplete="tel"
                />
              </label>
              <label className="text-sm font-medium text-slate-600">
                Timezone
                <select
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
                  value={form.timezone ?? defaults.timezone}
                  onChange={(event) => handleChange({ timezone: event.target.value })}
                >
                  {TIMEZONE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-primary">Communication preferences</h2>
              <p className="text-xs text-slate-500">Control which notifications you receive from Fixnado.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
                  checked={form.communicationPreferences?.email ?? defaults.communicationPreferences.email}
                  onChange={(event) => handlePreferenceChange('email', event.target.checked)}
                />
                Email alerts
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
                  checked={form.communicationPreferences?.sms ?? defaults.communicationPreferences.sms}
                  onChange={(event) => handlePreferenceChange('sms', event.target.checked)}
                />
                SMS dispatch updates
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
                  checked={form.communicationPreferences?.push ?? defaults.communicationPreferences.push}
                  onChange={(event) => handlePreferenceChange('push', event.target.checked)}
                />
                Push notifications
              </label>
            </div>
            <p className="text-xs text-slate-500">
              We only send operational alerts that keep your crews, finance teams, and stakeholders aligned. You can adjust the
              mix at any time.
            </p>
          </section>

          <section className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-600">
            <p className="text-sm font-semibold text-primary">Workspace summary</p>
            <p>{personaSummary}</p>
            <p className="text-xs text-slate-500">
              Need access to more workspaces? Visit the dashboards hub to request provider, finance, or enterprise access.
            </p>
          </section>

          {status ? <p className="text-sm font-semibold text-emerald-600">{status}</p> : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90"
            >
              Save profile
            </button>
            <Link
              to="/settings/security"
              className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:border-accent/40 hover:text-accent"
            >
              Security settings
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
