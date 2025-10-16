import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import PageHeader from '../../components/blueprints/PageHeader.jsx';
import { Button, Spinner, StatusPill } from '../../components/ui/index.js';
import { fetchPlatformSettings, persistPlatformSettings } from '../../api/platformSettingsClient.js';
import {
  deactivateAffiliateRule,
  getAdminAffiliateSettings,
  saveAdminAffiliateSettings,
  upsertAffiliateRule,
  listAdminAffiliateProfiles,
  createAdminAffiliateProfile,
  updateAdminAffiliateProfile,
  listAdminAffiliateLedgerEntries,
  createAdminAffiliateLedgerEntry,
  listAdminAffiliateReferrals,
  createAdminAffiliateReferral,
  updateAdminAffiliateReferral
} from '../../api/affiliateClient.js';
import {
  buildAffiliateFormState,
  buildAffiliateMetaSnapshot,
  buildPlatformFormState,
  buildRuleDraft,
  buildMetaSnapshot,
  multilineTextToList,
  rateFromPercent,
  slugify,
  textToList,
  tierOptions
} from './utils.js';
import CommissionManagementCard from './components/CommissionManagementCard.jsx';
import SubscriptionGovernanceCard from './components/SubscriptionGovernanceCard.jsx';
import IntegrationCredentialsCard from './components/IntegrationCredentialsCard.jsx';
import AffiliateProgrammeDesigner from './components/AffiliateProgrammeDesigner.jsx';
import AffiliateRulesManager from './components/AffiliateRulesManager.jsx';
import AffiliateRosterCard from './components/AffiliateRosterCard.jsx';
import AffiliateLedgerManager from './components/AffiliateLedgerManager.jsx';
import AffiliateReferralManager from './components/AffiliateReferralManager.jsx';

const RESOURCE_TYPE_OPTIONS = [
  { value: 'link', label: 'Link' },
  { value: 'guide', label: 'Guide' },
  { value: 'video', label: 'Video' },
  { value: 'document', label: 'Document' }
];

const ASSET_TYPE_OPTIONS = [
  { value: 'image', label: 'Image' },
  { value: 'logo', label: 'Logo' },
  { value: 'banner', label: 'Banner' },
  { value: 'video', label: 'Video' },
  { value: 'document', label: 'Document' }
];

const RULE_RECURRENCE_OPTIONS = [
  { value: 'one_time', label: 'First conversion' },
  { value: 'finite', label: 'Finite' },
  { value: 'infinite', label: 'Always' }
];

export default function AdminMonetizationWorkspace() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState(null);
  const [affiliateLoading, setAffiliateLoading] = useState(true);
  const [affiliateSaving, setAffiliateSaving] = useState(false);
  const [affiliateError, setAffiliateError] = useState(null);
  const [affiliateSuccess, setAffiliateSuccess] = useState(null);
  const [affiliateSettings, setAffiliateSettings] = useState(null);
  const [affiliateForm, setAffiliateForm] = useState(null);
  const [affiliateRules, setAffiliateRules] = useState([]);
  const [affiliatePerformance, setAffiliatePerformance] = useState([]);
  const [ruleDraft, setRuleDraft] = useState(() => buildRuleDraft());
  const [ruleEditorOpen, setRuleEditorOpen] = useState(false);
  const [ruleSaving, setRuleSaving] = useState(false);
  const [ruleError, setRuleError] = useState(null);
  const [ruleSuccess, setRuleSuccess] = useState(null);
  const [rosterFilters, setRosterFilters] = useState({ status: 'all', search: '' });
  const [rosterMeta, setRosterMeta] = useState({ page: 1, pageSize: 10, total: 0, pageCount: 0 });
  const [rosterData, setRosterData] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [rosterError, setRosterError] = useState(null);
  const [rosterCreationError, setRosterCreationError] = useState(null);
  const [createAffiliateForm, setCreateAffiliateForm] = useState({
    userId: '',
    referralCode: '',
    tierLabel: '',
    status: 'active'
  });
  const [creatingAffiliate, setCreatingAffiliate] = useState(false);
  const [rosterRefreshToken, setRosterRefreshToken] = useState(0);
  const [updatingProfileIds, setUpdatingProfileIds] = useState(() => new Set());
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [ledgerMeta, setLedgerMeta] = useState({ page: 1, pageSize: 25, total: 0, pageCount: 0 });
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerError, setLedgerError] = useState(null);
  const [ledgerForm, setLedgerForm] = useState({
    transactionAmount: '',
    commissionAmount: '',
    currency: 'USD',
    occurrenceIndex: 1,
    status: 'approved',
    recognizedAt: '',
    memo: '',
    transactionId: ''
  });
  const [ledgerSaving, setLedgerSaving] = useState(false);
  const [ledgerRefreshToken, setLedgerRefreshToken] = useState(0);
  const [referralFilters, setReferralFilters] = useState({ status: 'all', search: '' });
  const [referralMeta, setReferralMeta] = useState({ page: 1, pageSize: 10, total: 0, pageCount: 0 });
  const [referralData, setReferralData] = useState([]);
  const [referralLoading, setReferralLoading] = useState(true);
  const [referralError, setReferralError] = useState(null);
  const [referralCreationError, setReferralCreationError] = useState(null);
  const [createReferralForm, setCreateReferralForm] = useState({
    affiliateProfileId: '',
    referralCodeUsed: '',
    referredUserId: '',
    status: 'pending',
    conversionsCount: '',
    totalRevenue: '',
    totalCommissionEarned: '',
    lastConversionAt: '',
    memo: ''
  });
  const [creatingReferral, setCreatingReferral] = useState(false);
  const [referralRefreshToken, setReferralRefreshToken] = useState(0);
  const [updatingReferralIds, setUpdatingReferralIds] = useState(() => new Set());

  const refreshSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loaded = await fetchPlatformSettings();
      setSettings(loaded);
      setForm(buildPlatformFormState(loaded));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const refreshAffiliate = useCallback(
    async ({ signal, forceRefresh = false } = {}) => {
      setAffiliateLoading(true);
      setAffiliateError(null);
      setAffiliateSuccess(null);
      try {
        const payload = await getAdminAffiliateSettings({ signal, forceRefresh });
        if (signal?.aborted) {
          return;
        }
        setAffiliateSettings(payload.settings);
        setAffiliateForm(buildAffiliateFormState(payload.settings));
        setAffiliateRules(payload.rules ?? []);
        setAffiliatePerformance(payload.performance ?? []);
      } catch (caught) {
        if (signal?.aborted) {
          return;
        }
        setAffiliateError(
          caught instanceof Error ? caught.message : 'Failed to load affiliate configuration'
        );
        setAffiliateSettings(null);
        setAffiliateForm(buildAffiliateFormState());
        setAffiliateRules([]);
        setAffiliatePerformance([]);
      } finally {
        if (!signal?.aborted) {
          setAffiliateLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    refreshAffiliate({ signal: controller.signal });
    return () => controller.abort();
  }, [refreshAffiliate]);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setRosterLoading(true);
      setRosterError(null);
      try {
        const response = await listAdminAffiliateProfiles({
          page: rosterMeta.page,
          status: rosterFilters.status === 'all' ? undefined : rosterFilters.status,
          search: rosterFilters.search,
          signal: controller.signal,
          forceRefresh: rosterRefreshToken > 0
        });
        const data = response?.data ?? [];
        const meta = response?.meta ?? {};
        setRosterData(data);
        setSelectedProfile((current) => {
          if (!current) return current;
          const updated = data.find((profile) => profile.id === current.id);
          return updated ? { ...current, ...updated } : current;
        });
        setRosterMeta((current) => {
          const pageSize = meta.pageSize ?? current.pageSize ?? 10;
          const total = meta.total ?? data.length;
          const page = meta.page ?? current.page ?? 1;
          const pageCount = meta.pageCount ?? (pageSize ? Math.max(Math.ceil(total / pageSize), 1) : 1);
          return { page, pageSize, total, pageCount };
        });
      } catch (caught) {
        if (controller.signal.aborted) return;
        const message = caught instanceof Error ? caught.message : 'Failed to load affiliate profiles';
        setRosterError(message);
        setRosterData([]);
        setRosterMeta((current) => ({ ...current, total: 0, pageCount: 0 }));
      } finally {
        if (!controller.signal.aborted) {
          setRosterLoading(false);
        }
      }
    })();
    return () => controller.abort();
  }, [rosterFilters, rosterMeta.page, rosterRefreshToken]);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setReferralLoading(true);
      setReferralError(null);
      try {
        const response = await listAdminAffiliateReferrals({
          status: referralFilters.status === 'all' ? undefined : referralFilters.status,
          search: referralFilters.search,
          page: referralMeta.page,
          pageSize: referralMeta.pageSize,
          signal: controller.signal,
          forceRefresh: referralRefreshToken > 0
        });
        const data = response?.data ?? [];
        const meta = response?.meta ?? {};
        setReferralData(data);
        setReferralMeta((current) => {
          const pageSize = meta.pageSize ?? current.pageSize ?? 10;
          const total = meta.total ?? data.length;
          const page = meta.page ?? current.page ?? 1;
          const pageCount = meta.pageCount ?? (pageSize ? Math.max(Math.ceil(total / pageSize), 1) : 1);
          return { page, pageSize, total, pageCount };
        });
      } catch (caught) {
        if (controller.signal.aborted) return;
        const message = caught instanceof Error ? caught.message : 'Failed to load referrals';
        setReferralError(message);
        setReferralData([]);
        setReferralMeta((current) => ({ ...current, total: 0, pageCount: 0 }));
      } finally {
        if (!controller.signal.aborted) {
          setReferralLoading(false);
        }
      }
    })();
    return () => controller.abort();
  }, [referralFilters, referralMeta.page, referralMeta.pageSize, referralRefreshToken]);

  useEffect(() => {
    if (!selectedProfile) {
      return;
    }
    const controller = new AbortController();
    (async () => {
      setLedgerLoading(true);
      setLedgerError(null);
      try {
        const response = await listAdminAffiliateLedgerEntries(selectedProfile.id, {
          page: ledgerMeta.page,
          signal: controller.signal,
          forceRefresh: ledgerRefreshToken > 0
        });
        const data = response?.data ?? [];
        const meta = response?.meta ?? {};
        setLedgerEntries(data);
        setLedgerMeta((current) => {
          const pageSize = meta.pageSize ?? current.pageSize ?? 25;
          const total = meta.total ?? data.length;
          const page = meta.page ?? current.page ?? 1;
          const pageCount = meta.pageCount ?? (pageSize ? Math.max(Math.ceil(total / pageSize), 1) : 1);
          return { page, pageSize, total, pageCount };
        });
      } catch (caught) {
        if (controller.signal.aborted) return;
        const message = caught instanceof Error ? caught.message : 'Failed to load ledger entries';
        setLedgerError(message);
        setLedgerEntries([]);
      } finally {
        if (!controller.signal.aborted) {
          setLedgerLoading(false);
        }
      }
    })();
    return () => controller.abort();
  }, [selectedProfile, ledgerMeta.page, ledgerRefreshToken]);

  useEffect(() => {
    if (!selectedProfile) {
      return;
    }
    setCreateReferralForm((current) => {
      if (current.affiliateProfileId) {
        return current;
      }
      return {
        ...current,
        affiliateProfileId: selectedProfile.id,
        referralCodeUsed: current.referralCodeUsed || selectedProfile.referralCode || ''
      };
    });
  }, [selectedProfile]);

  const meta = useMemo(() => {
    const platformMeta = settings ? buildMetaSnapshot(settings) : [];
    const affiliateMeta = affiliateSettings
      ? buildAffiliateMetaSnapshot(affiliateSettings, affiliateRules)
      : [];
    return [...platformMeta, ...affiliateMeta];
  }, [settings, affiliateSettings, affiliateRules]);

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

  const handleSubscriptionToggle = (field, checked) => {
    setForm((current) => ({
      ...current,
      subscriptions: { ...current.subscriptions, [field]: checked }
    }));
  };

  const handleRestrictedFeaturesChange = (value) => {
    setForm((current) => ({
      ...current,
      subscriptions: { ...current.subscriptions, restrictedFeaturesText: value }
    }));
  };

  const handleDefaultTierChange = (value) => {
    setForm((current) => ({
      ...current,
      subscriptions: { ...current.subscriptions, defaultTier: value }
    }));
  };

  const handleSubscriptionField = (index, field, value) => {
    setForm((current) => ({
      ...current,
      subscriptions: {
        ...current.subscriptions,
        tiers: current.subscriptions.tiers.map((tier, idx) =>
          idx === index ? { ...tier, [field]: value } : tier
        )
      }
    }));
  };

  const handleAddSubscriptionTier = () => {
    setForm((current) => ({
      ...current,
      subscriptions: {
        ...current.subscriptions,
        tiers: [...current.subscriptions.tiers, { id: '', label: '', description: '', featuresText: '' }]
      }
    }));
  };

  const handleRemoveSubscriptionTier = (index) => {
    setForm((current) => ({
      ...current,
      subscriptions: {
        ...current.subscriptions,
        tiers: current.subscriptions.tiers.filter((_, idx) => idx !== index)
      }
    }));
  };

  const handleIntegrationChange = (section, field, value) => {
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
      setForm(buildPlatformFormState(settings));
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
          reportingReplicaUri: form.integrations.database?.reportingReplicaUri,
          archiveReplicaUri: form.integrations.database?.archiveReplicaUri
        }
      }
    };

    try {
      const updated = await persistPlatformSettings(payload);
      setSettings(updated);
      setForm(buildPlatformFormState(updated));
      setSuccess('Monetisation controls updated successfully.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to save platform settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAffiliateInput = (field) => (event) => {
    const value = event.target.value;
    setAffiliateForm((current) => (current ? { ...current, [field]: value } : current));
  };

  const handleAffiliateToggle = (field) => (event) => {
    const checked = event.target.checked;
    setAffiliateForm((current) => (current ? { ...current, [field]: checked } : current));
  };

  const handleAffiliateResourceField = (index, field) => (event) => {
    const value = event.target.value;
    setAffiliateForm((current) => {
      if (!current) return current;
      const resources = current.resources.map((resource, idx) =>
        idx === index ? { ...resource, [field]: value } : resource
      );
      return { ...current, resources };
    });
  };

  const handleAffiliateResourceTypeChange = (index, value) => {
    setAffiliateForm((current) => {
      if (!current) return current;
      const resources = current.resources.map((resource, idx) =>
        idx === index ? { ...resource, type: value } : resource
      );
      return { ...current, resources };
    });
  };

  const handleAffiliateResourceToggle = (index) => (event) => {
    const checked = event.target.checked;
    setAffiliateForm((current) => {
      if (!current) return current;
      const resources = current.resources.map((resource, idx) =>
        idx === index ? { ...resource, openInNewTab: checked } : resource
      );
      return { ...current, resources };
    });
  };

  const handleAddAffiliateResource = () => {
    setAffiliateForm((current) =>
      current
        ? {
            ...current,
            resources: [
              ...current.resources,
              { id: '', label: '', url: '', type: 'link', description: '', rolesText: '', openInNewTab: true }
            ]
          }
        : current
    );
  };

  const handleRemoveAffiliateResource = (index) => {
    setAffiliateForm((current) =>
      current ? { ...current, resources: current.resources.filter((_, idx) => idx !== index) } : current
    );
  };

  const handleAffiliateAssetField = (index, field) => (event) => {
    const value = event.target.value;
    setAffiliateForm((current) => {
      if (!current) return current;
      const assetLibrary = current.assetLibrary.map((asset, idx) =>
        idx === index ? { ...asset, [field]: value } : asset
      );
      return { ...current, assetLibrary };
    });
  };

  const handleAffiliateAssetTypeChange = (index, value) => {
    setAffiliateForm((current) => {
      if (!current) return current;
      const assetLibrary = current.assetLibrary.map((asset, idx) =>
        idx === index ? { ...asset, type: value } : asset
      );
      return { ...current, assetLibrary };
    });
  };

  const handleAddAffiliateAsset = () => {
    setAffiliateForm((current) =>
      current
        ? {
            ...current,
            assetLibrary: [
              ...current.assetLibrary,
              { id: '', label: '', type: 'image', url: '', previewUrl: '', description: '' }
            ]
          }
        : current
    );
  };

  const handleRemoveAffiliateAsset = (index) => {
    setAffiliateForm((current) =>
      current ? { ...current, assetLibrary: current.assetLibrary.filter((_, idx) => idx !== index) } : current
    );
  };

  const handleAffiliateTierField = (index, field) => (event) => {
    const value = event.target.value;
    setAffiliateForm((current) => {
      if (!current) return current;
      const tiers = current.tiers.map((tier, idx) =>
        idx === index ? { ...tier, [field]: value } : tier
      );
      return { ...current, tiers };
    });
  };

  const handleAddAffiliateTier = () => {
    setAffiliateForm((current) =>
      current
        ? {
            ...current,
            tiers: [
              ...current.tiers,
              {
                id: '',
                label: '',
                headline: '',
                requirement: '',
                badgeColor: '#1445E0',
                imageUrl: '',
                benefitsText: ''
              }
            ]
          }
        : current
    );
  };

  const handleRemoveAffiliateTier = (index) => {
    setAffiliateForm((current) =>
      current ? { ...current, tiers: current.tiers.filter((_, idx) => idx !== index) } : current
    );
  };

  const resetAffiliateForm = () => {
    if (affiliateSettings) {
      setAffiliateForm(buildAffiliateFormState(affiliateSettings));
      setAffiliateError(null);
      setAffiliateSuccess(null);
    }
  };

  const handleAffiliateSubmit = async (event) => {
    event.preventDefault();
    if (!affiliateForm) return;

    setAffiliateSaving(true);
    setAffiliateError(null);
    setAffiliateSuccess(null);

    const payload = {
      ...affiliateForm,
      resources: affiliateForm.resources.map((resource) => ({
        ...resource,
        roles: textToList(resource.rolesText)
      })),
      assetLibrary: affiliateForm.assetLibrary,
      tiers: affiliateForm.tiers.map((tier) => ({
        ...tier,
        benefits: multilineTextToList(tier.benefitsText)
      }))
    };

    try {
      const updated = await saveAdminAffiliateSettings(payload);
      setAffiliateSettings(updated);
      setAffiliateForm(buildAffiliateFormState(updated));
      setAffiliateSuccess('Affiliate configuration saved successfully.');
    } catch (caught) {
      setAffiliateError(caught instanceof Error ? caught.message : 'Unable to save affiliate configuration');
    } finally {
      setAffiliateSaving(false);
    }
  };

  const openRuleEditor = (rule = null) => {
    setRuleDraft(buildRuleDraft(rule));
    setRuleEditorOpen(true);
    setRuleError(null);
    setRuleSuccess(null);
  };

  const closeRuleEditor = () => {
    setRuleDraft(buildRuleDraft());
    setRuleEditorOpen(false);
  };

  const handleRuleFieldChange = (field) => (event) => {
    const value = event.target.value;
    setRuleDraft((current) => ({ ...current, [field]: value }));
  };

  const handleRuleRecurrenceChange = (value) => {
    setRuleDraft((current) => ({
      ...current,
      recurrenceType: value,
      recurrenceLimit: value === 'finite' ? current.recurrenceLimit : ''
    }));
  };

  const handleRuleToggle = (field) => (event) => {
    const checked = event.target.checked;
    setRuleDraft((current) => ({ ...current, [field]: checked }));
  };

  const handleRuleMetadataChange = (field) => (event) => {
    const value = event.target.value;
    setRuleDraft((current) => ({
      ...current,
      metadata: { ...current.metadata, [field]: value }
    }));
  };

  const handleRuleSubmit = async (event) => {
    event.preventDefault();
    setRuleSaving(true);
    setRuleError(null);
    setRuleSuccess(null);

    const payload = {
      name: ruleDraft.name.trim(),
      tierLabel: ruleDraft.tierLabel.trim(),
      commissionRate: Number.parseFloat(ruleDraft.commissionRate) || 0,
      priority: ruleDraft.priority === '' ? 100 : Number.parseInt(ruleDraft.priority, 10) || 100,
      minTransactionValue:
        ruleDraft.minTransactionValue === '' ? 0 : Number.parseFloat(ruleDraft.minTransactionValue),
      maxTransactionValue:
        ruleDraft.maxTransactionValue === '' ? null : Number.parseFloat(ruleDraft.maxTransactionValue),
      recurrenceType: ruleDraft.recurrenceType,
      recurrenceLimit:
        ruleDraft.recurrenceType === 'finite' && ruleDraft.recurrenceLimit !== ''
          ? Number.parseInt(ruleDraft.recurrenceLimit, 10)
          : null,
      currency: ruleDraft.currency || 'USD',
      isActive: Boolean(ruleDraft.isActive),
      metadata: {
        summary: ruleDraft.metadata.summary.trim(),
        badgeColor: ruleDraft.metadata.badgeColor || '#1445E0',
        badgeIcon: ruleDraft.metadata.badgeIcon.trim(),
        landingPageUrl: ruleDraft.metadata.landingPageUrl.trim(),
        perks: multilineTextToList(ruleDraft.metadata.perksText)
      }
    };

    try {
      await upsertAffiliateRule(payload, { id: ruleDraft.id || undefined });
      setRuleSuccess(ruleDraft.id ? 'Commission rule updated.' : 'Commission rule created.');
      closeRuleEditor();
      await refreshAffiliate({ forceRefresh: true });
    } catch (caught) {
      setRuleError(caught instanceof Error ? caught.message : 'Unable to save commission rule');
    } finally {
      setRuleSaving(false);
    }
  };

  const handleDeactivateRule = async (ruleId) => {
    if (!ruleId) return;
    setRuleSaving(true);
    setRuleError(null);
    setRuleSuccess(null);
    try {
      await deactivateAffiliateRule(ruleId);
      setRuleSuccess('Commission rule deactivated.');
      await refreshAffiliate({ forceRefresh: true });
    } catch (caught) {
      setRuleError(caught instanceof Error ? caught.message : 'Unable to deactivate commission rule');
    } finally {
      setRuleSaving(false);
    }
  };

  const handleRosterFilterChange = (field, value) => {
    setRosterFilters((current) => ({ ...current, [field]: value }));
  };

  const handleRosterApplyFilters = () => {
    setRosterMeta((current) => ({ ...current, page: 1 }));
    setRosterRefreshToken((value) => value + 1);
  };

  const handleRosterResetFilters = () => {
    setRosterFilters({ status: 'all', search: '' });
    setRosterMeta((current) => ({ ...current, page: 1 }));
    setRosterRefreshToken((value) => value + 1);
  };

  const handleRosterPaginate = (page) => {
    setRosterMeta((current) => (page === current.page ? current : { ...current, page }));
  };

  const handleRosterRefresh = () => {
    setRosterRefreshToken((value) => value + 1);
  };

  const handleCreateFormChange = (field, value) => {
    setCreateAffiliateForm((current) => ({ ...current, [field]: value }));
  };

  const handleReferralFilterChange = (field, value) => {
    setReferralFilters((current) => ({ ...current, [field]: value }));
  };

  const handleReferralApplyFilters = () => {
    setReferralMeta((current) => ({ ...current, page: 1 }));
    setReferralRefreshToken((value) => value + 1);
  };

  const handleReferralResetFilters = () => {
    setReferralFilters({ status: 'all', search: '' });
    setReferralMeta((current) => ({ ...current, page: 1 }));
    setReferralRefreshToken((value) => value + 1);
  };

  const handleReferralPaginate = (page) => {
    setReferralMeta((current) => (page === current.page ? current : { ...current, page }));
  };

  const handleReferralRefresh = () => {
    setReferralRefreshToken((value) => value + 1);
  };

  const handleReferralFormChange = (field, value) => {
    setReferralCreationError(null);
    setCreateReferralForm((current) => ({ ...current, [field]: value }));
  };

  const resetReferralForm = () => {
    setCreateReferralForm({
      affiliateProfileId: '',
      referralCodeUsed: '',
      referredUserId: '',
      status: 'pending',
      conversionsCount: '',
      totalRevenue: '',
      totalCommissionEarned: '',
      lastConversionAt: '',
      memo: ''
    });
  };

  const handleCreateReferral = async () => {
    if (!createReferralForm.affiliateProfileId) {
      setReferralCreationError('Select an affiliate profile before logging a referral.');
      return;
    }

    setCreatingReferral(true);
    setReferralCreationError(null);

    const payload = {
      affiliateProfileId: createReferralForm.affiliateProfileId,
      status: createReferralForm.status,
      referralCodeUsed: createReferralForm.referralCodeUsed.trim() || undefined,
      referredUserId: createReferralForm.referredUserId.trim() || undefined,
      lastConversionAt: createReferralForm.lastConversionAt || undefined,
      metadata: createReferralForm.memo ? { note: createReferralForm.memo } : undefined
    };

    const conversions = Number.parseInt(createReferralForm.conversionsCount, 10);
    if (Number.isFinite(conversions)) {
      payload.conversionsCount = conversions;
    }
    const revenue = Number.parseFloat(createReferralForm.totalRevenue);
    if (Number.isFinite(revenue)) {
      payload.totalRevenue = revenue;
    }
    const commission = Number.parseFloat(createReferralForm.totalCommissionEarned);
    if (Number.isFinite(commission)) {
      payload.totalCommissionEarned = commission;
    }

    try {
      const response = await createAdminAffiliateReferral(payload);
      resetReferralForm();
      setReferralMeta((current) => ({ ...current, page: 1 }));
      setReferralRefreshToken((value) => value + 1);
      const nextProfile = response?.profile;
      if (nextProfile) {
        setRosterData((current) => current.map((profile) => (profile.id === nextProfile.id ? { ...profile, ...nextProfile } : profile)));
        setSelectedProfile((current) => (current && current.id === nextProfile.id ? { ...current, ...nextProfile } : current));
      }
    } catch (caught) {
      setReferralCreationError(caught instanceof Error ? caught.message : 'Unable to create referral');
    } finally {
      setCreatingReferral(false);
    }
  };

  const handleReferralUpdate = async (id, changes) => {
    if (!id || !changes) {
      return;
    }

    const payload = { ...changes };
    if (Object.hasOwn(payload, 'conversionsCount')) {
      const parsed = Number.parseInt(payload.conversionsCount, 10);
      if (Number.isFinite(parsed)) {
        payload.conversionsCount = parsed;
      } else {
        delete payload.conversionsCount;
      }
    }
    if (Object.hasOwn(payload, 'totalRevenue')) {
      if (payload.totalRevenue === '') {
        delete payload.totalRevenue;
      } else {
        const parsed = Number.parseFloat(payload.totalRevenue);
        if (Number.isFinite(parsed)) {
          payload.totalRevenue = parsed;
        } else {
          delete payload.totalRevenue;
        }
      }
    }
    if (Object.hasOwn(payload, 'totalCommissionEarned')) {
      if (payload.totalCommissionEarned === '') {
        delete payload.totalCommissionEarned;
      } else {
        const parsed = Number.parseFloat(payload.totalCommissionEarned);
        if (Number.isFinite(parsed)) {
          payload.totalCommissionEarned = parsed;
        } else {
          delete payload.totalCommissionEarned;
        }
      }
    }
    if (Object.hasOwn(payload, 'lastConversionAt')) {
      payload.lastConversionAt = payload.lastConversionAt || null;
    }

    if (Object.keys(payload).length === 0) {
      return;
    }

    setUpdatingReferralIds((current) => {
      const next = new Set(current);
      next.add(id);
      return next;
    });
    setReferralError(null);

    try {
      const response = await updateAdminAffiliateReferral(id, payload);
      const nextReferral = response?.data ?? response;
      const nextProfile = response?.profile;
      setReferralData((current) => current.map((referral) => (referral.id === id ? { ...referral, ...nextReferral } : referral)));
      if (nextProfile) {
        setRosterData((current) => current.map((profile) => (profile.id === nextProfile.id ? { ...profile, ...nextProfile } : profile)));
        setSelectedProfile((current) => (current && current.id === nextProfile.id ? { ...current, ...nextProfile } : current));
      }
    } catch (caught) {
      setReferralError(caught instanceof Error ? caught.message : 'Unable to update referral');
    } finally {
      setUpdatingReferralIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  };

  const handleCreateAffiliate = async () => {
    const userId = createAffiliateForm.userId.trim();
    if (!userId) {
      setRosterCreationError('User ID is required to create an affiliate.');
      return;
    }

    setCreatingAffiliate(true);
    setRosterCreationError(null);

    const payload = {
      userId,
      status: createAffiliateForm.status,
      tierLabel: createAffiliateForm.tierLabel.trim() || undefined,
      referralCode: createAffiliateForm.referralCode.trim() || undefined,
      metadata: { createdFrom: 'admin-monetisation-workspace' }
    };

    try {
      await createAdminAffiliateProfile(payload);
      setCreateAffiliateForm({ userId: '', referralCode: '', tierLabel: '', status: 'active' });
      setRosterMeta((current) => ({ ...current, page: 1 }));
      setRosterRefreshToken((value) => value + 1);
    } catch (caught) {
      setRosterCreationError(caught instanceof Error ? caught.message : 'Unable to create affiliate profile');
    } finally {
      setCreatingAffiliate(false);
    }
  };

  const handleLocalProfileChange = (id, changes) => {
    setRosterData((current) => current.map((profile) => (profile.id === id ? { ...profile, ...changes } : profile)));
    setSelectedProfile((current) => (current && current.id === id ? { ...current, ...changes } : current));
  };

  const handleUpdateProfile = async (id, changes) => {
    if (!id) return;
    setUpdatingProfileIds((current) => {
      const next = new Set(current);
      next.add(id);
      return next;
    });
    setRosterError(null);
    try {
      const updated = await updateAdminAffiliateProfile(id, changes);
      setRosterData((current) => current.map((profile) => (profile.id === id ? { ...profile, ...updated } : profile)));
      setSelectedProfile((current) => (current && current.id === id ? { ...current, ...updated } : current));
    } catch (caught) {
      setRosterError(caught instanceof Error ? caught.message : 'Failed to update affiliate profile');
    } finally {
      setUpdatingProfileIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  };

  const handleOpenLedger = (profile) => {
    setSelectedProfile(profile);
    setLedgerMeta((current) => ({ ...current, page: 1 }));
    setLedgerRefreshToken((value) => value + 1);
  };

  const handleCloseLedger = () => {
    setSelectedProfile(null);
    setLedgerEntries([]);
    setLedgerError(null);
    setLedgerMeta({ page: 1, pageSize: 25, total: 0, pageCount: 0 });
    setLedgerForm({
      transactionAmount: '',
      commissionAmount: '',
      currency: 'USD',
      occurrenceIndex: 1,
      status: 'approved',
      recognizedAt: '',
      memo: '',
      transactionId: ''
    });
  };

  const handleLedgerFormChange = (field, value) => {
    setLedgerForm((current) => ({ ...current, [field]: value }));
  };

  const handleLedgerPaginate = (page) => {
    setLedgerMeta((current) => (page === current.page ? current : { ...current, page }));
  };

  const handleLedgerRefresh = () => {
    setLedgerRefreshToken((value) => value + 1);
  };

  const handleLedgerSubmit = async (event) => {
    event.preventDefault();
    if (!selectedProfile) return;

    const commissionAmountValue = Number.parseFloat(ledgerForm.commissionAmount);
    if (!Number.isFinite(commissionAmountValue)) {
      setLedgerError('Commission amount is required.');
      return;
    }

    setLedgerSaving(true);
    setLedgerError(null);

    const transactionAmountValue = Number.parseFloat(ledgerForm.transactionAmount);
    const occurrenceIndexValue = Number.parseInt(ledgerForm.occurrenceIndex, 10);

    const payload = {
      commissionAmount: commissionAmountValue,
      transactionAmount: Number.isFinite(transactionAmountValue) ? transactionAmountValue : commissionAmountValue,
      currency: ledgerForm.currency || 'USD',
      occurrenceIndex: Number.isFinite(occurrenceIndexValue) && occurrenceIndexValue > 0 ? occurrenceIndexValue : 1,
      status: ledgerForm.status,
      recognizedAt: ledgerForm.recognizedAt || undefined,
      transactionId: ledgerForm.transactionId?.trim() || undefined,
      metadata: ledgerForm.memo ? { memo: ledgerForm.memo } : undefined
    };

    try {
      const result = await createAdminAffiliateLedgerEntry(selectedProfile.id, payload);
      const nextProfile = result?.profile ?? selectedProfile;
      setRosterData((current) => current.map((profile) => (profile.id === nextProfile.id ? { ...profile, ...nextProfile } : profile)));
      setSelectedProfile((current) => (current && current.id === nextProfile.id ? { ...current, ...nextProfile } : current));
      setLedgerForm((current) => ({
        ...current,
        transactionAmount: '',
        commissionAmount: '',
        memo: '',
        transactionId: ''
      }));
      setLedgerMeta((current) => ({ ...current, page: 1 }));
      setLedgerRefreshToken((value) => value + 1);
    } catch (caught) {
      setLedgerError(caught instanceof Error ? caught.message : 'Failed to record ledger adjustment');
    } finally {
      setLedgerSaving(false);
    }
  };

  const tierChoices = useMemo(() => tierOptions(form?.subscriptions?.tiers ?? []), [form]);
  const affiliateCurrencyFormatter = useMemo(
    () => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }),
    []
  );
  const referralProfileOptions = useMemo(
    () =>
      rosterData.map((profile) => ({
        value: profile.id,
        label: profile.user?.email
          ? `${profile.referralCode} • ${profile.user.email}`
          : profile.referralCode || profile.id
      })),
    [rosterData]
  );

  const isLoadingSnapshot = (loading && !form) || (affiliateLoading && !affiliateForm && !affiliateError);

  if (isLoadingSnapshot) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50" data-qa-page="admin-monetization">
        <Spinner className="h-10 w-10 text-primary" />
      </div>
    );
  }

  const landingPageAction = affiliateForm?.landingPageUrl
    ? {
        label: 'View landing page',
        variant: 'ghost',
        icon: ArrowTopRightOnSquareIcon,
        href: affiliateForm.landingPageUrl,
        target: '_blank',
        rel: 'noopener noreferrer',
        analyticsId: 'open-affiliate-landing'
      }
    : null;
  const partnerPortalAction = affiliateForm?.partnerPortalUrl
    ? {
        label: 'Open partner portal',
        variant: 'secondary',
        icon: ArrowTopRightOnSquareIcon,
        href: affiliateForm.partnerPortalUrl,
        target: '_blank',
        rel: 'noopener noreferrer',
        analyticsId: 'open-affiliate-portal'
      }
    : null;

  const headerActions = [
    {
      label: 'Refresh snapshot',
      variant: 'secondary',
      icon: ArrowPathIcon,
      onClick: () => refreshSettings(),
      disabled: loading,
      analyticsId: 'refresh-platform-settings'
    },
    {
      label: 'Refresh affiliate snapshot',
      variant: 'secondary',
      icon: ArrowPathIcon,
      onClick: () => refreshAffiliate({ forceRefresh: true }),
      disabled: affiliateLoading,
      analyticsId: 'refresh-affiliate-settings'
    },
    landingPageAction,
    partnerPortalAction
  ].filter(Boolean);

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
        actions={headerActions}
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

        <CommissionManagementCard
          value={form.commissions}
          onToggle={handleCommissionToggle}
          onBaseRateChange={handleCommissionRateChange}
          onAddCustomRate={handleAddCustomRate}
          onCustomRateChange={handleCustomRateChange}
          onRemoveCustomRate={handleRemoveCustomRate}
        />

        <SubscriptionGovernanceCard
          value={form.subscriptions}
          tierChoices={tierChoices}
          onToggle={handleSubscriptionToggle}
          onRestrictedFeaturesChange={handleRestrictedFeaturesChange}
          onDefaultTierChange={handleDefaultTierChange}
          onAddTier={handleAddSubscriptionTier}
          onTierChange={handleSubscriptionField}
          onRemoveTier={handleRemoveSubscriptionTier}
        />

        <IntegrationCredentialsCard value={form.integrations} onChange={handleIntegrationChange} />

        <div className="flex flex-col items-stretch justify-end gap-3 sm:flex-row">
          <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
            Reset changes
          </Button>
          <Button type="submit" loading={saving} iconPosition="end">
            Save monetisation controls
          </Button>
        </div>
      </form>

      <div className="mx-auto mt-20 max-w-7xl space-y-12 px-6 pb-24">
        <div className="space-y-3">
          <h2 className="text-3xl font-semibold text-primary">Affiliate monetisation</h2>
          <p className="text-base text-slate-600">
            Manage the Fixnado partner program from one place — from onboarding resources through to tiered commission rules and performance tracking.
          </p>
          {affiliateError ? (
            <StatusPill tone="danger" icon={ExclamationTriangleIcon}>
              {affiliateError}
            </StatusPill>
          ) : null}
          {affiliateSuccess ? (
            <StatusPill tone="success" icon={CheckCircleIcon}>
              {affiliateSuccess}
            </StatusPill>
          ) : null}
        </div>

        <form className="space-y-10" onSubmit={handleAffiliateSubmit}>
          <AffiliateProgrammeDesigner
            value={affiliateForm}
            onInputChange={handleAffiliateInput}
            onToggle={handleAffiliateToggle}
            onAddResource={handleAddAffiliateResource}
            onResourceFieldChange={handleAffiliateResourceField}
            onResourceTypeChange={handleAffiliateResourceTypeChange}
            onResourceToggle={handleAffiliateResourceToggle}
            onRemoveResource={handleRemoveAffiliateResource}
            onAddAsset={handleAddAffiliateAsset}
            onAssetFieldChange={handleAffiliateAssetField}
            onAssetTypeChange={handleAffiliateAssetTypeChange}
            onRemoveAsset={handleRemoveAffiliateAsset}
            onAddTier={handleAddAffiliateTier}
            onTierFieldChange={handleAffiliateTierField}
            onRemoveTier={handleRemoveAffiliateTier}
            resourceTypeOptions={RESOURCE_TYPE_OPTIONS}
            assetTypeOptions={ASSET_TYPE_OPTIONS}
          />

          <div className="flex flex-col items-stretch justify-end gap-3 sm:flex-row">
            <Button type="button" variant="secondary" onClick={resetAffiliateForm} disabled={affiliateSaving}>
              Reset affiliate changes
            </Button>
            <Button type="submit" loading={affiliateSaving} iconPosition="end">
              Save affiliate programme
            </Button>
          </div>
        </form>

        <AffiliateRosterCard
          loading={rosterLoading}
          profiles={rosterData}
          meta={rosterMeta}
          error={rosterError ?? null}
          filters={rosterFilters}
          onFilterChange={handleRosterFilterChange}
          onApplyFilters={handleRosterApplyFilters}
          onResetFilters={handleRosterResetFilters}
          onPaginate={handleRosterPaginate}
          onRefresh={handleRosterRefresh}
          createForm={createAffiliateForm}
          onCreateFormChange={handleCreateFormChange}
          onCreate={handleCreateAffiliate}
          creating={creatingAffiliate}
          creationError={rosterCreationError ?? null}
          onLocalProfileChange={handleLocalProfileChange}
          onUpdateProfile={handleUpdateProfile}
          updatingIds={updatingProfileIds}
          onOpenLedger={handleOpenLedger}
        />

        <AffiliateReferralManager
          loading={referralLoading}
          referrals={referralData}
          meta={referralMeta}
          error={referralError ?? null}
          filters={referralFilters}
          onFilterChange={handleReferralFilterChange}
          onApplyFilters={handleReferralApplyFilters}
          onResetFilters={handleReferralResetFilters}
          onPaginate={handleReferralPaginate}
          onRefresh={handleReferralRefresh}
          profileOptions={referralProfileOptions}
          createForm={createReferralForm}
          onCreateFormChange={handleReferralFormChange}
          onCreate={handleCreateReferral}
          creating={creatingReferral}
          creationError={referralCreationError ?? null}
          onUpdateField={handleReferralUpdate}
          updatingIds={updatingReferralIds}
        />

        {selectedProfile ? (
          <AffiliateLedgerManager
            profile={selectedProfile}
            entries={ledgerEntries}
            meta={ledgerMeta}
            loading={ledgerLoading}
            error={ledgerError ?? null}
            form={ledgerForm}
            onFormChange={handleLedgerFormChange}
            onSubmit={handleLedgerSubmit}
            saving={ledgerSaving}
            onRefresh={handleLedgerRefresh}
            onClose={handleCloseLedger}
            onPaginate={handleLedgerPaginate}
          />
        ) : null}

        <AffiliateRulesManager
          rules={affiliateRules}
          performance={affiliatePerformance}
          currencyFormatter={affiliateCurrencyFormatter}
          ruleEditorOpen={ruleEditorOpen}
          ruleDraft={ruleDraft}
          onOpenEditor={openRuleEditor}
          onCloseEditor={closeRuleEditor}
          onRuleFieldChange={handleRuleFieldChange}
          onRuleRecurrenceChange={handleRuleRecurrenceChange}
          onRuleToggle={handleRuleToggle}
          onRuleMetadataChange={handleRuleMetadataChange}
          onRuleSubmit={handleRuleSubmit}
          onDeactivateRule={handleDeactivateRule}
          onRefresh={() => refreshAffiliate({ forceRefresh: true })}
          loading={affiliateLoading}
          saving={ruleSaving}
          error={ruleError}
          success={ruleSuccess}
          recurrenceOptions={RULE_RECURRENCE_OPTIONS}
          value={affiliateForm ?? { resources: [], assetLibrary: [] }}
        />
      </div>
    </div>
  );
}
