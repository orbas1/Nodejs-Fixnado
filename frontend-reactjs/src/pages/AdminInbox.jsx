import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/blueprints/PageHeader.jsx';
import {
  Button,
  Card,
  Checkbox,
  FormField,
  Select,
  Spinner,
  StatusPill,
  TextInput
} from '../components/ui/index.js';
import {
  fetchAdminInboxSnapshot,
  updateAdminInboxConfiguration,
  saveInboxQueue,
  deleteInboxQueue,
  saveInboxTemplate,
  deleteInboxTemplate
} from '../api/adminInboxClient.js';

const DEFAULT_CONFIG_FORM = {
  autoAssignEnabled: true,
  quietHoursStart: '',
  quietHoursEnd: '',
  attachmentsEnabled: true,
  maxAttachmentMb: 25,
  allowedFileTypesText: 'jpg, png, pdf',
  aiAssistEnabled: true,
  aiAssistProvider: '',
  firstResponseSlaMinutes: 10,
  resolutionSlaMinutes: 120,
  brandColor: '#0ea5e9',
  signature: '',
  defaultQueueId: ''
};

const EMPTY_QUEUE_FORM = {
  id: null,
  name: '',
  description: '',
  slaMinutes: 15,
  escalationMinutes: 45,
  allowedRolesText: 'support, operations',
  autoResponderEnabled: true,
  triageFormUrl: '',
  channelsText: 'in-app, email',
  accentColor: '#0ea5e9'
};

const EMPTY_TEMPLATE_FORM = {
  id: null,
  name: '',
  queueId: '',
  category: '',
  locale: 'en-GB',
  subject: '',
  body: '',
  tagsText: '',
  previewImageUrl: '',
  isActive: true
};

function splitList(value) {
  if (typeof value !== 'string') {
    return [];
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function buildConfigForm(configuration) {
  if (!configuration) {
    return { ...DEFAULT_CONFIG_FORM };
  }
  return {
    autoAssignEnabled: configuration.autoAssignEnabled !== false,
    quietHoursStart: configuration.quietHoursStart || '',
    quietHoursEnd: configuration.quietHoursEnd || '',
    attachmentsEnabled: configuration.attachmentsEnabled !== false,
    maxAttachmentMb: configuration.maxAttachmentMb ?? 25,
    allowedFileTypesText: Array.isArray(configuration.allowedFileTypes)
      ? configuration.allowedFileTypes.join(', ')
      : DEFAULT_CONFIG_FORM.allowedFileTypesText,
    aiAssistEnabled: configuration.aiAssistEnabled !== false,
    aiAssistProvider: configuration.aiAssistProvider || '',
    firstResponseSlaMinutes: configuration.firstResponseSlaMinutes ?? 10,
    resolutionSlaMinutes: configuration.resolutionSlaMinutes ?? 120,
    brandColor: configuration.brandColor || '#0ea5e9',
    signature: configuration.signature || '',
    defaultQueueId: configuration.defaultQueueId || ''
  };
}

function buildQueueForm(queue) {
  if (!queue) {
    return { ...EMPTY_QUEUE_FORM };
  }
  return {
    id: queue.id || null,
    name: queue.name || '',
    description: queue.description || '',
    slaMinutes: queue.slaMinutes ?? 15,
    escalationMinutes: queue.escalationMinutes ?? 45,
    allowedRolesText: Array.isArray(queue.allowedRoles) ? queue.allowedRoles.join(', ') : '',
    autoResponderEnabled: queue.autoResponderEnabled !== false,
    triageFormUrl: queue.triageFormUrl || '',
    channelsText: Array.isArray(queue.channels) ? queue.channels.join(', ') : '',
    accentColor: queue.accentColor || '#0ea5e9'
  };
}

function buildTemplateForm(template) {
  if (!template) {
    return { ...EMPTY_TEMPLATE_FORM };
  }
  return {
    id: template.id || null,
    name: template.name || '',
    queueId: template.queueId || '',
    category: template.category || '',
    locale: template.locale || 'en-GB',
    subject: template.subject || '',
    body: template.body || '',
    tagsText: Array.isArray(template.tags) ? template.tags.join(', ') : '',
    previewImageUrl: template.previewImageUrl || '',
    isActive: template.isActive !== false
  };
}

export default function AdminInbox() {
  const numberFormatter = useMemo(() => new Intl.NumberFormat(), []);
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState(null);
  const [configForm, setConfigForm] = useState(DEFAULT_CONFIG_FORM);
  const [queueForm, setQueueForm] = useState(EMPTY_QUEUE_FORM);
  const [templateForm, setTemplateForm] = useState(EMPTY_TEMPLATE_FORM);
  const [editingQueueId, setEditingQueueId] = useState(null);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingQueue, setSavingQueue] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const refreshSnapshot = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminInboxSnapshot();
      setSnapshot(data);
      setConfigForm(buildConfigForm(data.configuration));
      setQueueForm({ ...EMPTY_QUEUE_FORM });
      setTemplateForm({ ...EMPTY_TEMPLATE_FORM });
      setEditingQueueId(null);
      setEditingTemplateId(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load inbox settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSnapshot();
  }, [refreshSnapshot]);

  const metrics = useMemo(() => snapshot?.metrics ?? {}, [snapshot]);

  const headerMeta = useMemo(() => {
    if (!snapshot) {
      return [];
    }
    return [
      {
        label: 'Backlog',
        value: numberFormatter.format(metrics.backlog ?? 0),
        caption: 'Open conversations'
      },
      {
        label: 'Awaiting response',
        value: numberFormatter.format(metrics.awaitingResponse ?? 0),
        caption: 'Last reply from participant'
      },
      {
        label: 'Avg first response',
        value:
          metrics.averageFirstResponseMinutes != null
            ? `${Number(metrics.averageFirstResponseMinutes).toFixed(1)} min`
            : '—',
        caption: 'Across all queues'
      },
      {
        label: 'Queues tracked',
        value: numberFormatter.format(metrics.queues ?? 0),
        caption: 'Active inbox queues'
      }
    ];
  }, [metrics, numberFormatter, snapshot]);

  const queueOptions = useMemo(
    () =>
      (snapshot?.queues ?? []).map((queue) => ({
        value: queue.id ?? '',
        label: queue.name ?? 'Queue'
      })),
    [snapshot?.queues]
  );

  const handleConfigToggle = (field) => (event) => {
    setConfigForm((current) => ({ ...current, [field]: event.target.checked }));
  };

  const handleConfigChange = (field) => (event) => {
    setConfigForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleConfigSubmit = async (event) => {
    event.preventDefault();
    setSavingConfig(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        autoAssignEnabled: configForm.autoAssignEnabled,
        quietHoursStart: configForm.quietHoursStart || null,
        quietHoursEnd: configForm.quietHoursEnd || null,
        attachmentsEnabled: configForm.attachmentsEnabled,
        maxAttachmentMb: Number.parseInt(configForm.maxAttachmentMb, 10) || 25,
        allowedFileTypes: splitList(configForm.allowedFileTypesText),
        aiAssistEnabled: configForm.aiAssistEnabled,
        aiAssistProvider: configForm.aiAssistProvider,
        firstResponseSlaMinutes: Number.parseInt(configForm.firstResponseSlaMinutes, 10) || 10,
        resolutionSlaMinutes: Number.parseInt(configForm.resolutionSlaMinutes, 10) || 120,
        brandColor: configForm.brandColor,
        signature: configForm.signature,
        defaultQueueId: configForm.defaultQueueId || null
      };
      const updated = await updateAdminInboxConfiguration(payload);
      setSnapshot(updated);
      setConfigForm(buildConfigForm(updated.configuration));
      setSuccess('Inbox configuration updated successfully.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save inbox configuration.');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleQueueFieldChange = (field) => (event) => {
    setQueueForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleQueueToggle = (field) => (event) => {
    setQueueForm((current) => ({ ...current, [field]: event.target.checked }));
  };

  const handleQueueSubmit = async (event) => {
    event.preventDefault();
    setSavingQueue(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        id: editingQueueId,
        name: queueForm.name,
        description: queueForm.description,
        slaMinutes: Number.parseInt(queueForm.slaMinutes, 10) || 15,
        escalationMinutes: Number.parseInt(queueForm.escalationMinutes, 10) || 45,
        allowedRoles: splitList(queueForm.allowedRolesText),
        autoResponderEnabled: queueForm.autoResponderEnabled,
        triageFormUrl: queueForm.triageFormUrl,
        channels: splitList(queueForm.channelsText),
        accentColor: queueForm.accentColor
      };
      const updated = await saveInboxQueue(payload);
      setSnapshot(updated);
      setQueueForm({ ...EMPTY_QUEUE_FORM });
      setEditingQueueId(null);
      setSuccess(`Queue ${payload.name} saved.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save queue.');
    } finally {
      setSavingQueue(false);
    }
  };

  const handleQueueEdit = (queueId) => {
    const queue = (snapshot?.queues ?? []).find((item) => item.id === queueId);
    if (!queue) return;
    setEditingQueueId(queueId);
    setQueueForm(buildQueueForm(queue));
  };

  const handleQueueDelete = async (queueId) => {
    if (!queueId) return;
    const queue = (snapshot?.queues ?? []).find((item) => item.id === queueId);
    const confirmed = window.confirm(`Delete queue “${queue?.name ?? 'Queue'}”? This will unassign related conversations.`);
    if (!confirmed) return;

    setSavingQueue(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await deleteInboxQueue(queueId);
      setSnapshot(updated);
      setQueueForm({ ...EMPTY_QUEUE_FORM });
      setEditingQueueId(null);
      setSuccess('Queue removed.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to delete queue.');
    } finally {
      setSavingQueue(false);
    }
  };

  const handleTemplateFieldChange = (field) => (event) => {
    setTemplateForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleTemplateToggle = (field) => (event) => {
    setTemplateForm((current) => ({ ...current, [field]: event.target.checked }));
  };

  const handleTemplateSubmit = async (event) => {
    event.preventDefault();
    setSavingTemplate(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        id: editingTemplateId,
        name: templateForm.name,
        queueId: templateForm.queueId || null,
        category: templateForm.category,
        locale: templateForm.locale,
        subject: templateForm.subject,
        body: templateForm.body,
        tags: splitList(templateForm.tagsText),
        previewImageUrl: templateForm.previewImageUrl,
        isActive: templateForm.isActive
      };
      const updated = await saveInboxTemplate(payload);
      setSnapshot(updated);
      setTemplateForm({ ...EMPTY_TEMPLATE_FORM });
      setEditingTemplateId(null);
      setSuccess(`Template ${payload.name} saved.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save template.');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleTemplateEdit = (templateId) => {
    const template = (snapshot?.templates ?? []).find((item) => item.id === templateId);
    if (!template) return;
    setEditingTemplateId(templateId);
    setTemplateForm(buildTemplateForm(template));
  };

  const handleTemplateDelete = async (templateId) => {
    if (!templateId) return;
    const template = (snapshot?.templates ?? []).find((item) => item.id === templateId);
    const confirmed = window.confirm(`Delete template “${template?.name ?? 'Template'}”?`);
    if (!confirmed) return;
    setSavingTemplate(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await deleteInboxTemplate(templateId);
      setSnapshot(updated);
      setTemplateForm({ ...EMPTY_TEMPLATE_FORM });
      setEditingTemplateId(null);
      setSuccess('Template removed.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to delete template.');
    } finally {
      setSavingTemplate(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <PageHeader
        eyebrow="Admin control tower"
        title="Inbox operations"
        description="Configure queues, automation, and templates for the Fixnado unified inbox."
        breadcrumbs={[
          { label: 'Admin', to: '/admin/dashboard' },
          { label: 'Inbox operations' }
        ]}
        meta={headerMeta}
      />

      <div className="mx-auto max-w-7xl px-6 py-10">
        {error ? (
          <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
            <p className="font-semibold">{error}</p>
          </div>
        ) : null}
        {success ? (
          <div className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-700">
            <p className="font-semibold">{success}</p>
          </div>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : snapshot ? (
          <div className="space-y-12">
            <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {(snapshot.queueMetrics ?? snapshot.queues ?? []).slice(0, 4).map((queue) => (
                <Card key={queue.id ?? queue.name} className="border border-slate-200 bg-white/90 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{queue.name}</p>
                  <p className="mt-3 text-2xl font-semibold text-primary">
                    {numberFormatter.format(queue.backlog ?? 0)} open
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {numberFormatter.format(queue.awaitingResponse ?? 0)} awaiting •
                    {' '}
                    {numberFormatter.format(queue.breachRisk ?? 0)} breaches
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    SLA {queue.slaMinutes ?? 15} min • Escalate {queue.escalationMinutes ?? 45} min
                  </p>
                </Card>
              ))}
            </section>

            <section className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
              <form
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                onSubmit={handleConfigSubmit}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-primary">Automation guardrails</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Update how Fixnado routes, responds, and enforces attachment policy across all inbox queues.
                    </p>
                  </div>
                  {savingConfig ? <StatusPill tone="info">Saving…</StatusPill> : null}
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <Checkbox
                    label="Auto-assign new conversations"
                    checked={configForm.autoAssignEnabled}
                    onChange={handleConfigToggle('autoAssignEnabled')}
                  />
                  <Checkbox
                    label="Enable AI assist suggestions"
                    checked={configForm.aiAssistEnabled}
                    onChange={handleConfigToggle('aiAssistEnabled')}
                  />
                  <Checkbox
                    label="Allow participant attachments"
                    checked={configForm.attachmentsEnabled}
                    onChange={handleConfigToggle('attachmentsEnabled')}
                  />
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <FormField id="default-queue" label="Default queue for new conversations">
                    <Select
                      value={configForm.defaultQueueId}
                      onChange={handleConfigChange('defaultQueueId')}
                    >
                      <option value="">Select queue</option>
                      {queueOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField id="ai-provider" label="AI assist provider">
                    <TextInput
                      value={configForm.aiAssistProvider}
                      onChange={handleConfigChange('aiAssistProvider')}
                      placeholder="Provider or model"
                    />
                  </FormField>
                  <FormField id="quiet-hours-start" label="Quiet hours start" hint="HH:MM">
                    <TextInput
                      value={configForm.quietHoursStart}
                      onChange={handleConfigChange('quietHoursStart')}
                      placeholder="22:00"
                    />
                  </FormField>
                  <FormField id="quiet-hours-end" label="Quiet hours end" hint="HH:MM">
                    <TextInput
                      value={configForm.quietHoursEnd}
                      onChange={handleConfigChange('quietHoursEnd')}
                      placeholder="07:00"
                    />
                  </FormField>
                  <FormField id="max-attachment" label="Max attachment size (MB)">
                    <TextInput
                      type="number"
                      min="1"
                      value={configForm.maxAttachmentMb}
                      onChange={handleConfigChange('maxAttachmentMb')}
                    />
                  </FormField>
                  <FormField id="allowed-file-types" label="Allowed file types" hint="Comma separated">
                    <TextInput
                      value={configForm.allowedFileTypesText}
                      onChange={handleConfigChange('allowedFileTypesText')}
                      placeholder="jpg, png, pdf"
                    />
                  </FormField>
                  <FormField id="first-response-sla" label="First response SLA (minutes)">
                    <TextInput
                      type="number"
                      min="1"
                      value={configForm.firstResponseSlaMinutes}
                      onChange={handleConfigChange('firstResponseSlaMinutes')}
                    />
                  </FormField>
                  <FormField id="resolution-sla" label="Resolution SLA (minutes)">
                    <TextInput
                      type="number"
                      min="1"
                      value={configForm.resolutionSlaMinutes}
                      onChange={handleConfigChange('resolutionSlaMinutes')}
                    />
                  </FormField>
                  <FormField id="brand-color" label="Accent colour">
                    <TextInput
                      value={configForm.brandColor}
                      onChange={handleConfigChange('brandColor')}
                      placeholder="#0ea5e9"
                    />
                  </FormField>
                  <FormField id="signature" label="Signature" optionalLabel="Optional">
                    <TextInput
                      value={configForm.signature}
                      onChange={handleConfigChange('signature')}
                      placeholder="Fixnado Concierge"
                    />
                  </FormField>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button type="submit" disabled={savingConfig}>
                    Save configuration
                  </Button>
                </div>
              </form>

              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-primary">Queue overview</h2>
                  <ul className="mt-4 space-y-3 text-sm text-slate-600">
                    {(snapshot.queueMetrics ?? snapshot.queues ?? []).map((queue) => (
                      <li key={queue.id ?? queue.name} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-primary">{queue.name}</p>
                          <span className="text-xs text-slate-500">
                            {numberFormatter.format(queue.backlog ?? 0)} open • {numberFormatter.format(queue.awaitingResponse ?? 0)} awaiting
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          SLA {queue.slaMinutes ?? 15} min • Escalation {queue.escalationMinutes ?? 45} min
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <form
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                onSubmit={handleQueueSubmit}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-primary">
                      {editingQueueId ? 'Edit queue' : 'Create queue'}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Define queue routing, SLA targets, and channels available to participants.
                    </p>
                  </div>
                  {savingQueue ? <StatusPill tone="info">Saving…</StatusPill> : null}
                </div>

                <div className="mt-6 grid gap-6">
                  <FormField id="queue-name" label="Queue name">
                    <TextInput value={queueForm.name} onChange={handleQueueFieldChange('name')} required />
                  </FormField>
                  <FormField id="queue-description" label="Description" optionalLabel="Optional">
                    <TextInput
                      value={queueForm.description}
                      onChange={handleQueueFieldChange('description')}
                      placeholder="Describe purpose or escalation policy"
                    />
                  </FormField>
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField id="queue-sla" label="Response SLA (minutes)">
                      <TextInput
                        type="number"
                        min="1"
                        value={queueForm.slaMinutes}
                        onChange={handleQueueFieldChange('slaMinutes')}
                      />
                    </FormField>
                    <FormField id="queue-escalation" label="Escalation (minutes)">
                      <TextInput
                        type="number"
                        min="1"
                        value={queueForm.escalationMinutes}
                        onChange={handleQueueFieldChange('escalationMinutes')}
                      />
                    </FormField>
                  </div>
                  <FormField id="queue-roles" label="Allowed responder roles" hint="Comma separated">
                    <TextInput
                      value={queueForm.allowedRolesText}
                      onChange={handleQueueFieldChange('allowedRolesText')}
                    />
                  </FormField>
                  <FormField id="queue-channels" label="Supported channels" hint="Comma separated">
                    <TextInput
                      value={queueForm.channelsText}
                      onChange={handleQueueFieldChange('channelsText')}
                    />
                  </FormField>
                  <FormField id="queue-triage" label="Triage form URL" optionalLabel="Optional">
                    <TextInput
                      value={queueForm.triageFormUrl}
                      onChange={handleQueueFieldChange('triageFormUrl')}
                      placeholder="https://forms.fixnado.com/..."
                    />
                  </FormField>
                  <FormField id="queue-accent" label="Accent colour">
                    <TextInput
                      value={queueForm.accentColor}
                      onChange={handleQueueFieldChange('accentColor')}
                      placeholder="#0ea5e9"
                    />
                  </FormField>
                  <Checkbox
                    label="Enable auto-responder for this queue"
                    checked={queueForm.autoResponderEnabled}
                    onChange={handleQueueToggle('autoResponderEnabled')}
                  />
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <Button type="submit" disabled={savingQueue}>
                    {editingQueueId ? 'Update queue' : 'Create queue'}
                  </Button>
                  {editingQueueId ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setEditingQueueId(null);
                        setQueueForm({ ...EMPTY_QUEUE_FORM });
                      }}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </form>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-primary">Queues</h2>
                <p className="mt-1 text-sm text-slate-600">Manage responder coverage and SLA policies.</p>
                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Queue</th>
                        <th className="px-4 py-3 text-left">SLA</th>
                        <th className="px-4 py-3 text-left">Awaiting</th>
                        <th className="px-4 py-3 text-left">Breaches</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {(snapshot.queues ?? []).map((queue) => {
                        const metricsForQueue = (snapshot.queueMetrics ?? []).find((item) => item.id === queue.id) ?? {};
                        return (
                          <tr key={queue.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-primary">{queue.name}</div>
                              <div className="text-xs text-slate-500">{queue.allowedRoles?.join(', ')}</div>
                            </td>
                            <td className="px-4 py-3">
                              {queue.slaMinutes ?? 15} min
                              <div className="text-xs text-slate-500">Escalation {queue.escalationMinutes ?? 45} min</div>
                            </td>
                            <td className="px-4 py-3">{numberFormatter.format(metricsForQueue.awaitingResponse ?? 0)}</td>
                            <td className="px-4 py-3">{numberFormatter.format(metricsForQueue.breachRisk ?? 0)}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-3">
                                <Button variant="ghost" size="sm" onClick={() => handleQueueEdit(queue.id)}>
                                  Edit
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleQueueDelete(queue.id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <form
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                onSubmit={handleTemplateSubmit}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-primary">
                      {editingTemplateId ? 'Edit template' : 'Create template'}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Maintain reusable responses for support and operations teams.
                    </p>
                  </div>
                  {savingTemplate ? <StatusPill tone="info">Saving…</StatusPill> : null}
                </div>

                <div className="mt-6 grid gap-6">
                  <FormField id="template-name" label="Template name">
                    <TextInput value={templateForm.name} onChange={handleTemplateFieldChange('name')} required />
                  </FormField>
                  <FormField id="template-queue" label="Associated queue" optionalLabel="Optional">
                    <Select value={templateForm.queueId} onChange={handleTemplateFieldChange('queueId')}>
                      <option value="">All queues</option>
                      {queueOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField id="template-category" label="Category" optionalLabel="Optional">
                      <TextInput
                        value={templateForm.category}
                        onChange={handleTemplateFieldChange('category')}
                        placeholder="Status update, booking, warning…"
                      />
                    </FormField>
                    <FormField id="template-locale" label="Locale">
                      <TextInput value={templateForm.locale} onChange={handleTemplateFieldChange('locale')} />
                    </FormField>
                  </div>
                  <FormField id="template-subject" label="Subject" optionalLabel="Optional">
                    <TextInput
                      value={templateForm.subject}
                      onChange={handleTemplateFieldChange('subject')}
                      placeholder="Subject line for email channels"
                    />
                  </FormField>
                  <FormField id="template-body" label="Body">
                    <textarea
                      className="fx-text-input h-40"
                      value={templateForm.body}
                      onChange={handleTemplateFieldChange('body')}
                      required
                    />
                  </FormField>
                  <FormField id="template-tags" label="Tags" hint="Comma separated">
                    <TextInput
                      value={templateForm.tagsText}
                      onChange={handleTemplateFieldChange('tagsText')}
                      placeholder="welcome, status-update"
                    />
                  </FormField>
                  <FormField id="template-preview" label="Preview image URL" optionalLabel="Optional">
                    <TextInput
                      value={templateForm.previewImageUrl}
                      onChange={handleTemplateFieldChange('previewImageUrl')}
                    />
                  </FormField>
                  <Checkbox
                    label="Template is active"
                    checked={templateForm.isActive}
                    onChange={handleTemplateToggle('isActive')}
                  />
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <Button type="submit" disabled={savingTemplate}>
                    {editingTemplateId ? 'Update template' : 'Create template'}
                  </Button>
                  {editingTemplateId ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setEditingTemplateId(null);
                        setTemplateForm({ ...EMPTY_TEMPLATE_FORM });
                      }}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </form>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-primary">Templates</h2>
                <p className="mt-1 text-sm text-slate-600">Organise reusable responses for your teams.</p>
                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Template</th>
                        <th className="px-4 py-3 text-left">Queue</th>
                        <th className="px-4 py-3 text-left">Locale</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {(snapshot.templates ?? []).map((template) => {
                        const queueName = queueOptions.find((option) => option.value === template.queueId)?.label || 'All queues';
                        return (
                          <tr key={template.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-primary">{template.name}</div>
                              <div className="text-xs text-slate-500">{template.category}</div>
                            </td>
                            <td className="px-4 py-3">{queueName}</td>
                            <td className="px-4 py-3">{template.locale}</td>
                            <td className="px-4 py-3">
                              {template.isActive ? (
                                <StatusPill tone="success">Active</StatusPill>
                              ) : (
                                <StatusPill tone="warning">Paused</StatusPill>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-3">
                                <Button variant="ghost" size="sm" onClick={() => handleTemplateEdit(template.id)}>
                                  Edit
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleTemplateDelete(template.id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
            Unable to load inbox configuration.
          </div>
        )}
      </div>
    </div>
  );
}
