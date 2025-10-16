import AdminMonetizationWorkspace from '../features/affiliateMonetization/AdminMonetizationWorkspace.jsx';

export default function AdminMonetization() {
  return <AdminMonetizationWorkspace />;
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import PageHeader from '../components/blueprints/PageHeader.jsx';
import { Button, Spinner, StatusPill } from '../components/ui/index.js';
import { fetchPlatformSettings, persistPlatformSettings } from '../api/platformSettingsClient.js';
import {
  CommissionSettingsPanel,
  SubscriptionSettingsPanel,
  IntegrationSettingsPanel,
  CommissionStructureModal,
  SubscriptionPackageModal,
  buildFormState,
  buildMetaSnapshot,
  packageOptions,
  deriveStructureId,
  derivePackageId,
  rateFromPercent,
  ensureCurrency,
  textToList,
  describeStructureRate,
  describeBillingSummary,
  EMPTY_STRUCTURE,
  EMPTY_PACKAGE
} from '../features/monetisation/index.js';

export default function AdminMonetization() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState(null);
  const [structureEditor, setStructureEditor] = useState({ open: false, index: null, value: EMPTY_STRUCTURE });
  const [packageEditor, setPackageEditor] = useState({ open: false, index: null, value: EMPTY_PACKAGE });

  const refreshSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loaded = await fetchPlatformSettings();
      setSettings(loaded);
      setForm(buildFormState(loaded));
      setStructureEditor({ open: false, index: null, value: EMPTY_STRUCTURE });
      setPackageEditor({ open: false, index: null, value: EMPTY_PACKAGE });
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

  const handleOpenStructureEditor = (index = null) => {
    if (!form) return;
    const base =
      index !== null && index >= 0
        ? form.commissions.structures[index]
        : { ...EMPTY_STRUCTURE, ratePercent: form.commissions.baseRatePercent };
    setStructureEditor({ open: true, index, value: { ...base } });
  };

  const handleStructureModalClose = () => {
    setStructureEditor({ open: false, index: null, value: EMPTY_STRUCTURE });
  };

  const handleStructureSave = (draft, index) => {
    setForm((current) => {
      const nextStructures = [...current.commissions.structures];
      const sanitized = {
        ...EMPTY_STRUCTURE,
        ...draft,
        id: draft.id ?? '',
        name: draft.name ?? '',
        description: draft.description ?? '',
        rateType: draft.rateType === 'flat' ? 'flat' : 'percentage',
        ratePercent: Number.parseFloat(draft.ratePercent ?? 0) || 0,
        flatAmount: Number.parseFloat(draft.flatAmount ?? 0) || 0,
        currency: ensureCurrency(draft.currency ?? 'GBP', 'GBP'),
        appliesToText: draft.appliesToText ?? '',
        payoutDelayDays: Number.parseInt(draft.payoutDelayDays ?? 0, 10) || 0,
        minBookingValue: draft.minBookingValue ?? '',
        maxBookingValue: draft.maxBookingValue ?? '',
        active: draft.active !== false,
        imageUrl: draft.imageUrl ?? ''
      };
      if (typeof index === 'number' && index >= 0 && index < nextStructures.length) {
        nextStructures[index] = sanitized;
      } else {
        nextStructures.push(sanitized);
      }
      return {
        ...current,
        commissions: { ...current.commissions, structures: nextStructures }
      };
    });
    handleStructureModalClose();
  };

  const handleStructureRemove = (index) => {
    setForm((current) => ({
      ...current,
      commissions: {
        ...current.commissions,
        structures: current.commissions.structures.filter((_, idx) => idx !== index)
      }
    }));
  };

  const handleOpenPackageEditor = (index = null) => {
    if (!form) return;
    const base =
      index !== null && index >= 0
        ? form.subscriptions.packages[index]
        : { ...EMPTY_PACKAGE, priceCurrency: form.subscriptions.packages[0]?.priceCurrency ?? 'GBP' };
    setPackageEditor({ open: true, index, value: { ...base } });
  };

  const handlePackageModalClose = () => {
    setPackageEditor({ open: false, index: null, value: EMPTY_PACKAGE });
  };

  const handlePackageSave = (draft, index) => {
    setForm((current) => {
      const nextPackages = [...current.subscriptions.packages];
      const interval = (draft.billingInterval || '').toLowerCase();
      const sanitized = {
        ...EMPTY_PACKAGE,
        ...draft,
        id: draft.id ?? '',
        label: draft.label ?? '',
        description: draft.description ?? '',
        priceAmount: Number.parseFloat(draft.priceAmount ?? 0) || 0,
        priceCurrency: ensureCurrency(draft.priceCurrency ?? 'GBP', 'GBP'),
        billingInterval: ['week', 'month', 'year'].includes(interval) ? interval : 'month',
        billingFrequency: Number.parseInt(draft.billingFrequency ?? 1, 10) || 1,
        trialDays: Number.parseInt(draft.trialDays ?? 0, 10) || 0,
        badge: draft.badge ?? '',
        imageUrl: draft.imageUrl ?? '',
        featuresText: draft.featuresText ?? '',
        roleAccessText: draft.roleAccessText ?? '',
        highlight: draft.highlight === true,
        supportUrl: draft.supportUrl ?? ''
      };
      if (typeof index === 'number' && index >= 0 && index < nextPackages.length) {
        nextPackages[index] = sanitized;
      } else {
        nextPackages.push(sanitized);
      }

      let nextDefault = current.subscriptions.defaultTier;
      if (!nextPackages.some((pkg) => derivePackageId(pkg) === nextDefault)) {
        nextDefault = derivePackageId(nextPackages[0]) || '';
      }

      return {
        ...current,
        subscriptions: {
          ...current.subscriptions,
          packages: nextPackages,
          defaultTier: nextPackages.length > 0 ? nextDefault : ''
        }
      };
    });
    handlePackageModalClose();
  };

  const handlePackageRemove = (index) => {
    setForm((current) => {
      const nextPackages = current.subscriptions.packages.filter((_, idx) => idx !== index);
      let nextDefault = current.subscriptions.defaultTier;
      if (!nextPackages.some((pkg) => derivePackageId(pkg) === nextDefault)) {
        nextDefault = derivePackageId(nextPackages[0]) || '';
      }
      return {
        ...current,
        subscriptions: {
          ...current.subscriptions,
          packages: nextPackages,
          defaultTier: nextPackages.length > 0 ? nextDefault : ''
        }
      };
    });
  };

  const handleMovePackage = (index, direction) => {
    setForm((current) => {
      const nextPackages = [...current.subscriptions.packages];
      const target = index + direction;
      if (target < 0 || target >= nextPackages.length) {
        return current;
      }
      [nextPackages[index], nextPackages[target]] = [nextPackages[target], nextPackages[index]];
      return {
        ...current,
        subscriptions: { ...current.subscriptions, packages: nextPackages }
      };
    });
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

    const structures = form.commissions.structures
      .map((structure) => {
        const id = deriveStructureId(structure);
        if (!id || !structure.name) {
          return null;
        }
        const minValue = Number.parseFloat(structure.minBookingValue);
        const maxValue = Number.parseFloat(structure.maxBookingValue);
        const minBookingValue = Number.isFinite(minValue) && minValue >= 0 ? Number(minValue.toFixed(2)) : 0;
        const maxBookingValue =
          Number.isFinite(maxValue) && maxValue >= minBookingValue ? Number(maxValue.toFixed(2)) : null;

        return {
          id,
          name: structure.name,
          description: structure.description,
          rateType: structure.rateType === 'flat' ? 'flat' : 'percentage',
          rateValue:
            structure.rateType === 'flat'
              ? Number.parseFloat(structure.flatAmount ?? 0) || 0
              : rateFromPercent(structure.ratePercent),
          currency: ensureCurrency(structure.currency ?? 'GBP', 'GBP'),
          appliesTo: textToList(structure.appliesToText),
          payoutDelayDays: Number.parseInt(structure.payoutDelayDays ?? 0, 10) || 0,
          minBookingValue,
          maxBookingValue,
          active: structure.active !== false,
          imageUrl: structure.imageUrl || ''
        };
      })
      .filter(Boolean);

    const packages = form.subscriptions.packages
      .map((pkg) => {
        const id = derivePackageId(pkg);
        if (!id || !pkg.label) {
          return null;
        }
        const priceAmount = Number.parseFloat(pkg.priceAmount ?? 0) || 0;
        const billingFrequency = Number.parseInt(pkg.billingFrequency ?? 1, 10) || 1;
        const trialDays = Number.parseInt(pkg.trialDays ?? 0, 10) || 0;
        const interval = (pkg.billingInterval || 'month').toLowerCase();

        return {
          id,
          label: pkg.label,
          description: pkg.description,
          features: textToList(pkg.featuresText),
          price: {
            amount: Number(priceAmount.toFixed(2)),
            currency: ensureCurrency(pkg.priceCurrency ?? 'GBP', 'GBP')
          },
          billingInterval: ['week', 'month', 'year'].includes(interval) ? interval : 'month',
          billingFrequency,
          trialDays,
          badge: pkg.badge ?? '',
          imageUrl: pkg.imageUrl ?? '',
          roleAccess: textToList(pkg.roleAccessText),
          highlight: pkg.highlight === true,
          supportUrl: pkg.supportUrl ?? ''
        };
      })
      .filter(Boolean);

    const payload = {
      commissions: {
        enabled: form.commissions.enabled,
        baseRate: rateFromPercent(form.commissions.baseRatePercent),
        customRates,
        structures
      },
      subscriptions: {
        enabled: form.subscriptions.enabled,
        enforceFeatures: form.subscriptions.enforceFeatures,
        defaultTier: form.subscriptions.defaultTier,
        restrictedFeatures: textToList(form.subscriptions.restrictedFeaturesText),
        tiers: packages
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

  const packageChoices = packageOptions(form.subscriptions.packages);

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

        <CommissionSettingsPanel
          form={form.commissions}
          onToggle={handleCommissionToggle}
          onRateChange={handleCommissionRateChange}
          onOpenStructureEditor={handleOpenStructureEditor}
          onStructureRemove={handleStructureRemove}
          onAddCustomRate={handleAddCustomRate}
          onCustomRateChange={handleCustomRateChange}
          onRemoveCustomRate={handleRemoveCustomRate}
          describeStructureRate={describeStructureRate}
          deriveStructureId={deriveStructureId}
        />

        <SubscriptionSettingsPanel
          form={form.subscriptions}
          packageChoices={packageChoices}
          onToggle={handleSubscriptionToggle}
          onFieldChange={handleSubscriptionField}
          onDefaultTierChange={handleDefaultTierChange}
          onOpenPackageEditor={handleOpenPackageEditor}
          onMovePackage={handleMovePackage}
          onRemovePackage={handlePackageRemove}
          describeBillingSummary={describeBillingSummary}
          derivePackageId={derivePackageId}
        />

        <IntegrationSettingsPanel form={form.integrations} onIntegrationChange={handleIntegrationChange} />

        <div className="flex flex-col items-stretch justify-end gap-3 sm:flex-row">
          <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
            Reset changes
          </Button>
          <Button type="submit" loading={saving} iconPosition="end">
            Save monetisation controls
          </Button>
        </div>
      </form>

      <CommissionStructureModal
        open={structureEditor.open}
        initialValue={structureEditor.value}
        baseRatePercent={form.commissions.baseRatePercent}
        onClose={handleStructureModalClose}
        onSubmit={(draft) => handleStructureSave(draft, structureEditor.index)}
        onDelete={
          structureEditor.index !== null
            ? () => {
                handleStructureRemove(structureEditor.index);
                handleStructureModalClose();
              }
            : undefined
        }
      />
      <SubscriptionPackageModal
        open={packageEditor.open}
        initialValue={packageEditor.value}
        onClose={handlePackageModalClose}
        onSubmit={(draft) => handlePackageSave(draft, packageEditor.index)}
        onDelete={
          packageEditor.index !== null
            ? () => {
                handlePackageRemove(packageEditor.index);
                handlePackageModalClose();
              }
            : undefined
        }
      />
    </div>
  );
}
