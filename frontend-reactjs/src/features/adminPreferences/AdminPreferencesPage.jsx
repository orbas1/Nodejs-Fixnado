import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import PageHeader from '../../components/blueprints/PageHeader.jsx';
import { Button, Card, Spinner, StatusPill } from '../../components/ui/index.js';
import { fetchAdminPreferences, persistAdminPreferences } from '../../api/adminPreferencesClient.js';
import {
  THEME_OPTIONS,
  buildFormState,
  buildMetaSummary,
  buildPayload,
  buildLinkId,
  cloneFormState,
  formatSectionList,
  normaliseMeta,
  ensureNonEmptyList
} from './state.js';
import GeneralPreferencesSection from './components/GeneralPreferencesSection.jsx';
import NotificationPreferencesSection from './components/NotificationPreferencesSection.jsx';
import SecurityPreferencesSection from './components/SecurityPreferencesSection.jsx';
import WorkspacePreferencesSection from './components/WorkspacePreferencesSection.jsx';

export default function AdminPreferencesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [success, setSuccess] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [meta, setMeta] = useState(normaliseMeta());
  const [form, setForm] = useState(null);
  const [baseline, setBaseline] = useState(null);

  const refreshPreferences = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setValidationErrors([]);
    try {
      const snapshot = await fetchAdminPreferences();
      const initialForm = buildFormState(snapshot.preferences);
      const baselineState = cloneFormState(initialForm);
      const formState = cloneFormState(initialForm);
      setPreferences(snapshot.preferences);
      setForm(formState);
      setBaseline(baselineState);
      setMeta(normaliseMeta(snapshot.meta));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPreferences();
  }, [refreshPreferences]);

  const headerMeta = useMemo(() => buildMetaSummary(preferences, meta), [preferences, meta]);
  const isDirty = useMemo(() => {
    if (!baseline || !form) {
      return false;
    }
    return JSON.stringify(form) !== JSON.stringify(baseline);
  }, [baseline, form]);

  const handleGeneralChange = (field, value) => {
    setForm((current) => ({
      ...current,
      general: { ...current.general, [field]: value }
    }));
  };

  const handleNotificationToggle = (field) => (event) => {
    const { checked } = event.target;
    setForm((current) => ({
      ...current,
      notifications: { ...current.notifications, [field]: checked }
    }));
  };

  const handleNotificationChange = (field, value) => {
    setForm((current) => ({
      ...current,
      notifications: { ...current.notifications, [field]: value }
    }));
  };

  const handleNotificationListChange = (index, value) => {
    setForm((current) => {
      const nextList = current.notifications.escalationEmails.slice();
      nextList[index] = value;
      return {
        ...current,
        notifications: { ...current.notifications, escalationEmails: nextList }
      };
    });
  };

  const addEscalationEmail = () => {
    setForm((current) => ({
      ...current,
      notifications: {
        ...current.notifications,
        escalationEmails: [...current.notifications.escalationEmails, '']
      }
    }));
  };

  const removeEscalationEmail = (index) => {
    setForm((current) => {
      const next = current.notifications.escalationEmails.filter((_, idx) => idx !== index);
      return {
        ...current,
        notifications: { ...current.notifications, escalationEmails: ensureNonEmptyList(next) }
      };
    });
  };

  const handleSecurityToggle = (field) => (event) => {
    const { checked } = event.target;
    setForm((current) => ({
      ...current,
      security: { ...current.security, [field]: checked }
    }));
  };

  const handleSecurityChange = (field, value) => {
    setForm((current) => ({
      ...current,
      security: { ...current.security, [field]: value }
    }));
  };

  const updateSecurityList = (field, index, value) => {
    setForm((current) => {
      const nextList = current.security[field].slice();
      nextList[index] = value;
      return {
        ...current,
        security: { ...current.security, [field]: nextList }
      };
    });
  };

  const addSecurityListEntry = (field) => {
    setForm((current) => ({
      ...current,
      security: {
        ...current.security,
        [field]: [...current.security[field], '']
      }
    }));
  };

  const removeSecurityListEntry = (field, index) => {
    setForm((current) => ({
      ...current,
      security: {
        ...current.security,
        [field]: ensureNonEmptyList(current.security[field].filter((_, idx) => idx !== index))
      }
    }));
  };

  const handleWorkspaceChange = (field, value) => {
    setForm((current) => ({
      ...current,
      workspace: { ...current.workspace, [field]: value }
    }));
  };

  const handleWorkspaceToggle = (field) => (event) => {
    const { checked } = event.target;
    setForm((current) => ({
      ...current,
      workspace: { ...current.workspace, [field]: checked }
    }));
  };

  const updateAllowedRole = (index, value) => {
    setForm((current) => {
      const nextRoles = current.workspace.allowedAdminRoles.slice();
      nextRoles[index] = value;
      return {
        ...current,
        workspace: { ...current.workspace, allowedAdminRoles: nextRoles }
      };
    });
  };

  const addAllowedRole = () => {
    setForm((current) => ({
      ...current,
      workspace: {
        ...current.workspace,
        allowedAdminRoles: [...current.workspace.allowedAdminRoles, '']
      }
    }));
  };

  const removeAllowedRole = (index) => {
    setForm((current) => ({
      ...current,
      workspace: {
        ...current.workspace,
        allowedAdminRoles: ensureNonEmptyList(
          current.workspace.allowedAdminRoles.filter((_, idx) => idx !== index),
          'admin'
        )
      }
    }));
  };

  const updateQuickLink = (index, field, value) => {
    setForm((current) => {
      const nextLinks = current.workspace.quickLinks.slice();
      nextLinks[index] = { ...nextLinks[index], [field]: value };
      return {
        ...current,
        workspace: { ...current.workspace, quickLinks: nextLinks }
      };
    });
  };

  const addQuickLink = () => {
    setForm((current) => ({
      ...current,
      workspace: {
        ...current.workspace,
        quickLinks: [...current.workspace.quickLinks, { id: buildLinkId(), label: '', href: '' }]
      }
    }));
  };

  const removeQuickLink = (index) => {
    setForm((current) => ({
      ...current,
      workspace: {
        ...current.workspace,
        quickLinks: current.workspace.quickLinks.filter((_, idx) => idx !== index)
      }
    }));
  };

  const resetForm = useCallback(() => {
    if (!baseline) {
      return;
    }
    const restored = cloneFormState(baseline);
    if (!restored) {
      return;
    }
    setForm(restored);
    setValidationErrors([]);
    setSuccess(null);
    setError(null);
  }, [baseline]);

  const handleSave = async () => {
    if (!form || !isDirty) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    setValidationErrors([]);
    try {
      const payload = buildPayload(form);
      const snapshot = await persistAdminPreferences(payload);
      const nextFormState = buildFormState(snapshot.preferences);
      const nextBaseline = cloneFormState(nextFormState);
      const formState = cloneFormState(nextFormState);
      setPreferences(snapshot.preferences);
      setForm(formState);
      setBaseline(nextBaseline);
      setMeta(normaliseMeta(snapshot.meta));
      setSuccess('Admin preferences updated successfully.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save preferences');
      if (caught?.details && Array.isArray(caught.details)) {
        setValidationErrors(caught.details);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
        <Spinner className="h-8 w-8 text-primary" />
        <span className="sr-only">Loading admin preferences</span>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <StatusPill tone="danger">Failed to initialise preferences</StatusPill>
        {error ? <p className="mt-4 text-sm text-slate-500">{error}</p> : null}
        <div className="mt-8 flex justify-center">
          <Button variant="secondary" icon={ArrowPathIcon} onClick={refreshPreferences}>
            Retry loading
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50">
      <PageHeader
        eyebrow="Admin control centre"
        title="Settings & preferences"
        description="Manage the operating guardrails, escalation contacts, and workspace defaults for platform administrators."
        breadcrumbs={[
          { label: 'Admin home', to: '/admin/dashboard' },
          { label: 'Settings preferences' }
        ]}
        actions={[
          {
            label: 'Admin dashboard',
            to: '/admin/dashboard',
            variant: 'secondary'
          },
          {
            label: 'Monetisation controls',
            to: '/admin/monetisation',
            variant: 'secondary'
          }
        ]}
        meta={headerMeta}
      />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            icon={ArrowPathIcon}
            iconPosition="start"
            onClick={refreshPreferences}
            disabled={loading || saving}
          >
            Refresh snapshot
          </Button>
          <Button
            variant="ghost"
            icon={ArrowUturnLeftIcon}
            iconPosition="start"
            onClick={resetForm}
            disabled={!baseline || !isDirty || saving}
          >
            Reset changes
          </Button>
          <Button
            variant="primary"
            icon={ShieldCheckIcon}
            iconPosition="start"
            onClick={handleSave}
            loading={saving}
            disabled={!isDirty || saving}
          >
            Save preferences
          </Button>
          {isDirty ? <StatusPill tone="warning">You have unsaved changes</StatusPill> : null}
          {typeof meta.version === 'number' ? <StatusPill tone="neutral">Version v{meta.version}</StatusPill> : null}
          {meta.changedSections.length > 0 ? (
            <StatusPill tone="info">Recent updates: {formatSectionList(meta.changedSections)}</StatusPill>
          ) : null}
          {success ? <StatusPill tone="success">{success}</StatusPill> : null}
          {error ? <StatusPill tone="danger">{error}</StatusPill> : null}
          {saving ? <StatusPill tone="info">Saving…</StatusPill> : null}
        </div>

        {validationErrors.length > 0 ? (
          <Card className="mb-8 border border-rose-200 bg-rose-50/70" padding="lg">
            <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-rose-600">Validation details</h2>
            <ul className="mt-4 space-y-2 text-sm text-rose-700">
              {validationErrors.map((detail) => (
                <li key={`${detail.field}-${detail.message}`}>
                  {detail.field ? `${detail.field}: ` : ''}
                  {detail.message}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        <div className="space-y-8">
          <GeneralPreferencesSection general={form.general} onFieldChange={handleGeneralChange} />
          <NotificationPreferencesSection
            notifications={form.notifications}
            onToggle={handleNotificationToggle}
            onFieldChange={handleNotificationChange}
            onListChange={handleNotificationListChange}
            onAddEmail={addEscalationEmail}
            onRemoveEmail={removeEscalationEmail}
          />
          <SecurityPreferencesSection
            security={form.security}
            onToggle={handleSecurityToggle}
            onFieldChange={handleSecurityChange}
            onListChange={updateSecurityList}
            onAddListEntry={addSecurityListEntry}
            onRemoveListEntry={removeSecurityListEntry}
          />
          <WorkspacePreferencesSection
            workspace={form.workspace}
            themeOptions={THEME_OPTIONS}
            onToggle={handleWorkspaceToggle}
            onFieldChange={handleWorkspaceChange}
            onUpdateRole={updateAllowedRole}
            onAddRole={addAllowedRole}
            onRemoveRole={removeAllowedRole}
            onUpdateQuickLink={updateQuickLink}
            onAddQuickLink={addQuickLink}
            onRemoveQuickLink={removeQuickLink}
          />
        </div>
      </div>
    </div>
  );
}
