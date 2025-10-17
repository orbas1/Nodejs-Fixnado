import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createProviderEnterpriseUpgrade,
  updateProviderEnterpriseUpgrade
} from '../../../api/panelClient.js';

const DEFAULT_FORM = {
  id: null,
  status: 'draft',
  summary: '',
  requestedAt: '',
  targetGoLive: '',
  lastDecisionAt: '',
  seats: '',
  contractValue: '',
  currency: 'GBP',
  automationScope: '',
  enterpriseFeatures: [],
  onboardingManager: '',
  notes: '',
  contacts: [],
  sites: [],
  checklist: [],
  documents: []
};

const DEFAULT_REMOVED_IDS = {
  contacts: [],
  sites: [],
  checklist: [],
  documents: []
};

const createRemovedIdsState = () => ({
  contacts: [],
  sites: [],
  checklist: [],
  documents: []
});

const ensureUniqueFeatures = (features = []) => Array.from(new Set(features.filter(Boolean)));

const toDateInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 10);
};

const createTempId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `tmp-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

const coerceNullableNumber = (value) => {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normaliseForm = (upgrade) => {
  if (!upgrade) {
    return { ...DEFAULT_FORM };
  }

  return {
    id: upgrade.id ?? null,
    status: upgrade.status ?? 'draft',
    summary: upgrade.summary ?? '',
    requestedAt: upgrade.requestedAt ? toDateInputValue(upgrade.requestedAt) : '',
    targetGoLive: upgrade.targetGoLive ? toDateInputValue(upgrade.targetGoLive) : '',
    lastDecisionAt: upgrade.lastDecisionAt ? toDateInputValue(upgrade.lastDecisionAt) : '',
    seats: upgrade.seats != null ? String(upgrade.seats) : '',
    contractValue:
      upgrade.contractValue != null && !Number.isNaN(Number(upgrade.contractValue))
        ? String(upgrade.contractValue)
        : '',
    currency: upgrade.currency ?? 'GBP',
    automationScope: upgrade.automationScope ?? '',
    enterpriseFeatures: Array.isArray(upgrade.enterpriseFeatures)
      ? ensureUniqueFeatures(upgrade.enterpriseFeatures)
      : [],
    onboardingManager: upgrade.onboardingManager ?? '',
    notes: upgrade.notes ?? '',
    contacts: (upgrade.contacts ?? []).map((contact) => ({
      ...contact,
      clientId: createTempId()
    })),
    sites: (upgrade.sites ?? []).map((site) => ({
      ...site,
      headcount: site.headcount != null ? String(site.headcount) : '',
      goLiveDate: site.goLiveDate ? toDateInputValue(site.goLiveDate) : '',
      clientId: createTempId()
    })),
    checklist: (upgrade.checklist ?? []).map((item, index) => ({
      ...item,
      dueDate: item.dueDate ? toDateInputValue(item.dueDate) : '',
      sortOrder: item.sortOrder ?? index,
      clientId: createTempId()
    })),
    documents: (upgrade.documents ?? []).map((doc) => ({
      ...doc,
      clientId: createTempId()
    }))
  };
};

export function useEnterpriseUpgradeForm(initialUpgrade, { onRefresh } = {}) {
  const [record, setRecord] = useState(initialUpgrade ?? null);
  const [form, setForm] = useState(() => normaliseForm(initialUpgrade));
  const [removedIds, setRemovedIds] = useState(() => createRemovedIdsState());
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setRecord(initialUpgrade ?? null);
    setForm(normaliseForm(initialUpgrade));
    setRemovedIds(createRemovedIdsState());
  }, [initialUpgrade]);

  const statusTone = useMemo(() => {
    switch (form.status) {
      case 'approved':
        return 'success';
      case 'in_review':
      case 'submitted':
        return 'info';
      case 'rejected':
      case 'deferred':
        return 'danger';
      default:
        return 'neutral';
    }
  }, [form.status]);

  const setField = useCallback((field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  }, []);

  const toggleFeature = useCallback((value) => {
    setForm((current) => {
      const exists = current.enterpriseFeatures.includes(value);
      const nextFeatures = exists
        ? current.enterpriseFeatures.filter((entry) => entry !== value)
        : [...current.enterpriseFeatures, value];
      return { ...current, enterpriseFeatures: ensureUniqueFeatures(nextFeatures) };
    });
  }, []);

  const updateArrayField = useCallback((section, index, field, value) => {
    setForm((current) => {
      const nextSection = current[section].map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry
      );
      return { ...current, [section]: nextSection };
    });
  }, []);

  const updateArrayBoolean = useCallback((section, index, field, value) => {
    setForm((current) => {
      const nextSection = current[section].map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: Boolean(value) } : entry
      );
      return { ...current, [section]: nextSection };
    });
  }, []);

  const addArrayEntry = useCallback((section, template) => {
    setForm((current) => ({
      ...current,
      [section]: [...current[section], { ...template, clientId: createTempId() }]
    }));
  }, []);

  const removeArrayEntry = useCallback((section, index) => {
    setForm((current) => {
      const entry = current[section][index];
      const nextSection = current[section].filter((_, entryIndex) => entryIndex !== index);
      setRemovedIds((prev) => {
        if (entry?.id) {
          return { ...prev, [section]: [...prev[section], entry.id] };
        }
        return prev;
      });
      return { ...current, [section]: nextSection };
    });
  }, []);

  const buildPayload = useCallback(() => ({
    status: form.status,
    summary: form.summary || null,
    requestedAt: form.requestedAt || null,
    targetGoLive: form.targetGoLive || null,
    lastDecisionAt: form.lastDecisionAt || null,
    seats: coerceNullableNumber(form.seats),
    contractValue: coerceNullableNumber(form.contractValue),
    currency: form.currency || 'GBP',
    automationScope: form.automationScope || null,
    enterpriseFeatures: ensureUniqueFeatures(form.enterpriseFeatures),
    onboardingManager: form.onboardingManager || null,
    notes: form.notes || null,
    contacts: form.contacts.map(({ clientId, ...contact }) => ({
      id: contact.id || undefined,
      name: contact.name,
      role: contact.role || null,
      email: contact.email || null,
      phone: contact.phone || null,
      influenceLevel: contact.influenceLevel || null,
      primaryContact: Boolean(contact.primaryContact)
    })),
    sites: form.sites.map(({ clientId, goLiveDate, ...site }) => ({
      id: site.id || undefined,
      siteName: site.siteName,
      region: site.region || null,
      headcount: coerceNullableNumber(site.headcount),
      goLiveDate: goLiveDate || null,
      imageUrl: site.imageUrl || null,
      notes: site.notes || null
    })),
    checklist: form.checklist.map(({ clientId, ...item }, index) => ({
      id: item.id || undefined,
      label: item.label,
      status: item.status,
      owner: item.owner || null,
      dueDate: item.dueDate || null,
      notes: item.notes || null,
      sortOrder: item.sortOrder ?? index
    })),
    documents: form.documents.map(({ clientId, ...doc }) => ({
      id: doc.id || undefined,
      title: doc.title,
      type: doc.type || null,
      url: doc.url,
      thumbnailUrl: doc.thumbnailUrl || null,
      description: doc.description || null
    })),
    removedContactIds: removedIds.contacts,
    removedSiteIds: removedIds.sites,
    removedChecklistIds: removedIds.checklist,
    removedDocumentIds: removedIds.documents
  }), [form, removedIds]);

  const createWorkspace = useCallback(async () => {
    setCreating(true);
    setError(null);
    setMessage(null);
    try {
      const result = await createProviderEnterpriseUpgrade({ status: 'draft' });
      setRecord(result ?? null);
      setForm(normaliseForm(result));
      setRemovedIds(createRemovedIdsState());
      setMessage('Enterprise upgrade workspace created.');
      onRefresh?.();
    } catch (err) {
      setError(err?.message || 'Unable to create enterprise upgrade workspace.');
    } finally {
      setCreating(false);
    }
  }, [onRefresh]);

  const saveWorkspace = useCallback(async () => {
    const requestId = form.id || record?.id;
    if (!requestId) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const result = await updateProviderEnterpriseUpgrade(requestId, buildPayload());
      setRecord(result ?? null);
      setForm(normaliseForm(result));
      setRemovedIds(createRemovedIdsState());
      setMessage('Enterprise upgrade plan updated.');
      onRefresh?.();
    } catch (err) {
      setError(err?.message || 'Unable to save enterprise upgrade.');
    } finally {
      setSaving(false);
    }
  }, [buildPayload, form.id, onRefresh, record?.id]);

  const showCreateState = !record?.id;

  return {
    record,
    form,
    statusTone,
    showCreateState,
    message,
    error,
    saving,
    creating,
    setField,
    toggleFeature,
    updateArrayField,
    updateArrayBoolean,
    addArrayEntry,
    removeArrayEntry,
    createWorkspace,
    saveWorkspace,
    setError,
    setMessage
  };
}

export const enterpriseUpgradeFormUtils = {
  normaliseForm,
  createTempId,
  coerceNullableNumber,
  ensureUniqueFeatures,
  DEFAULT_FORM,
  DEFAULT_REMOVED_IDS
};
