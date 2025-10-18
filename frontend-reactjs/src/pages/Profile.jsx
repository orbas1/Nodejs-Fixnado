import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon,
  ClockIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  MapPinIcon,
  PhoneIcon,
  ShareIcon,
  ShieldCheckIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import Spinner from '../components/ui/Spinner.jsx';
import { useSession } from '../hooks/useSession.js';
import { useProfile } from '../hooks/useProfile.js';
import { DASHBOARD_ROLES } from '../constants/dashboardConfig.js';

const BASE_SECTIONS = Object.freeze({
  profile: 'Profile',
  spaces: 'Spaces',
  boards: 'Boards',
  tags: 'Tags',
  contact: 'Contact',
  schedule: 'Schedule',
  digest: 'Digest',
  status: 'Status',
  team: 'Team',
  roles: 'Roles',
  shortcuts: 'Shortcuts',
  channels: 'Channels',
  prefs: 'Prefs',
  securityFactors: 'Factors',
  account: 'Account',
  manage: 'Manage',
  activity: 'Activity'
});

const ROLE_PROFILE_THEMES = Object.freeze({
  user: {
    personaLabel: 'User',
    nav: [
      { id: 'home', label: 'Home' },
      { id: 'crew', label: 'Crew' },
      { id: 'signals', label: 'Signals' },
      { id: 'shield', label: 'Shield' }
    ],
    stats: [
      { id: 'spaces', label: 'Spaces', getValue: ({ shortcutsCount }) => shortcutsCount },
      { id: 'roles', label: 'Roles', getValue: ({ rolesCount }) => rolesCount },
      { id: 'channels', label: 'Channels', getValue: ({ channelsCount }) => channelsCount },
      { id: 'alerts', label: 'Alerts', getValue: ({ alertsCount }) => alertsCount }
    ],
    actions: {
      primary: { to: '/services', label: 'Book' },
      secondary: { to: '/communications', label: 'Message' },
      tertiary: { label: 'Share' }
    },
    sections: BASE_SECTIONS
  },
  admin: {
    personaLabel: 'Admin',
    nav: [
      { id: 'home', label: 'Home' },
      { id: 'crew', label: 'Ops' },
      { id: 'signals', label: 'Signals' },
      { id: 'shield', label: 'Guard' }
    ],
    stats: [
      { id: 'spaces', label: 'Tenants', getValue: ({ shortcutsCount }) => shortcutsCount },
      { id: 'roles', label: 'Roles', getValue: ({ rolesCount }) => rolesCount },
      { id: 'channels', label: 'Feeds', getValue: ({ channelsCount }) => channelsCount },
      { id: 'alerts', label: 'Alerts', getValue: ({ alertsCount }) => alertsCount }
    ],
    actions: {
      primary: { to: '/admin/dashboard', label: 'Audit' },
      secondary: { to: '/admin/inbox', label: 'Inbox' },
      tertiary: { label: 'Share' }
    },
    sections: {
      ...BASE_SECTIONS,
      profile: 'Admin',
      spaces: 'Tenants',
      boards: 'Boards',
      tags: 'Badges',
      contact: 'Contacts',
      schedule: 'Rhythm',
      status: 'Alerts',
      team: 'Org',
      shortcuts: 'Hubs',
      channels: 'Feeds',
      prefs: 'Prefs',
      manage: 'Secure',
      activity: 'Sessions'
    }
  },
  provider: {
    personaLabel: 'Provider',
    nav: [
      { id: 'home', label: 'Ops' },
      { id: 'crew', label: 'Crew' },
      { id: 'signals', label: 'Pulse' },
      { id: 'shield', label: 'Guard' }
    ],
    stats: [
      { id: 'spaces', label: 'Studios', getValue: ({ shortcutsCount }) => shortcutsCount },
      { id: 'roles', label: 'Crew', getValue: ({ rolesCount }) => rolesCount },
      { id: 'channels', label: 'Feeds', getValue: ({ channelsCount }) => channelsCount },
      { id: 'alerts', label: 'Alerts', getValue: ({ alertsCount }) => alertsCount }
    ],
    actions: {
      primary: { to: '/provider/services', label: 'Assign' },
      secondary: { to: '/provider/inventory', label: 'Assets' },
      tertiary: { label: 'Share' }
    },
    sections: {
      ...BASE_SECTIONS,
      profile: 'Ops',
      spaces: 'Studios',
      boards: 'Boards',
      tags: 'Badges',
      contact: 'Routes',
      schedule: 'Rhythm',
      digest: 'Digest',
      status: 'Alerts',
      team: 'Org',
      shortcuts: 'Shortcuts',
      channels: 'Feeds',
      prefs: 'Signals',
      manage: 'Secure',
      activity: 'Sessions'
    }
  },
  finance: {
    personaLabel: 'Finance',
    nav: [
      { id: 'home', label: 'Home' },
      { id: 'crew', label: 'Cash' },
      { id: 'signals', label: 'Pulse' },
      { id: 'shield', label: 'Guard' }
    ],
    stats: [
      { id: 'spaces', label: 'Books', getValue: ({ shortcutsCount }) => shortcutsCount },
      { id: 'roles', label: 'Roles', getValue: ({ rolesCount }) => rolesCount },
      { id: 'channels', label: 'Feeds', getValue: ({ channelsCount }) => channelsCount },
      { id: 'alerts', label: 'Alerts', getValue: ({ alertsCount }) => alertsCount }
    ],
    actions: {
      primary: { to: '/dashboards/finance', label: 'Review' },
      secondary: { to: '/communications', label: 'Inbox' },
      tertiary: { label: 'Share' }
    },
    sections: {
      ...BASE_SECTIONS,
      profile: 'Ledger',
      spaces: 'Books',
      boards: 'Boards',
      tags: 'Badges',
      contact: 'Contacts',
      schedule: 'Rhythm',
      status: 'Alerts',
      team: 'Org',
      shortcuts: 'Shortcuts',
      channels: 'Feeds',
      prefs: 'Signals',
      manage: 'Secure',
      activity: 'Sessions'
    }
  },
  serviceman: {
    personaLabel: 'Crew',
    nav: [
      { id: 'home', label: 'Home' },
      { id: 'crew', label: 'Jobs' },
      { id: 'signals', label: 'Pulse' },
      { id: 'shield', label: 'Guard' }
    ],
    stats: [
      { id: 'spaces', label: 'Routes', getValue: ({ shortcutsCount }) => shortcutsCount },
      { id: 'roles', label: 'Crews', getValue: ({ rolesCount }) => rolesCount },
      { id: 'channels', label: 'Feeds', getValue: ({ channelsCount }) => channelsCount },
      { id: 'alerts', label: 'Alerts', getValue: ({ alertsCount }) => alertsCount }
    ],
    actions: {
      primary: { to: '/services', label: 'Schedule' },
      secondary: { to: '/communications', label: 'Chat' },
      tertiary: { label: 'Share' }
    },
    sections: {
      ...BASE_SECTIONS,
      profile: 'Crew',
      spaces: 'Routes',
      boards: 'Boards',
      tags: 'Badges',
      contact: 'Contacts',
      schedule: 'Rhythm',
      status: 'Alerts',
      team: 'Unit',
      shortcuts: 'Shortcuts',
      channels: 'Feeds',
      prefs: 'Signals',
      manage: 'Secure',
      activity: 'Sessions'
    }
  },
  enterprise: {
    personaLabel: 'Enterprise',
    nav: [
      { id: 'home', label: 'Home' },
      { id: 'crew', label: 'Sites' },
      { id: 'signals', label: 'Pulse' },
      { id: 'shield', label: 'Guard' }
    ],
    stats: [
      { id: 'spaces', label: 'Sites', getValue: ({ shortcutsCount }) => shortcutsCount },
      { id: 'roles', label: 'Roles', getValue: ({ rolesCount }) => rolesCount },
      { id: 'channels', label: 'Feeds', getValue: ({ channelsCount }) => channelsCount },
      { id: 'alerts', label: 'Alerts', getValue: ({ alertsCount }) => alertsCount }
    ],
    actions: {
      primary: { to: '/dashboards/enterprise/panel', label: 'Review' },
      secondary: { to: '/communications', label: 'Inbox' },
      tertiary: { label: 'Share' }
    },
    sections: {
      ...BASE_SECTIONS,
      profile: 'Enterprise',
      spaces: 'Sites',
      boards: 'Boards',
      tags: 'Badges',
      contact: 'Contacts',
      schedule: 'Rhythm',
      status: 'Alerts',
      team: 'Org',
      shortcuts: 'Shortcuts',
      channels: 'Feeds',
      prefs: 'Signals',
      manage: 'Secure',
      activity: 'Sessions'
    }
  }
});

function toList(value) {
  return Array.isArray(value) ? value : [];
}

function formatLabel(value) {
  if (!value) {
    return '—';
  }
  return value
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildInitials(name) {
  const parts = name.split(' ').filter(Boolean);
  if (!parts.length) {
    return 'U';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Profile() {
  const { profile, defaults, isLoading, error, refresh } = useProfile();
  const session = useSession();
  const [activeTab, setActiveTab] = useState('home');
  const [activePersona, setActivePersona] = useState('user');
  const [showAvatar, setShowAvatar] = useState(false);
  const [shareNotice, setShareNotice] = useState(null);
  const [focusCard, setFocusCard] = useState(null);
  const shareTimer = useRef(null);

  const data = useMemo(() => {
    const base = { ...defaults, ...(profile ?? {}) };
    return {
      ...base,
      communicationPreferences: {
        ...defaults.communicationPreferences,
        ...(profile?.communicationPreferences ?? {})
      },
      security: { ...defaults.security, ...(profile?.security ?? {}) },
      workspaceShortcuts: toList(profile?.workspaceShortcuts ?? defaults.workspaceShortcuts),
      roleAssignments: toList(profile?.roleAssignments ?? defaults.roleAssignments),
      notificationChannels: toList(profile?.notificationChannels ?? defaults.notificationChannels)
    };
  }, [defaults, profile]);

  const displayName = useMemo(() => {
    const name = [data.firstName, data.lastName].filter(Boolean).join(' ');
    if (name) {
      return name;
    }
    if (data.organisation) {
      return data.organisation;
    }
    return session.userId || 'Profile';
  }, [data.firstName, data.lastName, data.organisation, session.userId]);

  const heroTags = useMemo(() => {
    const tags = new Set();
    if (data.jobTitle) {
      tags.add(data.jobTitle);
    }
    if (data.teamName) {
      tags.add(data.teamName);
    }
    if (data.organisation) {
      tags.add(data.organisation);
    }
    return Array.from(tags);
  }, [data.jobTitle, data.teamName, data.organisation]);

  const shortcuts = useMemo(() => toList(data.workspaceShortcuts), [data.workspaceShortcuts]);
  const roles = useMemo(() => toList(data.roleAssignments), [data.roleAssignments]);
  const channels = useMemo(() => toList(data.notificationChannels), [data.notificationChannels]);
  const preferences = data.communicationPreferences;
  const sessionDashboards = useMemo(() => toList(session?.dashboards), [session?.dashboards]);

  const personaOptions = useMemo(() => {
    const availableIds = sessionDashboards.length
      ? sessionDashboards
      : [session.role].filter(Boolean);
    const uniqueIds = Array.from(new Set(availableIds));
    const resolved = uniqueIds
      .map((id) => {
        const role = DASHBOARD_ROLES.find((entry) => entry.id === id);
        if (!role) {
          return null;
        }
        const label = ROLE_PROFILE_THEMES[id]?.personaLabel ?? formatLabel(id);
        return { id, label, role };
      })
      .filter(Boolean);

    if (resolved.length > 0) {
      return resolved;
    }

    const fallbackRole = DASHBOARD_ROLES.find((entry) => entry.id === 'user');
    if (!fallbackRole) {
      return [];
    }

    return [
      {
        id: fallbackRole.id,
        label: ROLE_PROFILE_THEMES[fallbackRole.id]?.personaLabel ?? formatLabel(fallbackRole.id),
        role: fallbackRole
      }
    ];
  }, [session.role, sessionDashboards]);

  useEffect(() => {
    if (personaOptions.length === 0) {
      if (activePersona !== 'user') {
        setActivePersona('user');
      }
      return;
    }

    if (!personaOptions.some((option) => option.id === activePersona)) {
      setActivePersona(personaOptions[0].id);
    }
  }, [activePersona, personaOptions]);

  useEffect(() => {
    setActiveTab('home');
  }, [activePersona]);

  const personaCopy = ROLE_PROFILE_THEMES[activePersona] ?? ROLE_PROFILE_THEMES.user;
  const personaSections = personaCopy.sections ?? BASE_SECTIONS;
  const navTabs = personaCopy.nav ?? ROLE_PROFILE_THEMES.user.nav;
  const primaryAction = personaCopy.actions?.primary ?? ROLE_PROFILE_THEMES.user.actions.primary;
  const secondaryAction = personaCopy.actions?.secondary ?? ROLE_PROFILE_THEMES.user.actions.secondary;
  const tertiaryAction = personaCopy.actions?.tertiary ?? ROLE_PROFILE_THEMES.user.actions.tertiary;

  const alertsEnabled = useMemo(() => {
    return ['emailAlerts', 'smsAlerts', 'pushAlerts', 'marketingOptIn'].reduce(
      (count, key) => (preferences?.[key] ? count + 1 : count),
      0
    );
  }, [preferences]);

  const stats = useMemo(() => {
    const config = personaCopy.stats ?? ROLE_PROFILE_THEMES.user.stats;
    const context = {
      shortcutsCount: shortcuts.length,
      rolesCount: roles.length,
      channelsCount: channels.length,
      alertsCount: alertsEnabled
    };

    return config.map((item) => ({
      id: item.id,
      label: item.label,
      value: typeof item.getValue === 'function' ? item.getValue(context) : 0
    }));
  }, [alertsEnabled, channels.length, personaCopy, roles.length, shortcuts.length]);

  const localTime = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(data.locale || 'en-GB', {
        timeZone: data.timezone || 'UTC',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date());
    } catch (err) {
      console.warn('[Profile] unable to resolve local time', err);
      return null;
    }
  }, [data.locale, data.timezone]);

  const localDate = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(data.locale || 'en-GB', {
        timeZone: data.timezone || 'UTC',
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }).format(new Date());
    } catch {
      return null;
    }
  }, [data.locale, data.timezone]);

  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const closeFocus = useCallback(() => {
    setFocusCard(null);
  }, []);

  const handleShare = useCallback(async () => {
    if (shareTimer.current) {
      clearTimeout(shareTimer.current);
    }
    try {
      const sharePayload = {
        title: displayName,
        text: `${displayName} on Fixnado`,
        url: typeof window !== 'undefined' ? window.location.href : ''
      };
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(sharePayload);
        setShareNotice('Shared');
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(sharePayload.url);
        setShareNotice('Link copied');
      } else {
        setShareNotice('Copy failed');
      }
    } catch (err) {
      console.warn('[Profile] share failed', err);
      setShareNotice('Copy failed');
    } finally {
      shareTimer.current = setTimeout(() => setShareNotice(null), 2200);
    }
  }, [displayName]);

  const openFocus = useCallback(
    (payload) => {
      setFocusCard(payload);
    },
    []
  );

  const contactItems = useMemo(() => {
    const items = [];
    if (data.email || session.userId) {
      items.push({
        id: 'email',
        label: data.email || session.userId,
        href: `mailto:${data.email || session.userId}`,
        icon: EnvelopeIcon
      });
    }
    if (data.phone) {
      items.push({ id: 'phone', label: data.phone, href: `tel:${data.phone}`, icon: PhoneIcon });
    }
    if (data.address) {
      items.push({ id: 'address', label: data.address, icon: MapPinIcon });
    }
    return items;
  }, [data.address, data.email, data.phone, session.userId]);

  const digestLabel = formatLabel(preferences?.digestFrequency);

  if (isLoading && !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="relative isolate overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_55%)]" aria-hidden="true" />
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-12 pt-16 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => (data.avatarUrl ? setShowAvatar(true) : null)}
                className="relative h-32 w-32 overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/10 shadow-2xl ring-4 ring-white/20 transition hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                aria-label="Expand avatar"
              >
                {data.avatarUrl ? (
                  <img src={data.avatarUrl} alt={displayName} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-3xl font-semibold uppercase text-white/80">
                    {buildInitials(displayName)}
                  </span>
                )}
              </button>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{displayName}</h1>
                  {session?.isAuthenticated && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                      Live
                    </span>
                  )}
                </div>
                {data.bio ? (
                  <p className="max-w-xl text-sm font-medium text-white/80 sm:text-base sm:leading-relaxed line-clamp-3">{data.bio}</p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {heroTags.map((tag) => (
                    <span key={tag} className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
                      {tag}
                    </span>
                  ))}
                </div>
                {personaOptions.length > 1 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {personaOptions.map((option) => {
                      const isActive = option.id === activePersona;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setActivePersona(option.id)}
                          className={`rounded-2xl px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                            isActive ? 'bg-white text-slate-900' : 'border border-white/20 text-white/70'
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
                  {data.timezone && (
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4" aria-hidden="true" />
                      {localTime || '—'}
                      {localDate ? <span className="ml-1 text-white/60">{localDate}</span> : null}
                      <span className="ml-2 rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[11px] font-semibold uppercase text-white/70">
                        {data.timezone}
                      </span>
                    </span>
                  )}
                  {data.locale && (
                    <span className="flex items-center gap-1">
                      <GlobeAltIcon className="h-4 w-4" aria-hidden="true" />
                      {formatLabel(data.locale)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              {secondaryAction ? (
                <Link
                  to={secondaryAction.to}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5" aria-hidden="true" />
                  {secondaryAction.label}
                </Link>
              ) : null}
              {primaryAction ? (
                <Link
                  to={primaryAction.to}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-slate-900/20 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <CalendarDaysIcon className="h-5 w-5" aria-hidden="true" />
                  {primaryAction.label}
                </Link>
              ) : null}
              {tertiaryAction ? (
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <ShareIcon className="h-5 w-5" aria-hidden="true" />
                  {tertiaryAction.label}
                </button>
              ) : null}
            </div>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-white/10 bg-white/10 px-4 py-5 text-sm font-semibold text-white/90 shadow-lg shadow-slate-900/30 backdrop-blur"
              >
                <dt className="text-xs uppercase tracking-[0.3em] text-white/60">{item.label}</dt>
                <dd className="mt-2 text-3xl font-semibold">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16 pt-10 sm:px-8 lg:px-10">
        {error && (
          <div className="mb-8 rounded-3xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm font-semibold text-rose-700 shadow-sm">
            Sync issue
            {error.message ? <span className="ml-2 text-rose-500">{error.message}</span> : null}
          </div>
        )}
        {shareNotice && (
          <div className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-700 shadow-sm">
            {shareNotice}
          </div>
        )}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <nav className="flex flex-wrap gap-2" aria-label="Profile sections">
            {navTabs.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                      : 'bg-white text-slate-600 shadow-sm hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin text-primary' : 'text-slate-500'}`} aria-hidden="true" />
            Refresh
          </button>
        </div>

        {activeTab === 'home' && (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
                <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{personaSections.profile}</h2>
                <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Name</dt>
                    <dd className="mt-1 text-base font-semibold text-slate-900">{displayName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Role</dt>
                    <dd className="mt-1 text-base font-semibold text-slate-900">{data.jobTitle || 'Member'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Org</dt>
                    <dd className="mt-1 text-base font-semibold text-slate-900">{data.organisation || 'Independent'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{personaSections.team}</dt>
                    <dd className="mt-1 text-base font-semibold text-slate-900">{data.teamName || '—'}</dd>
                  </div>
                </dl>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{personaSections.spaces}</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {shortcuts.length > 0 ? (
                      shortcuts.map((entry) => (
                        <Link
                          key={entry}
                          to={`/dashboards/${entry}`}
                          className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                        >
                          {formatLabel(entry)}
                        </Link>
                      ))
                    ) : (
                      <span className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-400">
                        Empty
                      </span>
                    )}
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{personaSections.boards}</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {sessionDashboards.length > 0 ? (
                      sessionDashboards.map((entry) => (
                        <Link
                          key={entry}
                          to={`/dashboards/${entry}`}
                          className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                        >
                          {formatLabel(entry)}
                        </Link>
                      ))
                    ) : (
                      <span className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-400">
                        Empty
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
                <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{personaSections.tags}</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[...heroTags, digestLabel].filter(Boolean).map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      <CheckBadgeIcon className="h-4 w-4 text-primary" aria-hidden="true" />
                      {tag}
                    </span>
                  ))}
                  {alertsEnabled === 0 && (
                    <span className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                      <ShieldCheckIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      Silent
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
                <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{personaSections.contact}</h2>
                <div className="mt-4 space-y-3">
                  {contactItems.length > 0 ? (
                    contactItems.map((item) => {
                      const Icon = item.icon;
                      const href = item.href || null;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => openFocus({ title: formatLabel(item.id), lines: [item.label], href })}
                          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                        >
                          <span className="flex items-center gap-3">
                            <Icon className="h-5 w-5 text-slate-500" aria-hidden="true" />
                            {item.label}
                          </span>
                          <span className="text-xs text-slate-500">View</span>
                        </button>
                      );
                    })
                  ) : (
                    <span className="inline-flex w-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-400">
                      Empty
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
                <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{personaSections.schedule}</h2>
                <div className="mt-4 space-y-3 text-sm font-semibold text-slate-700">
                  {[
                    { id: 'time', label: localTime || '—', icon: ClockIcon },
                    { id: 'date', label: localDate || '—', icon: CalendarDaysIcon },
                    { id: 'zone', label: formatLabel(data.timezone), icon: GlobeAltIcon }
                  ]
                    .filter((entry) => entry.label)
                    .map((entry) => {
                      const Icon = entry.icon;
                      return (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => openFocus({ title: formatLabel(entry.id), lines: [entry.label] })}
                          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-left transition hover:bg-slate-200"
                        >
                          <span className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                            <Icon className="h-5 w-5 text-slate-500" aria-hidden="true" />
                            {entry.label}
                          </span>
                          <span className="text-xs text-slate-500">View</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'crew' && (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
                <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{personaSections.team}</h2>
                <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Org</dt>
                    <dd className="mt-1 text-base font-semibold text-slate-900">{data.organisation || 'Independent'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{personaSections.team}</dt>
                    <dd className="mt-1 text-base font-semibold text-slate-900">{data.teamName || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Title</dt>
                    <dd className="mt-1 text-base font-semibold text-slate-900">{data.jobTitle || 'Member'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Locale</dt>
                    <dd className="mt-1 text-base font-semibold text-slate-900">{formatLabel(data.locale)}</dd>
                  </div>
                </dl>
              </div>

              <div className="space-y-4">
                {roles.length > 0 ? (
                  roles.map((role) => (
                    <div key={role.id || role.role} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3 text-base font-semibold text-slate-900">
                          <UserGroupIcon className="h-6 w-6 text-primary" aria-hidden="true" />
                          {formatLabel(role.role) || 'Role'}
                        </div>
                        <span
                          className={`inline-flex items-center rounded-2xl px-3 py-1 text-xs font-semibold ${
                            role.allowCreate ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {role.allowCreate ? 'Creator' : 'Viewer'}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {toList(role.dashboards).length > 0 ? (
                          toList(role.dashboards).map((board) => (
                            <Link
                              key={board}
                              to={`/dashboards/${board}`}
                              className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                            >
                              {formatLabel(board)}
                            </Link>
                          ))
                        ) : (
                          <span className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-400">
                            Empty
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-sm font-semibold text-slate-400">
                    Empty
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
                <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{personaSections.shortcuts}</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {shortcuts.length > 0 ? (
                    shortcuts.map((entry) => (
                      <Link
                        key={entry}
                        to={`/dashboards/${entry}`}
                        className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                      >
                        {formatLabel(entry)}
                      </Link>
                    ))
                  ) : (
                    <span className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-400">
                      Empty
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
                <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{personaSections.boards}</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {sessionDashboards.length > 0 ? (
                    sessionDashboards.map((entry) => (
                      <Link
                        key={entry}
                        to={`/dashboards/${entry}`}
                        className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                      >
                        {formatLabel(entry)}
                      </Link>
                    ))
                  ) : (
                    <span className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-400">
                      Empty
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'signals' && (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
                <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{personaSections.channels}</h2>
                <div className="mt-4 space-y-3">
                  {channels.length > 0 ? (
                    channels.map((channel) => (
                      <button
                        key={channel.id || channel.type || channel}
                        type="button"
                        onClick={() =>
                          openFocus({
                            title: formatLabel(channel.type || channel),
                            lines: [formatLabel(channel.status || 'active')]
                          })
                        }
                        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        <span>{formatLabel(channel.type || channel)}</span>
                        <span className="rounded-2xl bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                          {formatLabel(channel.status || 'active')}
                        </span>
                      </button>
                    ))
                  ) : (
                    <span className="inline-flex w-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-400">
                      Empty
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
                <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{personaSections.prefs}</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    { id: 'email', label: 'Email', enabled: preferences?.emailAlerts },
                    { id: 'sms', label: 'SMS', enabled: preferences?.smsAlerts },
                    { id: 'push', label: 'Push', enabled: preferences?.pushAlerts },
                    { id: 'promo', label: 'Marketing', enabled: preferences?.marketingOptIn }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openFocus({ title: item.label, lines: [item.enabled ? 'On' : 'Off'] })}
                      className={`inline-flex items-center rounded-2xl px-3 py-1 text-xs font-semibold transition ${
                        item.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
                <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{personaSections.digest}</h2>
                <button
                  type="button"
                  onClick={() => openFocus({ title: 'Digest', lines: [digestLabel || 'None'] })}
                  className="mt-4 inline-flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  <span>{digestLabel || 'None'}</span>
                  <span className="text-xs text-slate-500">View</span>
                </button>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
                <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{personaSections.status}</h2>
                <button
                  type="button"
                  onClick={() => openFocus({ title: 'Alerts', lines: [alertsEnabled > 0 ? `${alertsEnabled} Active` : 'Muted'] })}
                  className="mt-4 inline-flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  <span>{alertsEnabled > 0 ? `${alertsEnabled} Active` : 'Muted'}</span>
                  <span className="text-xs text-slate-500">View</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'shield' && (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
                <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{personaSections.securityFactors}</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[{ id: 'email', label: 'Email', enabled: data.security?.twoFactorEmail }, { id: 'app', label: 'Authenticator', enabled: data.security?.twoFactorApp }].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openFocus({ title: item.label, lines: [item.enabled ? 'On' : 'Off'] })}
                      className={`inline-flex items-center rounded-2xl px-3 py-1 text-xs font-semibold transition ${
                        item.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
                <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{personaSections.account}</h2>
                <dl className="mt-5 space-y-3 text-sm font-semibold text-slate-700">
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3">
                    <dt>ID</dt>
                    <dd className="truncate text-slate-500">{session.userId || '—'}</dd>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3">
                    <dt>Email</dt>
                    <dd className="truncate text-slate-500">{data.email || session.userId || '—'}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
                <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{personaSections.manage}</h2>
                <Link
                  to="/settings/security"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                >
                  <ShieldCheckIcon className="h-5 w-5" aria-hidden="true" />
                  Secure
                </Link>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
                <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{personaSections.activity}</h2>
                <button
                  type="button"
                  onClick={() =>
                    openFocus({
                      title: 'Sessions',
                      lines: [data.security?.lastSignIn ? new Date(data.security.lastSignIn).toLocaleString() : 'No data']
                    })
                  }
                  className="mt-4 inline-flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  <span>{data.security?.lastSignIn ? new Date(data.security.lastSignIn).toLocaleString() : 'No data'}</span>
                  <span className="text-xs text-slate-500">View</span>
                </button>
              </div>
            </div>
          </section>
        )}

      </main>

      {focusCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 backdrop-blur">
          <button
            type="button"
            onClick={closeFocus}
            className="absolute inset-0 h-full w-full"
            aria-label="Close detail view"
          />
          <div className="relative w-full max-w-md rounded-3xl border border-white/20 bg-white/95 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">{focusCard.title}</h3>
                <div className="mt-4 space-y-2">
                  {(focusCard.lines || []).map((line, index) => (
                    <div key={`${focusCard.title}-${index}`} className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={closeFocus}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100"
                aria-label="Dismiss detail view"
              >
                ×
              </button>
            </div>
            {focusCard.href ? (
              <a
                href={focusCard.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
              >
                Open
              </a>
            ) : null}
          </div>
        </div>
      )}

      {showAvatar && data.avatarUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur">
          <button
            type="button"
            onClick={() => setShowAvatar(false)}
            className="absolute inset-0 h-full w-full"
            aria-label="Close avatar preview"
          />
          <div className="relative rounded-3xl border border-white/10 bg-white/10 p-4 shadow-2xl">
            <img src={data.avatarUrl} alt={displayName} className="h-[70vh] w-[70vw] max-w-3xl rounded-2xl object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
