import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useSession } from '../hooks/useSession.js';
import { useProfile } from '../hooks/useProfile.js';

const FALLBACK_TIMEZONES = ['UTC', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Asia/Singapore'];

const LOCALE_OPTIONS = [
  { value: 'en-GB', label: 'English (United Kingdom)' },
  { value: 'en-US', label: 'English (United States)' },
  { value: 'fr-FR', label: 'Français (France)' },
  { value: 'es-ES', label: 'Español (España)' }
];

const DIGEST_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: 'daily', label: 'Daily summary' },
  { value: 'weekly', label: 'Weekly digest' }
];

const ROLE_OPTIONS = [
  { value: 'user', label: 'Customer workspace' },
  { value: 'serviceman', label: 'Field crew workspace' },
  { value: 'provider', label: 'Provider operations' },
  { value: 'enterprise', label: 'Enterprise programme' },
  { value: 'finance', label: 'Finance controls' },
  { value: 'admin', label: 'Platform admin' },
  { value: 'operations', label: 'Operations control' }
];

const CHANNEL_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'phone', label: 'Phone' },
  { value: 'webhook', label: 'Webhook' }
];

const generateClientId = () => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const buffer = crypto.getRandomValues(new Uint32Array(4));
      return Array.from(buffer)
        .map((value) => value.toString(16).padStart(8, '0'))
        .join('-');
    }
  } catch (error) {
    console.warn('[Profile] unable to generate secure id', error);
  }
  return `profile-${Math.random().toString(36).slice(2)}-${Date.now()}`;
};

const resolveTimezones = () => {
  if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
    try {
      return Intl.supportedValuesOf('timeZone');
    } catch (error) {
      console.warn('[Profile] unable to read supported timezones', error);
    }
  }
  return FALLBACK_TIMEZONES;
};

const TIMEZONE_OPTIONS = resolveTimezones();

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

export default function Profile() {
  const session = useSession();
  const { profile, updateProfile, defaults, isLoading, isSaving, error, refresh } = useProfile();
  const [form, setForm] = useState(() => profile ?? defaults);
  const [status, setStatus] = useState(null);
  const [workspaceDraft, setWorkspaceDraft] = useState('');

  useEffect(() => {
    setForm(profile ?? defaults);
  }, [profile, defaults]);

  const dashboardLibrary = useMemo(() => {
    const base = new Set([...(session.dashboards ?? []), 'admin', 'provider', 'finance', 'enterprise', 'serviceman', 'user']);
    return Array.from(base);
  }, [session.dashboards]);

  const personaSummary = useMemo(() => {
    const workspaces = form.workspaceShortcuts?.length ? form.workspaceShortcuts.join(', ') : 'No workspace shortcuts configured.';
    const dashboards = session.dashboards?.length ? session.dashboards.join(', ') : 'No dashboards provisioned yet.';
    return `${workspaces} | Provisioned dashboards: ${dashboards}`;
  }, [form.workspaceShortcuts, session.dashboards]);

  const handleChange = useCallback((patch) => {
    setForm((current) => ({ ...current, ...patch }));
  }, []);

  const handlePreferenceChange = useCallback((key, value) => {
    setForm((current) => ({
      ...current,
      communicationPreferences: {
        ...current.communicationPreferences,
        [key]: value
      }
    }));
  }, []);

  const handleSecurityChange = useCallback((key, value) => {
    setForm((current) => ({
      ...current,
      security: {
        ...current.security,
        [key]: value
      }
    }));
  }, []);

  const handleWorkspaceAdd = useCallback(() => {
    const trimmed = workspaceDraft.trim();
    if (!trimmed) {
      return;
    }
    setForm((current) => {
      const next = new Set([...(current.workspaceShortcuts ?? []), trimmed]);
      return { ...current, workspaceShortcuts: Array.from(next) };
    });
    setWorkspaceDraft('');
  }, [workspaceDraft]);

  const handleWorkspaceRemove = useCallback((value) => {
    setForm((current) => ({
      ...current,
      workspaceShortcuts: (current.workspaceShortcuts ?? []).filter((entry) => entry !== value)
    }));
  }, []);

  const handleRoleChange = useCallback((id, patch) => {
    setForm((current) => ({
      ...current,
      roleAssignments: ensureArray(current.roleAssignments).map((assignment) =>
        assignment.id === id ? { ...assignment, ...patch } : assignment
      )
    }));
  }, []);

  const handleRoleDashboardToggle = useCallback((id, dashboard) => {
    setForm((current) => ({
      ...current,
      roleAssignments: ensureArray(current.roleAssignments).map((assignment) => {
        if (assignment.id !== id) {
          return assignment;
        }
        const dashboards = new Set(ensureArray(assignment.dashboards));
        if (dashboards.has(dashboard)) {
          dashboards.delete(dashboard);
        } else {
          dashboards.add(dashboard);
        }
        return { ...assignment, dashboards: Array.from(dashboards) };
      })
    }));
  }, []);

  const addRoleAssignment = useCallback(() => {
    setForm((current) => ({
      ...current,
      roleAssignments: [
        ...ensureArray(current.roleAssignments),
        {
          id: generateClientId(),
          role: 'user',
          allowCreate: false,
          dashboards: [],
          notes: ''
        }
      ]
    }));
  }, []);

  const removeRoleAssignment = useCallback((id) => {
    setForm((current) => ({
      ...current,
      roleAssignments: ensureArray(current.roleAssignments).filter((assignment) => assignment.id !== id)
    }));
  }, []);

  const addNotificationChannel = useCallback(() => {
    setForm((current) => ({
      ...current,
      notificationChannels: [
        ...ensureArray(current.notificationChannels),
        {
          id: generateClientId(),
          type: 'email',
          label: '',
          value: ''
        }
      ]
    }));
  }, []);

  const handleChannelChange = useCallback((id, patch) => {
    setForm((current) => ({
      ...current,
      notificationChannels: ensureArray(current.notificationChannels).map((channel) =>
        channel.id === id ? { ...channel, ...patch } : channel
      )
    }));
  }, []);

  const removeNotificationChannel = useCallback((id) => {
    setForm((current) => ({
      ...current,
      notificationChannels: ensureArray(current.notificationChannels).filter((channel) => channel.id !== id)
    }));
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      try {
        await updateProfile({
          firstName: form.firstName?.trim?.() ?? '',
          lastName: form.lastName?.trim?.() ?? '',
          email: form.email ?? profile.email ?? '',
          phone: form.phone ?? '',
          organisation: form.organisation ?? '',
          jobTitle: form.jobTitle ?? '',
          teamName: form.teamName ?? '',
          address: form.address ?? '',
          timezone: form.timezone ?? defaults.timezone,
          locale: form.locale ?? defaults.locale,
          avatarUrl: form.avatarUrl ?? '',
          signature: form.signature ?? '',
          communicationPreferences: form.communicationPreferences ?? defaults.communicationPreferences,
          workspaceShortcuts: ensureArray(form.workspaceShortcuts),
          roleAssignments: ensureArray(form.roleAssignments),
          notificationChannels: ensureArray(form.notificationChannels),
          security: form.security ?? defaults.security
        });
        setStatus({ message: 'Profile updated successfully.', tone: 'success' });
        setTimeout(() => setStatus(null), 2400);
      } catch (submitError) {
        const message = submitError?.message || 'Unable to update profile. Please try again.';
        setStatus({ message, tone: 'error' });
      }
    },
    [form, updateProfile, defaults, profile.email]
  );

  const handleReset = useCallback(() => {
    refresh({ skipNetwork: true });
    setStatus({ message: 'Local changes cleared.', tone: 'info' });
    setTimeout(() => setStatus(null), 1800);
  }, [refresh]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="rounded-3xl border border-slate-200 bg-white/95 p-10 shadow-2xl shadow-accent/10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-accent">Account</p>
            <h1 className="text-3xl font-semibold text-primary">Profile &amp; workspace controls</h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage your contact details, workspace permissions, and notification preferences for every Fixnado dashboard.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row">
            <Link
              to="/dashboards"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-accent/40 hover:text-accent"
            >
              Open workspace hub
            </Link>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-accent/40 hover:text-accent"
            >
              Reset local changes
            </button>
          </div>
        </div>

        {error ? (
          <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error.message || 'Unable to load the latest profile from the server. Working with cached details.'}
          </p>
        ) : null}

        <form className="mt-10 grid gap-6" onSubmit={handleSubmit}>
          <section className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-primary">Contact information</h2>
              <p className="text-xs text-slate-500">Update the name and title that appears across dashboards and collaboration tools.</p>
            </div>
            <div className="grid gap-4">
              <label className="text-sm font-medium text-slate-600">
                First name
                <input
                  type="text"
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
                  value={form.firstName ?? ''}
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
                  value={form.lastName ?? ''}
                  onChange={(event) => handleChange({ lastName: event.target.value })}
                  placeholder={defaults.lastName}
                  autoComplete="family-name"
                />
              </label>
              <label className="text-sm font-medium text-slate-600">
                Job title
                <input
                  type="text"
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
                  value={form.jobTitle ?? ''}
                  onChange={(event) => handleChange({ jobTitle: event.target.value })}
                  placeholder="Operations lead"
                />
              </label>
              <label className="text-sm font-medium text-slate-600">
                Team
                <input
                  type="text"
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
                  value={form.teamName ?? ''}
                  onChange={(event) => handleChange({ teamName: event.target.value })}
                  placeholder="Dispatch & scheduling"
                />
              </label>
            </div>
            <div className="grid gap-4">
              <label className="text-sm font-medium text-slate-600">
                Email
                <input
                  type="email"
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500"
                  value={form.email || profile.email || session.userId || ''}
                  readOnly
                />
              </label>
              <label className="text-sm font-medium text-slate-600">
                Phone number
                <input
                  type="tel"
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
                  value={form.phone ?? ''}
                  onChange={(event) => handleChange({ phone: event.target.value })}
                  placeholder="+44 20 0000 0000"
                  autoComplete="tel"
                />
              </label>
              <label className="text-sm font-medium text-slate-600">
                Organisation
                <input
                  type="text"
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
                  value={form.organisation ?? ''}
                  onChange={(event) => handleChange({ organisation: event.target.value })}
                  placeholder="Fixnado"
                  autoComplete="organization"
                />
              </label>
            </div>
          </section>

          <section className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-primary">Location &amp; locale</h2>
              <p className="text-xs text-slate-500">Set your preferred timezone, locale, and mailing address so scheduling windows are personalised.</p>
            </div>
            <div className="grid gap-4">
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
              <label className="text-sm font-medium text-slate-600">
                Locale
                <select
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
                  value={form.locale ?? defaults.locale}
                  onChange={(event) => handleChange({ locale: event.target.value })}
                >
                  {LOCALE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="md:col-span-2 text-sm font-medium text-slate-600">
              Mailing address
              <textarea
                className="mt-1 min-h-[92px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
                value={form.address ?? ''}
                onChange={(event) => handleChange({ address: event.target.value })}
                placeholder="Add billing or dispatch instructions"
              />
            </label>
          </section>

          <section className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-primary">Communication preferences</h2>
              <p className="text-xs text-slate-500">Control how Fixnado keeps you informed across scheduling, compliance, and finance workflows.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
                  checked={Boolean(form.communicationPreferences?.emailAlerts)}
                  onChange={(event) => handlePreferenceChange('emailAlerts', event.target.checked)}
                />
                Email alerts
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
                  checked={Boolean(form.communicationPreferences?.smsAlerts)}
                  onChange={(event) => handlePreferenceChange('smsAlerts', event.target.checked)}
                />
                SMS updates
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
                  checked={Boolean(form.communicationPreferences?.pushAlerts)}
                  onChange={(event) => handlePreferenceChange('pushAlerts', event.target.checked)}
                />
                Push notifications
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
                  checked={Boolean(form.communicationPreferences?.marketingOptIn)}
                  onChange={(event) => handlePreferenceChange('marketingOptIn', event.target.checked)}
                />
                Product news
              </label>
            </div>
            <div className="grid gap-4 md:max-w-md">
              <label className="text-sm font-medium text-slate-600">
                Digest frequency
                <select
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
                  value={form.communicationPreferences?.digestFrequency ?? defaults.communicationPreferences.digestFrequency}
                  onChange={(event) => handlePreferenceChange('digestFrequency', event.target.value)}
                >
                  {DIGEST_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-primary">Notification channels</h3>
                <button
                  type="button"
                  onClick={addNotificationChannel}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-accent/40 hover:text-accent"
                >
                  <PlusIcon className="h-4 w-4" /> Add channel
                </button>
              </div>
              <div className="grid gap-4">
                {ensureArray(form.notificationChannels).length === 0 ? (
                  <p className="text-xs text-slate-500">Add escalation contacts, backup numbers, or webhooks for operational alerts.</p>
                ) : null}
                {ensureArray(form.notificationChannels).map((channel) => (
                  <div key={channel.id} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                    <label className="text-xs font-medium text-slate-600">
                      Type
                      <select
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                        value={channel.type ?? 'email'}
                        onChange={(event) => handleChannelChange(channel.id, { type: event.target.value })}
                      >
                        {CHANNEL_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs font-medium text-slate-600">
                      Label
                      <input
                        type="text"
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                        value={channel.label ?? ''}
                        onChange={(event) => handleChannelChange(channel.id, { label: event.target.value })}
                        placeholder="Operations inbox"
                      />
                    </label>
                    <label className="text-xs font-medium text-slate-600 md:col-span-2">
                      Destination
                      <input
                        type="text"
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                        value={channel.value ?? ''}
                        onChange={(event) => handleChannelChange(channel.id, { value: event.target.value })}
                        placeholder="ops@fixnado.com or +1 415 555 1212"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeNotificationChannel(channel.id)}
                      className="mt-6 inline-flex items-center justify-center self-start rounded-full border border-rose-100 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:border-rose-200 hover:bg-rose-50"
                    >
                      <TrashIcon className="mr-1 h-4 w-4" /> Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-primary">Workspace &amp; role access</h2>
              <p className="text-xs text-slate-500">
                Pin dashboards for quick switching and define which personas you can act as when creating bookings, invoices, or compliance records.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Workspace shortcuts</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ensureArray(form.workspaceShortcuts).map((shortcut) => (
                    <button
                      type="button"
                      key={shortcut}
                      onClick={() => handleWorkspaceRemove(shortcut)}
                      className="group inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                    >
                      {shortcut}
                      <span className="text-[10px] font-normal uppercase tracking-wider text-slate-400 group-hover:text-rose-500">Remove</span>
                    </button>
                  ))}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={workspaceDraft}
                      onChange={(event) => setWorkspaceDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          handleWorkspaceAdd();
                        }
                      }}
                      placeholder="Add workspace"
                      className="w-48 rounded-full border border-slate-200 px-3 py-1.5 text-xs focus:border-accent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleWorkspaceAdd}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-accent/40 hover:text-accent"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role allowances</p>
                  <button
                    type="button"
                    onClick={addRoleAssignment}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-accent/40 hover:text-accent"
                  >
                    <PlusIcon className="h-4 w-4" /> Add role
                  </button>
                </div>
                {ensureArray(form.roleAssignments).length === 0 ? (
                  <p className="text-xs text-slate-500">Assign additional personas to collaborate across provider, finance, or enterprise dashboards.</p>
                ) : null}
                <div className="grid gap-4">
                  {ensureArray(form.roleAssignments).map((assignment) => (
                    <div key={assignment.id} className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                        <label className="text-xs font-medium text-slate-600">
                          Role
                          <select
                            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                            value={assignment.role ?? 'user'}
                            onChange={(event) => handleRoleChange(assignment.id, { role: event.target.value })}
                          >
                            {ROLE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                            checked={Boolean(assignment.allowCreate)}
                            onChange={(event) => handleRoleChange(assignment.id, { allowCreate: event.target.checked })}
                          />
                          Can create new records
                        </label>
                        <button
                          type="button"
                          onClick={() => removeRoleAssignment(assignment.id)}
                          className="inline-flex items-center justify-center gap-1 rounded-full border border-rose-100 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:border-rose-200 hover:bg-rose-50"
                        >
                          <TrashIcon className="h-4 w-4" /> Remove
                        </button>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Dashboard access</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {dashboardLibrary.map((dashboard) => {
                            const assigned = ensureArray(assignment.dashboards).includes(dashboard);
                            return (
                              <button
                                key={`${assignment.id}-${dashboard}`}
                                type="button"
                                onClick={() => handleRoleDashboardToggle(assignment.id, dashboard)}
                                className={
                                  'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ' +
                                  (assigned
                                    ? 'border border-accent/60 bg-accent/10 text-accent'
                                    : 'border border-slate-200 bg-white text-slate-700 hover:border-accent/40 hover:text-accent')
                                }
                              >
                                {dashboard}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <label className="text-xs font-medium text-slate-600">
                        Notes
                        <textarea
                          className="mt-1 min-h-[72px] w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                          value={assignment.notes ?? ''}
                          onChange={(event) => handleRoleChange(assignment.id, { notes: event.target.value })}
                          placeholder="Explain how this role should be used"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-primary">Security &amp; sign-in</h2>
              <p className="text-xs text-slate-500">Strengthen account protection by enabling multi-factor prompts for high-risk actions.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-600">
                <span>Email two-factor</span>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
                  checked={Boolean(form.security?.twoFactorEmail)}
                  onChange={(event) => handleSecurityChange('twoFactorEmail', event.target.checked)}
                />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-600">
                <span>Authenticator app</span>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
                  checked={Boolean(form.security?.twoFactorApp)}
                  onChange={(event) => handleSecurityChange('twoFactorApp', event.target.checked)}
                />
              </label>
              <div className="md:col-span-2">
                <Link
                  to="/settings/security"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-accent hover:text-accent/80"
                >
                  Manage trusted devices
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-primary">Profile presentation</h2>
              <p className="text-xs text-slate-500">Add an avatar and signature used on purchase orders, invoices, and collaboration threads.</p>
            </div>
            <div className="grid gap-4">
              <label className="text-sm font-medium text-slate-600">
                Avatar URL
                <input
                  type="url"
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
                  value={form.avatarUrl ?? ''}
                  onChange={(event) => handleChange({ avatarUrl: event.target.value })}
                  placeholder="https://cdn.fixnado.com/profiles/me.png"
                />
              </label>
              {form.avatarUrl ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</p>
                  <img
                    src={form.avatarUrl}
                    alt="Profile avatar preview"
                    className="mt-2 h-24 w-24 rounded-full object-cover"
                    onError={() =>
                      setStatus({
                        message: 'Unable to load avatar preview. Check the URL and try again.',
                        tone: 'error'
                      })
                    }
                  />
                </div>
              ) : null}
              <label className="text-sm font-medium text-slate-600">
                Signature block
                <textarea
                  className="mt-1 min-h-[92px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-accent focus:outline-none"
                  value={form.signature ?? ''}
                  onChange={(event) => handleChange({ signature: event.target.value })}
                  placeholder={'Avery Stone\nOperations Lead\n+44 20 0000 0000'}
                />
              </label>
            </div>
          </section>

          <section className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-600">
            <p className="text-sm font-semibold text-primary">Workspace summary</p>
            <p>{personaSummary}</p>
            <p className="text-xs text-slate-500">
              Need access to more dashboards? Visit the workspace hub to request provider, finance, or enterprise roles. Changes require approval from your organisation admin.
            </p>
          </section>

          {status ? (
            <p
              className={`text-sm font-semibold ${
                status.tone === 'error'
                  ? 'text-rose-600'
                  : status.tone === 'info'
                    ? 'text-slate-600'
                    : 'text-emerald-600'
              }`}
            >
              {status.message}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSaving || isLoading}
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSaving ? 'Saving…' : 'Save profile'}
            </button>
            <Link
              to="/settings/security"
              className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:border-accent/40 hover:text-accent"
            >
              Advanced security settings
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
