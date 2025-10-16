import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout.jsx';
import { DASHBOARD_ROLES } from '../../constants/dashboardConfig.js';
import { fetchAdminProfile, saveAdminProfile } from '../../api/adminProfileClient.js';
import { useAdminSession } from '../../providers/AdminSessionProvider.jsx';
import IdentitySection from './components/IdentitySection.jsx';
import ContactSection from './components/ContactSection.jsx';
import NotificationsSection from './components/NotificationsSection.jsx';
import EscalationSection from './components/EscalationSection.jsx';
import CoverageSection from './components/CoverageSection.jsx';
import SecuritySection from './components/SecuritySection.jsx';
import DelegatesSection from './components/DelegatesSection.jsx';
import ResourcesSection from './components/ResourcesSection.jsx';
import ReviewSection from './components/ReviewSection.jsx';
import {
  ESCALATION_METHOD_OPTIONS,
  MAX_ESCALATION_CONTACTS
} from './defaults.js';
import { buildMeta, normaliseProfile, serialiseProfile } from './utils.js';

const DEFAULT_ESCALATION_CONTACT = { method: 'email', label: '', destination: '', priority: 'p1' };

function AdminProfileDashboard() {
  const { refreshSession, logout } = useAdminSession();
  const [profile, setProfile] = useState(() => normaliseProfile({}));
  const [loading, setLoading] = useState(false);
  const [initialised, setInitialised] = useState(false);
  const [feedback, setFeedback] = useState({ loadError: null, saveError: null, success: null });
  const [saving, setSaving] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const markDirty = useCallback(() => {
    setFeedback((current) => ({ ...current, success: null, saveError: null }));
  }, []);

  const loadProfile = useCallback(
    async ({ signal } = {}) => {
      setLoading(true);
      try {
        const payload = await fetchAdminProfile({ signal });
        setProfile(normaliseProfile(payload));
        setFeedback((current) => ({ ...current, loadError: null }));
        setInitialised(true);
        setLastRefreshed(new Date().toISOString());
      } catch (error) {
        if (signal?.aborted) return;
        const message = error instanceof Error ? error.message : 'Failed to load admin profile';
        setFeedback((current) => ({ ...current, loadError: message }));
        setInitialised(true);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    loadProfile({ signal: controller.signal });
    return () => controller.abort();
  }, [loadProfile]);

  const handleProfileChange = useCallback(
    (field, value) => {
      markDirty();
      setProfile((current) => ({ ...current, [field]: value }));
    },
    [markDirty]
  );

  const handleWorkingHoursChange = useCallback(
    (field, value) => {
      markDirty();
      setProfile((current) => ({
        ...current,
        workingHours: { ...current.workingHours, [field]: value }
      }));
    },
    [markDirty]
  );

  const handleThemeChange = useCallback(
    (value) => {
      markDirty();
      setProfile((current) => ({ ...current, theme: value }));
    },
    [markDirty]
  );

  const handleNotificationToggle = useCallback(
    (field) => {
      markDirty();
      setProfile((current) => ({
        ...current,
        notifications: { ...current.notifications, [field]: !current.notifications[field] }
      }));
    },
    [markDirty]
  );

  const handleSecurityToggle = useCallback(
    (field) => {
      markDirty();
      setProfile((current) => ({
        ...current,
        security: { ...current.security, [field]: !current.security[field] }
      }));
    },
    [markDirty]
  );

  const handleSecurityTimeoutChange = useCallback(
    (value) => {
      markDirty();
      setProfile((current) => ({
        ...current,
        security: { ...current.security, sessionTimeoutMinutes: value }
      }));
    },
    [markDirty]
  );

  const handleAddEscalationContact = useCallback(() => {
    markDirty();
    setProfile((current) => ({
      ...current,
      escalationContacts: current.escalationContacts.length >= MAX_ESCALATION_CONTACTS
        ? current.escalationContacts
        : [...current.escalationContacts, { ...DEFAULT_ESCALATION_CONTACT }]
    }));
  }, [markDirty]);

  const handleEscalationUpdate = useCallback(
    (index, field, value) => {
      markDirty();
      setProfile((current) => ({
        ...current,
        escalationContacts: current.escalationContacts.map((contact, idx) =>
          idx === index ? { ...contact, [field]: value } : contact
        )
      }));
    },
    [markDirty]
  );

  const handleEscalationRemove = useCallback(
    (index) => {
      markDirty();
      setProfile((current) => ({
        ...current,
        escalationContacts: current.escalationContacts.filter((_, idx) => idx !== index)
      }));
    },
    [markDirty]
  );

  const handleOutOfOfficeToggle = useCallback(
    () => {
      markDirty();
      setProfile((current) => ({
        ...current,
        outOfOffice: { ...current.outOfOffice, enabled: !current.outOfOffice.enabled }
      }));
    },
    [markDirty]
  );

  const handleOutOfOfficeFieldChange = useCallback(
    (field, value) => {
      markDirty();
      setProfile((current) => ({
        ...current,
        outOfOffice: { ...current.outOfOffice, [field]: value }
      }));
    },
    [markDirty]
  );

  const handleDelegateAdd = useCallback(() => {
    markDirty();
    setProfile((current) => ({
      ...current,
      delegates: [...current.delegates, { name: '', email: '', role: '' }]
    }));
  }, [markDirty]);

  const handleDelegateUpdate = useCallback(
    (index, field, value) => {
      markDirty();
      setProfile((current) => ({
        ...current,
        delegates: current.delegates.map((delegate, idx) =>
          idx === index ? { ...delegate, [field]: value } : delegate
        )
      }));
    },
    [markDirty]
  );

  const handleDelegateRemove = useCallback(
    (index) => {
      markDirty();
      setProfile((current) => ({
        ...current,
        delegates: current.delegates.filter((_, idx) => idx !== index)
      }));
    },
    [markDirty]
  );

  const handleResourceAdd = useCallback(() => {
    markDirty();
    setProfile((current) => ({
      ...current,
      resourceLinks: [...current.resourceLinks, { label: '', url: '' }]
    }));
  }, [markDirty]);

  const handleResourceUpdate = useCallback(
    (index, field, value) => {
      markDirty();
      setProfile((current) => ({
        ...current,
        resourceLinks: current.resourceLinks.map((link, idx) =>
          idx === index ? { ...link, [field]: value } : link
        )
      }));
    },
    [markDirty]
  );

  const handleResourceRemove = useCallback(
    (index) => {
      markDirty();
      setProfile((current) => ({
        ...current,
        resourceLinks: current.resourceLinks.filter((_, idx) => idx !== index)
      }));
    },
    [markDirty]
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    setFeedback((current) => ({ ...current, saveError: null }));
    try {
      const payload = serialiseProfile(profile);
      const updated = await saveAdminProfile(payload);
      const nextProfile = normaliseProfile({ ...updated, updatedAt: updated?.updatedAt ?? new Date().toISOString() });
      setProfile(nextProfile);
      setFeedback({ loadError: null, saveError: null, success: 'Admin profile updated successfully.' });
      setLastRefreshed(new Date().toISOString());
      if (typeof refreshSession === 'function') {
        await refreshSession();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save admin profile';
      setFeedback((current) => ({ ...current, saveError: message, success: null }));
    } finally {
      setSaving(false);
    }
  }, [profile, refreshSession]);

  const handleReload = useCallback(() => {
    loadProfile();
  }, [loadProfile]);

  const meta = useMemo(() => buildMeta(profile), [profile]);
  const roleMeta = useMemo(() => DASHBOARD_ROLES.find((role) => role.id === 'admin'), []);
  const registeredRoles = useMemo(() => DASHBOARD_ROLES.filter((role) => role.registered), []);

  const feedbackBanner = useMemo(() => {
    const error = feedback.saveError ?? feedback.loadError;
    const success = feedback.success;
    return { error, success };
  }, [feedback]);

  const sections = useMemo(() => {
    if (!initialised) {
      return [];
    }

    return [
      {
        id: 'identity',
        label: 'Identity & presence',
        description: 'Manage how your administrator persona appears across the control centre.',
        icon: 'profile',
        render: () => (
          <IdentitySection
            profile={profile}
            meta={meta}
            onProfileChange={handleProfileChange}
            onTextareaChange={handleProfileChange}
            feedback={feedbackBanner}
          />
        ),
        searchable: [
          { id: 'first-name', label: 'First name', description: 'Identity & presence' },
          { id: 'last-name', label: 'Last name', description: 'Identity & presence' },
          { id: 'display-name', label: 'Display name', description: 'Identity & presence' },
          { id: 'pronouns', label: 'Pronouns', description: 'Identity & presence' }
        ]
      },
      {
        id: 'contact',
        label: 'Contact & availability',
        description: 'Keep incident responders aligned on how and when to reach you.',
        icon: 'calendar',
        render: () => (
          <ContactSection
            profile={profile}
            onProfileChange={handleProfileChange}
            onWorkingHoursChange={handleWorkingHoursChange}
            onThemeChange={handleThemeChange}
          />
        ),
        searchable: [
          { id: 'primary-email', label: 'Primary email', description: 'Contact & availability' },
          { id: 'timezone', label: 'Timezone', description: 'Contact & availability' },
          { id: 'working-hours', label: 'Working hours', description: 'Contact & availability' }
        ]
      },
      {
        id: 'notifications',
        label: 'Notifications',
        description: 'Control digests, escalations, and real-time messaging.',
        icon: 'support',
        render: () => (
          <NotificationsSection notifications={profile.notifications} onToggle={handleNotificationToggle} />
        ),
        searchable: [
          { id: 'security-alerts', label: 'Security alerts', description: 'Notifications' },
          { id: 'incident-escalations', label: 'Incident escalations', description: 'Notifications' }
        ]
      },
      {
        id: 'escalation',
        label: 'Escalation routing',
        description: 'Configure urgent contact channels and redundancy.',
        icon: 'pipeline',
        render: () => (
          <EscalationSection
            contacts={profile.escalationContacts}
            onAdd={handleAddEscalationContact}
            onUpdate={handleEscalationUpdate}
            onRemove={handleEscalationRemove}
          />
        ),
        searchable: ESCALATION_METHOD_OPTIONS.map((option) => ({
          id: `escalation-${option.value}`,
          label: `${option.label} channel`,
          description: 'Escalation routing'
        }))
      },
      {
        id: 'coverage',
        label: 'Coverage & out of office',
        description: 'Delegate responsibility when you are unavailable.',
        icon: 'availability',
        render: () => (
          <CoverageSection
            outOfOffice={profile.outOfOffice}
            onToggle={handleOutOfOfficeToggle}
            onFieldChange={handleOutOfOfficeFieldChange}
            onDateChange={handleOutOfOfficeFieldChange}
          />
        ),
        searchable: [
          { id: 'coverage-window', label: 'Coverage window', description: 'Coverage & out of office' },
          { id: 'coverage-delegate', label: 'Delegate email', description: 'Coverage & out of office' }
        ]
      },
      {
        id: 'security',
        label: 'Security posture',
        description: 'MFA, login monitoring, and session policies.',
        icon: 'settings',
        render: () => (
          <SecuritySection
            security={profile.security}
            onToggle={handleSecurityToggle}
            onTimeoutChange={handleSecurityTimeoutChange}
          />
        ),
        searchable: [
          { id: 'mfa', label: 'Multi-factor authentication', description: 'Security posture' },
          { id: 'session-timeout', label: 'Session timeout', description: 'Security posture' }
        ]
      },
      {
        id: 'delegates',
        label: 'Delegates',
        description: 'Trusted teammates who can cover escalations.',
        icon: 'crew',
        render: () => (
          <DelegatesSection
            delegates={profile.delegates}
            onAdd={handleDelegateAdd}
            onUpdate={handleDelegateUpdate}
            onRemove={handleDelegateRemove}
          />
        ),
        searchable: [
          { id: 'delegate-email', label: 'Delegate email', description: 'Delegates' }
        ]
      },
      {
        id: 'resources',
        label: 'Runbooks & resources',
        description: 'Link the documentation your teams rely on.',
        icon: 'documents',
        render: () => (
          <ResourcesSection
            resources={profile.resourceLinks}
            onAdd={handleResourceAdd}
            onUpdate={handleResourceUpdate}
            onRemove={handleResourceRemove}
          />
        ),
        searchable: [
          { id: 'runbook', label: 'Runbook URL', description: 'Runbooks & resources' }
        ]
      },
      {
        id: 'review',
        label: 'Review & publish',
        description: 'Save updates to the control tower profile.',
        icon: 'automation',
        render: () => (
          <ReviewSection
            saving={saving}
            updatedAt={profile.updatedAt}
            onSave={handleSave}
            onReload={handleReload}
          />
        ),
        searchable: [
          { id: 'save', label: 'Save changes', description: 'Review & publish' }
        ]
      }
    ];
  }, [
    initialised,
    profile,
    meta,
    handleProfileChange,
    feedbackBanner,
    handleWorkingHoursChange,
    handleThemeChange,
    handleNotificationToggle,
    handleAddEscalationContact,
    handleEscalationUpdate,
    handleEscalationRemove,
    handleOutOfOfficeToggle,
    handleOutOfOfficeFieldChange,
    handleSecurityToggle,
    handleSecurityTimeoutChange,
    handleDelegateAdd,
    handleDelegateUpdate,
    handleDelegateRemove,
    handleResourceAdd,
    handleResourceUpdate,
    handleResourceRemove,
    saving,
    handleSave,
    handleReload
  ]);

  const dashboardPayload = useMemo(() => {
    if (!initialised) {
      return null;
    }
    return {
      navigation: sections,
      persona: 'admin',
      metadata: { features: { profile: true } }
    };
  }, [initialised, sections]);

  return (
    <DashboardLayout
      roleMeta={roleMeta}
      registeredRoles={registeredRoles}
      dashboard={dashboardPayload}
      loading={loading}
      error={feedback.loadError}
      onRefresh={handleReload}
      lastRefreshed={lastRefreshed}
      onLogout={logout}
    />
  );
}

export default AdminProfileDashboard;
