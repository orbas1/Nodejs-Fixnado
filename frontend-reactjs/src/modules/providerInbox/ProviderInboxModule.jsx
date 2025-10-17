import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import InboxSettingsForm from '../../features/communications/components/InboxSettingsForm.jsx';
import EntryPointsManager from '../../features/communications/components/EntryPointsManager.jsx';
import QuickRepliesManager from '../../features/communications/components/QuickRepliesManager.jsx';
import EscalationRulesManager from '../../features/communications/components/EscalationRulesManager.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';
import {
  fetchInboxSettings,
  saveInboxSettings,
  createInboxEntryPoint,
  updateInboxEntryPoint,
  deleteInboxEntryPoint,
  createInboxQuickReply,
  updateInboxQuickReply,
  deleteInboxQuickReply,
  createInboxEscalationRule,
  updateInboxEscalationRule,
  deleteInboxEscalationRule
} from '../../api/communicationsClient.js';

const sortEntryPoints = (entries = []) =>
  [...entries].sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) {
      return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    }
    return (a.label || '').localeCompare(b.label || '');
  });

const normaliseQuickRepliesList = (items = []) =>
  [...items].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    }
    return (a.title || '').localeCompare(b.title || '');
  });

const normaliseEscalationRulesList = (items = []) =>
  [...items].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

const buildConfigurationState = (snapshot) => ({
  liveRoutingEnabled: snapshot?.configuration?.liveRoutingEnabled ?? true,
  defaultGreeting: snapshot?.configuration?.defaultGreeting ?? '',
  aiAssistDisplayName: snapshot?.configuration?.aiAssistDisplayName ?? 'Fixnado Assist',
  aiAssistDescription: snapshot?.configuration?.aiAssistDescription ?? '',
  timezone: snapshot?.configuration?.timezone ?? 'Europe/London',
  quietHoursStart: snapshot?.configuration?.quietHoursStart ?? '',
  quietHoursEnd: snapshot?.configuration?.quietHoursEnd ?? ''
});

const buildNewEntryPoint = () => ({
  key: '',
  label: '',
  description: '',
  icon: '',
  defaultMessage: '',
  ctaLabel: '',
  ctaUrl: '',
  imageUrl: '',
  displayOrder: '',
  enabled: true
});

const buildNewQuickReply = () => ({
  title: '',
  body: '',
  category: '',
  sortOrder: '',
  allowedRoles: []
});

const buildNewEscalationRule = () => ({
  name: '',
  description: '',
  triggerType: 'keyword',
  keywords: '',
  minutesWithoutReply: '',
  targetType: 'user',
  targetReference: '',
  targetLabel: '',
  allowedRoles: [],
  slaMinutes: 15,
  responseTemplate: '',
  active: true
});

const buildEscalationPayload = (draft) => {
  const payload = {
    name: draft.name,
    description: draft.description || null,
    triggerType: draft.triggerType,
    targetType: draft.targetType,
    targetReference: draft.targetReference,
    targetLabel: draft.targetLabel || null,
    allowedRoles: draft.allowedRoles,
    slaMinutes: Number.isFinite(Number(draft.slaMinutes))
      ? Number.parseInt(draft.slaMinutes, 10)
      : undefined,
    active: draft.active,
    responseTemplate: draft.responseTemplate || null
  };

  if (draft.triggerType === 'inactivity') {
    payload.triggerMetadata = {
      minutesWithoutReply: Number.isFinite(Number(draft.minutesWithoutReply))
        ? Number.parseInt(draft.minutesWithoutReply, 10)
        : 15
    };
  } else if (draft.triggerType === 'keyword') {
    payload.triggerMetadata = {
      keywords: draft.keywords
        ? draft.keywords
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : []
    };
  }

  return payload;
};

const ProviderInboxModule = ({ tenantId, initialSnapshot, summary, capabilities, error }) => {
  const [configuration, setConfiguration] = useState(() => buildConfigurationState(initialSnapshot));
  const [entryPoints, setEntryPoints] = useState(() => sortEntryPoints(initialSnapshot?.entryPoints ?? []));
  const entryPointSnapshotRef = useRef(
    new Map((initialSnapshot?.entryPoints ?? []).map((entry) => [entry.id, entry]))
  );
  const [entryPointDirtyMap, setEntryPointDirtyMap] = useState({});
  const [entryPointSavingMap, setEntryPointSavingMap] = useState({});
  const [entryPointDeletingMap, setEntryPointDeletingMap] = useState({});
  const [creatingEntryPoint, setCreatingEntryPoint] = useState(false);
  const [newEntryPoint, setNewEntryPoint] = useState(() => buildNewEntryPoint());

  const [quickReplies, setQuickReplies] = useState(() =>
    normaliseQuickRepliesList(initialSnapshot?.quickReplies ?? [])
  );
  const [newQuickReply, setNewQuickReply] = useState(() => buildNewQuickReply());
  const [editingQuickReplyId, setEditingQuickReplyId] = useState(null);
  const [editingQuickReplyDraft, setEditingQuickReplyDraft] = useState(null);

  const [escalationRules, setEscalationRules] = useState(() =>
    normaliseEscalationRulesList(initialSnapshot?.escalationRules ?? [])
  );
  const [newEscalationRule, setNewEscalationRule] = useState(() => buildNewEscalationRule());
  const [editingEscalationId, setEditingEscalationId] = useState(null);
  const [editingEscalationDraft, setEditingEscalationDraft] = useState(null);

  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState(error ?? null);
  const [statusMessage, setStatusMessage] = useState('');

  const tenantHeaders = useMemo(() => (tenantId ? { 'x-tenant-id': tenantId } : {}), [tenantId]);
  const withTenant = useCallback(
    (options = {}) => ({
      ...options,
      headers: { ...(options.headers ?? {}), ...tenantHeaders }
    }),
    [tenantHeaders]
  );

  const applySnapshot = useCallback(
    (snapshot) => {
      if (!snapshot) {
        return;
      }
      setConfiguration(buildConfigurationState(snapshot));
      const sortedEntries = sortEntryPoints(snapshot.entryPoints ?? []);
      setEntryPoints(sortedEntries);
      entryPointSnapshotRef.current = new Map(sortedEntries.map((entry) => [entry.id, entry]));
      setEntryPointDirtyMap({});
      setEntryPointSavingMap({});
      setEntryPointDeletingMap({});
      setQuickReplies(normaliseQuickRepliesList(snapshot.quickReplies ?? []));
      setEscalationRules(normaliseEscalationRulesList(snapshot.escalationRules ?? []));
    },
    []
  );

  useEffect(() => {
    if (initialSnapshot) {
      applySnapshot(initialSnapshot);
    }
  }, [initialSnapshot, applySnapshot]);

  useEffect(() => {
    setSettingsError(error ?? null);
  }, [error]);

  const clearStatusMessage = useCallback(() => {
    window.clearTimeout(clearStatusMessage.timeoutId);
    clearStatusMessage.timeoutId = window.setTimeout(() => {
      setStatusMessage('');
    }, 3200);
  }, []);

  useEffect(() => () => window.clearTimeout(clearStatusMessage.timeoutId), [clearStatusMessage]);

  const sortedEntryPoints = useMemo(() => sortEntryPoints(entryPoints), [entryPoints]);

  const handleConfigurationChange = useCallback((field, value) => {
    setConfiguration((current) => ({
      ...current,
      [field]: value
    }));
  }, []);

  const handleSettingsSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (!tenantId) {
        setSettingsError('A provider tenant identifier is required to save inbox settings.');
        return;
      }
      setSettingsSaving(true);
      saveInboxSettings(
        {
          liveRoutingEnabled: configuration.liveRoutingEnabled,
          defaultGreeting: configuration.defaultGreeting,
          aiAssistDisplayName: configuration.aiAssistDisplayName,
          aiAssistDescription: configuration.aiAssistDescription,
          timezone: configuration.timezone,
          quietHoursStart: configuration.quietHoursStart || null,
          quietHoursEnd: configuration.quietHoursEnd || null
        },
        withTenant()
      )
        .then((payload) => {
          applySnapshot(payload);
          setSettingsError(null);
          setStatusMessage('Inbox configuration saved successfully.');
          clearStatusMessage();
        })
        .catch((saveError) => {
          setSettingsError(saveError.message || 'Unable to save inbox settings');
        })
        .finally(() => {
          setSettingsSaving(false);
        });
    },
    [tenantId, configuration, withTenant, applySnapshot, clearStatusMessage]
  );

  const handleSettingsRefresh = useCallback(() => {
    if (!tenantId) {
      setSettingsError('Assign this provider to a tenant before refreshing settings.');
      return;
    }
    setSettingsLoading(true);
    fetchInboxSettings(withTenant())
      .then((payload) => {
        applySnapshot(payload);
        setSettingsError(null);
      })
      .catch((refreshError) => {
        setSettingsError(refreshError.message || 'Unable to reload inbox settings');
      })
      .finally(() => {
        setSettingsLoading(false);
      });
  }, [tenantId, withTenant, applySnapshot]);

  const handleEntryPointToggle = useCallback((id) => {
    setEntryPoints((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, enabled: !entry.enabled } : entry))
    );
    setEntryPointDirtyMap((current) => ({ ...current, [id]: true }));
  }, []);

  const handleEntryPointFieldChange = useCallback((id, field, value) => {
    setEntryPoints((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry))
    );
    setEntryPointDirtyMap((current) => ({ ...current, [id]: true }));
  }, []);

  const resetEntryPointDirtyState = useCallback((id) => {
    setEntryPointDirtyMap((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }, []);

  const handleEntryPointReset = useCallback(
    (id) => {
      const snapshot = entryPointSnapshotRef.current.get(id);
      if (!snapshot) {
        return;
      }
      setEntryPoints((current) => current.map((entry) => (entry.id === id ? { ...snapshot } : entry)));
      resetEntryPointDirtyState(id);
    },
    [resetEntryPointDirtyState]
  );

  const handleEntryPointSave = useCallback(
    (id) => {
      const entry = entryPoints.find((item) => item.id === id);
      if (!entry || !tenantId) {
        return;
      }
      setEntryPointSavingMap((current) => ({ ...current, [id]: true }));
      updateInboxEntryPoint(
        id,
        {
          label: entry.label,
          description: entry.description,
          icon: entry.icon,
          defaultMessage: entry.defaultMessage,
          imageUrl: entry.imageUrl,
          ctaLabel: entry.ctaLabel,
          ctaUrl: entry.ctaUrl,
          enabled: entry.enabled,
          displayOrder:
            entry.displayOrder === '' || entry.displayOrder == null
              ? undefined
              : Number.parseInt(entry.displayOrder, 10)
        },
        withTenant()
      )
        .then((updated) => {
          entryPointSnapshotRef.current.set(id, updated);
          setEntryPoints((current) => current.map((item) => (item.id === id ? updated : item)));
          resetEntryPointDirtyState(id);
          setSettingsError(null);
          setStatusMessage('Entry point updated.');
          clearStatusMessage();
        })
        .catch((updateError) => {
          setSettingsError(updateError.message || 'Unable to update entry point');
        })
        .finally(() => {
          setEntryPointSavingMap((current) => {
            const next = { ...current };
            delete next[id];
            return next;
          });
        });
    },
    [entryPoints, tenantId, withTenant, resetEntryPointDirtyState, clearStatusMessage]
  );

  const handleEntryPointDelete = useCallback(
    (id) => {
      if (!tenantId) {
        return;
      }
      setEntryPointDeletingMap((current) => ({ ...current, [id]: true }));
      deleteInboxEntryPoint(id, withTenant())
        .then(() => {
          entryPointSnapshotRef.current.delete(id);
          setEntryPoints((current) => current.filter((entry) => entry.id !== id));
          resetEntryPointDirtyState(id);
          setSettingsError(null);
          setStatusMessage('Entry point removed.');
          clearStatusMessage();
        })
        .catch((deleteError) => {
          setSettingsError(deleteError.message || 'Unable to delete entry point');
        })
        .finally(() => {
          setEntryPointDeletingMap((current) => {
            const next = { ...current };
            delete next[id];
            return next;
          });
        });
    },
    [tenantId, withTenant, resetEntryPointDirtyState, clearStatusMessage]
  );

  const resetNewEntryPointForm = useCallback(() => {
    setNewEntryPoint(buildNewEntryPoint());
  }, []);

  const handleNewEntryPointChange = useCallback((field, value) => {
    setNewEntryPoint((current) => ({
      ...current,
      [field]: value
    }));
  }, []);

  const handleNewEntryPointSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (!tenantId) {
        setSettingsError('Assign this provider to a tenant before creating entry points.');
        return;
      }
      setCreatingEntryPoint(true);
      createInboxEntryPoint(
        {
          key: newEntryPoint.key,
          label: newEntryPoint.label,
          description: newEntryPoint.description,
          icon: newEntryPoint.icon,
          defaultMessage: newEntryPoint.defaultMessage,
          imageUrl: newEntryPoint.imageUrl,
          ctaLabel: newEntryPoint.ctaLabel,
          ctaUrl: newEntryPoint.ctaUrl,
          enabled: newEntryPoint.enabled,
          displayOrder:
            newEntryPoint.displayOrder === ''
              ? undefined
              : Number.parseInt(newEntryPoint.displayOrder, 10)
        },
        withTenant()
      )
        .then((created) => {
          entryPointSnapshotRef.current.set(created.id, created);
          setEntryPoints((current) => sortEntryPoints([...current, created]));
          resetNewEntryPointForm();
          setSettingsError(null);
          setStatusMessage('Entry point created.');
          clearStatusMessage();
        })
        .catch((createError) => {
          setSettingsError(createError.message || 'Unable to create entry point');
        })
        .finally(() => {
          setCreatingEntryPoint(false);
        });
    },
    [tenantId, newEntryPoint, withTenant, resetNewEntryPointForm, clearStatusMessage]
  );

  const handleTemplateCopy = useCallback((template) => {
    if (!template) {
      return;
    }
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(template)
        .then(() => {
          setStatusMessage('Template copied to clipboard.');
          clearStatusMessage();
        })
        .catch(() => {
          setStatusMessage('Template ready – paste where needed.');
          clearStatusMessage();
        });
    } else {
      setStatusMessage('Template ready – paste where needed.');
      clearStatusMessage();
    }
  }, [clearStatusMessage]);

  const toggleRoleInDraft = useCallback((role, updater) => {
    updater((current) => {
      if (!current) {
        return current;
      }
      const hasRole = current.allowedRoles.includes(role);
      return {
        ...current,
        allowedRoles: hasRole
          ? current.allowedRoles.filter((item) => item !== role)
          : [...current.allowedRoles, role]
      };
    });
  }, []);

  const handleNewQuickReplyRoleToggle = useCallback(
    (role) => {
      toggleRoleInDraft(role, setNewQuickReply);
    },
    [toggleRoleInDraft]
  );

  const handleEditingQuickReplyRoleToggle = useCallback(
    (role) => {
      toggleRoleInDraft(role, setEditingQuickReplyDraft);
    },
    [toggleRoleInDraft]
  );

  const handleNewQuickReplyChange = useCallback((field, value) => {
    setNewQuickReply((current) => ({
      ...current,
      [field]: value
    }));
  }, []);

  const handleNewQuickReplySubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (!tenantId) {
        setSettingsError('Assign this provider to a tenant before creating quick replies.');
        return;
      }
      setSettingsSaving(true);
      createInboxQuickReply(
        {
          title: newQuickReply.title,
          body: newQuickReply.body,
          category: newQuickReply.category || undefined,
          sortOrder:
            newQuickReply.sortOrder === ''
              ? undefined
              : Number.parseInt(newQuickReply.sortOrder, 10),
          allowedRoles: newQuickReply.allowedRoles
        },
        withTenant()
      )
        .then((reply) => {
          setQuickReplies((current) => normaliseQuickRepliesList([...current, reply]));
          setNewQuickReply(buildNewQuickReply());
          setSettingsError(null);
          setStatusMessage('Quick reply created.');
          clearStatusMessage();
        })
        .catch((createError) => {
          setSettingsError(createError.message || 'Unable to create quick reply');
        })
        .finally(() => {
          setSettingsSaving(false);
        });
    },
    [tenantId, newQuickReply, withTenant, clearStatusMessage]
  );

  const handleQuickReplyEditStart = useCallback((reply) => {
    setEditingQuickReplyId(reply.id);
    setEditingQuickReplyDraft({
      id: reply.id,
      title: reply.title,
      body: reply.body,
      category: reply.category || '',
      sortOrder: String(reply.sortOrder ?? ''),
      allowedRoles: reply.allowedRoles || []
    });
  }, []);

  const handleEditingQuickReplyChange = useCallback((field, value) => {
    setEditingQuickReplyDraft((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        [field]: value
      };
    });
  }, []);

  const handleQuickReplyEditCancel = useCallback(() => {
    setEditingQuickReplyId(null);
    setEditingQuickReplyDraft(null);
  }, []);

  const handleQuickReplyEditSave = useCallback(
    (event) => {
      event.preventDefault();
      if (!editingQuickReplyId || !editingQuickReplyDraft || !tenantId) {
        return;
      }
      setSettingsSaving(true);
      updateInboxQuickReply(
        editingQuickReplyId,
        {
          title: editingQuickReplyDraft.title,
          body: editingQuickReplyDraft.body,
          category: editingQuickReplyDraft.category || null,
          sortOrder:
            editingQuickReplyDraft.sortOrder === ''
              ? undefined
              : Number.parseInt(editingQuickReplyDraft.sortOrder, 10),
          allowedRoles: editingQuickReplyDraft.allowedRoles
        },
        withTenant()
      )
        .then((reply) => {
          setQuickReplies((current) =>
            normaliseQuickRepliesList(current.map((item) => (item.id === reply.id ? reply : item)))
          );
          setEditingQuickReplyId(null);
          setEditingQuickReplyDraft(null);
          setSettingsError(null);
          setStatusMessage('Quick reply updated.');
          clearStatusMessage();
        })
        .catch((updateError) => {
          setSettingsError(updateError.message || 'Unable to update quick reply');
        })
        .finally(() => {
          setSettingsSaving(false);
        });
    },
    [editingQuickReplyDraft, editingQuickReplyId, tenantId, withTenant, clearStatusMessage]
  );

  const handleQuickReplyDelete = useCallback(
    (quickReplyId) => {
      if (!tenantId) {
        return;
      }
      setSettingsSaving(true);
      deleteInboxQuickReply(quickReplyId, withTenant())
        .then(() => {
          setQuickReplies((current) => current.filter((item) => item.id !== quickReplyId));
          if (editingQuickReplyId === quickReplyId) {
            setEditingQuickReplyId(null);
            setEditingQuickReplyDraft(null);
          }
          setSettingsError(null);
          setStatusMessage('Quick reply removed.');
          clearStatusMessage();
        })
        .catch((deleteError) => {
          setSettingsError(deleteError.message || 'Unable to delete quick reply');
        })
        .finally(() => {
          setSettingsSaving(false);
        });
    },
    [tenantId, withTenant, editingQuickReplyId, clearStatusMessage]
  );

  const handleEscalationRoleToggle = useCallback(
    (role) => {
      toggleRoleInDraft(role, setNewEscalationRule);
    },
    [toggleRoleInDraft]
  );

  const handleNewEscalationChange = useCallback((field, value) => {
    setNewEscalationRule((current) => ({
      ...current,
      [field]: value
    }));
  }, []);

  const handleNewEscalationSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (!tenantId) {
        setSettingsError('Assign this provider to a tenant before creating escalation rules.');
        return;
      }
      setSettingsSaving(true);
      createInboxEscalationRule(
        {
          ...buildEscalationPayload(newEscalationRule)
        },
        withTenant()
      )
        .then((rule) => {
          setEscalationRules((current) => normaliseEscalationRulesList([...current, rule]));
          setNewEscalationRule(buildNewEscalationRule());
          setSettingsError(null);
          setStatusMessage('Escalation rule created.');
          clearStatusMessage();
        })
        .catch((createError) => {
          setSettingsError(createError.message || 'Unable to create escalation rule');
        })
        .finally(() => {
          setSettingsSaving(false);
        });
    },
    [tenantId, newEscalationRule, withTenant, clearStatusMessage]
  );

  const handleEscalationEditStart = useCallback((rule) => {
    setEditingEscalationId(rule.id);
    setEditingEscalationDraft({
      id: rule.id,
      name: rule.name,
      description: rule.description || '',
      triggerType: rule.triggerType,
      keywords:
        rule.triggerType === 'keyword'
          ? (rule.triggerMetadata?.keywords || []).join(', ')
          : '',
      minutesWithoutReply:
        rule.triggerType === 'inactivity'
          ? String(rule.triggerMetadata?.minutesWithoutReply ?? rule.slaMinutes ?? '')
          : '',
      targetType: rule.targetType,
      targetReference: rule.targetReference,
      targetLabel: rule.targetLabel || '',
      allowedRoles: rule.allowedRoles || [],
      slaMinutes: String(rule.slaMinutes ?? 15),
      responseTemplate: rule.responseTemplate || '',
      active: rule.active ?? true
    });
  }, []);

  const handleEditingEscalationChange = useCallback((field, value) => {
    setEditingEscalationDraft((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        [field]: value
      };
    });
  }, []);

  const handleEditingEscalationRoleToggle = useCallback(
    (role) => {
      toggleRoleInDraft(role, setEditingEscalationDraft);
    },
    [toggleRoleInDraft]
  );

  const handleEscalationEditCancel = useCallback(() => {
    setEditingEscalationId(null);
    setEditingEscalationDraft(null);
  }, []);

  const handleEscalationEditSave = useCallback(
    (event) => {
      event.preventDefault();
      if (!editingEscalationId || !editingEscalationDraft || !tenantId) {
        return;
      }
      setSettingsSaving(true);
      updateInboxEscalationRule(
        editingEscalationId,
        {
          ...buildEscalationPayload(editingEscalationDraft)
        },
        withTenant()
      )
        .then((rule) => {
          setEscalationRules((current) =>
            normaliseEscalationRulesList(current.map((item) => (item.id === rule.id ? rule : item)))
          );
          setEditingEscalationId(null);
          setEditingEscalationDraft(null);
          setSettingsError(null);
          setStatusMessage('Escalation rule updated.');
          clearStatusMessage();
        })
        .catch((updateError) => {
          setSettingsError(updateError.message || 'Unable to update escalation rule');
        })
        .finally(() => {
          setSettingsSaving(false);
        });
    },
    [editingEscalationDraft, editingEscalationId, tenantId, withTenant, clearStatusMessage]
  );

  const handleEscalationDelete = useCallback(
    (escalationId) => {
      if (!tenantId) {
        return;
      }
      setSettingsSaving(true);
      deleteInboxEscalationRule(escalationId, withTenant())
        .then(() => {
          setEscalationRules((current) => current.filter((rule) => rule.id !== escalationId));
          if (editingEscalationId === escalationId) {
            setEditingEscalationId(null);
            setEditingEscalationDraft(null);
          }
          setSettingsError(null);
          setStatusMessage('Escalation rule removed.');
          clearStatusMessage();
        })
        .catch((deleteError) => {
          setSettingsError(deleteError.message || 'Unable to delete escalation rule');
        })
        .finally(() => {
          setSettingsSaving(false);
        });
    },
    [tenantId, withTenant, editingEscalationId, clearStatusMessage]
  );

  const summaryCards = useMemo(() => {
    const cards = [
      {
        id: 'entry-points',
        label: 'Entry points',
        value: entryPoints.length,
        helper: 'Live widgets'
      },
      {
        id: 'quick-replies',
        label: 'Quick replies',
        value: quickReplies.length,
        helper: 'Role-aware macros'
      },
      {
        id: 'escalations',
        label: 'Escalation rules',
        value: escalationRules.length,
        helper: 'Automation guardrails'
      },
      {
        id: 'routing',
        label: 'Routing status',
        value: configuration.liveRoutingEnabled ? 'Live' : 'Paused',
        tone: configuration.liveRoutingEnabled ? 'success' : 'warning',
        helper: `Timezone ${configuration.timezone}`
      }
    ];

    if (summary?.updatedAt) {
      cards.push({
        id: 'updated-at',
        label: 'Last updated',
        value: new Date(summary.updatedAt).toLocaleString(),
        helper: 'Configuration timestamp'
      });
    }

    return cards;
  }, [entryPoints.length, quickReplies.length, escalationRules.length, configuration, summary]);

  const canManage = Boolean(tenantId && (capabilities?.allowManage ?? true));

  return (
    <section className="space-y-8">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Provider communications</p>
            <h2 className="text-2xl font-semibold text-primary">Full inbox</h2>
          </div>
          <Link
            to="/communications"
            className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-white px-4 py-2 text-sm font-semibold text-accent shadow-sm transition hover:border-accent hover:bg-accent/10"
          >
            Launch communications workspace
          </Link>
        </div>
        <p className="text-sm text-slate-600 max-w-3xl">
          Configure how enquiries reach your teams, manage reusable reply templates, and automate
          escalation guardrails across every Provider/SME surface.
        </p>
        {statusMessage ? (
          <p className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            {statusMessage}
          </p>
        ) : null}
        {settingsError ? (
          <p className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">
            {settingsError}
          </p>
        ) : null}
        {error && !settingsError ? (
          <p className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
            {error}
          </p>
        ) : null}
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.id}
            className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-primary">{card.value}</p>
            <p className="mt-1 text-xs text-slate-500">{card.helper}</p>
            {card.tone ? (
              <div className="mt-3">
                <StatusPill tone={card.tone}>{card.value}</StatusPill>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {!canManage ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-sm text-slate-600">
          <h3 className="text-lg font-semibold text-primary">Connect a tenant to manage inboxes</h3>
          <p className="mt-2">
            The Full inbox workspace requires a linked provider tenant. Assign this provider to a
            company in the directory to unlock routing controls, quick replies, and escalation
            automation.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <InboxSettingsForm
            configuration={configuration}
            loading={settingsLoading}
            saving={settingsSaving}
            error={null}
            onFieldChange={handleConfigurationChange}
            onSubmit={handleSettingsSubmit}
            onRefresh={handleSettingsRefresh}
          />

          <EntryPointsManager
            entryPoints={sortedEntryPoints}
            dirtyMap={entryPointDirtyMap}
            savingMap={entryPointSavingMap}
            deletingMap={entryPointDeletingMap}
            onFieldChange={handleEntryPointFieldChange}
            onToggle={handleEntryPointToggle}
            onSave={handleEntryPointSave}
            onReset={handleEntryPointReset}
            onDelete={handleEntryPointDelete}
            onTemplateSelect={handleTemplateCopy}
            newEntryPoint={newEntryPoint}
            onNewEntryPointChange={handleNewEntryPointChange}
            onNewEntryPointSubmit={handleNewEntryPointSubmit}
            onNewEntryPointReset={resetNewEntryPointForm}
            creatingEntryPoint={creatingEntryPoint}
          />

          <QuickRepliesManager
            quickReplies={quickReplies}
            newQuickReply={newQuickReply}
            onNewQuickReplyChange={handleNewQuickReplyChange}
            onNewQuickReplySubmit={handleNewQuickReplySubmit}
            onRoleToggle={handleNewQuickReplyRoleToggle}
            saving={settingsSaving}
            onTemplateSelect={handleTemplateCopy}
            onEditStart={handleQuickReplyEditStart}
            editingQuickReplyId={editingQuickReplyId}
            editingQuickReplyDraft={editingQuickReplyDraft}
            onEditingChange={handleEditingQuickReplyChange}
            onEditingRoleToggle={handleEditingQuickReplyRoleToggle}
            onEditSave={handleQuickReplyEditSave}
            onEditCancel={handleQuickReplyEditCancel}
            onDelete={handleQuickReplyDelete}
          />

          <EscalationRulesManager
            escalationRules={escalationRules}
            newEscalationRule={newEscalationRule}
            onNewEscalationChange={handleNewEscalationChange}
            onRoleToggle={handleEscalationRoleToggle}
            onNewEscalationSubmit={handleNewEscalationSubmit}
            saving={settingsSaving}
            onEditStart={handleEscalationEditStart}
            editingEscalationId={editingEscalationId}
            editingEscalationDraft={editingEscalationDraft}
            onEditingChange={handleEditingEscalationChange}
            onEditingRoleToggle={handleEditingEscalationRoleToggle}
            onEditSave={handleEscalationEditSave}
            onEditCancel={handleEscalationEditCancel}
            onDelete={handleEscalationDelete}
          />
        </div>
      )}
    </section>
  );
};

ProviderInboxModule.propTypes = {
  tenantId: PropTypes.string,
  initialSnapshot: PropTypes.shape({
    configuration: PropTypes.object,
    entryPoints: PropTypes.array,
    quickReplies: PropTypes.array,
    escalationRules: PropTypes.array
  }),
  summary: PropTypes.shape({
    entryPoints: PropTypes.number,
    quickReplies: PropTypes.number,
    escalationRules: PropTypes.number,
    liveRoutingEnabled: PropTypes.bool,
    timezone: PropTypes.string,
    updatedAt: PropTypes.string
  }),
  capabilities: PropTypes.shape({
    allowManage: PropTypes.bool
  }),
  error: PropTypes.string
};

ProviderInboxModule.defaultProps = {
  tenantId: null,
  initialSnapshot: null,
  summary: null,
  capabilities: null,
  error: null
};

export default ProviderInboxModule;
