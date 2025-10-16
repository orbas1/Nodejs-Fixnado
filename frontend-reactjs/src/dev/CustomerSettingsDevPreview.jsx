import { useMemo, useState } from 'react';
import customerSettingsStub from '../testStubs/customerSettingsStub.js';
import ProfileSettingsPanel from '../components/dashboard/customer-settings/ProfileSettingsPanel.jsx';
import SecuritySettingsPanel from '../components/dashboard/customer-settings/SecuritySettingsPanel.jsx';
import NotificationsSettingsPanel from '../components/dashboard/customer-settings/NotificationsSettingsPanel.jsx';
import BillingSettingsPanel from '../components/dashboard/customer-settings/BillingSettingsPanel.jsx';

const LANGUAGE_OPTIONS = ['en-GB', 'en-US', 'es-MX', 'fr-FR'];
const CURRENCY_OPTIONS = ['GBP', 'USD', 'EUR', 'CAD', 'AUD'];

const buildTimezoneOptions = () => {
  if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
    return Intl.supportedValuesOf('timeZone');
  }
  return ['Europe/London', 'UTC', 'America/New_York', 'America/Los_Angeles'];
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2, 10)}`;
};

const initialData = structuredClone(customerSettingsStub);

export default function CustomerSettingsDevPreview() {
  const timezoneOptions = useMemo(() => buildTimezoneOptions(), []);
  const [profile, setProfile] = useState({
    ...initialData.profile,
    avatarUrl: initialData.profile.avatarUrl ?? ''
  });
  const [security, setSecurity] = useState({
    twoFactorApp: Boolean(initialData.security.twoFactor.app),
    twoFactorEmail: Boolean(initialData.security.twoFactor.email),
    methods: [...(initialData.security.twoFactor.methods ?? [])]
  });
  const [notifications, setNotifications] = useState({
    dispatchEmail: Boolean(initialData.notifications.dispatch.email),
    dispatchSms: Boolean(initialData.notifications.dispatch.sms),
    supportEmail: Boolean(initialData.notifications.support.email),
    supportSms: Boolean(initialData.notifications.support.sms),
    weeklySummaryEmail: Boolean(initialData.notifications.weeklySummary.email),
    conciergeEmail: Boolean(initialData.notifications.concierge.email),
    quietHours: {
      enabled: Boolean(initialData.notifications.quietHours.enabled),
      start: initialData.notifications.quietHours.start ?? '20:00',
      end: initialData.notifications.quietHours.end ?? '07:00',
      timezone: initialData.notifications.quietHours.timezone ?? 'Europe/London'
    },
    escalationContacts: initialData.notifications.escalationContacts.map((contact) => ({
      id: generateId(),
      name: contact.name ?? '',
      email: contact.email ?? ''
    }))
  });
  const [billing, setBilling] = useState({
    preferredCurrency: initialData.billing.preferredCurrency ?? 'GBP',
    defaultPaymentMethod: initialData.billing.defaultPaymentMethod ?? '',
    paymentNotes: initialData.billing.paymentNotes ?? '',
    invoiceRecipients: (initialData.billing.invoiceRecipients ?? []).map((recipient) => ({
      id: generateId(),
      name: recipient.name ?? '',
      email: recipient.email ?? ''
    }))
  });

  const [status, setStatus] = useState({ profile: null, security: null, notifications: null, billing: null });
  const [saving, setSaving] = useState({ profile: false, security: false, notifications: false, billing: false });

  const runFakeSave = async (section) => {
    setSaving((current) => ({ ...current, [section]: true }));
    await new Promise((resolve) => setTimeout(resolve, 400));
    setSaving((current) => ({ ...current, [section]: false }));
    setStatus((current) => ({ ...current, [section]: { type: 'success', message: 'Saved locally (dev preview).' } }));
  };

  const updateProfileField = (field, value) => setProfile((current) => ({ ...current, [field]: value }));
  const updateSecurityToggle = (field, value) => setSecurity((current) => ({ ...current, [field]: value }));
  const addSecurityMethod = (method) =>
    setSecurity((current) => ({
      ...current,
      methods: current.methods.includes(method) ? current.methods : [...current.methods, method]
    }));
  const removeSecurityMethod = (method) =>
    setSecurity((current) => ({ ...current, methods: current.methods.filter((entry) => entry !== method) }));

  const updateNotificationToggle = (field, value) => setNotifications((current) => ({ ...current, [field]: value }));
  const toggleQuietHours = (enabled) =>
    setNotifications((current) => ({ ...current, quietHours: { ...current.quietHours, enabled } }));
  const updateQuietHours = (field, value) =>
    setNotifications((current) => ({ ...current, quietHours: { ...current.quietHours, [field]: value } }));
  const addEscalationContact = () =>
    setNotifications((current) => ({
      ...current,
      escalationContacts: [...current.escalationContacts, { id: generateId(), name: '', email: '' }]
    }));
  const updateEscalationContact = (id, key, value) =>
    setNotifications((current) => ({
      ...current,
      escalationContacts: current.escalationContacts.map((contact) =>
        contact.id === id ? { ...contact, [key]: value } : contact
      )
    }));
  const removeEscalationContact = (id) =>
    setNotifications((current) => ({
      ...current,
      escalationContacts: current.escalationContacts.filter((contact) => contact.id !== id)
    }));

  const updateBillingField = (field, value) => setBilling((current) => ({ ...current, [field]: value }));
  const addInvoiceRecipient = () =>
    setBilling((current) => ({
      ...current,
      invoiceRecipients: [...current.invoiceRecipients, { id: generateId(), name: '', email: '' }]
    }));
  const updateInvoiceRecipient = (id, key, value) =>
    setBilling((current) => ({
      ...current,
      invoiceRecipients: current.invoiceRecipients.map((recipient) =>
        recipient.id === id ? { ...recipient, [key]: value } : recipient
      )
    }));
  const removeInvoiceRecipient = (id) =>
    setBilling((current) => ({
      ...current,
      invoiceRecipients: current.invoiceRecipients.filter((recipient) => recipient.id !== id)
    }));

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-accent">Developer preview</p>
          <h1 className="text-3xl font-semibold text-primary">Customer settings UI preview</h1>
          <p className="text-sm text-slate-600">
            This route renders the modular customer settings panels without hitting the API. Use it in development to confirm
            layout and interaction states.
          </p>
        </header>
        <div className="space-y-12">
          <ProfileSettingsPanel
            form={profile}
            onFieldChange={updateProfileField}
            onSubmit={async (event) => {
              event.preventDefault();
              await runFakeSave('profile');
            }}
            saving={saving.profile}
            status={status.profile}
            timezoneOptions={timezoneOptions}
            languageOptions={LANGUAGE_OPTIONS}
          />
          <SecuritySettingsPanel
            form={security}
            onToggle={updateSecurityToggle}
            onAddMethod={addSecurityMethod}
            onRemoveMethod={removeSecurityMethod}
            onSubmit={async (event) => {
              event.preventDefault();
              await runFakeSave('security');
            }}
            saving={saving.security}
            status={status.security}
          />
          <NotificationsSettingsPanel
            form={notifications}
            onToggle={updateNotificationToggle}
            onQuietHoursToggle={toggleQuietHours}
            onQuietHoursChange={updateQuietHours}
            onAddContact={addEscalationContact}
            onUpdateContact={updateEscalationContact}
            onRemoveContact={removeEscalationContact}
            onSubmit={async (event) => {
              event.preventDefault();
              await runFakeSave('notifications');
            }}
            saving={saving.notifications}
            status={status.notifications}
            timezoneOptions={timezoneOptions}
          />
          <BillingSettingsPanel
            form={billing}
            onFieldChange={updateBillingField}
            onAddRecipient={addInvoiceRecipient}
            onUpdateRecipient={updateInvoiceRecipient}
            onRemoveRecipient={removeInvoiceRecipient}
            onSubmit={async (event) => {
              event.preventDefault();
              await runFakeSave('billing');
            }}
            saving={saving.billing}
            status={status.billing}
            currencyOptions={CURRENCY_OPTIONS}
          />
        </div>
      </div>
    </div>
  );
}
