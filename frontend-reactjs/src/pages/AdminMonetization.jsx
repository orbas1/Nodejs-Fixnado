import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ScaleIcon,
  ShieldCheckIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import PageHeader from '../components/blueprints/PageHeader.jsx';
import { Button, Card, Checkbox, SegmentedControl, Spinner, StatusPill, TextInput } from '../components/ui/index.js';
import { fetchPlatformSettings, persistPlatformSettings } from '../api/platformSettingsClient.js';

const COMMISSION_PERCENT_PRECISION = 100;

function percentFromRate(rate) {
  const numeric = Number.parseFloat(rate ?? 0);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.round(numeric * 100 * COMMISSION_PERCENT_PRECISION) / COMMISSION_PERCENT_PRECISION;
}

function rateFromPercent(percent) {
  const numeric = Number.parseFloat(percent ?? 0);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  const ratio = numeric / 100;
  if (ratio < 0) return 0;
  if (ratio > 1) return 1;
  return Math.round(ratio * COMMISSION_PERCENT_PRECISION) / COMMISSION_PERCENT_PRECISION;
}

function listToText(list) {
  return Array.isArray(list) ? list.join(', ') : '';
}

function textToList(value) {
  if (typeof value !== 'string') {
    return [];
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function normaliseTier(tier) {
  return {
    id: tier?.id ?? '',
    label: tier?.label ?? '',
    description: tier?.description ?? '',
    featuresText: listToText(tier?.features ?? [])
  };
}

function buildFormState(settings) {
  return {
    commissions: {
      enabled: settings.commissions?.enabled !== false,
      baseRatePercent:
        settings.commissions?.baseRate !== undefined
          ? percentFromRate(settings.commissions.baseRate)
          : 2.5,
      customRates: Object.entries(settings.commissions?.customRates ?? {}).map(([key, value]) => ({
        key,
        ratePercent: percentFromRate(value)
      }))
    },
    subscriptions: {
      enabled: settings.subscriptions?.enabled !== false,
      enforceFeatures: settings.subscriptions?.enforceFeatures !== false,
      defaultTier: settings.subscriptions?.defaultTier || 'standard',
      restrictedFeaturesText: listToText(settings.subscriptions?.restrictedFeatures ?? []),
      tiers: (settings.subscriptions?.tiers ?? []).map(normaliseTier)
    },
    integrations: {
      stripe: { ...(settings.integrations?.stripe ?? {}) },
      escrow: { ...(settings.integrations?.escrow ?? {}) },
      smtp: { ...(settings.integrations?.smtp ?? {}) },
      cloudflareR2: { ...(settings.integrations?.cloudflareR2 ?? {}) },
      app: { ...(settings.integrations?.app ?? {}) },
      database: { ...(settings.integrations?.database ?? {}) }
    }
  };
}

function slugify(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function tierOptions(tiers) {
  return tiers.map((tier) => ({ value: tier.id || slugify(tier.label), label: tier.label || tier.id || 'Tier' }));
}

function buildMetaSnapshot(settings) {
  const commissionState = settings.commissions?.enabled === false ? 'Disabled' : 'Enabled';
  const commissionRate = (
    settings.commissions?.baseRate !== undefined
      ? percentFromRate(settings.commissions.baseRate)
      : 2.5
  ).toLocaleString(undefined, {
    maximumFractionDigits: 2
  });
  const subscriptionState = settings.subscriptions?.enabled === false ? 'Subscriptions disabled' : 'Subscriptions active';
  const enforced = settings.subscriptions?.enforceFeatures !== false ? 'Feature gating on' : 'Feature gating off';
  const stripeConfigured = settings.integrations?.stripe?.secretKey ? 'Connected' : 'Pending setup';

  return [
    {
      label: 'Commission status',
      value: `${commissionState} • ${commissionRate}%`,
      caption: 'Applied to new bookings and analytics rollups.'
    },
    {
      label: 'Subscription guardrails',
      value: `${subscriptionState}`,
      caption: enforced
    },
    {
      label: 'Stripe integration',
      value: stripeConfigured,
      caption: settings.integrations?.stripe?.publishableKey ? 'Keys present' : 'Missing publishable key'
    }
  ];
}

export default function AdminMonetization() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState(null);

  const refreshSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loaded = await fetchPlatformSettings();
      setSettings(loaded);
      setForm(buildFormState(loaded));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const meta = useMemo(() => (settings ? buildMetaSnapshot(settings) : []), [settings]);

  const handleCommissionToggle = (event) => {
    setForm((current) => ({
      ...current,
      commissions: { ...current.commissions, enabled: event.target.checked }
    }));
  };

  const handleCommissionRateChange = (event) => {
    setForm((current) => ({
      ...current,
      commissions: { ...current.commissions, baseRatePercent: event.target.value }
    }));
  };

  const handleAddCustomRate = () => {
    setForm((current) => ({
      ...current,
      commissions: {
        ...current.commissions,
        customRates: [...current.commissions.customRates, { key: '', ratePercent: 0 }]
      }
    }));
  };

  const handleCustomRateChange = (index, field, value) => {
    setForm((current) => {
      const nextRates = current.commissions.customRates.map((entry, idx) =>
        idx === index ? { ...entry, [field]: value } : entry
      );
      return {
        ...current,
        commissions: { ...current.commissions, customRates: nextRates }
      };
    });
  };

  const handleRemoveCustomRate = (index) => {
    setForm((current) => ({
      ...current,
      commissions: {
        ...current.commissions,
        customRates: current.commissions.customRates.filter((_, idx) => idx !== index)
      }
    }));
  };

  const handleSubscriptionToggle = (field) => (event) => {
    setForm((current) => ({
      ...current,
      subscriptions: { ...current.subscriptions, [field]: event.target.checked }
    }));
  };

  const handleSubscriptionField = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => ({
      ...current,
      subscriptions: { ...current.subscriptions, [field]: value }
    }));
  };

  const handleTierChange = (index, field, value) => {
    setForm((current) => {
      const nextTiers = current.subscriptions.tiers.map((tier, idx) =>
        idx === index ? { ...tier, [field]: value } : tier
      );
      return {
        ...current,
        subscriptions: { ...current.subscriptions, tiers: nextTiers }
      };
    });
  };

  const handleAddTier = () => {
    setForm((current) => ({
      ...current,
      subscriptions: {
        ...current.subscriptions,
        tiers: [
          ...current.subscriptions.tiers,
          {
            id: '',
            label: '',
            description: '',
            featuresText: ''
          }
        ]
      }
    }));
  };

  const handleRemoveTier = (index) => {
    setForm((current) => ({
      ...current,
      subscriptions: {
        ...current.subscriptions,
        tiers: current.subscriptions.tiers.filter((_, idx) => idx !== index)
      }
    }));
  };

  const handleDefaultTierChange = (value) => {
    setForm((current) => ({
      ...current,
      subscriptions: { ...current.subscriptions, defaultTier: value }
    }));
  };

  const handleIntegrationChange = (section, field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((current) => ({
      ...current,
      integrations: {
        ...current.integrations,
        [section]: {
          ...current.integrations[section],
          [field]: value
        }
      }
    }));
  };

  const resetForm = () => {
    if (settings) {
      setForm(buildFormState(settings));
      setError(null);
      setSuccess(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    const customRates = {};
    for (const entry of form.commissions.customRates) {
      if (!entry.key) continue;
      const rate = rateFromPercent(entry.ratePercent);
      if (!Number.isFinite(rate)) continue;
      customRates[entry.key.trim()] = rate;
    }

    const payload = {
      commissions: {
        enabled: form.commissions.enabled,
        baseRate: rateFromPercent(form.commissions.baseRatePercent),
        customRates
      },
      subscriptions: {
        enabled: form.subscriptions.enabled,
        enforceFeatures: form.subscriptions.enforceFeatures,
        defaultTier: form.subscriptions.defaultTier,
        restrictedFeatures: textToList(form.subscriptions.restrictedFeaturesText),
        tiers: form.subscriptions.tiers
          .map((tier) => ({
            id: tier.id ? slugify(tier.id) : slugify(tier.label),
            label: tier.label,
            description: tier.description,
            features: textToList(tier.featuresText)
          }))
          .filter((tier) => tier.id && tier.label)
      },
      integrations: {
        stripe: form.integrations.stripe,
        escrow: form.integrations.escrow,
        smtp: {
          ...form.integrations.smtp,
          port: form.integrations.smtp?.port,
          secure: form.integrations.smtp?.secure
        },
        cloudflareR2: form.integrations.cloudflareR2,
        app: form.integrations.app,
        database: {
          ...form.integrations.database,
          port: form.integrations.database?.port,
          ssl: form.integrations.database?.ssl
        }
      }
    };

    try {
      const updated = await persistPlatformSettings(payload);
      setSettings(updated);
      setForm(buildFormState(updated));
      setSuccess('Monetisation controls updated successfully.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to save platform settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50" data-qa-page="admin-monetization">
        <Spinner className="h-10 w-10 text-primary" />
      </div>
    );
  }

  const tierChoices = tierOptions(form.subscriptions.tiers);

  return (
    <div className="min-h-screen bg-slate-50 pb-24" data-qa-page="admin-monetization">
      <PageHeader
        eyebrow="Revenue operations"
        title="Monetisation controls"
        description="Govern cross-marketplace commissions, provider payout guardrails, and integration credentials from a single command surface."
        breadcrumbs={[
          { label: 'Operations', to: '/' },
          { label: 'Admin dashboard', to: '/admin/dashboard' },
          { label: 'Monetisation controls' }
        ]}
        actions={[
          {
            label: 'Refresh snapshot',
            variant: 'secondary',
            icon: ArrowPathIcon,
            onClick: () => refreshSettings(),
            disabled: loading,
            analyticsId: 'refresh-platform-settings'
          }
        ]}
        meta={meta}
      />

      <form className="mx-auto max-w-7xl space-y-10 px-6 pt-16" onSubmit={handleSubmit}>
        <div className="space-y-4">
          {error ? (
            <StatusPill tone="danger" icon={ExclamationTriangleIcon}>
              {error}
            </StatusPill>
          ) : null}
          {success ? (
            <StatusPill tone="success" icon={CheckCircleIcon}>
              {success}
            </StatusPill>
          ) : null}
        </div>

        <Card padding="lg" className="space-y-8 border-slate-200 bg-white/90 shadow-lg shadow-primary/5">
          <header className="space-y-2">
            <h2 className="text-2xl font-semibold text-primary">Commission management</h2>
            <p className="text-sm text-slate-600">
              Define cross-marketplace commission earnings from escrow transactions and staged releases.
            </p>
          </header>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Checkbox
              label="Enable commissions"
              checked={form.commissions.enabled}
              onChange={handleCommissionToggle}
              description="Disable to waive platform earnings across all transactions."
            />

            <TextInput
              label="Default commission rate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              suffix="%"
              value={form.commissions.baseRatePercent}
              onChange={handleCommissionRateChange}
              placeholder="2.5"
              hint="Applies when no demand-specific override is matched. Default platform share is 2.5%."
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-primary">Custom rate overrides</p>
                <p className="text-xs text-slate-500">
                  Provide keys like <code>scheduled:high</code> or <code>on_demand</code>. Empty entries are ignored.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={PlusIcon}
                onClick={handleAddCustomRate}
              >
                Add override
              </Button>
            </div>
            <div className="space-y-3">
              {form.commissions.customRates.length === 0 ? (
                <p className="text-xs text-slate-500">No custom rates configured.</p>
              ) : (
                form.commissions.customRates.map((entry, index) => (
                  <div
                    key={`custom-rate-${index}`}
                    className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,160px)_auto]"
                  >
                    <TextInput
                      label="Key"
                      value={entry.key}
                      onChange={(event) => handleCustomRateChange(index, 'key', event.target.value)}
                      hint="Matches booking type and demand e.g. scheduled:high"
                    />
                    <TextInput
                      label="Rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      suffix="%"
                      value={entry.ratePercent}
                      onChange={(event) => handleCustomRateChange(index, 'ratePercent', event.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={TrashIcon}
                      onClick={() => handleRemoveCustomRate(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-primary/10 bg-primary/5 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Platform policy highlights
            </h3>
            <ul className="space-y-3 text-sm text-primary">
              <li className="flex items-start gap-3">
                <ShieldCheckIcon aria-hidden="true" className="mt-0.5 h-5 w-5" />
                <div>
                  Default owner commission is fixed at <strong>2.5%</strong> of every booking unless you explicitly override the rate for specific demand bands.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <BanknotesIcon aria-hidden="true" className="mt-0.5 h-5 w-5" />
                <div>
                  Providers retain full control over how much they pay their servicemen. The platform only records ledger references and does not intermediate crew wages.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <ScaleIcon aria-hidden="true" className="mt-0.5 h-5 w-5" />
                <div>
                  Wallet and ledger operations operate as pass-through accounting so Fixnado is not holding client funds—keeping us outside FCA regulated activities and aligned with Apple App Store rules that exempt real-world services from in-app purchase flows.
                </div>
              </li>
            </ul>
          </div>
        </Card>

        <Card padding="lg" className="space-y-8 border-slate-200 bg-white/90 shadow-lg shadow-primary/5">
          <header className="space-y-2">
            <h2 className="text-2xl font-semibold text-primary">Subscription governance</h2>
            <p className="text-sm text-slate-600">
              Configure subscription tiers and feature gating to regulate marketplace capabilities.
            </p>
          </header>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Checkbox
              label="Enable subscriptions"
              checked={form.subscriptions.enabled}
              onChange={handleSubscriptionToggle('enabled')}
              description="Disable to grant all features regardless of tier."
            />
            <Checkbox
              label="Enforce feature gating"
              checked={form.subscriptions.enforceFeatures}
              onChange={handleSubscriptionToggle('enforceFeatures')}
              description="When off, tiers remain visible but restrictions are not applied."
            />
          </div>

          <TextInput
            label="Restricted features"
            value={form.subscriptions.restrictedFeaturesText}
            onChange={handleSubscriptionField('restrictedFeaturesText')}
            hint="Comma separated feature flags that require an active subscription."
          />

          <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-primary">Subscription tiers</p>
                <p className="text-xs text-slate-500">
                  Provide at least one tier. Default tier is assigned to new providers.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <SegmentedControl
                  name="Default subscription tier"
                  value={form.subscriptions.defaultTier}
                  onChange={handleDefaultTierChange}
                  options={tierChoices.length > 0 ? tierChoices : [{ value: form.subscriptions.defaultTier || 'standard', label: form.subscriptions.defaultTier || 'Standard' }]}
                  size="sm"
                />
                <Button type="button" variant="secondary" size="sm" icon={PlusIcon} onClick={handleAddTier}>
                  Add tier
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {form.subscriptions.tiers.length === 0 ? (
                <p className="text-xs text-slate-500">No tiers configured. Add at least one tier to enable gating.</p>
              ) : (
                form.subscriptions.tiers.map((tier, index) => (
                  <div key={`tier-${index}`} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <TextInput
                        label="Tier ID"
                        value={tier.id}
                        onChange={(event) => handleTierChange(index, 'id', event.target.value)}
                        hint="Used for API checks and analytics labelling."
                      />
                      <TextInput
                        label="Display name"
                        value={tier.label}
                        onChange={(event) => handleTierChange(index, 'label', event.target.value)}
                      />
                    </div>
                    <TextInput
                      label="Description"
                      value={tier.description}
                      onChange={(event) => handleTierChange(index, 'description', event.target.value)}
                      optionalLabel="optional"
                    />
                    <TextInput
                      label="Features"
                      value={tier.featuresText}
                      onChange={(event) => handleTierChange(index, 'featuresText', event.target.value)}
                      hint="Comma separated feature flags unlocked by this tier."
                    />
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        icon={TrashIcon}
                        onClick={() => handleRemoveTier(index)}
                      >
                        Remove tier
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>

        <Card padding="lg" className="space-y-8 border-slate-200 bg-white/90 shadow-lg shadow-primary/5">
          <header className="space-y-2">
            <h2 className="text-2xl font-semibold text-primary">Integration credentials</h2>
            <p className="text-sm text-slate-600">
              Centralise billing, escrow, email, and storage secrets. Values are stored securely server-side.
            </p>
          </header>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Stripe</h3>
              <TextInput
                label="Publishable key"
                value={form.integrations.stripe.publishableKey || ''}
                onChange={handleIntegrationChange('stripe', 'publishableKey')}
              />
              <TextInput
                label="Secret key"
                type="password"
                value={form.integrations.stripe.secretKey || ''}
                onChange={handleIntegrationChange('stripe', 'secretKey')}
              />
              <TextInput
                label="Webhook secret"
                type="password"
                value={form.integrations.stripe.webhookSecret || ''}
                onChange={handleIntegrationChange('stripe', 'webhookSecret')}
              />
              <TextInput
                label="Account ID"
                value={form.integrations.stripe.accountId || ''}
                onChange={handleIntegrationChange('stripe', 'accountId')}
              />
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Escrow.com</h3>
              <TextInput
                label="API key"
                value={form.integrations.escrow.apiKey || ''}
                onChange={handleIntegrationChange('escrow', 'apiKey')}
              />
              <TextInput
                label="API secret"
                type="password"
                value={form.integrations.escrow.apiSecret || ''}
                onChange={handleIntegrationChange('escrow', 'apiSecret')}
              />
              <TextInput
                label="Environment"
                value={form.integrations.escrow.environment || ''}
                onChange={handleIntegrationChange('escrow', 'environment')}
                hint="Use sandbox for testing or production when ready to transact."
              />
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">SMTP</h3>
              <TextInput
                label="Host"
                value={form.integrations.smtp.host || ''}
                onChange={handleIntegrationChange('smtp', 'host')}
              />
              <TextInput
                label="Port"
                type="number"
                value={form.integrations.smtp.port ?? ''}
                onChange={handleIntegrationChange('smtp', 'port')}
              />
              <TextInput
                label="Username"
                value={form.integrations.smtp.username || ''}
                onChange={handleIntegrationChange('smtp', 'username')}
              />
              <TextInput
                label="Password"
                type="password"
                value={form.integrations.smtp.password || ''}
                onChange={handleIntegrationChange('smtp', 'password')}
              />
              <TextInput
                label="From email"
                value={form.integrations.smtp.fromEmail || ''}
                onChange={handleIntegrationChange('smtp', 'fromEmail')}
              />
              <Checkbox
                label="Use secure connection (TLS)"
                checked={Boolean(form.integrations.smtp.secure)}
                onChange={handleIntegrationChange('smtp', 'secure')}
              />
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Cloudflare R2</h3>
              <TextInput
                label="Account ID"
                value={form.integrations.cloudflareR2.accountId || ''}
                onChange={handleIntegrationChange('cloudflareR2', 'accountId')}
              />
              <TextInput
                label="Access key ID"
                value={form.integrations.cloudflareR2.accessKeyId || ''}
                onChange={handleIntegrationChange('cloudflareR2', 'accessKeyId')}
              />
              <TextInput
                label="Secret access key"
                type="password"
                value={form.integrations.cloudflareR2.secretAccessKey || ''}
                onChange={handleIntegrationChange('cloudflareR2', 'secretAccessKey')}
              />
              <TextInput
                label="Bucket name"
                value={form.integrations.cloudflareR2.bucket || ''}
                onChange={handleIntegrationChange('cloudflareR2', 'bucket')}
              />
              <TextInput
                label="Public URL"
                value={form.integrations.cloudflareR2.publicUrl || ''}
                onChange={handleIntegrationChange('cloudflareR2', 'publicUrl')}
              />
              <TextInput
                label="Endpoint"
                value={form.integrations.cloudflareR2.endpoint || ''}
                onChange={handleIntegrationChange('cloudflareR2', 'endpoint')}
              />
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">App shell</h3>
              <TextInput
                label="Application name"
                value={form.integrations.app.name || ''}
                onChange={handleIntegrationChange('app', 'name')}
              />
              <TextInput
                label="Primary URL"
                value={form.integrations.app.url || ''}
                onChange={handleIntegrationChange('app', 'url')}
              />
              <TextInput
                label="Support email"
                value={form.integrations.app.supportEmail || ''}
                onChange={handleIntegrationChange('app', 'supportEmail')}
              />
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Database credentials</h3>
              <TextInput
                label="Host"
                value={form.integrations.database.host || ''}
                onChange={handleIntegrationChange('database', 'host')}
              />
              <TextInput
                label="Port"
                type="number"
                value={form.integrations.database.port ?? ''}
                onChange={handleIntegrationChange('database', 'port')}
              />
              <TextInput
                label="Database name"
                value={form.integrations.database.name || ''}
                onChange={handleIntegrationChange('database', 'name')}
              />
              <TextInput
                label="User"
                value={form.integrations.database.user || ''}
                onChange={handleIntegrationChange('database', 'user')}
              />
              <TextInput
                label="Password"
                type="password"
                value={form.integrations.database.password || ''}
                onChange={handleIntegrationChange('database', 'password')}
              />
              <Checkbox
                label="Require SSL"
                checked={Boolean(form.integrations.database.ssl)}
                onChange={handleIntegrationChange('database', 'ssl')}
              />
            </div>
          </div>
        </Card>

        <div className="flex flex-col items-stretch justify-end gap-3 sm:flex-row">
          <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
            Reset changes
          </Button>
          <Button type="submit" loading={saving} iconPosition="end">
            Save monetisation controls
          </Button>
        </div>
      </form>
    </div>
  );
}
