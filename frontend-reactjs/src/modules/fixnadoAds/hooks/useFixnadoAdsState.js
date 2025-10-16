import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  listFixnadoCampaigns,
  createFixnadoCampaign,
  getFixnadoCampaign,
  updateFixnadoCampaign,
  createFixnadoFlight,
  saveFixnadoTargetingRules,
  recordFixnadoMetric,
  listFixnadoFraudSignals,
  resolveFixnadoFraudSignal,
  getFixnadoCampaignSummary,
  listFixnadoCreatives,
  createFixnadoCreative,
  updateFixnadoCreative,
  deleteFixnadoCreative
} from '../../../api/fixnadoAdsClient.js';

const defaultSummary = (initialSnapshot) => {
  if (!initialSnapshot || typeof initialSnapshot !== 'object') {
    return null;
  }
  if (initialSnapshot.summary) {
    return initialSnapshot.summary;
  }
  if (initialSnapshot.data && initialSnapshot.data.summary) {
    return initialSnapshot.data.summary;
  }
  return null;
};

const defaultCampaignSeed = (initialSnapshot) => {
  if (!initialSnapshot) {
    return [];
  }
  if (Array.isArray(initialSnapshot.campaigns)) {
    return initialSnapshot.campaigns;
  }
  if (initialSnapshot.data && Array.isArray(initialSnapshot.data.campaigns)) {
    return initialSnapshot.data.campaigns;
  }
  return [];
};

const defaultCreativesSeed = (initialSnapshot) => {
  if (!initialSnapshot) {
    return [];
  }
  if (Array.isArray(initialSnapshot.creatives)) {
    return initialSnapshot.creatives;
  }
  if (initialSnapshot.data && Array.isArray(initialSnapshot.data.creatives)) {
    return initialSnapshot.data.creatives;
  }
  return [];
};

const defaultTargetingSeed = (initialSnapshot) => {
  if (!initialSnapshot) {
    return [];
  }
  if (Array.isArray(initialSnapshot.targetingRules)) {
    return initialSnapshot.targetingRules;
  }
  if (initialSnapshot.data && Array.isArray(initialSnapshot.data.targetingRules)) {
    return initialSnapshot.data.targetingRules;
  }
  return [];
};

const defaultMetricsSeed = (initialSnapshot) => {
  if (!initialSnapshot) {
    return [];
  }
  if (Array.isArray(initialSnapshot.metrics)) {
    return initialSnapshot.metrics;
  }
  if (initialSnapshot.data && Array.isArray(initialSnapshot.data.metrics)) {
    return initialSnapshot.data.metrics;
  }
  return [];
};

function buildCampaignForm(campaign, network) {
  if (!campaign) {
    return null;
  }

  return {
    id: campaign.id ?? '',
    companyId: campaign.companyId ?? campaign.metadata?.companyId ?? '',
    name: campaign.name ?? '',
    objective: campaign.objective ?? '',
    campaignType: campaign.campaignType ?? 'ppc',
    status: campaign.status ?? 'draft',
    pacingStrategy: campaign.pacingStrategy ?? 'even',
    bidStrategy: campaign.bidStrategy ?? 'cpc',
    currency: campaign.currency ?? 'GBP',
    totalBudget: campaign.totalBudget != null ? String(campaign.totalBudget) : '',
    dailySpendCap: campaign.dailySpendCap != null ? String(campaign.dailySpendCap) : '',
    startAt: campaign.startAt ? campaign.startAt.slice(0, 10) : '',
    endAt: campaign.endAt ? campaign.endAt.slice(0, 10) : '',
    timezone: campaign.timezone ?? 'Europe/London',
    metadata: { ...(campaign.metadata ?? {}), network }
  };
}

function createEmptyCampaignForm(network) {
  return {
    id: '',
    companyId: '',
    name: '',
    objective: '',
    campaignType: 'ppc',
    status: 'draft',
    pacingStrategy: 'even',
    bidStrategy: 'cpc',
    currency: 'GBP',
    totalBudget: '',
    dailySpendCap: '',
    startAt: '',
    endAt: '',
    timezone: 'Europe/London',
    metadata: { network }
  };
}

function normaliseTargetingRule(rule) {
  if (!rule) {
    return {
      id: null,
      ruleType: 'zone',
      operator: 'include',
      value: '',
      payload: {}
    };
  }

  const payload = rule.payload && typeof rule.payload === 'object' ? rule.payload : {};
  const value = typeof payload.value === 'string' ? payload.value : payload.slug || payload.code || '';

  return {
    id: rule.id ?? null,
    ruleType: rule.ruleType ?? 'zone',
    operator: rule.operator ?? 'include',
    value,
    payload
  };
}

function createEmptyTargetingRule() {
  return {
    id: null,
    ruleType: 'zone',
    operator: 'include',
    value: '',
    payload: {}
  };
}

function prepareCampaignPayload(form, network) {
  if (!form) {
    return null;
  }

  const startAt = form.startAt ? new Date(form.startAt) : null;
  const endAt = form.endAt ? new Date(form.endAt) : null;

  return {
    companyId: form.companyId || undefined,
    name: form.name,
    objective: form.objective,
    campaignType: form.campaignType || 'ppc',
    status: form.status || 'draft',
    pacingStrategy: form.pacingStrategy || 'even',
    bidStrategy: form.bidStrategy || 'cpc',
    currency: form.currency || 'GBP',
    totalBudget:
      form.totalBudget !== '' && form.totalBudget !== null
        ? Number.parseFloat(form.totalBudget)
        : undefined,
    dailySpendCap:
      form.dailySpendCap !== '' && form.dailySpendCap !== null
        ? Number.parseFloat(form.dailySpendCap)
        : null,
    startAt: startAt && !Number.isNaN(startAt.getTime()) ? startAt.toISOString() : null,
    endAt: endAt && !Number.isNaN(endAt.getTime()) ? endAt.toISOString() : null,
    timezone: form.timezone || 'Europe/London',
    metadata: { ...(form.metadata || {}), network }
  };
}

function normaliseCampaignListPayload(payload) {
  if (!payload) {
    return [];
  }
  if (Array.isArray(payload.data)) {
    return payload.data;
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  return [];
}

export function useFixnadoAdsState({ network = 'fixnado', initialSnapshot = {} } = {}) {
  const seededCampaigns = useMemo(() => defaultCampaignSeed(initialSnapshot), [initialSnapshot]);
  const seededSummary = useMemo(() => defaultSummary(initialSnapshot), [initialSnapshot]);
  const seededCreatives = useMemo(() => defaultCreativesSeed(initialSnapshot), [initialSnapshot]);
  const seededTargeting = useMemo(() => defaultTargetingSeed(initialSnapshot), [initialSnapshot]);
  const seededMetrics = useMemo(() => defaultMetricsSeed(initialSnapshot), [initialSnapshot]);

  const [campaigns, setCampaigns] = useState(() => seededCampaigns);
  const [campaignsMeta, setCampaignsMeta] = useState(() => ({ count: seededCampaigns.length }));
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignsError, setCampaignsError] = useState(null);
  const [filters, setFilters] = useState({ status: 'all', search: '' });

  const [activeCampaignId, setActiveCampaignId] = useState(null);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [campaignForm, setCampaignForm] = useState(null);
  const [creationDraft, setCreationDraft] = useState(null);
  const [summary, setSummary] = useState(seededSummary);
  const [fraudSignals, setFraudSignals] = useState([]);
  const [flights, setFlights] = useState([]);
  const [metrics, setMetrics] = useState(seededMetrics);
  const [creatives, setCreatives] = useState(seededCreatives);
  const [targetingDraft, setTargetingDraft] = useState(seededTargeting.map((rule) => normaliseTargetingRule(rule)));

  const [campaignDetailLoading, setCampaignDetailLoading] = useState(false);
  const [campaignDetailError, setCampaignDetailError] = useState(null);
  const [saving, setSaving] = useState({
    campaign: false,
    flight: false,
    targeting: false,
    metric: false,
    creative: false,
    resolveSignal: false
  });
  const [feedback, setFeedback] = useState(null);

  const loadCampaigns = useCallback(async () => {
    setCampaignsLoading(true);
    setCampaignsError(null);
    try {
      const payload = await listFixnadoCampaigns({
        status: filters.status === 'all' ? undefined : filters.status,
        search: filters.search || undefined
      });
      const data = normaliseCampaignListPayload(payload);
      setCampaigns(data);
      setCampaignsMeta(payload?.meta ?? { count: data.length });
    } catch (error) {
      console.error('Failed to load Fixnado campaigns', error);
      setCampaignsError(error?.message ?? 'Unable to load Fixnado campaigns');
    } finally {
      setCampaignsLoading(false);
    }
  }, [filters.search, filters.status]);

  const resetCampaignDetail = useCallback(() => {
    setActiveCampaign(null);
    setCampaignForm(null);
    setSummary(null);
    setFraudSignals([]);
    setFlights([]);
    setMetrics([]);
    setCreatives([]);
    setTargetingDraft([]);
    setCampaignDetailError(null);
  }, []);

  const loadCampaignDetail = useCallback(
    async (campaignId) => {
      if (!campaignId) {
        resetCampaignDetail();
        return;
      }

      setCampaignDetailLoading(true);
      setCampaignDetailError(null);
      try {
        const [campaignPayload, summaryPayload, signalsPayload, creativesPayload] = await Promise.all([
          getFixnadoCampaign(campaignId, { includeMetrics: true, includeFraudSignals: true }),
          getFixnadoCampaignSummary(campaignId),
          listFixnadoFraudSignals(campaignId),
          listFixnadoCreatives(campaignId)
        ]);

        const campaignData = campaignPayload?.data ?? campaignPayload ?? null;
        setActiveCampaign(campaignData);
        setCampaignForm(buildCampaignForm(campaignData, network));
        setFlights(campaignData?.flights ?? []);
        setMetrics((campaignData?.dailyMetrics ?? []).slice().sort((a, b) => new Date(b.metricDate) - new Date(a.metricDate)));
        setTargetingDraft((campaignData?.targetingRules ?? []).map((rule) => normaliseTargetingRule(rule)));
        setSummary(summaryPayload?.data ?? summaryPayload ?? null);
        setFraudSignals(signalsPayload?.data ?? signalsPayload ?? []);
        setCreatives(creativesPayload?.data ?? creativesPayload ?? campaignData?.creatives ?? []);
      } catch (error) {
        console.error('Failed to load Fixnado campaign detail', error);
        setCampaignDetailError(error?.message ?? 'Unable to load campaign detail');
      } finally {
        setCampaignDetailLoading(false);
      }
    },
    [network, resetCampaignDetail]
  );

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  useEffect(() => {
    if (activeCampaignId) {
      setCreationDraft(null);
      loadCampaignDetail(activeCampaignId);
    } else {
      resetCampaignDetail();
    }
  }, [activeCampaignId, loadCampaignDetail, resetCampaignDetail]);

  const setFilter = useCallback((name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
  }, []);

  const handleSearchChange = useCallback((event) => {
    setFilter('search', event.target.value);
  }, [setFilter]);

  const handleStatusChange = useCallback((event) => {
    setFilter('status', event.target.value);
  }, [setFilter]);

  const selectCampaign = useCallback((campaignId) => {
    setFeedback(null);
    setCreationDraft(null);
    setActiveCampaignId(campaignId);
  }, []);

  const startCreateCampaign = useCallback(() => {
    setFeedback(null);
    setActiveCampaignId(null);
    setCreationDraft(createEmptyCampaignForm(network));
    resetCampaignDetail();
  }, [network, resetCampaignDetail]);

  const cancelCreateCampaign = useCallback(() => {
    setCreationDraft(null);
    setFeedback(null);
  }, []);

  const updateCreationDraft = useCallback((field, value) => {
    setCreationDraft((current) => ({ ...(current ?? createEmptyCampaignForm(network)), [field]: value }));
  }, [network]);

  const updateCampaignField = useCallback((field, value) => {
    setCampaignForm((current) => (current ? { ...current, [field]: value } : current));
  }, []);

  const createCampaignAction = useCallback(async () => {
    if (!creationDraft) {
      return null;
    }
    const payload = prepareCampaignPayload(creationDraft, network);
    setSaving((current) => ({ ...current, campaign: true }));
    setFeedback(null);
    try {
      const response = await createFixnadoCampaign(payload);
      const created = response?.data ?? response ?? null;
      setCreationDraft(null);
      await loadCampaigns();
      if (created?.id) {
        setActiveCampaignId(created.id);
      }
      setFeedback({ type: 'success', message: 'Campaign created successfully.' });
      return created;
    } catch (error) {
      console.error('Failed to create Fixnado campaign', error);
      setFeedback({ type: 'error', message: error?.message ?? 'Unable to create campaign' });
      throw error;
    } finally {
      setSaving((current) => ({ ...current, campaign: false }));
    }
  }, [creationDraft, loadCampaigns, network]);

  const updateCampaignAction = useCallback(async () => {
    if (!campaignForm || !activeCampaignId) {
      return null;
    }
    const payload = prepareCampaignPayload(campaignForm, network);
    setSaving((current) => ({ ...current, campaign: true }));
    setFeedback(null);
    try {
      const response = await updateFixnadoCampaign(activeCampaignId, payload);
      const updated = response?.data ?? response ?? null;
      await Promise.all([loadCampaigns(), loadCampaignDetail(activeCampaignId)]);
      setFeedback({ type: 'success', message: 'Campaign updated successfully.' });
      return updated;
    } catch (error) {
      console.error('Failed to update Fixnado campaign', error);
      setFeedback({ type: 'error', message: error?.message ?? 'Unable to update campaign' });
      throw error;
    } finally {
      setSaving((current) => ({ ...current, campaign: false }));
    }
  }, [activeCampaignId, campaignForm, loadCampaignDetail, loadCampaigns, network]);

  const addFlight = useCallback(
    async (flightDraft) => {
      if (!activeCampaignId) {
        return null;
      }
      setSaving((current) => ({ ...current, flight: true }));
      setFeedback(null);
      try {
        const response = await createFixnadoFlight(activeCampaignId, flightDraft);
        const created = response?.data ?? response ?? null;
        await loadCampaignDetail(activeCampaignId);
        setFeedback({ type: 'success', message: 'Flight added to campaign.' });
        return created;
      } catch (error) {
        console.error('Failed to create Fixnado flight', error);
        setFeedback({ type: 'error', message: error?.message ?? 'Unable to add flight' });
        throw error;
      } finally {
        setSaving((current) => ({ ...current, flight: false }));
      }
    },
    [activeCampaignId, loadCampaignDetail]
  );

  const addTargetingRule = useCallback(() => {
    setTargetingDraft((current) => [...current, createEmptyTargetingRule()]);
  }, []);

  const updateTargetingRule = useCallback((index, field, value) => {
    setTargetingDraft((current) =>
      current.map((rule, idx) => (idx === index ? { ...rule, [field]: value } : rule))
    );
  }, []);

  const removeTargetingRule = useCallback((index) => {
    setTargetingDraft((current) => current.filter((_, idx) => idx !== index));
  }, []);

  const saveTargeting = useCallback(async () => {
    if (!activeCampaignId) {
      return null;
    }
    setSaving((current) => ({ ...current, targeting: true }));
    setFeedback(null);
    try {
      const payload = targetingDraft.map((rule) => ({
        id: rule.id,
        ruleType: rule.ruleType,
        operator: rule.operator,
        payload: { ...rule.payload, value: rule.value }
      }));
      const response = await saveFixnadoTargetingRules(activeCampaignId, payload);
      const saved = response?.data ?? response ?? [];
      setTargetingDraft(saved.map((rule) => normaliseTargetingRule(rule)));
      setFeedback({ type: 'success', message: 'Targeting rules updated.' });
      return saved;
    } catch (error) {
      console.error('Failed to save targeting rules', error);
      setFeedback({ type: 'error', message: error?.message ?? 'Unable to update targeting rules' });
      throw error;
    } finally {
      setSaving((current) => ({ ...current, targeting: false }));
    }
  }, [activeCampaignId, targetingDraft]);

  const recordMetricAction = useCallback(
    async (metricDraft) => {
      if (!activeCampaignId) {
        return null;
      }
      setSaving((current) => ({ ...current, metric: true }));
      setFeedback(null);
      try {
        const response = await recordFixnadoMetric(activeCampaignId, metricDraft);
        const created = response?.data ?? response ?? null;
        if (created) {
          setMetrics((current) => [created, ...current]);
        }
        setFeedback({ type: 'success', message: 'Metric recorded.' });
        return created;
      } catch (error) {
        console.error('Failed to record metric', error);
        setFeedback({ type: 'error', message: error?.message ?? 'Unable to record metric' });
        throw error;
      } finally {
        setSaving((current) => ({ ...current, metric: false }));
      }
    },
    [activeCampaignId]
  );

  const resolveFraudSignalAction = useCallback(
    async (signalId, note) => {
      if (!signalId) {
        return null;
      }
      setSaving((current) => ({ ...current, resolveSignal: true }));
      setFeedback(null);
      try {
        const response = await resolveFixnadoFraudSignal(signalId, note ? { note } : {});
        const resolved = response?.data ?? response ?? null;
        if (resolved) {
          setFraudSignals((current) =>
            current.map((signal) => (signal.id === resolved.id ? resolved : signal))
          );
        }
        setFeedback({ type: 'success', message: 'Fraud signal resolved.' });
        return resolved;
      } catch (error) {
        console.error('Failed to resolve fraud signal', error);
        setFeedback({ type: 'error', message: error?.message ?? 'Unable to resolve fraud signal' });
        throw error;
      } finally {
        setSaving((current) => ({ ...current, resolveSignal: false }));
      }
    },
    []
  );

  const addCreativeAction = useCallback(
    async (creativeDraft) => {
      if (!activeCampaignId) {
        return null;
      }
      setSaving((current) => ({ ...current, creative: true }));
      setFeedback(null);
      try {
        const response = await createFixnadoCreative(activeCampaignId, creativeDraft);
        const created = response?.data ?? response ?? null;
        if (created) {
          setCreatives((current) => [created, ...current]);
        }
        setFeedback({ type: 'success', message: 'Creative added.' });
        return created;
      } catch (error) {
        console.error('Failed to create creative', error);
        setFeedback({ type: 'error', message: error?.message ?? 'Unable to create creative' });
        throw error;
      } finally {
        setSaving((current) => ({ ...current, creative: false }));
      }
    },
    [activeCampaignId]
  );

  const updateCreativeAction = useCallback(async (creativeId, updates) => {
    if (!creativeId) {
      return null;
    }
    setFeedback(null);
    try {
      const response = await updateFixnadoCreative(creativeId, updates);
      const updated = response?.data ?? response ?? null;
      if (updated) {
        setCreatives((current) => current.map((creative) => (creative.id === updated.id ? updated : creative)));
      }
      setFeedback({ type: 'success', message: 'Creative updated.' });
      return updated;
    } catch (error) {
      console.error('Failed to update creative', error);
      setFeedback({ type: 'error', message: error?.message ?? 'Unable to update creative' });
      throw error;
    }
  }, []);

  const removeCreativeAction = useCallback(async (creativeId) => {
    if (!creativeId) {
      return null;
    }
    setSaving((current) => ({ ...current, creative: true }));
    setFeedback(null);
    try {
      await deleteFixnadoCreative(creativeId);
      setCreatives((current) => current.filter((creative) => creative.id !== creativeId));
      setFeedback({ type: 'success', message: 'Creative removed.' });
      return true;
    } catch (error) {
      console.error('Failed to delete creative', error);
      setFeedback({ type: 'error', message: error?.message ?? 'Unable to delete creative' });
      throw error;
    } finally {
      setSaving((current) => ({ ...current, creative: false }));
    }
  }, []);

  const clearFeedback = useCallback(() => setFeedback(null), []);

  const isCreating = Boolean(creationDraft);

  return {
    network,
    data: {
      campaigns,
      campaignsMeta,
      campaignsLoading,
      campaignsError,
      filters,
      activeCampaignId,
      activeCampaign,
      campaignForm,
      creationDraft,
      isCreating,
      campaignDetailLoading,
      campaignDetailError,
      summary,
      fraudSignals,
      flights,
      metrics,
      creatives,
      targetingDraft,
      saving,
      feedback
    },
    actions: {
      refreshCampaigns: loadCampaigns,
      handleSearchChange,
      handleStatusChange,
      setFilter,
      selectCampaign,
      startCreateCampaign,
      cancelCreateCampaign,
      updateCreationDraft,
      updateCampaignField,
      createCampaign: createCampaignAction,
      updateCampaign: updateCampaignAction,
      addFlight,
      addTargetingRule,
      updateTargetingRule,
      removeTargetingRule,
      saveTargeting,
      recordMetric: recordMetricAction,
      resolveFraudSignal: resolveFraudSignalAction,
      addCreative: addCreativeAction,
      updateCreative: updateCreativeAction,
      removeCreative: removeCreativeAction,
      reloadCampaign: () => (activeCampaignId ? loadCampaignDetail(activeCampaignId) : resetCampaignDetail()),
      clearFeedback
    }
  };
}

export default useFixnadoAdsState;
