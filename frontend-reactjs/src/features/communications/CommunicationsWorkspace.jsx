import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { useSearchParams } from 'react-router-dom';
import ConversationList from '../../components/communications/ConversationList.jsx';
import MessageComposer from '../../components/communications/MessageComposer.jsx';
import MessageBubble from './components/MessageBubble.jsx';
import ParticipantControls from './components/ParticipantControls.jsx';
import InboxSettingsForm from './components/InboxSettingsForm.jsx';
import EntryPointsManager from './components/EntryPointsManager.jsx';
import QuickRepliesManager from './components/QuickRepliesManager.jsx';
import EscalationRulesManager from './components/EscalationRulesManager.jsx';
import {
  listConversations,
  fetchConversation,
  postMessage,
  updateParticipantPreferences,
  createVideoSession,
  CommunicationsApiError,
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
import { resolveSessionTelemetryContext } from '../../utils/telemetry.js';
import {
  COMMUNICATIONS_ALLOWED_ROLES,
  hasCommunicationsAccess,
  normaliseRole,
  formatRoleLabel
} from '../../constants/accessControl.js';


function Communications() {
  const [sessionRole, setSessionRole] = useState(() =>
    normaliseRole(resolveSessionTelemetryContext().role)
  );
  const hasAccess = useMemo(() => hasCommunicationsAccess(sessionRole), [sessionRole]);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialParticipant = searchParams.get('participantId') || '';
  const [participantInput, setParticipantInput] = useState(initialParticipant);
  const [participantId, setParticipantId] = useState(initialParticipant);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [listLoading, setListLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [videoSession, setVideoSession] = useState(null);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [composerPrefill, setComposerPrefill] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState(null);
  const [inboxConfiguration, setInboxConfiguration] = useState({
    liveRoutingEnabled: true,
    defaultGreeting: '',
    aiAssistDisplayName: 'Fixnado Assist',
    aiAssistDescription: '',
    timezone: 'Europe/London',
    quietHoursStart: '',
    quietHoursEnd: ''
  });
  const [entryPoints, setEntryPoints] = useState([]);
  const entryPointSnapshotRef = useRef(new Map());
  const [entryPointDirtyMap, setEntryPointDirtyMap] = useState({});
  const [entryPointSavingMap, setEntryPointSavingMap] = useState({});
  const [entryPointDeletingMap, setEntryPointDeletingMap] = useState({});
  const [quickReplies, setQuickReplies] = useState([]);
  const [escalationRules, setEscalationRules] = useState([]);
  const [creatingEntryPoint, setCreatingEntryPoint] = useState(false);
  const [newEntryPoint, setNewEntryPoint] = useState({
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
  const [newQuickReply, setNewQuickReply] = useState({
    title: '',
    body: '',
    category: '',
    sortOrder: '',
    allowedRoles: []
  });
  const [editingQuickReplyId, setEditingQuickReplyId] = useState(null);
  const [editingQuickReplyDraft, setEditingQuickReplyDraft] = useState(null);
  const [newEscalationRule, setNewEscalationRule] = useState({
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
  const [editingEscalationId, setEditingEscalationId] = useState(null);
  const [editingEscalationDraft, setEditingEscalationDraft] = useState(null);
  const messagesViewportRef = useRef(null);
  const messagesEndRef = useRef(null);

  const normaliseQuickReplies = useCallback((items) => {
    return [...items].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return a.title.localeCompare(b.title);
    });
  }, []);

  const normaliseEscalationRules = useCallback((items) => {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const applySettingsPayload = useCallback(
    (payload) => {
      setInboxConfiguration({
        ...payload.configuration,
        quietHoursStart: payload.configuration.quietHoursStart || '',
        quietHoursEnd: payload.configuration.quietHoursEnd || ''
      });
      setEntryPoints(payload.entryPoints);
      entryPointSnapshotRef.current = new Map(payload.entryPoints.map((entry) => [entry.id, entry]));
      setEntryPointDirtyMap({});
      setEntryPointSavingMap({});
      setEntryPointDeletingMap({});
      setQuickReplies(normaliseQuickReplies(payload.quickReplies));
      setEscalationRules(normaliseEscalationRules(payload.escalationRules));
    },
    [normaliseEscalationRules, normaliseQuickReplies]
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const syncRole = () => {
      const resolvedRole = normaliseRole(resolveSessionTelemetryContext().role);
      setSessionRole(resolvedRole);
    };

    syncRole();
    window.addEventListener('storage', syncRole);
    window.addEventListener('focus', syncRole);

    return () => {
      window.removeEventListener('storage', syncRole);
      window.removeEventListener('focus', syncRole);
    };
  }, []);

  useEffect(() => {
    if (initialParticipant) {
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }
    const storedParticipant = window.localStorage?.getItem('fx.profile.participantId');
    if (storedParticipant && !participantId) {
      setParticipantInput(storedParticipant);
      setParticipantId(storedParticipant);
      setSearchParams({ participantId: storedParticipant });
    }
  }, [initialParticipant, participantId, setSearchParams]);

  useEffect(() => {
    if (!hasAccess) {
      return;
    }

    let cancelled = false;
    setSettingsLoading(true);
    setSettingsError(null);

    fetchInboxSettings()
      .then((payload) => {
        if (cancelled) {
          return;
        }
        applySettingsPayload(payload);
      })
      .catch((settingsFetchError) => {
        if (cancelled) {
          return;
        }
        setSettingsError(settingsFetchError.message || 'Unable to load inbox settings');
      })
      .finally(() => {
        if (!cancelled) {
          setSettingsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [applySettingsPayload, hasAccess]);

  useEffect(() => {
    if (!participantId) {
      setConversations([]);
      setActiveConversation(null);
      setActiveConversationId(null);
      setListLoading(false);
      return;
    }

    let cancelled = false;
    setListLoading(true);
    setError(null);

    listConversations(participantId)
      .then((payload) => {
        if (cancelled) return;
        setConversations(payload);
        if (payload.length > 0) {
          setActiveConversationId((current) => {
            if (current && payload.some((conversation) => conversation.id === current)) {
              return current;
            }
            return payload[0].id;
          });
        } else {
          setActiveConversationId(null);
          setActiveConversation(null);
        }
      })
      .catch((listError) => {
        if (cancelled) return;
        setError(listError.message || 'Unable to load conversations');
        setConversations([]);
      })
      .finally(() => {
        if (!cancelled) {
          setListLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [participantId]);

  useEffect(() => {
    if (!participantId || !activeConversationId) {
      setActiveConversation(null);
      setMessagesLoading(false);
      return;
    }

    let cancelled = false;
    setMessagesLoading(true);
    setError(null);

    fetchConversation(activeConversationId)
      .then((payload) => {
        if (cancelled) return;
        setActiveConversation(payload);
        setVideoSession(null);
      })
      .catch((fetchError) => {
        if (cancelled) return;
        setError(fetchError.message || 'Unable to load conversation');
      })
      .finally(() => {
        if (!cancelled) {
          setMessagesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeConversationId, participantId]);

  const viewerParticipant = useMemo(
    () => activeConversation?.participants?.find((participant) => participant.id === participantId) || null,
    [activeConversation, participantId]
  );

  const conversationMessages = activeConversation?.messages ?? [];

  useEffect(() => {
    if (!messagesEndRef.current) {
      return;
    }
    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    messagesEndRef.current.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'end' });
  }, [activeConversationId, conversationMessages.length]);

  const handleSendMessage = useCallback(
    async ({ body, requestAiAssist }) => {
      if (!activeConversationId || !participantId) {
        throw new CommunicationsApiError('Choose a conversation before sending a message.');
      }

      const messages = await postMessage(activeConversationId, {
        senderParticipantId: participantId,
        body,
        requestAiAssist
      });

      setActiveConversation((current) => {
        if (!current) {
          return current;
        }
        return {
          ...current,
          messages: [...(current.messages ?? []), ...messages]
        };
      });

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === activeConversationId
            ? {
                ...conversation,
                messages: messages.length > 0 ? [messages[messages.length - 1]] : conversation.messages
              }
            : conversation
        )
      );
    },
    [activeConversationId, participantId]
  );

  const handlePreferencesChange = useCallback(
    async (updates) => {
      if (!activeConversationId || !participantId) {
        return;
      }
      setPreferencesSaving(true);
      try {
        const updated = await updateParticipantPreferences(activeConversationId, participantId, updates);
        setActiveConversation((current) => {
          if (!current) {
            return current;
          }
          return {
            ...current,
            participants: current.participants.map((participant) =>
              participant.id === updated.id ? { ...participant, ...updated } : participant
            )
          };
        });
      } catch (updateError) {
        setError(updateError.message || 'Unable to update preferences');
      } finally {
        setPreferencesSaving(false);
      }
    },
    [activeConversationId, participantId]
  );

  const handleVideoSession = useCallback(async () => {
    if (!activeConversationId || !participantId) {
      setError('Select a conversation to create a video session.');
      return;
    }

    try {
      const payload = await createVideoSession(activeConversationId, { participantId });
      setVideoSession(payload);
    } catch (sessionError) {
      setError(sessionError.message || 'Unable to create video session');
    }
  }, [activeConversationId, participantId]);

  const hasParticipant = Boolean(participantId);

  const sortedEntryPoints = useMemo(
    () =>
      [...entryPoints].sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) {
          return a.displayOrder - b.displayOrder;
        }
        return a.label.localeCompare(b.label);
      }),
    [entryPoints]
  );

  const handleEntryPointToggle = useCallback((id) => {
    setEntryPoints((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, enabled: !entry.enabled } : entry
      )
    );
    setEntryPointDirtyMap((current) => ({ ...current, [id]: true }));
  }, []);

  const handleEntryPointFieldChange = useCallback((id, field, value) => {
    setEntryPoints((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry))
    );
    setEntryPointDirtyMap((current) => ({ ...current, [id]: true }));
  }, []);

  const handleEntryPointMessage = useCallback(
    (template) => {
      if (!template) {
        return;
      }
      if (!activeConversationId) {
        if (!conversations.length) {
          setError('Select or create a conversation before sending a message.');
          return;
        }
        setActiveConversationId(conversations[0].id);
      }
      setError((current) =>
        current && current.startsWith('Select or create a conversation') ? null : current
      );
      setComposerPrefill(template);
    },
    [activeConversationId, conversations]
  );

  const handleEntryPointReset = useCallback((id) => {
    const snapshot = entryPointSnapshotRef.current.get(id);
    if (!snapshot) {
      return;
    }
    setEntryPoints((current) =>
      current.map((entry) => (entry.id === id ? { ...snapshot } : entry))
    );
    setEntryPointDirtyMap((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }, []);

  const handleEntryPointSave = useCallback(
    (id) => {
      const entry = entryPoints.find((item) => item.id === id);
      if (!entry) {
        return;
      }

      setEntryPointSavingMap((current) => ({ ...current, [id]: true }));
      updateInboxEntryPoint(id, {
        label: entry.label,
        description: entry.description,
        icon: entry.icon,
        defaultMessage: entry.defaultMessage,
        imageUrl: entry.imageUrl,
        ctaLabel: entry.ctaLabel,
        ctaUrl: entry.ctaUrl,
        enabled: entry.enabled,
        displayOrder:
          entry.displayOrder === '' || entry.displayOrder === null || entry.displayOrder === undefined
            ? undefined
            : Number.parseInt(entry.displayOrder, 10)
      })
        .then((updated) => {
          entryPointSnapshotRef.current.set(id, updated);
          setEntryPoints((current) => current.map((item) => (item.id === id ? updated : item)));
          setEntryPointDirtyMap((current) => {
            const next = { ...current };
            delete next[id];
            return next;
          });
          setSettingsError(null);
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
    [entryPoints]
  );

  const handleEntryPointDelete = useCallback((id) => {
    setEntryPointDeletingMap((current) => ({ ...current, [id]: true }));
    deleteInboxEntryPoint(id)
      .then(() => {
        entryPointSnapshotRef.current.delete(id);
        setEntryPoints((current) => current.filter((entry) => entry.id !== id));
        setEntryPointDirtyMap((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
        setSettingsError(null);
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
  }, []);

  const resetNewEntryPointForm = useCallback(() => {
    setNewEntryPoint({
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
      setCreatingEntryPoint(true);
      createInboxEntryPoint({
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
      })
        .then((entry) => {
          entryPointSnapshotRef.current.set(entry.id, entry);
          setEntryPoints((current) => [...current, entry]);
          resetNewEntryPointForm();
          setSettingsError(null);
        })
        .catch((createError) => {
          setSettingsError(createError.message || 'Unable to create entry point');
        })
        .finally(() => {
          setCreatingEntryPoint(false);
        });
    },
    [newEntryPoint, resetNewEntryPointForm]
  );

  const handleSettingsSubmit = useCallback(
    (event) => {
      event.preventDefault();
      setSettingsSaving(true);
      saveInboxSettings({
        liveRoutingEnabled: inboxConfiguration.liveRoutingEnabled,
        defaultGreeting: inboxConfiguration.defaultGreeting,
        aiAssistDisplayName: inboxConfiguration.aiAssistDisplayName,
        aiAssistDescription: inboxConfiguration.aiAssistDescription,
        timezone: inboxConfiguration.timezone,
        quietHoursStart: inboxConfiguration.quietHoursStart || null,
        quietHoursEnd: inboxConfiguration.quietHoursEnd || null
      })
        .then((payload) => {
          applySettingsPayload(payload);
          setSettingsError(null);
        })
        .catch((saveError) => {
          setSettingsError(saveError.message || 'Unable to save inbox settings');
        })
        .finally(() => {
          setSettingsSaving(false);
        });
    },
    [applySettingsPayload, inboxConfiguration]
  );

  const handleSettingsRefresh = useCallback(() => {
    setSettingsLoading(true);
    fetchInboxSettings()
      .then((payload) => {
        applySettingsPayload(payload);
        setSettingsError(null);
      })
      .catch((refreshError) => {
        setSettingsError(refreshError.message || 'Unable to reload inbox settings');
      })
      .finally(() => {
        setSettingsLoading(false);
      });
  }, [applySettingsPayload]);

  const handleConfigurationChange = useCallback((field, value) => {
    setInboxConfiguration((current) => ({
      ...current,
      [field]: value
    }));
  }, []);

  const handleQuickReplyRoleToggle = useCallback((role, updater) => {
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
      handleQuickReplyRoleToggle(role, setNewQuickReply);
    },
    [handleQuickReplyRoleToggle]
  );

  const handleEditingQuickReplyRoleToggle = useCallback(
    (role) => {
      handleQuickReplyRoleToggle(role, setEditingQuickReplyDraft);
    },
    [handleQuickReplyRoleToggle]
  );

  const handleNewQuickReplyChange = useCallback((field, value) => {
    setNewQuickReply((current) => ({
      ...current,
      [field]: value
    }));
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

  const handleNewQuickReplySubmit = useCallback(
    (event) => {
      event.preventDefault();
      setSettingsSaving(true);
      createInboxQuickReply({
        title: newQuickReply.title,
        body: newQuickReply.body,
        category: newQuickReply.category || undefined,
        sortOrder:
          newQuickReply.sortOrder === '' ? undefined : Number.parseInt(newQuickReply.sortOrder, 10),
        allowedRoles: newQuickReply.allowedRoles
      })
        .then((reply) => {
          setQuickReplies((current) => normaliseQuickReplies([...current, reply]));
          setNewQuickReply({ title: '', body: '', category: '', sortOrder: '', allowedRoles: [] });
          setSettingsError(null);
        })
        .catch((createError) => {
          setSettingsError(createError.message || 'Unable to create quick reply');
        })
        .finally(() => {
          setSettingsSaving(false);
        });
    },
    [newQuickReply, normaliseQuickReplies]
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

  const handleQuickReplyEditSave = useCallback(
    (event) => {
      event.preventDefault();
      if (!editingQuickReplyId || !editingQuickReplyDraft) {
        return;
      }
      setSettingsSaving(true);
      updateInboxQuickReply(editingQuickReplyId, {
        title: editingQuickReplyDraft.title,
        body: editingQuickReplyDraft.body,
        category: editingQuickReplyDraft.category || null,
        sortOrder:
          editingQuickReplyDraft.sortOrder === ''
            ? undefined
            : Number.parseInt(editingQuickReplyDraft.sortOrder, 10),
        allowedRoles: editingQuickReplyDraft.allowedRoles
      })
        .then((reply) => {
          setQuickReplies((current) =>
            normaliseQuickReplies(current.map((item) => (item.id === reply.id ? reply : item)))
          );
          setEditingQuickReplyId(null);
          setEditingQuickReplyDraft(null);
          setSettingsError(null);
        })
        .catch((updateError) => {
          setSettingsError(updateError.message || 'Unable to update quick reply');
        })
        .finally(() => {
          setSettingsSaving(false);
        });
    },
    [editingQuickReplyDraft, editingQuickReplyId, normaliseQuickReplies]
  );

  const handleQuickReplyDelete = useCallback(
    (quickReplyId) => {
      setSettingsSaving(true);
      deleteInboxQuickReply(quickReplyId)
        .then(() => {
          setQuickReplies((current) => current.filter((item) => item.id !== quickReplyId));
          if (editingQuickReplyId === quickReplyId) {
            setEditingQuickReplyId(null);
            setEditingQuickReplyDraft(null);
          }
          setSettingsError(null);
        })
        .catch((deleteError) => {
          setSettingsError(deleteError.message || 'Unable to delete quick reply');
        })
        .finally(() => {
          setSettingsSaving(false);
        });
    },
    [editingQuickReplyId]
  );

  const buildEscalationPayload = useCallback((draft) => {
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
  }, []);

  const handleNewEscalationSubmit = useCallback(
    (event) => {
      event.preventDefault();
      setSettingsSaving(true);
      createInboxEscalationRule({
        ...buildEscalationPayload(newEscalationRule)
      })
        .then((rule) => {
          setEscalationRules((current) => normaliseEscalationRules([...current, rule]));
          setNewEscalationRule({
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
          setSettingsError(null);
        })
        .catch((createError) => {
          setSettingsError(createError.message || 'Unable to create escalation rule');
        })
        .finally(() => {
          setSettingsSaving(false);
        });
    },
    [buildEscalationPayload, newEscalationRule, normaliseEscalationRules]
  );

  const handleEscalationEditStart = useCallback((rule) => {
    setEditingEscalationId(rule.id);
    setEditingEscalationDraft({
      id: rule.id,
      name: rule.name,
      description: rule.description || '',
      triggerType: rule.triggerType,
      keywords: rule.triggerType === 'keyword' ? (rule.triggerMetadata?.keywords || []).join(', ') : '',
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
      active: rule.active
    });
  }, []);

  const handleEscalationEditCancel = useCallback(() => {
    setEditingEscalationId(null);
    setEditingEscalationDraft(null);
  }, []);

  const toggleEscalationRole = useCallback((role, updater) => {
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

  const handleNewEscalationChange = useCallback((field, value) => {
    setNewEscalationRule((current) => ({
      ...current,
      [field]: value
    }));
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

  const handleNewEscalationRoleToggle = useCallback(
    (role) => {
      toggleEscalationRole(role, setNewEscalationRule);
    },
    [toggleEscalationRole]
  );

  const handleEditingEscalationRoleToggle = useCallback(
    (role) => {
      toggleEscalationRole(role, setEditingEscalationDraft);
    },
    [toggleEscalationRole]
  );

  const handleEscalationEditSave = useCallback(
    (event) => {
      event.preventDefault();
      if (!editingEscalationId || !editingEscalationDraft) {
        return;
      }
      setSettingsSaving(true);
      updateInboxEscalationRule(editingEscalationId, buildEscalationPayload(editingEscalationDraft))
        .then((rule) => {
          setEscalationRules((current) =>
            normaliseEscalationRules(current.map((item) => (item.id === rule.id ? rule : item)))
          );
          setEditingEscalationId(null);
          setEditingEscalationDraft(null);
          setSettingsError(null);
        })
        .catch((updateError) => {
          setSettingsError(updateError.message || 'Unable to update escalation rule');
        })
        .finally(() => {
          setSettingsSaving(false);
        });
    },
    [buildEscalationPayload, editingEscalationDraft, editingEscalationId, normaliseEscalationRules]
  );

  const handleEscalationDelete = useCallback((escalationId) => {
    setSettingsSaving(true);
    deleteInboxEscalationRule(escalationId)
      .then(() => {
        setEscalationRules((current) => current.filter((item) => item.id !== escalationId));
        if (editingEscalationId === escalationId) {
          setEditingEscalationId(null);
          setEditingEscalationDraft(null);
        }
        setSettingsError(null);
      })
      .catch((deleteError) => {
        setSettingsError(deleteError.message || 'Unable to delete escalation rule');
      })
      .finally(() => {
        setSettingsSaving(false);
      });
  }, [editingEscalationId]);

  if (!hasAccess) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-4xl flex-col items-center justify-center px-4 py-12 text-center">
        <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-10 shadow-lg shadow-amber-100">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-600">Access restricted</p>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Communications workspace is limited</h1>
          <p className="mt-3 text-sm text-slate-600">
            Messaging is reserved for Fixnado provider, enterprise, and operations cohorts. Switch to an authorised
            workspace role or request access from operations enablement so conversations remain governed.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-amber-300 hover:text-amber-600"
              href="mailto:enablement@fixnado.com?subject=Communications%20workspace%20access"
            >
              Request enablement review
            </a>
            <button
              type="button"
              onClick={() => {
                const resolvedRole = normaliseRole(resolveSessionTelemetryContext().role);
                setSessionRole(resolvedRole);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-amber-950 shadow hover:bg-amber-400"
            >
              Retry role detection
            </button>
          </div>
          <dl className="mt-8 grid gap-4 text-left text-xs text-slate-600 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/80 bg-white p-4 shadow-sm">
              <dt className="font-semibold uppercase tracking-[0.25em] text-slate-500">Current role</dt>
              <dd className="mt-2 text-sm font-semibold text-slate-900">{formatRoleLabel(sessionRole)}</dd>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white p-4 shadow-sm">
              <dt className="font-semibold uppercase tracking-[0.25em] text-slate-500">Authorised cohorts</dt>
              <dd className="mt-2 text-sm font-semibold text-slate-900">
                {COMMUNICATIONS_ALLOWED_ROLES.map((role) => formatRoleLabel(role)).join(', ')}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 py-12">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/95 px-6 py-10 shadow-xl shadow-slate-200/80">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Inbox</p>
            <h1 className="text-3xl font-semibold text-slate-900">Messaging &amp; AI assist</h1>
            <p className="text-sm text-slate-500">A clean, social-style space for every conversation.</p>
          </header>
          <div
            className={clsx(
              'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg shadow-slate-900/20',
              inboxConfiguration.liveRoutingEnabled
                ? 'bg-slate-900/90 text-white'
                : 'bg-slate-200 text-slate-600'
            )}
          >
            <span
              className={clsx(
                'inline-flex h-2 w-2 rounded-full',
                inboxConfiguration.liveRoutingEnabled ? 'animate-pulse bg-emerald-400' : 'bg-slate-400'
              )}
              aria-hidden="true"
            />
            {inboxConfiguration.liveRoutingEnabled ? 'Live routing enabled' : 'Live routing paused'}
          </div>
        </div>

        
        <div className="mt-6 space-y-6">
          <InboxSettingsForm
            configuration={inboxConfiguration}
            loading={settingsLoading}
            saving={settingsSaving}
            error={settingsError}
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
            onTemplateSelect={handleEntryPointMessage}
            newEntryPoint={newEntryPoint}
            onNewEntryPointChange={handleNewEntryPointChange}
            onNewEntryPointSubmit={handleNewEntryPointSubmit}
            onNewEntryPointReset={resetNewEntryPointForm}
            creatingEntryPoint={creatingEntryPoint}
          />
        </div>

        
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <QuickRepliesManager
            quickReplies={quickReplies}
            newQuickReply={newQuickReply}
            onNewQuickReplyChange={handleNewQuickReplyChange}
            onNewQuickReplySubmit={handleNewQuickReplySubmit}
            onRoleToggle={handleNewQuickReplyRoleToggle}
            saving={settingsSaving}
            onTemplateSelect={handleEntryPointMessage}
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
            onRoleToggle={handleNewEscalationRoleToggle}
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
        </section>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = participantInput.trim();
            setParticipantId(trimmed);
            setSearchParams(trimmed ? { participantId: trimmed } : {});
          }}
          className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm"
        >
          <label
            htmlFor="communications-participant"
            className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500"
          >
            Participant
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="communications-participant"
              type="text"
              value={participantInput}
              onChange={(event) => setParticipantInput(event.target.value)}
              placeholder="Participant ID"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder-slate-400 transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-200 transition hover:bg-sky-400"
            >
              Load
            </button>
          </div>
        </form>

        {!hasParticipant ? (
          <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600 shadow-sm">
            Add a participant ID to open the inbox.
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600 shadow-sm">{error}</p>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-slate-200 bg-white/80 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-600">Inbox</h2>
              {listLoading ? <span className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Loading…</span> : null}
            </div>
            <ConversationList
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelect={(conversationId) => setActiveConversationId(conversationId)}
            />
          </aside>

          <section className="flex min-h-[520px] flex-col rounded-3xl border border-slate-200 bg-slate-50/80">
            {!activeConversation ? (
              <div className="m-auto max-w-sm px-6 text-center text-sm text-slate-500">
                {hasParticipant
                  ? 'Pick a thread from the inbox to jump into the chat.'
                  : 'Load a participant to see their messages here.'}
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-6 py-5">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{activeConversation.subject}</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {activeConversation.participants
                        .filter((participant) => participant.role !== 'ai_assistant')
                        .map((participant) => `${participant.displayName} (${participant.role})`)
                        .join(' • ')}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      AI {activeConversation.aiAssistDefault ? 'On' : 'Off'}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">{activeConversation.retentionDays}d retention</span>
                    {activeConversation.metadata?.bookingId ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1">Booking #{activeConversation.metadata.bookingId}</span>
                    ) : null}
                  </div>
                </div>

                <div
                  ref={messagesViewportRef}
                  className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6"
                >
                  {messagesLoading ? (
                    <p className="text-sm text-slate-500">Loading conversation…</p>
                  ) : (
                    <div className="space-y-4">
                      {conversationMessages.map((message) => (
                        <MessageBubble
                          key={message.id}
                          message={message}
                          isSelf={message.senderParticipantId === participantId}
                          viewerParticipantId={participantId}
                        />
                      ))}
                      {conversationMessages.length === 0 ? (
                        <p className="text-sm text-slate-500">No messages yet. Be the first to say hello.</p>
                      ) : null}
                      <span ref={messagesEndRef} aria-hidden="true" />
                    </div>
                  )}

                  <ParticipantControls
                    participant={viewerParticipant}
                    onPreferencesChange={handlePreferencesChange}
                    disabled={preferencesSaving}
                  />

                  <div className="rounded-2xl bg-white/90 p-4 text-sm text-slate-600 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Need a live walkthrough?</p>
                        <p className="text-xs text-slate-500">Spin up an Agora video session without leaving the chat.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleVideoSession}
                        className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-400"
                      >
                        Create video session
                      </button>
                    </div>
                    {videoSession ? (
                      <dl className="mt-4 grid gap-3 text-xs text-slate-500 sm:grid-cols-2">
                        <div>
                          <dt className="uppercase tracking-[0.3em] text-slate-400">Channel</dt>
                          <dd className="font-mono text-sm text-slate-900">{videoSession.channelName}</dd>
                        </div>
                        <div>
                          <dt className="uppercase tracking-[0.3em] text-slate-400">Expires</dt>
                          <dd>{new Date(videoSession.expiresAt).toLocaleString()}</dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="uppercase tracking-[0.3em] text-slate-400">Token</dt>
                          <dd className="break-all font-mono text-[10px] text-slate-900">{videoSession.token}</dd>
                        </div>
                      </dl>
                    ) : null}
                  </div>

                  <MessageComposer
                    onSend={handleSendMessage}
                    disabled={!viewerParticipant}
                    aiAssistAvailable={Boolean(viewerParticipant?.aiAssistEnabled && activeConversation?.aiAssistDefault)}
                    defaultAiAssist={viewerParticipant?.aiAssistEnabled}
                    prefill={composerPrefill}
                    onPrefillConsumed={() => setComposerPrefill('')}
                  />
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default Communications;
