import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  getProviderSettings,
  updateProviderSettingsProfile,
  updateProviderSettingsBranding,
  updateProviderSettingsOperations,
  createProviderSettingsContact,
  updateProviderSettingsContact,
  deleteProviderSettingsContact,
  createProviderSettingsCoverage,
  updateProviderSettingsCoverage,
  deleteProviderSettingsCoverage
} from '../../../api/panelClient.js';
import { Button, Spinner } from '../../../components/ui/index.js';
import IdentityForm from './components/IdentityForm.jsx';
import BrandingForm from './components/BrandingForm.jsx';
import OperationsForm from './components/OperationsForm.jsx';
import ContactsPanel from './components/ContactsPanel.jsx';
import CoveragePanel from './components/CoveragePanel.jsx';
import ContactModal from './components/ContactModal.jsx';
import CoverageModal from './components/CoverageModal.jsx';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

const DEFAULT_SUPPORT_DAYS = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' }
];

const DEFAULT_SUPPORT_START = '09:00';
const DEFAULT_SUPPORT_END = '17:00';

function generateLocalId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function extractErrorMessage(error, fallback) {
  if (!error) return fallback;
  if (error.details) {
    if (Array.isArray(error.details)) {
      const first = error.details[0];
      if (typeof first === 'string') return first;
      if (first?.message) return first.message;
      if (first?.msg) return first.msg;
    } else if (typeof error.details === 'string') {
      return error.details;
    } else if (typeof error.details === 'object') {
      const values = Object.values(error.details);
      if (Array.isArray(values[0])) {
        return values[0][0];
      }
      if (typeof values[0] === 'string') {
        return values[0];
      }
    }
  }
  if (error.message) return error.message;
  return fallback;
}

function ensureSupportHours(rawHours, supportDays) {
  const days = supportDays.length > 0 ? supportDays : DEFAULT_SUPPORT_DAYS;
  return days.reduce((acc, day) => {
    const entry = rawHours?.[day.id] ?? {};
    acc[day.id] = {
      enabled: Boolean(entry.enabled),
      start: entry.start ?? DEFAULT_SUPPORT_START,
      end: entry.end ?? DEFAULT_SUPPORT_END
    };
    return acc;
  }, {});
}

function socialLinksToState(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.map((entry, index) => ({
    id: entry.id || generateLocalId(`social-${index}`),
    label: entry.label ?? '',
    url: entry.url ?? ''
  }));
}

function socialLinksToPayload(entries) {
  return entries
    .map((entry) => ({
      id: entry.id,
      label: entry.label?.trim() || undefined,
      url: entry.url?.trim()
    }))
    .filter((entry) => Boolean(entry.url));
}

function metadataObjectToEntries(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return [];
  }
  return Object.entries(metadata)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value], index) => ({
      id: generateLocalId(`metadata-${index}`),
      key,
      value: String(value)
    }));
}

function metadataEntriesToObject(entries) {
  return entries.reduce((acc, entry) => {
    const key = entry.key?.trim();
    if (!key) {
      return acc;
    }
    acc[key] = entry.value?.trim() ?? '';
    return acc;
  }, {});
}

function createIdentityState(profile = {}) {
  return {
    displayName: profile.displayName ?? '',
    tradingName: profile.tradingName ?? '',
    tagline: profile.tagline ?? '',
    missionStatement: profile.missionStatement ?? '',
    supportEmail: profile.supportEmail ?? '',
    supportPhone: profile.supportPhone ?? '',
    billingEmail: profile.billingEmail ?? '',
    billingPhone: profile.billingPhone ?? '',
    websiteUrl: profile.websiteUrl ?? '',
    operationsPlaybookUrl: profile.operationsPlaybookUrl ?? '',
    insurancePolicyUrl: profile.insurancePolicyUrl ?? '',
    dispatchRadiusKm:
      profile.dispatchRadiusKm != null ? String(profile.dispatchRadiusKm) : '',
    preferredResponseMinutes:
      profile.preferredResponseMinutes != null
        ? String(profile.preferredResponseMinutes)
        : '',
    serviceRegionsText: Array.isArray(profile.serviceRegions)
      ? profile.serviceRegions.join('\n')
      : ''
  };
}

function createBrandingState(branding = {}) {
  return {
    logoUrl: branding.logoUrl ?? '',
    heroImageUrl: branding.heroImageUrl ?? '',
    brandPrimaryColor: branding.brandPrimaryColor ?? '',
    brandSecondaryColor: branding.brandSecondaryColor ?? '',
    brandFont: branding.brandFont ?? '',
    mediaGallery: Array.isArray(branding.mediaGallery)
      ? branding.mediaGallery.map((item, index) => ({
          id: item.id || generateLocalId(`media-${index}`),
          label: item.label ?? '',
          url: item.url ?? ''
        }))
      : []
  };
}

function createOperationsState(operations = {}, supportDays) {
  return {
    operationsNotes: operations.operationsNotes ?? '',
    coverageNotes: operations.coverageNotes ?? '',
    supportHours: ensureSupportHours(operations.supportHours, supportDays),
    socialLinks: socialLinksToState(operations.socialLinks)
  };
}

function createContactDraft(contact = {}, contactTypes = []) {
  return {
    id: contact.id ?? null,
    name: contact.name ?? '',
    role: contact.role ?? '',
    email: contact.email ?? '',
    phone: contact.phone ?? '',
    type: contact.type ?? contactTypes[0] ?? 'operations',
    isPrimary: Boolean(contact.isPrimary),
    notes: contact.notes ?? '',
    avatarUrl: contact.avatarUrl ?? ''
  };
}

function createCoverageDraft(coverage = {}, serviceZones = [], coverageTypes = []) {
  return {
    id: coverage.id ?? null,
    zoneId: coverage.zoneId ?? serviceZones[0]?.id ?? '',
    coverageType: coverage.coverageType ?? coverageTypes[0] ?? 'primary',
    slaMinutes: coverage.slaMinutes != null ? String(coverage.slaMinutes) : '240',
    maxCapacity: coverage.maxCapacity != null ? String(coverage.maxCapacity) : '0',
    notes: coverage.notes ?? '',
    metadataEntries: metadataObjectToEntries(coverage.metadata)
  };
}

function ProviderProfileSettingsWorkspace({ section }) {
  const companyId = section?.data?.companyId ?? null;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [enums, setEnums] = useState({
    contactTypes: [],
    coverageTypes: [],
    serviceZones: [],
    supportDays: DEFAULT_SUPPORT_DAYS
  });
  const [links, setLinks] = useState({ storefront: null });
  const [identityForm, setIdentityForm] = useState(() => createIdentityState());
  const [brandingForm, setBrandingForm] = useState(() => createBrandingState());
  const [operationsForm, setOperationsForm] = useState(() => createOperationsState({}, DEFAULT_SUPPORT_DAYS));
  const [contacts, setContacts] = useState([]);
  const [coverage, setCoverage] = useState([]);

  const [identitySaving, setIdentitySaving] = useState(false);
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [operationsSaving, setOperationsSaving] = useState(false);
  const [contactsSaving, setContactsSaving] = useState(false);
  const [coverageSaving, setCoverageSaving] = useState(false);

  const [identityStatus, setIdentityStatus] = useState(null);
  const [brandingStatus, setBrandingStatus] = useState(null);
  const [operationsStatus, setOperationsStatus] = useState(null);
  const [contactsStatus, setContactsStatus] = useState(null);
  const [coverageStatus, setCoverageStatus] = useState(null);
  const [contactModalStatus, setContactModalStatus] = useState(null);
  const [coverageModalStatus, setCoverageModalStatus] = useState(null);

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactDraft, setContactDraft] = useState(() => createContactDraft());
  const [contactMode, setContactMode] = useState('create');
  const [editingContactId, setEditingContactId] = useState(null);

  const [isCoverageModalOpen, setIsCoverageModalOpen] = useState(false);
  const [coverageDraft, setCoverageDraft] = useState(() => createCoverageDraft());
  const [coverageMode, setCoverageMode] = useState('create');
  const [editingCoverageId, setEditingCoverageId] = useState(null);

  const supportDays = useMemo(
    () => (enums.supportDays?.length ? enums.supportDays : DEFAULT_SUPPORT_DAYS),
    [enums.supportDays]
  );

  const applySettings = useCallback((payload) => {
    const settings = payload?.data ?? payload;
    if (!settings) {
      return;
    }

    const nextEnums = {
      contactTypes: settings.enums?.contactTypes ?? [],
      coverageTypes: settings.enums?.coverageTypes ?? [],
      serviceZones: settings.enums?.serviceZones ?? [],
      supportDays: settings.enums?.supportDays ?? DEFAULT_SUPPORT_DAYS
    };

    setEnums(nextEnums);
    setLinks(settings.links ?? { storefront: null });
    setIdentityForm(createIdentityState(settings.profile));
    setBrandingForm(createBrandingState(settings.branding));
    setOperationsForm(createOperationsState(settings.operations, nextEnums.supportDays));
    setContacts(settings.contacts ?? []);
    setCoverage(settings.coverage ?? []);
  }, []);

  const loadSettings = useCallback(
    async (options = {}) => {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await getProviderSettings({ companyId, forceRefresh: options.forceRefresh });
        applySettings(response);
      } catch (error) {
        setLoadError(extractErrorMessage(error, 'Unable to load provider settings.'));
      } finally {
        setLoading(false);
      }
    },
    [applySettings, companyId]
  );

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleRefresh = useCallback(() => {
    loadSettings({ forceRefresh: true });
  }, [loadSettings]);

  const handleIdentityFieldChange = useCallback((field, value) => {
    setIdentityForm((current) => ({ ...current, [field]: value }));
  }, []);

  const handleIdentitySubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (identitySaving) return;
      setIdentitySaving(true);
      setIdentityStatus(null);
      try {
        const serviceRegions = identityForm.serviceRegionsText
          .split(/\r?\n/)
          .map((region) => region.trim())
          .filter(Boolean);
        const payload = {
          displayName: identityForm.displayName,
          tradingName: identityForm.tradingName,
          tagline: identityForm.tagline,
          missionStatement: identityForm.missionStatement,
          supportEmail: identityForm.supportEmail,
          supportPhone: identityForm.supportPhone,
          billingEmail: identityForm.billingEmail,
          billingPhone: identityForm.billingPhone,
          websiteUrl: identityForm.websiteUrl,
          operationsPlaybookUrl: identityForm.operationsPlaybookUrl,
          insurancePolicyUrl: identityForm.insurancePolicyUrl,
          dispatchRadiusKm:
            identityForm.dispatchRadiusKm !== '' ? Number(identityForm.dispatchRadiusKm) : null,
          preferredResponseMinutes:
            identityForm.preferredResponseMinutes !== ''
              ? Number(identityForm.preferredResponseMinutes)
              : null,
          serviceRegions
        };
        const response = await updateProviderSettingsProfile(payload, { companyId });
        applySettings(response);
        setIdentityStatus({ type: 'success', message: 'Profile saved successfully.' });
      } catch (error) {
        setIdentityStatus({
          type: 'error',
          message: extractErrorMessage(error, 'Unable to save profile details.')
        });
      } finally {
        setIdentitySaving(false);
      }
    },
    [applySettings, companyId, identityForm, identitySaving]
  );

  const handleBrandingFieldChange = useCallback((field, value) => {
    setBrandingForm((current) => ({ ...current, [field]: value }));
  }, []);

  const handleAddMedia = useCallback(() => {
    setBrandingForm((current) => ({
      ...current,
      mediaGallery: [
        ...current.mediaGallery,
        { id: generateLocalId('media'), label: '', url: '' }
      ]
    }));
  }, []);

  const handleMediaChange = useCallback((index, field, value) => {
    setBrandingForm((current) => ({
      ...current,
      mediaGallery: current.mediaGallery.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    }));
  }, []);

  const handleRemoveMedia = useCallback((index) => {
    setBrandingForm((current) => ({
      ...current,
      mediaGallery: current.mediaGallery.filter((_, itemIndex) => itemIndex !== index)
    }));
  }, []);

  const handleBrandingSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (brandingSaving) return;
      setBrandingSaving(true);
      setBrandingStatus(null);
      try {
        const payload = {
          logoUrl: brandingForm.logoUrl,
          heroImageUrl: brandingForm.heroImageUrl,
          brandPrimaryColor: brandingForm.brandPrimaryColor,
          brandSecondaryColor: brandingForm.brandSecondaryColor,
          brandFont: brandingForm.brandFont,
          mediaGallery: brandingForm.mediaGallery
            .filter((item) => item.url?.trim())
            .map((item) => ({
              id: item.id,
              label: item.label?.trim() || undefined,
              url: item.url?.trim()
            }))
        };
        const response = await updateProviderSettingsBranding(payload, { companyId });
        applySettings(response);
        setBrandingStatus({ type: 'success', message: 'Branding updated.' });
      } catch (error) {
        setBrandingStatus({
          type: 'error',
          message: extractErrorMessage(error, 'Unable to update branding settings.')
        });
      } finally {
        setBrandingSaving(false);
      }
    },
    [applySettings, brandingForm, brandingSaving, companyId]
  );

  const handleOperationsFieldChange = useCallback((field, value) => {
    setOperationsForm((current) => ({ ...current, [field]: value }));
  }, []);

  const handleToggleSupportDay = useCallback((dayId, enabled) => {
    setOperationsForm((current) => {
      const existing = current.supportHours?.[dayId] ?? {
        enabled: false,
        start: DEFAULT_SUPPORT_START,
        end: DEFAULT_SUPPORT_END
      };
      return {
        ...current,
        supportHours: {
          ...current.supportHours,
          [dayId]: {
            ...existing,
            enabled,
            start: enabled ? existing.start || DEFAULT_SUPPORT_START : existing.start || DEFAULT_SUPPORT_START,
            end: enabled ? existing.end || DEFAULT_SUPPORT_END : existing.end || DEFAULT_SUPPORT_END
          }
        }
      };
    });
  }, []);

  const handleSupportTimeChange = useCallback((dayId, field, value) => {
    setOperationsForm((current) => ({
      ...current,
      supportHours: {
        ...current.supportHours,
        [dayId]: {
          ...current.supportHours[dayId],
          [field]: value
        }
      }
    }));
  }, []);

  const handleAddSocialLink = useCallback(() => {
    setOperationsForm((current) => ({
      ...current,
      socialLinks: [
        ...current.socialLinks,
        { id: generateLocalId('social'), label: '', url: '' }
      ]
    }));
  }, []);

  const handleSocialLinkChange = useCallback((index, field, value) => {
    setOperationsForm((current) => ({
      ...current,
      socialLinks: current.socialLinks.map((link, linkIndex) =>
        linkIndex === index ? { ...link, [field]: value } : link
      )
    }));
  }, []);

  const handleRemoveSocialLink = useCallback((index) => {
    setOperationsForm((current) => ({
      ...current,
      socialLinks: current.socialLinks.filter((_, linkIndex) => linkIndex !== index)
    }));
  }, []);

  const handleOperationsSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (operationsSaving) return;
      setOperationsSaving(true);
      setOperationsStatus(null);
      try {
        const supportHoursPayload = {};
        for (const day of supportDays) {
          const entry = operationsForm.supportHours?.[day.id] ?? {
            enabled: false,
            start: DEFAULT_SUPPORT_START,
            end: DEFAULT_SUPPORT_END
          };
          supportHoursPayload[day.id] = entry.enabled
            ? { enabled: true, start: entry.start, end: entry.end }
            : { enabled: false, start: null, end: null };
        }
        const payload = {
          operationsNotes: operationsForm.operationsNotes,
          coverageNotes: operationsForm.coverageNotes,
          supportHours: supportHoursPayload,
          socialLinks: socialLinksToPayload(operationsForm.socialLinks)
        };
        const response = await updateProviderSettingsOperations(payload, { companyId });
        applySettings(response);
        setOperationsStatus({ type: 'success', message: 'Operations preferences updated.' });
      } catch (error) {
        setOperationsStatus({
          type: 'error',
          message: extractErrorMessage(error, 'Unable to update operations preferences.')
        });
      } finally {
        setOperationsSaving(false);
      }
    },
    [applySettings, companyId, operationsForm, operationsSaving, supportDays]
  );

  const openCreateContactModal = useCallback(() => {
    setContactMode('create');
    setEditingContactId(null);
    setContactDraft(createContactDraft({}, enums.contactTypes));
    setContactModalStatus(null);
    setIsContactModalOpen(true);
  }, [enums.contactTypes]);

  const openEditContactModal = useCallback(
    (contact) => {
      setContactMode('edit');
      setEditingContactId(contact.id);
      setContactDraft(createContactDraft(contact, enums.contactTypes));
      setContactModalStatus(null);
      setIsContactModalOpen(true);
    },
    [enums.contactTypes]
  );

  const closeContactModal = useCallback(() => {
    setIsContactModalOpen(false);
    setContactModalStatus(null);
    setContactDraft(createContactDraft({}, enums.contactTypes));
    setEditingContactId(null);
  }, [enums.contactTypes]);

  const handleContactDraftChange = useCallback((field, value) => {
    setContactDraft((current) => ({ ...current, [field]: value }));
  }, []);

  const handleSubmitContact = useCallback(
    async (event) => {
      event.preventDefault();
      if (contactsSaving) return;
      setContactsSaving(true);
      setContactModalStatus(null);
      setContactsStatus(null);
      try {
        const payload = {
          name: contactDraft.name,
          role: contactDraft.role,
          email: contactDraft.email,
          phone: contactDraft.phone,
          type: contactDraft.type,
          isPrimary: Boolean(contactDraft.isPrimary),
          notes: contactDraft.notes,
          avatarUrl: contactDraft.avatarUrl
        };
        const response = editingContactId
          ? await updateProviderSettingsContact(editingContactId, payload, { companyId })
          : await createProviderSettingsContact(payload, { companyId });
        applySettings(response);
        setContactsStatus({
          type: 'success',
          message: editingContactId ? 'Contact updated.' : 'Contact added.'
        });
        closeContactModal();
      } catch (error) {
        setContactModalStatus({
          type: 'error',
          message: extractErrorMessage(error, 'Unable to save contact.')
        });
      } finally {
        setContactsSaving(false);
      }
    },
    [applySettings, closeContactModal, companyId, contactDraft, contactsSaving, editingContactId]
  );

  const handleDeleteContact = useCallback(
    async (contact) => {
      if (!contact?.id) return;
      const confirmed =
        typeof window === 'undefined'
          ? true
          : window.confirm(`Remove ${contact.name} from your Fixnado escalation directory?`);
      if (!confirmed) return;
      setContactsSaving(true);
      setContactsStatus(null);
      try {
        const response = await deleteProviderSettingsContact(contact.id, { companyId });
        applySettings(response);
        setContactsStatus({ type: 'success', message: 'Contact removed.' });
      } catch (error) {
        setContactsStatus({
          type: 'error',
          message: extractErrorMessage(error, 'Unable to remove contact.')
        });
      } finally {
        setContactsSaving(false);
      }
    },
    [applySettings, companyId]
  );

  const openCreateCoverageModal = useCallback(() => {
    setCoverageMode('create');
    setEditingCoverageId(null);
    setCoverageDraft(createCoverageDraft({}, enums.serviceZones, enums.coverageTypes));
    setCoverageModalStatus(null);
    setIsCoverageModalOpen(true);
  }, [enums.coverageTypes, enums.serviceZones]);

  const openEditCoverageModal = useCallback(
    (entry) => {
      setCoverageMode('edit');
      setEditingCoverageId(entry.id);
      setCoverageDraft(createCoverageDraft(entry, enums.serviceZones, enums.coverageTypes));
      setCoverageModalStatus(null);
      setIsCoverageModalOpen(true);
    },
    [enums.coverageTypes, enums.serviceZones]
  );

  const closeCoverageModal = useCallback(() => {
    setIsCoverageModalOpen(false);
    setCoverageModalStatus(null);
    setCoverageDraft(createCoverageDraft({}, enums.serviceZones, enums.coverageTypes));
    setEditingCoverageId(null);
  }, [enums.coverageTypes, enums.serviceZones]);

  const handleCoverageDraftChange = useCallback((field, value) => {
    setCoverageDraft((current) => ({ ...current, [field]: value }));
  }, []);

  const handleCoverageMetadataChange = useCallback((index, field, value) => {
    setCoverageDraft((current) => ({
      ...current,
      metadataEntries: current.metadataEntries.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry
      )
    }));
  }, []);

  const handleAddCoverageMetadata = useCallback(() => {
    setCoverageDraft((current) => ({
      ...current,
      metadataEntries: [
        ...current.metadataEntries,
        { id: generateLocalId('metadata'), key: '', value: '' }
      ]
    }));
  }, []);

  const handleRemoveCoverageMetadata = useCallback((index) => {
    setCoverageDraft((current) => ({
      ...current,
      metadataEntries: current.metadataEntries.filter((_, entryIndex) => entryIndex !== index)
    }));
  }, []);

  const handleSubmitCoverage = useCallback(
    async (event) => {
      event.preventDefault();
      if (coverageSaving) return;
      setCoverageSaving(true);
      setCoverageModalStatus(null);
      setCoverageStatus(null);
      try {
        const payload = {
          zoneId: coverageDraft.zoneId,
          coverageType: coverageDraft.coverageType,
          slaMinutes: Number(coverageDraft.slaMinutes),
          maxCapacity: Number(coverageDraft.maxCapacity),
          notes: coverageDraft.notes,
          metadata: metadataEntriesToObject(coverageDraft.metadataEntries)
        };
        const response = editingCoverageId
          ? await updateProviderSettingsCoverage(editingCoverageId, payload, { companyId })
          : await createProviderSettingsCoverage(payload, { companyId });
        applySettings(response);
        setCoverageStatus({
          type: 'success',
          message: editingCoverageId ? 'Coverage updated.' : 'Coverage created.'
        });
        closeCoverageModal();
      } catch (error) {
        setCoverageModalStatus({
          type: 'error',
          message: extractErrorMessage(error, 'Unable to save coverage entry.')
        });
      } finally {
        setCoverageSaving(false);
      }
    },
    [applySettings, closeCoverageModal, companyId, coverageDraft, coverageSaving, editingCoverageId]
  );

  const handleDeleteCoverage = useCallback(
    async (entry) => {
      if (!entry?.id) return;
      const confirmed =
        typeof window === 'undefined'
          ? true
          : window.confirm(`Remove coverage for ${entry.zoneName || entry.zoneId}?`);
      if (!confirmed) return;
      setCoverageSaving(true);
      setCoverageStatus(null);
      try {
        const response = await deleteProviderSettingsCoverage(entry.id, { companyId });
        applySettings(response);
        setCoverageStatus({ type: 'success', message: 'Coverage removed.' });
      } catch (error) {
        setCoverageStatus({
          type: 'error',
          message: extractErrorMessage(error, 'Unable to remove coverage entry.')
        });
      } finally {
        setCoverageSaving(false);
      }
    },
    [applySettings, companyId]
  );

  if (loading) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
        <Spinner size="1.5rem" /> Loading provider profile settings…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4 rounded-3xl border border-rose-200 bg-rose-50 p-6 text-slate-700">
        <div>
          <h2 className="text-lg font-semibold text-rose-700">Unable to load profile settings</h2>
          <p className="text-sm text-rose-600">{loadError}</p>
        </div>
        <Button type="button" variant="secondary" icon={ArrowPathIcon} onClick={handleRefresh}>
          Retry loading
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-primary">Provider profile settings</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Maintain the information Fixnado surfaces to customers, dispatch, and finance. Updates sync instantly across storefronts, quotes, automation, and dashboards.
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" icon={ArrowPathIcon} onClick={handleRefresh}>
          Refresh snapshot
        </Button>
      </div>

      <div className="space-y-8">
        <IdentityForm
          form={identityForm}
          onChange={handleIdentityFieldChange}
          onSubmit={handleIdentitySubmit}
          saving={identitySaving}
          status={identityStatus}
          storefrontUrl={links.storefront}
        />

        <BrandingForm
          form={brandingForm}
          onFieldChange={handleBrandingFieldChange}
          onAddMedia={handleAddMedia}
          onMediaChange={handleMediaChange}
          onRemoveMedia={handleRemoveMedia}
          onSubmit={handleBrandingSubmit}
          saving={brandingSaving}
          status={brandingStatus}
        />

        <OperationsForm
          form={operationsForm}
          supportDays={supportDays}
          onFieldChange={handleOperationsFieldChange}
          onToggleSupportDay={handleToggleSupportDay}
          onSupportTimeChange={handleSupportTimeChange}
          onAddSocialLink={handleAddSocialLink}
          onSocialLinkChange={handleSocialLinkChange}
          onRemoveSocialLink={handleRemoveSocialLink}
          onSubmit={handleOperationsSubmit}
          saving={operationsSaving}
          status={operationsStatus}
        />

        <div className="grid gap-8 lg:grid-cols-2">
          <ContactsPanel
            contacts={contacts}
            loading={loading}
            status={contactsStatus}
            onCreate={openCreateContactModal}
            onEdit={openEditContactModal}
            onDelete={handleDeleteContact}
          />
          <CoveragePanel
            coverage={coverage}
            loading={loading}
            status={coverageStatus}
            onCreate={openCreateCoverageModal}
            onEdit={openEditCoverageModal}
            onDelete={handleDeleteCoverage}
          />
        </div>
      </div>

      <ContactModal
        open={isContactModalOpen}
        mode={contactMode}
        contact={contactDraft}
        contactTypes={enums.contactTypes.length ? enums.contactTypes : ['operations', 'support', 'finance']}
        onChange={handleContactDraftChange}
        onSubmit={handleSubmitContact}
        onClose={closeContactModal}
        saving={contactsSaving}
        status={contactModalStatus}
      />

      <CoverageModal
        open={isCoverageModalOpen}
        mode={coverageMode}
        coverage={coverageDraft}
        serviceZones={enums.serviceZones}
        coverageTypes={enums.coverageTypes.length ? enums.coverageTypes : ['primary', 'secondary', 'standby']}
        onChange={handleCoverageDraftChange}
        onMetadataChange={handleCoverageMetadataChange}
        onAddMetadata={handleAddCoverageMetadata}
        onRemoveMetadata={handleRemoveCoverageMetadata}
        onSubmit={handleSubmitCoverage}
        onClose={closeCoverageModal}
        saving={coverageSaving}
        status={coverageModalStatus}
      />
    </div>
  );
}

ProviderProfileSettingsWorkspace.propTypes = {
  section: PropTypes.shape({
    data: PropTypes.shape({
      companyId: PropTypes.string
    })
  })
};

ProviderProfileSettingsWorkspace.defaultProps = {
  section: null
};

export default ProviderProfileSettingsWorkspace;
