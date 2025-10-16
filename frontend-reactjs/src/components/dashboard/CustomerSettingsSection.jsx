import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Spinner from '../ui/Spinner.jsx';
import { useCustomerProfileSettings } from '../../hooks/useCustomerProfileSettings.js';
import ProfileSettingsPanel from './customer-settings/ProfileSettingsPanel.jsx';
import SecuritySettingsPanel from './customer-settings/SecuritySettingsPanel.jsx';
import NotificationsSettingsPanel from './customer-settings/NotificationsSettingsPanel.jsx';
import BillingSettingsPanel from './customer-settings/BillingSettingsPanel.jsx';

const LANGUAGE_OPTIONS = ['en-GB', 'en-US', 'es-MX', 'fr-FR'];
const CURRENCY_OPTIONS = ['GBP', 'USD', 'EUR', 'CAD', 'AUD'];

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2, 10)}`;
};

const buildTimezoneOptions = () => {
  if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
    return Intl.supportedValuesOf('timeZone');
  }
  return ['Europe/London', 'UTC', 'America/New_York', 'America/Los_Angeles'];
};

const timezoneOptions = buildTimezoneOptions();

function CustomerSettingsSection({ section }) {
  const {
    data,
    loading,
    error,
    saving,
    refresh,
    saveProfile,
    saveNotifications,
    saveBilling,
    saveSecurity
  } = useCustomerProfileSettings();

  const [profileForm, setProfileForm] = useState(null);
  const [securityForm, setSecurityForm] = useState(null);
  const [notificationsForm, setNotificationsForm] = useState(null);
  const [billingForm, setBillingForm] = useState(null);

  const [profileStatus, setProfileStatus] = useState(null);
  const [securityStatus, setSecurityStatus] = useState(null);
  const [notificationsStatus, setNotificationsStatus] = useState(null);
  const [billingStatus, setBillingStatus] = useState(null);

  useEffect(() => {
    if (!data) return;
    setProfileForm({
      firstName: data.profile?.firstName ?? '',
      lastName: data.profile?.lastName ?? '',
      preferredName: data.profile?.preferredName ?? '',
      jobTitle: data.profile?.jobTitle ?? '',
      email: data.profile?.email ?? '',
      phoneNumber: data.profile?.phoneNumber ?? '',
      timezone: data.profile?.timezone ?? timezoneOptions[0],
      language: data.profile?.language ?? LANGUAGE_OPTIONS[0],
      avatarUrl: data.profile?.avatarUrl ?? ''
    });
    setSecurityForm({
      twoFactorApp: Boolean(data.security?.twoFactor?.app),
      twoFactorEmail: Boolean(data.security?.twoFactor?.email),
      methods: Array.isArray(data.security?.twoFactor?.methods)
        ? [...data.security.twoFactor.methods]
        : []
    });
    setNotificationsForm({
      dispatchEmail: Boolean(data.notifications?.dispatch?.email),
      dispatchSms: Boolean(data.notifications?.dispatch?.sms),
      supportEmail: Boolean(data.notifications?.support?.email),
      supportSms: Boolean(data.notifications?.support?.sms),
      weeklySummaryEmail: Boolean(data.notifications?.weeklySummary?.email),
      conciergeEmail: Boolean(data.notifications?.concierge?.email),
      quietHours: {
        enabled: Boolean(data.notifications?.quietHours?.enabled),
        start: data.notifications?.quietHours?.start ?? '20:00',
        end: data.notifications?.quietHours?.end ?? '07:00',
        timezone: data.notifications?.quietHours?.timezone ?? data.profile?.timezone ?? timezoneOptions[0]
      },
      escalationContacts: Array.isArray(data.notifications?.escalationContacts)
        ? data.notifications.escalationContacts.map((contact) => ({
            id: contact.id ?? generateId(),
            name: contact.name ?? '',
            email: contact.email ?? ''
          }))
        : []
    });
    setBillingForm({
      preferredCurrency: data.billing?.preferredCurrency ?? CURRENCY_OPTIONS[0],
      defaultPaymentMethod: data.billing?.defaultPaymentMethod ?? '',
      paymentNotes: data.billing?.paymentNotes ?? '',
      invoiceRecipients: Array.isArray(data.billing?.invoiceRecipients)
        ? data.billing.invoiceRecipients.map((recipient) => ({
            id: recipient.id ?? generateId(),
            name: recipient.name ?? '',
            email: recipient.email ?? ''
          }))
        : []
    });
  }, [data]);

  const timezoneList = useMemo(() => timezoneOptions, []);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    if (!profileForm) return;
    setProfileStatus(null);
    try {
      await saveProfile(profileForm);
      setProfileStatus({ type: 'success', message: 'Profile settings saved.' });
    } catch (caught) {
      setProfileStatus({
        type: 'error',
        message: caught?.message || 'Unable to save profile settings.'
      });
    }
  };

  const handleSecuritySubmit = async (event) => {
    event.preventDefault();
    if (!securityForm) return;
    setSecurityStatus(null);
    try {
      await saveSecurity({
        twoFactorApp: Boolean(securityForm.twoFactorApp),
        twoFactorEmail: Boolean(securityForm.twoFactorEmail),
        methods: securityForm.methods
      });
      setSecurityStatus({ type: 'success', message: 'Security preferences updated.' });
    } catch (caught) {
      setSecurityStatus({
        type: 'error',
        message: caught?.message || 'Unable to update security preferences.'
      });
    }
  };

  const handleNotificationsSubmit = async (event) => {
    event.preventDefault();
    if (!notificationsForm) return;
    setNotificationsStatus(null);
    const { quietHours, escalationContacts, ...rest } = notificationsForm;
    try {
      await saveNotifications({
        dispatch: { email: rest.dispatchEmail, sms: rest.dispatchSms },
        support: { email: rest.supportEmail, sms: rest.supportSms },
        weeklySummary: { email: rest.weeklySummaryEmail },
        concierge: { email: rest.conciergeEmail },
        quietHours,
        escalationContacts
      });
      setNotificationsStatus({ type: 'success', message: 'Notification rules saved.' });
    } catch (caught) {
      setNotificationsStatus({
        type: 'error',
        message: caught?.message || 'Unable to save notification rules.'
      });
    }
  };

  const handleBillingSubmit = async (event) => {
    event.preventDefault();
    if (!billingForm) return;
    setBillingStatus(null);
    try {
      await saveBilling(billingForm);
      setBillingStatus({ type: 'success', message: 'Billing preferences saved.' });
    } catch (caught) {
      setBillingStatus({
        type: 'error',
        message: caught?.message || 'Unable to save billing preferences.'
      });
    }
  };

  const updateProfileField = (field, value) => {
    setProfileForm((current) => ({ ...current, [field]: value }));
  };

  const updateSecurityToggle = (field, value) => {
    setSecurityForm((current) => ({ ...current, [field]: value }));
  };

  const addSecurityMethod = (method) => {
    setSecurityForm((current) => ({
      ...current,
      methods: current.methods.includes(method) ? current.methods : [...current.methods, method]
    }));
  };

  const removeSecurityMethod = (method) => {
    setSecurityForm((current) => ({
      ...current,
      methods: current.methods.filter((entry) => entry !== method)
    }));
  };

  const updateNotificationToggle = (field, value) => {
    setNotificationsForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const toggleQuietHours = (enabled) => {
    setNotificationsForm((current) => ({
      ...current,
      quietHours: { ...current.quietHours, enabled }
    }));
  };

  const updateQuietHours = (field, value) => {
    setNotificationsForm((current) => ({
      ...current,
      quietHours: { ...current.quietHours, [field]: value }
    }));
  };

  const addEscalationContact = () => {
    setNotificationsForm((current) => ({
      ...current,
      escalationContacts: [...(current?.escalationContacts ?? []), { id: generateId(), name: '', email: '' }]
    }));
  };

  const updateEscalationContact = (id, key, value) => {
    setNotificationsForm((current) => ({
      ...current,
      escalationContacts: (current?.escalationContacts ?? []).map((contact) =>
        contact.id === id ? { ...contact, [key]: value } : contact
      )
    }));
  };

  const removeEscalationContact = (id) => {
    setNotificationsForm((current) => ({
      ...current,
      escalationContacts: (current?.escalationContacts ?? []).filter((contact) => contact.id !== id)
    }));
  };

  const updateBillingField = (field, value) => {
    setBillingForm((current) => ({ ...current, [field]: value }));
  };

  const addInvoiceRecipient = () => {
    setBillingForm((current) => ({
      ...current,
      invoiceRecipients: [...(current?.invoiceRecipients ?? []), { id: generateId(), name: '', email: '' }]
    }));
  };

  const updateInvoiceRecipient = (id, key, value) => {
    setBillingForm((current) => ({
      ...current,
      invoiceRecipients: (current?.invoiceRecipients ?? []).map((recipient) =>
        recipient.id === id ? { ...recipient, [key]: value } : recipient
      )
    }));
  };

  const removeInvoiceRecipient = (id) => {
    setBillingForm((current) => ({
      ...current,
      invoiceRecipients: (current?.invoiceRecipients ?? []).filter((recipient) => recipient.id !== id)
    }));
  };

  const hasData = profileForm && securityForm && notificationsForm && billingForm;

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.35em] text-primary/70">{section.eyebrow ?? 'Account settings'}</p>
        <h2 className="text-3xl font-semibold text-primary">{section.title ?? 'Profile settings'}</h2>
        <p className="max-w-3xl text-sm text-slate-600">
          {section.description ?? 'Manage identity, security, notifications, and billing preferences for your Fixnado workspace.'}
        </p>
        <button
          type="button"
          onClick={() => refresh().catch(() => {})}
          className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-4 py-2 text-xs font-semibold text-primary shadow-sm transition hover:border-primary/40"
          disabled={loading}
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="h-5 w-5" aria-hidden="true" />
            <div>
              <p className="font-semibold">We couldn’t load everything</p>
              <p className="text-xs">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!hasData ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-3xl border border-slate-200 bg-white/70">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
              <Spinner className="h-6 w-6 text-primary" />
              Loading profile settings…
            </div>
          ) : (
            <p className="text-sm text-slate-500">No settings available.</p>
          )}
        </div>
      ) : (
        <div className="space-y-12">
          <ProfileSettingsPanel
            form={profileForm}
            onFieldChange={updateProfileField}
            onSubmit={handleProfileSubmit}
            saving={saving.profile}
            status={profileStatus}
            timezoneOptions={timezoneList}
            languageOptions={LANGUAGE_OPTIONS}
          />

          <SecuritySettingsPanel
            form={securityForm}
            onToggle={updateSecurityToggle}
            onAddMethod={addSecurityMethod}
            onRemoveMethod={removeSecurityMethod}
            onSubmit={handleSecuritySubmit}
            saving={saving.security}
            status={securityStatus}
          />

          <NotificationsSettingsPanel
            form={notificationsForm}
            onToggle={updateNotificationToggle}
            onQuietHoursToggle={toggleQuietHours}
            onQuietHoursChange={updateQuietHours}
            onAddContact={addEscalationContact}
            onUpdateContact={updateEscalationContact}
            onRemoveContact={removeEscalationContact}
            onSubmit={handleNotificationsSubmit}
            saving={saving.notifications}
            status={notificationsStatus}
            timezoneOptions={timezoneList}
          />

          <BillingSettingsPanel
            form={billingForm}
            onFieldChange={updateBillingField}
            onAddRecipient={addInvoiceRecipient}
            onUpdateRecipient={updateInvoiceRecipient}
            onRemoveRecipient={removeInvoiceRecipient}
            onSubmit={handleBillingSubmit}
            saving={saving.billing}
            status={billingStatus}
            currencyOptions={CURRENCY_OPTIONS}
          />
        </div>
      )}
    </div>
  );
}

CustomerSettingsSection.propTypes = {
  section: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    eyebrow: PropTypes.string
  }).isRequired
};

export default CustomerSettingsSection;
