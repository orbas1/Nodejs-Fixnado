import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createNotificationRecipient,
  deleteNotificationRecipient,
  fetchAccountSettings,
  updateAccountPreferences,
  updateAccountProfile,
  updateAccountSecurity,
  updateNotificationRecipient
} from '../../../api/accountSettingsClient.js';
import {
  DEFAULT_CATALOGS,
  DEFAULT_PREFERENCES,
  DEFAULT_PROFILE,
  DEFAULT_SECURITY,
  EMPTY_ALERTS,
  RECIPIENT_TEMPLATE
} from '../constants.js';

function resolveValue(input, fallback = '') {
  if (input === null || input === undefined) {
    return fallback;
  }
  return input;
}

export function useAccountSettings(initialSnapshot) {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [security, setSecurity] = useState(DEFAULT_SECURITY);
  const [recipients, setRecipients] = useState([]);
  const [recipientDraft, setRecipientDraft] = useState(RECIPIENT_TEMPLATE);
  const [catalogs, setCatalogs] = useState(DEFAULT_CATALOGS);
  const [alerts, setAlerts] = useState(EMPTY_ALERTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({ profile: false, preferences: false, security: false, recipient: false });
  const [error, setError] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const heading = initialSnapshot?.label ?? 'Account workspace settings';
  const description =
    initialSnapshot?.description ??
    'Keep your Fixnado workspace details accurate so crews, finance teams, and concierge staff can reach the right people instantly.';

  const openSessionsDashboard = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.open('/app/security/sessions', '_blank', 'noopener');
    }
  }, []);

  const openAuditLog = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.open('/app/security/audit-log', '_blank', 'noopener');
    }
  }, []);

  const applySettings = useCallback((data) => {
    if (!data) {
      return;
    }

    setProfile({
      firstName: resolveValue(data.profile?.firstName),
      lastName: resolveValue(data.profile?.lastName),
      email: resolveValue(data.profile?.email),
      phoneNumber: resolveValue(data.profile?.phoneNumber),
      profileImageUrl: resolveValue(data.profile?.profileImageUrl)
    });

    setPreferences({
      timezone: resolveValue(data.preferences?.timezone ?? data.profile?.timezone, DEFAULT_PREFERENCES.timezone),
      locale: resolveValue(data.preferences?.locale ?? data.profile?.locale, DEFAULT_PREFERENCES.locale),
      defaultCurrency: resolveValue(data.preferences?.defaultCurrency, DEFAULT_PREFERENCES.defaultCurrency),
      weeklySummaryEnabled: data.preferences?.weeklySummaryEnabled ?? DEFAULT_PREFERENCES.weeklySummaryEnabled,
      dispatchAlertsEnabled: data.preferences?.dispatchAlertsEnabled ?? DEFAULT_PREFERENCES.dispatchAlertsEnabled,
      escrowAlertsEnabled: data.preferences?.escrowAlertsEnabled ?? DEFAULT_PREFERENCES.escrowAlertsEnabled,
      conciergeAlertsEnabled: data.preferences?.conciergeAlertsEnabled ?? DEFAULT_PREFERENCES.conciergeAlertsEnabled,
      quietHoursStart: resolveValue(data.preferences?.quietHoursStart),
      quietHoursEnd: resolveValue(data.preferences?.quietHoursEnd)
    });

    setSecurity({
      twoFactorApp: Boolean(data.security?.twoFactorApp),
      twoFactorEmail: Boolean(data.security?.twoFactorEmail)
    });

    setRecipients(Array.isArray(data.recipients) ? data.recipients : []);
    setCatalogs({
      timezones:
        Array.isArray(data.catalogs?.timezones) && data.catalogs.timezones.length
          ? data.catalogs.timezones
          : DEFAULT_CATALOGS.timezones,
      locales:
        Array.isArray(data.catalogs?.locales) && data.catalogs.locales.length
          ? data.catalogs.locales
          : DEFAULT_CATALOGS.locales,
      currencies:
        Array.isArray(data.catalogs?.currencies) && data.catalogs.currencies.length
          ? data.catalogs.currencies
          : DEFAULT_CATALOGS.currencies,
      channels:
        Array.isArray(data.catalogs?.channels) && data.catalogs.channels.length
          ? data.catalogs.channels
          : DEFAULT_CATALOGS.channels,
      roles:
        Array.isArray(data.catalogs?.roles) && data.catalogs.roles.length ? data.catalogs.roles : DEFAULT_CATALOGS.roles
    });

    setHasLoaded(true);
  }, []);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await fetchAccountSettings();
      applySettings(snapshot);
      setError(null);
    } catch (caught) {
      console.error('Failed to load account settings', caught);
      setError(caught instanceof Error ? caught.message : 'Failed to load account settings.');
    } finally {
      setLoading(false);
    }
  }, [applySettings]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (!initialSnapshot?.data) return;
    if (hasLoaded) return;
    const initialPanels = initialSnapshot.data.panels ?? [];
    if (initialPanels.length === 0) return;

    const snapshot = {
      profile: {},
      preferences: {},
      security: {},
      recipients: []
    };

    for (const panel of initialPanels) {
      if (!Array.isArray(panel.items)) continue;
      for (const item of panel.items) {
        if (panel.id === 'profile') {
          if (item.label?.toLowerCase().includes('email')) {
            snapshot.profile.email = item.value ?? '';
          }
        }
        if (panel.id === 'notifications' && item.type === 'toggle') {
          const key = item.label?.toLowerCase();
          if (key?.includes('dispatch')) snapshot.preferences.dispatchAlertsEnabled = Boolean(item.enabled);
          if (key?.includes('concierge')) snapshot.preferences.conciergeAlertsEnabled = Boolean(item.enabled);
        }
        if (panel.id === 'security' && item.type === 'toggle') {
          const key = item.label?.toLowerCase();
          if (key?.includes('authenticator')) snapshot.security.twoFactorApp = Boolean(item.enabled);
          if (key?.includes('email')) snapshot.security.twoFactorEmail = Boolean(item.enabled);
        }
      }
    }

    applySettings(snapshot);
  }, [initialSnapshot, applySettings, hasLoaded]);

  const currencyOptions = useMemo(
    () => catalogs.currencies.map((currency) => ({ value: currency, label: currency })),
    [catalogs.currencies]
  );

  const localeOptions = useMemo(
    () => catalogs.locales.map((locale) => ({ value: locale, label: locale })),
    [catalogs.locales]
  );

  const timezoneOptions = useMemo(
    () => catalogs.timezones.map((tz) => ({ value: tz, label: tz })),
    [catalogs.timezones]
  );

  const roleOptions = useMemo(
    () => catalogs.roles.map((role) => ({ value: role, label: role.charAt(0).toUpperCase() + role.slice(1) })),
    [catalogs.roles]
  );

  const channelOptions = useMemo(
    () => catalogs.channels.map((channel) => ({ value: channel, label: channel.toUpperCase() })),
    [catalogs.channels]
  );

  const setAlert = useCallback((key, type, message) => {
    setAlerts((prev) => ({ ...prev, [key]: message ? { type, message } : null }));
  }, []);

  const updateProfileField = useCallback((field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updatePreferencesField = useCallback((field, value) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateSecurityField = useCallback((field, value) => {
    setSecurity((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateRecipientDraft = useCallback((field, value) => {
    setRecipientDraft((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleProfileSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setSaving((prev) => ({ ...prev, profile: true }));
      setAlert('profile', null, null);
      try {
        const next = await updateAccountProfile(profile);
        applySettings(next);
        setAlert('profile', 'success', 'Profile updated successfully.');
      } catch (caught) {
        console.error('Failed to update profile', caught);
        setAlert('profile', 'error', caught instanceof Error ? caught.message : 'Unable to update profile.');
      } finally {
        setSaving((prev) => ({ ...prev, profile: false }));
      }
    },
    [applySettings, profile, setAlert]
  );

  const handlePreferencesSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setSaving((prev) => ({ ...prev, preferences: true }));
      setAlert('preferences', null, null);
      try {
        const next = await updateAccountPreferences({
          ...preferences,
          quietHoursStart: preferences.quietHoursStart || null,
          quietHoursEnd: preferences.quietHoursEnd || null
        });
        applySettings(next);
        setAlert('preferences', 'success', 'Preferences saved.');
      } catch (caught) {
        console.error('Failed to update preferences', caught);
        setAlert('preferences', 'error', caught instanceof Error ? caught.message : 'Unable to update preferences.');
      } finally {
        setSaving((prev) => ({ ...prev, preferences: false }));
      }
    },
    [applySettings, preferences, setAlert]
  );

  const handleSecuritySubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setSaving((prev) => ({ ...prev, security: true }));
      setAlert('security', null, null);
      try {
        const next = await updateAccountSecurity(security);
        applySettings(next);
        setAlert('security', 'success', 'Security preferences updated.');
      } catch (caught) {
        console.error('Failed to update security settings', caught);
        setAlert('security', 'error', caught instanceof Error ? caught.message : 'Unable to update security preferences.');
      } finally {
        setSaving((prev) => ({ ...prev, security: false }));
      }
    },
    [applySettings, security, setAlert]
  );

  const handleRecipientCreate = useCallback(
    async (event) => {
      event.preventDefault();
      setSaving((prev) => ({ ...prev, recipient: true }));
      setAlert('recipients', null, null);
      try {
        const created = await createNotificationRecipient(recipientDraft);
        setRecipients((prev) => [...prev, created]);
        setRecipientDraft(RECIPIENT_TEMPLATE);
        setAlert('recipients', 'success', 'Recipient added.');
      } catch (caught) {
        console.error('Failed to add recipient', caught);
        setAlert('recipients', 'error', caught instanceof Error ? caught.message : 'Unable to add recipient.');
      } finally {
        setSaving((prev) => ({ ...prev, recipient: false }));
      }
    },
    [recipientDraft, setAlert]
  );

  const handleRecipientUpdate = useCallback(
    async (recipientId, patch) => {
      try {
        const updated = await updateNotificationRecipient(recipientId, patch);
        setRecipients((prev) => prev.map((item) => (item.id === recipientId ? updated : item)));
        setAlert('recipients', 'success', 'Recipient updated.');
      } catch (caught) {
        console.error('Failed to update recipient', caught);
        setAlert('recipients', 'error', caught instanceof Error ? caught.message : 'Unable to update recipient.');
      }
    },
    [setAlert]
  );

  const handleRecipientDelete = useCallback(
    async (recipientId) => {
      try {
        await deleteNotificationRecipient(recipientId);
        setRecipients((prev) => prev.filter((recipient) => recipient.id !== recipientId));
        setAlert('recipients', 'success', 'Recipient removed.');
      } catch (caught) {
        console.error('Failed to delete recipient', caught);
        setAlert('recipients', 'error', caught instanceof Error ? caught.message : 'Unable to delete recipient.');
      }
    },
    [setAlert]
  );

  return {
    heading,
    description,
    loading,
    hasLoaded,
    error,
    alerts,
    saving,
    profile,
    preferences,
    security,
    catalogs,
    recipients,
    recipientDraft,
    currencyOptions,
    localeOptions,
    timezoneOptions,
    roleOptions,
    channelOptions,
    actions: {
      openSessionsDashboard,
      openAuditLog,
      reload: loadSettings
    },
    mutations: {
      updateProfileField,
      updatePreferencesField,
      updateSecurityField,
      updateRecipientDraft
    },
    handlers: {
      handleProfileSubmit,
      handlePreferencesSubmit,
      handleSecuritySubmit,
      handleRecipientCreate,
      handleRecipientUpdate,
      handleRecipientDelete
    }
  };
}

export default useAccountSettings;
