import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchProviderAdsWorkspace,
  createProviderCampaign,
  updateProviderCampaign,
  createProviderCampaignFlight,
  saveProviderTargeting,
  createProviderCreative,
  updateProviderCreative,
  deleteProviderCreative,
  saveProviderAudienceSegments,
  saveProviderPlacements,
  recordProviderMetrics
} from '../../../api/providerAdsClient.js';

export default function useProviderAdsWorkspace({ companyId, initialData = null } = {}) {
  const [workspace, setWorkspace] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const [mutating, setMutating] = useState(false);

  const loadWorkspace = useCallback(
    async ({ signal, force = false } = {}) => {
      if (!companyId && !force && !initialData) {
        return null;
      }
      setLoading(true);
      try {
        const response = await fetchProviderAdsWorkspace({ companyId }, { signal });
        const payload = response?.data ?? response;
        setWorkspace(payload || null);
        setError(null);
        return payload;
      } catch (err) {
        if (err.name === 'AbortError') {
          return null;
        }
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [companyId, initialData]
  );

  useEffect(() => {
    if (!initialData) {
      const controller = new AbortController();
      loadWorkspace({ signal: controller.signal }).catch(() => {});
      return () => controller.abort();
    }
    return undefined;
  }, [initialData, loadWorkspace]);

  const runMutation = useCallback(
    async (mutator) => {
      setMutating(true);
      try {
        const result = await mutator();
        await loadWorkspace({ force: true });
        return result;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setMutating(false);
      }
    },
    [loadWorkspace]
  );

  const actions = useMemo(
    () => ({
      refresh: () => loadWorkspace({ force: true }),
      async createCampaign(payload) {
        const body = { ...payload, companyId };
        return runMutation(() => createProviderCampaign(body));
      },
      async updateCampaign(campaignId, payload) {
        const body = { ...payload, companyId };
        return runMutation(() => updateProviderCampaign(campaignId, body));
      },
      async createFlight(campaignId, payload) {
        const body = { ...payload, companyId };
        return runMutation(() => createProviderCampaignFlight(campaignId, body));
      },
      async saveTargeting(campaignId, rules) {
        const body = { companyId, rules };
        return runMutation(() => saveProviderTargeting(campaignId, body));
      },
      async createCreative(campaignId, payload) {
        const body = { ...payload, companyId };
        return runMutation(() => createProviderCreative(campaignId, body));
      },
      async updateCreative(campaignId, creativeId, payload) {
        const body = { ...payload, companyId };
        return runMutation(() => updateProviderCreative(campaignId, creativeId, body));
      },
      async deleteCreative(campaignId, creativeId) {
        return runMutation(() => deleteProviderCreative(campaignId, creativeId));
      },
      async saveAudienceSegments(campaignId, segments) {
        const body = { companyId, segments };
        return runMutation(() => saveProviderAudienceSegments(campaignId, body));
      },
      async savePlacements(campaignId, placements) {
        const body = { companyId, placements };
        return runMutation(() => saveProviderPlacements(campaignId, body));
      },
      async recordMetrics(campaignId, payload) {
        const body = { ...payload, companyId };
        return runMutation(() => recordProviderMetrics(campaignId, body));
      }
    }),
    [companyId, loadWorkspace, runMutation]
  );

  return {
    data: workspace,
    loading,
    error,
    mutating,
    actions
  };
}
