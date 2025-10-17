import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  PlusIcon,
  ShieldCheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import {
  Button,
  Card,
  Checkbox,
  FormField,
  Modal,
  Select,
  StatusPill,
  TextArea,
  TextInput,
  Spinner
} from '../../ui/index.js';
import {
  archiveProviderByokIntegration,
  createProviderByokIntegration,
  fetchProviderByokSnapshot,
  listProviderByokAuditLogs,
  testProviderByokIntegration,
  updateProviderByokIntegration
} from '../../../api/providerByokClient.js';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'archived', label: 'Archived' }
];

const ROLE_OPTIONS = [
  { value: 'provider_admin', label: 'Provider admins' },
  { value: 'provider_manager', label: 'Provider managers' },
  { value: 'automation', label: 'Automation operators' },
  { value: 'finance', label: 'Finance approvers' },
  { value: 'compliance', label: 'Compliance reviewers' }
];

const INTEGRATION_PRESETS = {
  openai: {
    label: 'OpenAI BYOK',
    settings: {
      provider: 'openai',
      baseUrl: '',
      defaultModel: 'gpt-4o-mini',
      organizationId: '',
      rotationIntervalDays: 60,
      allowedRoles: ['provider_admin']
    },
    credentials: {
      apiKey: '',
      organizationId: ''
    }
  },
  slack: {
    label: 'Slack BYOK',
    settings: {
      defaultChannel: '',
      appId: '',
      teamId: '',
      rotationIntervalDays: 90,
      allowedRoles: ['provider_admin', 'provider_manager']
    },
    credentials: {
      botToken: '',
      signingSecret: ''
    }
  },
  webhook: {
    label: 'Webhook Relay',
    settings: {
      targetUrl: '',
      authType: 'none',
      rotationIntervalDays: 30,
      allowedRoles: ['provider_admin']
    },
    credentials: {
      sharedSecret: '',
      basicAuthUser: '',
      basicAuthPassword: ''
    }
  }
};

const STATUS_TONES = {
  active: { tone: 'success', label: 'Active' },
  inactive: { tone: 'neutral', label: 'Inactive' },
  suspended: { tone: 'warning', label: 'Suspended' },
  archived: { tone: 'danger', label: 'Archived' }
};

const DEFAULT_SUMMARY = {
  totalIntegrations: 0,
  activeIntegrations: 0,
  pendingRotation: 0,
  requiresVerification: 0,
  lastRotatedAt: null,
  nextRotationDueAt: null
};

const DEFAULT_SNAPSHOT = {
  summary: DEFAULT_SUMMARY,
  integrations: [],
  audit: []
};

function formatDateTime(iso, fallback = '—') {
  if (!iso) return fallback;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatRelativeTime(iso) {
  if (!iso) return '—';
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return '—';
  const diff = target.getTime() - Date.now();
  const minutes = Math.round(Math.abs(diff) / 60000);
  if (minutes < 1) return diff >= 0 ? 'moments away' : 'moments ago';
  if (minutes < 60) {
    return diff >= 0 ? `in ${minutes} minute${minutes === 1 ? '' : 's'}` : `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return diff >= 0 ? `in ${hours} hour${hours === 1 ? '' : 's'}` : `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  const days = Math.round(hours / 24);
  return diff >= 0 ? `in ${days} day${days === 1 ? '' : 's'}` : `${days} day${days === 1 ? '' : 's'} ago`;
}

function buildDefaultForm(integration) {
  const preset = INTEGRATION_PRESETS[integration] ?? {
    label: 'Custom integration',
    settings: { allowedRoles: ['provider_admin'], rotationIntervalDays: 60 },
    credentials: {}
  };

  return {
    id: null,
    integration,
    displayName: preset.label,
    status: 'inactive',
    settings: {
      ...preset.settings,
      allowedRoles: Array.from(new Set(preset.settings.allowedRoles ?? ['provider_admin'])),
      rotationIntervalDays: preset.settings.rotationIntervalDays ?? 60,
      notes: ''
    },
    credentials: { ...preset.credentials },
    metadata: {
      notes: '',
      supportContacts: [],
      supportingMedia: []
    },
    attachmentsText: '',
    supportContactsText: '',
    supportingMediaText: ''
  };
}

function buildFormFromIntegration(integration) {
  const base = buildDefaultForm(integration.integration);
  const attachments = (integration.settings?.attachments ?? [])
    .map((entry) => {
      if (typeof entry === 'string') return entry;
      if (entry && typeof entry === 'object') return entry.url || entry.label || '';
      return '';
    })
    .filter(Boolean);
  const supportContacts = (integration.metadata?.supportContacts ?? [])
    .map((contact) => {
      if (typeof contact === 'string') {
        return contact;
      }
      if (contact && typeof contact === 'object') {
        return [contact.name, contact.email].filter(Boolean).join(' • ');
      }
      return '';
    })
    .filter(Boolean);
  const supportingMedia = (integration.metadata?.supportingMedia ?? [])
    .map((item) => (typeof item === 'string' ? item : item?.url || ''))
    .filter(Boolean);

  return {
    id: integration.id,
    integration: integration.integration,
    displayName: integration.displayName,
    status: integration.status,
    settings: {
      ...base.settings,
      ...integration.settings,
      rotationIntervalDays:
        integration.settings?.rotationIntervalDays ?? base.settings.rotationIntervalDays ?? 60,
      allowedRoles: Array.from(new Set(integration.settings?.allowedRoles ?? base.settings.allowedRoles ?? ['provider_admin']))
    },
    credentials: {},
    metadata: {
      ...base.metadata,
      ...integration.metadata
    },
    attachmentsText: attachments.join('\n'),
    supportContactsText: supportContacts.join('\n'),
    supportingMediaText: supportingMedia.join('\n')
  };
}

function SummaryCard({ icon: Icon, title, value, helper }) {
  return (
    <Card padding="lg" className="flex items-start gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <p className="text-3xl font-semibold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{helper}</p>
      </div>
    </Card>
  );
}

SummaryCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  helper: PropTypes.string.isRequired
};

function SummaryGrid({ summary, onRefresh, refreshing }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-primary">Key management posture</h3>
          <p className="text-sm text-slate-600">
            Track connector coverage, rotation cadences, and validation health across your BYOK estate.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={ArrowPathIcon}
          onClick={onRefresh}
          loading={refreshing}
        >
          Refresh
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={ShieldCheckIcon}
          title="Active connectors"
          value={summary.activeIntegrations}
          helper={`${summary.totalIntegrations} total configured`}
        />
        <SummaryCard
          icon={ExclamationTriangleIcon}
          title="Rotation required"
          value={summary.pendingRotation}
          helper={summary.pendingRotation === 1 ? 'Key past rotation window' : 'Keys past rotation window'}
        />
        <SummaryCard
          icon={KeyIcon}
          title="Validation checks"
          value={summary.requiresVerification}
          helper="Keys awaiting verification"
        />
        <SummaryCard
          icon={SparklesIcon}
          title="Next rotation"
          value={summary.nextRotationDueAt ? formatRelativeTime(summary.nextRotationDueAt) : 'Scheduled'}
          helper={summary.lastRotatedAt ? `Last rotated ${formatRelativeTime(summary.lastRotatedAt)}` : 'Awaiting first rotation'}
        />
      </div>
    </div>
  );
}

SummaryGrid.propTypes = {
  summary: PropTypes.shape({
    activeIntegrations: PropTypes.number,
    totalIntegrations: PropTypes.number,
    pendingRotation: PropTypes.number,
    requiresVerification: PropTypes.number,
    lastRotatedAt: PropTypes.string,
    nextRotationDueAt: PropTypes.string
  }).isRequired,
  onRefresh: PropTypes.func.isRequired,
  refreshing: PropTypes.bool
};

SummaryGrid.defaultProps = {
  refreshing: false
};

function IntegrationTable({
  integrations,
  loading,
  onCreate,
  onManage,
  onAudit,
  onTest,
  onArchive,
  testLoadingId
}) {
  return (
    <Card padding="lg" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-primary">Connector catalogue</h3>
          <p className="text-sm text-slate-600">
            View every bring-your-own-key connector, its rotation cadence, and latest validation result.
          </p>
        </div>
        <Button icon={PlusIcon} onClick={onCreate} variant="primary">
          Add integration
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3">Integration</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Rotation</th>
              <th scope="col" className="px-4 py-3">Validation</th>
              <th scope="col" className="px-4 py-3">Allowed roles</th>
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {integrations.length === 0 && !loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                  No BYOK integrations configured yet. Add your first connector to enable provider-owned secrets.
                </td>
              </tr>
            ) : null}
            {integrations.map((integration) => {
              const statusMeta = STATUS_TONES[integration.status] ?? STATUS_TONES.inactive;
              const rotationDue = integration.rotationDueAt ? new Date(integration.rotationDueAt) : null;
              const rotationOverdue = rotationDue && rotationDue.getTime() < Date.now();
              const lastTestLabel = integration.lastTestStatus
                ? `${integration.lastTestStatus === 'passed' ? 'Passed' : 'Failed'} ${formatRelativeTime(
                    integration.lastTestAt
                  )}`
                : 'Not yet verified';
              return (
                <tr key={integration.id} className="align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{integration.displayName}</div>
                    <div className="text-xs text-slate-500">{integration.integration}</div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill tone={statusMeta.tone}>{statusMeta.label}</StatusPill>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className={clsx('font-medium', rotationOverdue && 'text-rose-600')}>
                      {integration.rotationDueAt ? formatRelativeTime(integration.rotationDueAt) : 'Scheduled'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {integration.lastRotatedAt ? `Rotated ${formatRelativeTime(integration.lastRotatedAt)}` : 'Awaiting rotation'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium">{lastTestLabel}</div>
                    {integration.lastTestNotes ? (
                      <div className="text-xs text-slate-500">{integration.lastTestNotes}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-wrap gap-2">
                      {(integration.settings?.allowedRoles ?? []).map((role) => (
                        <span
                          key={role}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                        >
                          {role.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onManage(integration)}
                      >
                        Manage
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAudit(integration)}
                      >
                        Audit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onTest(integration)}
                        loading={testLoadingId === integration.id}
                      >
                        Test
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={integration.status === 'archived'}
                        onClick={() => onArchive(integration)}
                      >
                        Archive
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center">
                  <Spinner aria-label="Loading BYOK data" />
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

IntegrationTable.propTypes = {
  integrations: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool,
  onCreate: PropTypes.func.isRequired,
  onManage: PropTypes.func.isRequired,
  onAudit: PropTypes.func.isRequired,
  onTest: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
  testLoadingId: PropTypes.string
};

IntegrationTable.defaultProps = {
  loading: false,
  testLoadingId: null
};

function AuditLogModal({ open, onClose, logs, loading, error, title }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description="Recent key lifecycle events, test outcomes, and configuration changes."
      size="lg"
    >
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-6">
            <Spinner aria-label="Loading audit history" />
          </div>
        ) : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {!loading && logs.length === 0 ? (
          <p className="text-sm text-slate-500">No audit activity recorded yet.</p>
        ) : null}
        <ul className="space-y-3">
          {logs.map((entry) => (
            <li key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-800">
                  {entry.eventType.replace('integration.', '').replace(/_/g, ' ')}
                </p>
                <p className="text-xs text-slate-500">{formatDateTime(entry.createdAt)}</p>
              </div>
              {entry.detail?.message ? (
                <p className="mt-2 text-sm text-slate-600">{entry.detail.message}</p>
              ) : null}
              <dl className="mt-2 grid gap-2 text-xs text-slate-500 md:grid-cols-2">
                {entry.detail?.status ? (
                  <div>
                    <dt className="font-medium text-slate-600">Status</dt>
                    <dd className="mt-1 capitalize">{entry.detail.status}</dd>
                  </div>
                ) : null}
                {entry.detail?.changes ? (
                  <div>
                    <dt className="font-medium text-slate-600">Changes</dt>
                    <dd className="mt-1">
                      {Object.keys(entry.detail.changes).length === 0
                        ? 'Configuration retained'
                        : Object.keys(entry.detail.changes).join(', ')}
                    </dd>
                  </div>
                ) : null}
                {entry.actorType || entry.actorId ? (
                  <div>
                    <dt className="font-medium text-slate-600">Actor</dt>
                    <dd className="mt-1">{entry.actorType || 'user'} {entry.actorId ? `(${entry.actorId})` : ''}</dd>
                  </div>
                ) : null}
              </dl>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}

AuditLogModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  logs: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  title: PropTypes.string
};

AuditLogModal.defaultProps = {
  loading: false,
  error: null,
  title: 'BYOK audit history'
};

export default function ProviderByokManagementSection({ section }) {
  const initialSnapshot = useMemo(() => section?.data ?? DEFAULT_SNAPSHOT, [section]);
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [formState, setFormState] = useState(() => buildDefaultForm('openai'));
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testLoadingId, setTestLoadingId] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [auditLogs, setAuditLogs] = useState(initialSnapshot.audit ?? []);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState(null);
  const [isAuditOpen, setAuditOpen] = useState(false);
  const [auditTitle, setAuditTitle] = useState('BYOK audit history');

  const mergeSnapshot = useCallback((payload) => {
    if (!payload) {
      setSnapshot(DEFAULT_SNAPSHOT);
      setAuditLogs([]);
      return;
    }
    setSnapshot(payload);
    setAuditLogs(payload.audit ?? []);
    setSelectedIntegration((current) => {
      if (!current) return null;
      return payload.integrations?.find((item) => item.id === current.id) ?? null;
    });
  }, []);

  const refreshSnapshot = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const payload = await fetchProviderByokSnapshot({ forceRefresh: !silent });
        mergeSnapshot(payload ?? DEFAULT_SNAPSHOT);
      } catch (err) {
        if (!silent) {
          setError(err?.message || 'Unable to load BYOK snapshot');
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [mergeSnapshot]
  );

  useEffect(() => {
    mergeSnapshot(initialSnapshot);
  }, [initialSnapshot, mergeSnapshot]);

  useEffect(() => {
    refreshSnapshot({ silent: true }).catch(() => {});
  }, [refreshSnapshot]);

  useEffect(() => {
    if (modalMode === 'edit' && selectedIntegration) {
      setFormState(buildFormFromIntegration(selectedIntegration));
    }
  }, [modalMode, selectedIntegration]);

  const handleCreate = useCallback(() => {
    setModalMode('create');
    setFormState(buildDefaultForm('openai'));
    setFormError(null);
    setTestResult(null);
    setSelectedIntegration(null);
    setModalOpen(true);
  }, []);

  const handleManage = useCallback((integration) => {
    setModalMode('edit');
    setSelectedIntegration(integration);
    setFormState(buildFormFromIntegration(integration));
    setFormError(null);
    setTestResult(null);
    setModalOpen(true);
  }, []);

  const handleArchive = useCallback(
    async (integration) => {
      if (!window.confirm('Archive this BYOK integration? This revokes access until restored.')) {
        return;
      }
      try {
        await archiveProviderByokIntegration(integration.id);
        await refreshSnapshot({ silent: false });
      } catch (err) {
        setError(err?.message || 'Failed to archive integration');
      }
    },
    [refreshSnapshot]
  );

  const handleTest = useCallback(
    async (integration) => {
      setTestLoadingId(integration.id);
      setTestResult(null);
      try {
        const result = await testProviderByokIntegration(integration.id);
        setTestResult({
          status: result.result?.status ?? 'unknown',
          message: result.result?.message ?? 'Test completed'
        });
        await refreshSnapshot({ silent: true });
      } catch (err) {
        setTestResult({ status: 'failed', message: err?.message || 'Test failed' });
      } finally {
        setTestLoadingId(null);
      }
    },
    [refreshSnapshot]
  );

  const handleAuditOpen = useCallback(async (integration) => {
    const title = integration
      ? `${integration.displayName ?? integration.integration ?? 'Integration'} audit history`
      : 'Control centre audit history';
    setAuditTitle(title);
    setAuditOpen(true);
    setAuditLoading(true);
    setAuditError(null);
    setAuditLogs([]);
    try {
      const logs = await listProviderByokAuditLogs(integration?.id ?? null, { limit: 25 });
      setAuditLogs(logs ?? []);
    } catch (err) {
      setAuditError(err?.message || 'Unable to load audit history');
    } finally {
      setAuditLoading(false);
    }
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setFormError(null);
    setTestResult(null);
  }, []);

  const updateSettingsField = useCallback((key, value) => {
    setFormState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: value
      }
    }));
  }, []);

  const updateMetadataField = useCallback((key, value) => {
    setFormState((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [key]: value
      }
    }));
  }, []);

  const handleRoleToggle = useCallback((role) => {
    setFormState((prev) => {
      const roles = new Set(prev.settings.allowedRoles ?? []);
      if (roles.has(role)) {
        roles.delete(role);
      } else {
        roles.add(role);
      }
      const finalRoles = roles.size ? Array.from(roles) : ['provider_admin'];
      return {
        ...prev,
        settings: {
          ...prev.settings,
          allowedRoles: finalRoles
        }
      };
    });
  }, []);

  const handleCredentialChange = useCallback((key, value) => {
    setFormState((prev) => ({
      ...prev,
      credentials: {
        ...prev.credentials,
        [key]: value
      }
    }));
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setSaving(true);
      setFormError(null);
      setTestResult(null);

      const payload = {
        integration: formState.integration,
        displayName: formState.displayName,
        status: formState.status,
        settings: {
          ...formState.settings,
          rotationIntervalDays: Number.parseInt(formState.settings.rotationIntervalDays, 10) || 60,
          attachments: formState.attachmentsText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean),
          allowedRoles: formState.settings.allowedRoles ?? ['provider_admin']
        },
        credentials: Object.fromEntries(
          Object.entries(formState.credentials || {}).filter(([, value]) => typeof value === 'string' && value.trim())
        ),
        metadata: {
          ...formState.metadata,
          notes: formState.metadata?.notes ?? '',
          supportContacts: formState.supportContactsText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean),
          supportingMedia: formState.supportingMediaText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
        }
      };

      try {
        if (modalMode === 'create') {
          await createProviderByokIntegration(payload);
        } else if (formState.id) {
          await updateProviderByokIntegration(formState.id, payload);
        }
        await refreshSnapshot({ silent: false });
        setModalOpen(false);
      } catch (err) {
        setFormError(err?.message || 'Unable to save BYOK integration');
      } finally {
        setSaving(false);
      }
    },
    [formState, modalMode, refreshSnapshot]
  );

  const handleIntegrationChange = useCallback((event) => {
    const value = event.target.value;
    setFormState(buildDefaultForm(value));
  }, []);

  const selectedStatusMeta = selectedIntegration
    ? STATUS_TONES[selectedIntegration.status] ?? STATUS_TONES.inactive
    : null;

  return (
    <section className="space-y-6" aria-label="BYOK management">
      <SummaryGrid summary={snapshot.summary ?? DEFAULT_SUMMARY} onRefresh={refreshSnapshot} refreshing={loading} />
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <IntegrationTable
        integrations={snapshot.integrations ?? []}
        loading={loading}
        onCreate={handleCreate}
        onManage={handleManage}
        onAudit={handleAuditOpen}
        onTest={handleTest}
        onArchive={handleArchive}
        testLoadingId={testLoadingId}
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleAuditOpen(null)}
        className="text-slate-600"
      >
        View control centre audit log
      </Button>

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        size="lg"
        title={modalMode === 'create' ? 'Add BYOK integration' : 'Manage BYOK integration'}
        description="Rotate secrets, update configuration, and control access to bring-your-own-key connectors."
      >
        <form className="space-y-5" onSubmit={handleSubmit}>
          {modalMode === 'edit' && selectedIntegration ? (
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1 text-sm text-slate-600">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-base font-semibold text-slate-800">{selectedIntegration.displayName}</p>
                  {selectedStatusMeta ? (
                    <StatusPill tone={selectedStatusMeta.tone}>{selectedStatusMeta.label}</StatusPill>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                  <span>
                    {selectedIntegration.lastRotatedAt
                      ? `Rotated ${formatRelativeTime(selectedIntegration.lastRotatedAt)}`
                      : 'Rotation pending'}
                  </span>
                  <span>
                    {selectedIntegration.rotationDueAt
                      ? `Next rotation ${formatRelativeTime(selectedIntegration.rotationDueAt)}`
                      : 'Rotation schedule applied'}
                  </span>
                  <span>
                    {selectedIntegration.lastTestAt
                      ? `Last validation ${formatRelativeTime(selectedIntegration.lastTestAt)}`
                      : 'Validation required'}
                  </span>
                  <span>
                    {selectedIntegration.hasCredentials ? 'Credentials on file' : 'Credentials pending'}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => handleAuditOpen(selectedIntegration)}
                >
                  View audit trail
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleTest(selectedIntegration)}
                  loading={testLoadingId === selectedIntegration.id}
                >
                  Run validation
                </Button>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            {modalMode === 'create' ? (
              <FormField id="byok-integration" label="Integration type">
                <Select
                  value={formState.integration}
                  onChange={handleIntegrationChange}
                  options={Object.entries(INTEGRATION_PRESETS).map(([value, preset]) => ({
                    value,
                    label: preset.label
                  }))}
                />
              </FormField>
            ) : (
              <FormField id="byok-integration" label="Integration">
                <input
                  id="byok-integration"
                  className="fx-text-input"
                  value={formState.integration}
                  disabled
                  readOnly
                />
              </FormField>
            )}
            <FormField id="byok-display-name" label="Display name">
              <TextInput
                id="byok-display-name"
                value={formState.displayName}
                onChange={(event) => setFormState((prev) => ({ ...prev, displayName: event.target.value }))}
              />
            </FormField>
            <FormField id="byok-status" label="Status">
              <Select
                value={formState.status}
                onChange={(event) => setFormState((prev) => ({ ...prev, status: event.target.value }))}
                options={STATUS_OPTIONS}
              />
            </FormField>
            <FormField
              id="byok-rotation"
              label="Rotation interval (days)"
              hint="Define the maximum number of days before rotation is required."
            >
              <TextInput
                id="byok-rotation"
                type="number"
                min="7"
                value={formState.settings.rotationIntervalDays}
                onChange={(event) => updateSettingsField('rotationIntervalDays', event.target.value)}
              />
            </FormField>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">Configuration</h4>
            <div className="grid gap-4 md:grid-cols-2">
              {formState.integration === 'openai' ? (
                <>
                  <FormField id="byok-provider" label="Provider">
                    <TextInput
                      id="byok-provider"
                      value={formState.settings.provider}
                      onChange={(event) => updateSettingsField('provider', event.target.value)}
                    />
                  </FormField>
                  <FormField id="byok-base-url" label="Base URL">
                    <TextInput
                      id="byok-base-url"
                      value={formState.settings.baseUrl}
                      onChange={(event) => updateSettingsField('baseUrl', event.target.value)}
                    />
                  </FormField>
                  <FormField id="byok-default-model" label="Default model">
                    <TextInput
                      id="byok-default-model"
                      value={formState.settings.defaultModel}
                      onChange={(event) => updateSettingsField('defaultModel', event.target.value)}
                    />
                  </FormField>
                  <FormField id="byok-org-id" label="Organisation ID">
                    <TextInput
                      id="byok-org-id"
                      value={formState.settings.organizationId ?? ''}
                      onChange={(event) => updateSettingsField('organizationId', event.target.value)}
                    />
                  </FormField>
                </>
              ) : null}

              {formState.integration === 'slack' ? (
                <>
                  <FormField id="byok-default-channel" label="Default channel">
                    <TextInput
                      id="byok-default-channel"
                      value={formState.settings.defaultChannel ?? ''}
                      onChange={(event) => updateSettingsField('defaultChannel', event.target.value)}
                    />
                  </FormField>
                  <FormField id="byok-app-id" label="Slack app ID">
                    <TextInput
                      id="byok-app-id"
                      value={formState.settings.appId ?? ''}
                      onChange={(event) => updateSettingsField('appId', event.target.value)}
                    />
                  </FormField>
                  <FormField id="byok-team-id" label="Team ID">
                    <TextInput
                      id="byok-team-id"
                      value={formState.settings.teamId ?? ''}
                      onChange={(event) => updateSettingsField('teamId', event.target.value)}
                    />
                  </FormField>
                </>
              ) : null}

              {formState.integration === 'webhook' ? (
                <>
                  <FormField id="byok-target-url" label="Target URL">
                    <TextInput
                      id="byok-target-url"
                      value={formState.settings.targetUrl ?? ''}
                      onChange={(event) => updateSettingsField('targetUrl', event.target.value)}
                    />
                  </FormField>
                  <FormField id="byok-auth-type" label="Authentication type">
                    <TextInput
                      id="byok-auth-type"
                      value={formState.settings.authType ?? ''}
                      onChange={(event) => updateSettingsField('authType', event.target.value)}
                    />
                  </FormField>
                </>
              ) : null}

              <FormField
                id="byok-attachments"
                label="Reference assets"
                hint="One URL per line. Used for implementation guides or key storage evidence."
              >
                <TextArea
                  id="byok-attachments"
                  rows={3}
                  value={formState.attachmentsText}
                  onChange={(event) => setFormState((prev) => ({ ...prev, attachmentsText: event.target.value }))}
                />
              </FormField>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">Access controls</h4>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs text-slate-500">Select the roles permitted to manage and rotate this connector.</p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {ROLE_OPTIONS.map((role) => (
                  <Checkbox
                    key={role.value}
                    label={role.label}
                    checked={formState.settings.allowedRoles?.includes(role.value)}
                    onChange={() => handleRoleToggle(role.value)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">Operational notes</h4>
            <FormField
              id="byok-notes"
              label="Notes"
              hint="Internal notes visible to provider administrators."
            >
              <TextArea
                id="byok-notes"
                rows={3}
                value={formState.metadata.notes ?? ''}
                onChange={(event) => updateMetadataField('notes', event.target.value)}
              />
            </FormField>
            <FormField
              id="byok-support-contacts"
              label="Support contacts"
              hint="One contact per line (name, email, or both)."
            >
              <TextArea
                id="byok-support-contacts"
                rows={2}
                value={formState.supportContactsText}
                onChange={(event) => setFormState((prev) => ({ ...prev, supportContactsText: event.target.value }))}
              />
            </FormField>
            <FormField
              id="byok-media"
              label="Supporting media"
              hint="One asset URL per line for runbooks, evidence, or architecture diagrams."
            >
              <TextArea
                id="byok-media"
                rows={2}
                value={formState.supportingMediaText}
                onChange={(event) => setFormState((prev) => ({ ...prev, supportingMediaText: event.target.value }))}
              />
            </FormField>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">Rotate credentials</h4>
            <p className="text-xs text-slate-500">
              Secrets are never displayed. Provide new values to rotate the connector. Leave blank to keep the existing secret.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {Object.keys(INTEGRATION_PRESETS[formState.integration]?.credentials ?? formState.credentials).map((field) => (
                <FormField key={field} id={`byok-credential-${field}`} label={field.replace(/([A-Z])/g, ' $1')}>
                  <TextInput
                    id={`byok-credential-${field}`}
                    type="password"
                    value={formState.credentials?.[field] ?? ''}
                    onChange={(event) => handleCredentialChange(field, event.target.value)}
                    placeholder="Enter to rotate"
                  />
                </FormField>
              ))}
            </div>
          </div>

          {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}
          {testResult ? (
            <p
              className={clsx(
                'text-sm',
                testResult.status === 'passed' ? 'text-emerald-600' : 'text-amber-600'
              )}
            >
              Validation result: {testResult.status} — {testResult.message}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={closeModal} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={saving}>
              {modalMode === 'create' ? 'Create integration' : 'Save changes'}
            </Button>
          </div>
        </form>
      </Modal>

      <AuditLogModal
        open={isAuditOpen}
        onClose={() => setAuditOpen(false)}
        logs={auditLogs}
        loading={auditLoading}
        error={auditError}
        title={auditTitle}
      />
    </section>
  );
}

ProviderByokManagementSection.propTypes = {
  section: PropTypes.shape({
    data: PropTypes.shape({
      summary: PropTypes.object,
      integrations: PropTypes.array,
      audit: PropTypes.array
    })
  })
};

ProviderByokManagementSection.defaultProps = {
  section: { data: DEFAULT_SNAPSHOT }
};
