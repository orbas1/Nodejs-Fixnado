import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchPlatformSettings,
  fetchPlatformSettingDiagnostics,
  persistPlatformSettings,
  runPlatformSettingDiagnostic
} from '../../api/platformSettingsClient.js';
import SystemSettingsForm from './SystemSettingsForm.jsx';
import DiagnosticDetailDialog from './components/DiagnosticDetailDialog.jsx';
import {
  STORAGE_SYNC_FIELDS,
  buildFormState,
  buildSettingsPayload,
  computeMeta,
  emptyLink,
  SECTION_LABELS
} from './utils.js';

function SystemSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [form, setForm] = useState(null);
  const [diagnostics, setDiagnostics] = useState([]);
  const [diagnosticSections, setDiagnosticSections] = useState([]);
  const [diagnosticLoading, setDiagnosticLoading] = useState(null);
  const [diagnosticError, setDiagnosticError] = useState(null);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [diagnosticFilter, setDiagnosticFilter] = useState('all');
  const [selectedDiagnostic, setSelectedDiagnostic] = useState(null);
  const [sectionFeedback, setSectionFeedback] = useState({});

  const loadDiagnostics = useCallback(
    async (sectionOverride) => {
      const target = sectionOverride ?? diagnosticFilter;
      const sectionParam = target === 'all' ? undefined : target;
      setDiagnosticError(null);
      setDiagnosticsLoading(true);
      try {
        const { diagnostics: history, sections } = await fetchPlatformSettingDiagnostics({
          limit: 25,
          section: sectionParam
        });
        setDiagnostics(history);
        if (Array.isArray(sections)) {
          setDiagnosticSections(sections);
          if (target !== 'all' && !sections.some((option) => option.value === target)) {
            setDiagnosticFilter('all');
          }
        } else {
          setDiagnosticSections([]);
        }
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : 'Failed to load diagnostic history';
        setDiagnosticError(message);
      } finally {
        setDiagnosticsLoading(false);
      }
    },
    [diagnosticFilter]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const settings = await fetchPlatformSettings();
      setForm(buildFormState(settings));
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Failed to load system settings';
      setError(message);
    } finally {
      await loadDiagnostics();
      setLoading(false);
    }
  }, [loadDiagnostics]);

  const buildDiagnosticPayload = useCallback(
    (section) => {
      if (!form) return null;
      switch (section) {
        case 'smtp': {
          const payload = { ...form.integrations.smtp };
          if (payload.port === '') {
            delete payload.port;
          }
          return payload;
        }
        case 'storage':
          return { ...form.system.storage, ...form.integrations.cloudflareR2 };
        case 'chatwoot':
          return { ...form.system.chatwoot };
        case 'openai':
          return { ...form.system.openai };
        case 'slack':
          return { ...form.system.slack };
        case 'github':
          return { ...form.system.github };
        case 'google-drive':
          return { ...form.system.googleDrive };
        default:
          return null;
      }
    },
    [form]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!success || typeof window === 'undefined') {
      return undefined;
    }
    const timeout = window.setTimeout(() => setSuccess(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [success]);

  const meta = useMemo(() => computeMeta(form), [form]);

  const handleSiteChange = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => ({
      ...current,
      system: {
        ...current.system,
        site: { ...current.system.site, [field]: value }
      },
      integrations:
        field === 'name' || field === 'url' || field === 'supportEmail'
          ? {
              ...current.integrations,
              app: { ...current.integrations.app, [field]: value }
            }
          : current.integrations
    }));
  };

  const handleSmtpChange = (field) => (event) => {
    const value = field === 'secure' ? event.target.checked : event.target.value;
    setForm((current) => ({
      ...current,
      integrations: {
        ...current.integrations,
        smtp: {
          ...current.integrations.smtp,
          [field]: value
        }
      }
    }));
  };

  const handleStorageChange = (field) => (event) => {
    const value = field === 'useCdn' ? event.target.checked : event.target.value;
    setForm((current) => {
      const next = {
        ...current,
        system: {
          ...current.system,
          storage: {
            ...current.system.storage,
            [field]: value
          }
        },
        integrations: { ...current.integrations }
      };
      if (STORAGE_SYNC_FIELDS.has(field)) {
        next.integrations.cloudflareR2 = {
          ...current.integrations.cloudflareR2,
          [field]: value
        };
      }
      return next;
    });
  };

  const handleSystemSectionChange = (section, field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((current) => ({
      ...current,
      system: {
        ...current.system,
        [section]: {
          ...current.system[section],
          [field]: value
        }
      }
    }));
  };

  const handleLinkChange = (collection, index, field) => (event) => {
    const value = event.target.value;
    setForm((current) => {
      const nextCollection = current.system[collection].map((entry, idx) =>
        idx === index ? { ...entry, [field]: value } : entry
      );
      return {
        ...current,
        system: {
          ...current.system,
          [collection]: nextCollection
        }
      };
    });
  };

  const handleAddLink = (collection) => () => {
    setForm((current) => ({
      ...current,
      system: {
        ...current.system,
        [collection]: [...current.system[collection], emptyLink()]
      }
    }));
  };

  const handleRemoveLink = (collection, index) => () => {
    setForm((current) => {
      const next = current.system[collection].filter((_, idx) => idx !== index);
      return {
        ...current,
        system: {
          ...current.system,
          [collection]: next.length > 0 ? next : [emptyLink()]
        }
      };
    });
  };

  const handleMoveLink = (collection, index, direction) => () => {
    setForm((current) => {
      const entries = current.system[collection];
      if (!Array.isArray(entries)) {
        return current;
      }
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= entries.length) {
        return current;
      }
      const next = entries.slice();
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return {
        ...current,
        system: {
          ...current.system,
          [collection]: next
        }
      };
    });
  };

  const handleReset = () => {
    if (!saving) {
      refresh();
    }
  };

  const handleDiagnostic = useCallback(
    async (section) => {
      if (!form) return;
      setDiagnosticError(null);
      setError(null);
      setSuccess(null);
      setDiagnosticLoading(section);
      try {
        const payload = buildDiagnosticPayload(section);
        if (!payload) {
          throw new Error('Unsupported diagnostic target');
        }
        const diagnostic = await runPlatformSettingDiagnostic(section, payload);
        if (!diagnostic) {
          throw new Error('Diagnostic did not return a result');
        }
        setSectionFeedback((current) => ({ ...current, [section]: diagnostic }));
        setSuccess(`${SECTION_LABELS[section] ?? 'Diagnostic'}: ${diagnostic.message}`);
        await loadDiagnostics();
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : 'Failed to run diagnostic';
        setDiagnosticError(message);
      } finally {
        setDiagnosticLoading(null);
      }
    },
    [form, buildDiagnosticPayload, loadDiagnostics]
  );

  const handleDiagnosticFilterChange = (value) => {
    setDiagnosticFilter(value);
    loadDiagnostics(value);
  };

  const handleRetryDiagnostic = (section) => {
    if (!section) {
      return;
    }
    void handleDiagnostic(section);
  };

  const handleInspectDiagnostic = (entry) => {
    setSelectedDiagnostic(entry);
  };

  const handleCloseInspection = () => {
    setSelectedDiagnostic(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload = buildSettingsPayload(form);

    try {
      const updated = await persistPlatformSettings(payload);
      setForm(buildFormState(updated));
      setSuccess('System settings updated successfully.');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Failed to save system settings';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SystemSettingsForm
        form={form}
        meta={meta}
        loading={loading}
        error={error}
        success={success}
        diagnosticError={diagnosticError}
        saving={saving}
        onSubmit={handleSubmit}
        onReset={handleReset}
        onSiteChange={handleSiteChange}
        onSmtpChange={handleSmtpChange}
        onStorageChange={handleStorageChange}
        onSystemSectionChange={handleSystemSectionChange}
        onLinkChange={handleLinkChange}
        onAddLink={handleAddLink}
        onRemoveLink={handleRemoveLink}
        onMoveLink={handleMoveLink}
        onDiagnostic={handleDiagnostic}
        diagnosticLoading={diagnosticLoading}
        sectionFeedback={sectionFeedback}
        diagnostics={diagnostics}
        diagnosticsLoading={diagnosticsLoading}
        diagnosticSections={diagnosticSections}
        diagnosticFilter={diagnosticFilter}
        onDiagnosticFilterChange={handleDiagnosticFilterChange}
        onDiagnosticsRefresh={() => loadDiagnostics()}
        onInspectDiagnostic={handleInspectDiagnostic}
        onRetryDiagnostic={handleRetryDiagnostic}
      />
      <DiagnosticDetailDialog
        diagnostic={selectedDiagnostic}
        open={Boolean(selectedDiagnostic)}
        onClose={handleCloseInspection}
      />
    </>
  );
}

export default SystemSettingsPage;
