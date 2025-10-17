import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchByokState,
  saveByokProfile,
  createByokConnector,
  updateByokConnector,
  deleteByokConnector,
  rotateByokConnector,
  runByokDiagnostic
} from '../../../api/servicemanByokClient.js';

const PROVIDER_OPTIONS = ['openai', 'slack', 'microsoft', 'google', 'custom'];
const ENVIRONMENT_OPTIONS = ['production', 'staging', 'sandbox'];
const STATUS_OPTIONS = ['active', 'disabled', 'pending', 'revoked'];

const defaultProfileDraft = (profile) => ({
  displayName: profile?.displayName ?? '',
  defaultProvider: profile?.defaultProvider ?? 'openai',
  defaultEnvironment: profile?.defaultEnvironment ?? 'production',
  rotationPolicyDays: String(profile?.rotationPolicyDays ?? 90),
  allowSelfProvisioning: Boolean(profile?.allowSelfProvisioning),
  notes: profile?.notes ?? ''
});

const emptyConnectorDraft = {
  id: null,
  displayName: '',
  provider: 'openai',
  environment: 'production',
  status: 'active',
  scopesInput: '',
  notes: '',
  allowedProjects: '',
  secret: ''
};

const formatScopes = (input) =>
  input
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

export function useServicemanByokState(servicemanId) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileDraft, setProfileDraft] = useState(() => defaultProfileDraft(null));
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState(null);

  const [connectors, setConnectors] = useState([]);
  const [connectorDraft, setConnectorDraft] = useState(emptyConnectorDraft);
  const [connectorSaving, setConnectorSaving] = useState(false);
  const [connectorError, setConnectorError] = useState(null);
  const [activeConnectorId, setActiveConnectorId] = useState(null);
  const [showConnectorDrawer, setShowConnectorDrawer] = useState(false);
  const [pendingRotationConnector, setPendingRotationConnector] = useState(null);
  const [rotationSaving, setRotationSaving] = useState(false);

  const [diagnostics, setDiagnostics] = useState({});
  const [diagnosticRunning, setDiagnosticRunning] = useState(null);

  const [auditTrail, setAuditTrail] = useState([]);

  const resetConnectorDraft = useCallback(() => {
    setConnectorDraft(emptyConnectorDraft);
    setActiveConnectorId(null);
    setShowConnectorDrawer(false);
    setConnectorError(null);
  }, []);

  const loadState = useCallback(
    async ({ silent = false } = {}) => {
      if (!servicemanId) {
        return;
      }
      if (!silent) {
        setLoading(true);
      }
      setError(null);
      try {
        const response = await fetchByokState(servicemanId);
        const payload = response?.data ?? response;
        const nextProfile = payload?.profile ?? null;
        setProfile(nextProfile);
        setProfileDraft(defaultProfileDraft(nextProfile));
        setConnectors(Array.isArray(payload?.connectors) ? payload.connectors : []);
        setAuditTrail(Array.isArray(payload?.auditTrail) ? payload.auditTrail : []);
      } catch (caught) {
        console.error('[useServicemanByokState] failed to load BYOK state', caught);
        setError(caught?.message ?? 'Unable to load BYOK management state');
      } finally {
        setLoading(false);
      }
    },
    [servicemanId]
  );

  useEffect(() => {
    loadState();
  }, [loadState]);

  const profileMeta = useMemo(
    () => ({
      providers: PROVIDER_OPTIONS,
      environments: ENVIRONMENT_OPTIONS
    }),
    []
  );

  const handleProfileFieldChange = useCallback((field, value) => {
    setProfileDraft((current) => ({
      ...current,
      [field]: field === 'allowSelfProvisioning' ? Boolean(value) : value
    }));
  }, []);

  const saveProfileDraft = useCallback(async () => {
    if (!servicemanId) return;
    setProfileSaving(true);
    setProfileFeedback(null);
    setError(null);
    try {
      const payload = {
        displayName: profileDraft.displayName,
        defaultProvider: profileDraft.defaultProvider,
        defaultEnvironment: profileDraft.defaultEnvironment,
        rotationPolicyDays: Number.parseInt(profileDraft.rotationPolicyDays, 10) || 90,
        allowSelfProvisioning: Boolean(profileDraft.allowSelfProvisioning),
        notes: profileDraft.notes
      };
      const response = await saveByokProfile(servicemanId, payload);
      const nextProfile = response?.data ?? response;
      setProfile(nextProfile);
      setProfileDraft(defaultProfileDraft(nextProfile));
      setProfileFeedback('Profile settings saved');
      setTimeout(() => setProfileFeedback(null), 4000);
    } catch (caught) {
      console.error('[useServicemanByokState] failed to save BYOK profile', caught);
      setError(caught?.message ?? 'Unable to save profile settings');
    } finally {
      setProfileSaving(false);
    }
  }, [profileDraft, servicemanId]);

  const openConnectorForm = useCallback((connector = null) => {
    if (connector) {
      setActiveConnectorId(connector.id);
      setConnectorDraft({
        id: connector.id,
        displayName: connector.displayName ?? '',
        provider: connector.provider ?? 'openai',
        environment: connector.environment ?? 'production',
        status: connector.status ?? 'active',
        scopesInput: Array.isArray(connector.scopes) ? connector.scopes.join(', ') : '',
        notes: connector.metadata?.notes ?? '',
        allowedProjects: connector.metadata?.allowedProjects?.join?.(', ') ?? '',
        secret: ''
      });
    } else {
      setActiveConnectorId(null);
      setConnectorDraft(emptyConnectorDraft);
    }
    setConnectorError(null);
    setShowConnectorDrawer(true);
  }, []);

  const submitConnectorDraft = useCallback(
    async (overrides = {}) => {
      if (!servicemanId) return null;
      setConnectorSaving(true);
      setConnectorError(null);
      try {
        const draft = { ...connectorDraft, ...overrides };
        const payload = {
          displayName: draft.displayName.trim(),
          provider: draft.provider,
          environment: draft.environment,
          status: draft.status,
          scopes: formatScopes(draft.scopesInput),
          metadata: {
            notes: draft.notes?.trim() || undefined,
            allowedProjects: formatScopes(draft.allowedProjects ?? '')
          }
        };

        if (!draft.id) {
          payload.secret = draft.secret;
          if (!payload.secret || payload.secret.trim().length < 8) {
            throw new Error('Secret must be at least 8 characters for new connectors');
          }
          const response = await createByokConnector(servicemanId, payload);
          const created = response?.data ?? response;
          setConnectors((current) => [...current, created]);
          resetConnectorDraft();
          return created;
        }

        const response = await updateByokConnector(servicemanId, draft.id, payload);
        const updated = response?.data ?? response;
        setConnectors((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
        resetConnectorDraft();
        return updated;
      } catch (caught) {
        console.error('[useServicemanByokState] failed to persist connector', caught);
        setConnectorError(caught?.message ?? 'Unable to save connector');
        throw caught;
      } finally {
        setConnectorSaving(false);
      }
    },
    [connectorDraft, resetConnectorDraft, servicemanId]
  );

  const removeConnector = useCallback(
    async (connectorId) => {
      if (!servicemanId || !connectorId) return;
      setConnectorSaving(true);
      setConnectorError(null);
      try {
        await deleteByokConnector(servicemanId, connectorId);
        setConnectors((current) => current.filter((entry) => entry.id !== connectorId));
      } catch (caught) {
        console.error('[useServicemanByokState] failed to delete connector', caught);
        setConnectorError(caught?.message ?? 'Unable to delete connector');
      } finally {
        setConnectorSaving(false);
      }
    },
    [servicemanId]
  );

  const requestRotation = useCallback((connector) => {
    setPendingRotationConnector(connector);
  }, []);

  const submitRotation = useCallback(
    async (secret, metadata = {}) => {
      if (!servicemanId || !pendingRotationConnector?.id) return null;
      setRotationSaving(true);
      try {
        const response = await rotateByokConnector(servicemanId, pendingRotationConnector.id, {
          secret,
          metadata
        });
        const updated = response?.data ?? response;
        setConnectors((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
        setPendingRotationConnector(null);
        return updated;
      } catch (caught) {
        console.error('[useServicemanByokState] failed to rotate connector', caught);
        setConnectorError(caught?.message ?? 'Unable to rotate connector');
        throw caught;
      } finally {
        setRotationSaving(false);
      }
    },
    [pendingRotationConnector, servicemanId]
  );

  const runDiagnosticForConnector = useCallback(
    async (connectorId) => {
      if (!servicemanId || !connectorId) return null;
      setDiagnosticRunning(connectorId);
      try {
        const response = await runByokDiagnostic(servicemanId, connectorId);
        const result = response?.data ?? response;
        setDiagnostics((current) => ({
          ...current,
          [connectorId]: { ...result, timestamp: new Date().toISOString() }
        }));
        return result;
      } catch (caught) {
        console.error('[useServicemanByokState] failed to run diagnostic', caught);
        setConnectorError(caught?.message ?? 'Unable to run diagnostic');
        throw caught;
      } finally {
        setDiagnosticRunning(null);
      }
    },
    [servicemanId]
  );

  return {
    loading,
    error,
    profile,
    profileDraft,
    profileSaving,
    profileFeedback,
    profileMeta,
    handleProfileFieldChange,
    saveProfileDraft,
    connectors,
    connectorDraft,
    connectorSaving,
    connectorError,
    activeConnectorId,
    showConnectorDrawer,
    pendingRotationConnector,
    rotationSaving,
    diagnostics,
    diagnosticRunning,
    auditTrail,
    openConnectorForm,
    setConnectorDraft,
    submitConnectorDraft,
    removeConnector,
    requestRotation,
    submitRotation,
    resetConnectorDraft,
    runDiagnosticForConnector,
    refresh: loadState,
    providerOptions: PROVIDER_OPTIONS,
    environmentOptions: ENVIRONMENT_OPTIONS,
    statusOptions: STATUS_OPTIONS
  };
}

export default useServicemanByokState;
