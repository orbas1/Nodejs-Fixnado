import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
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
  createConversation,
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

const VARIANT_COPY = {
  default: {
    eyebrow: 'Workspace',
    title: 'Communications',
    badgeActive: 'Live',
    badgePaused: 'Paused',
    accessTitle: 'Workspace locked',
    accessDescription: 'Switch to an allowed role or request access.',
    creatorName: 'Team member',
    createTitle: 'New chat',
    createButton: 'Create chat',
    createSuccess: 'Chat ready'
  },
  serviceman: {
    eyebrow: 'Crew',
    title: 'Job comms',
    badgeActive: 'Live',
    badgePaused: 'Paused',
    accessTitle: 'Crew chat locked',
    accessDescription: 'Use an allowed crew profile or request access.',
    creatorName: 'Crew lead',
    createTitle: 'New job chat',
    createButton: 'Open chat',
    createSuccess: 'Chat ready'
  }
};

const SECTION_TABS = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'setup', label: 'Setup' },
  { id: 'channels', label: 'Channels' },
  { id: 'replies', label: 'Replies' },
  { id: 'escalate', label: 'Escalate' }
];

const DEFAULT_CREATE_DRAFT = {
  subject: '',
  customerName: '',
  customerReference: '',
  customerType: 'user',
  jobId: '',
  location: '',
  initialMessage: '',
  aiAssistEnabled: true
};

function Communications({
  variant = 'default',
  allowedRoles = COMMUNICATIONS_ALLOWED_ROLES,
  initialParticipantId = '',
  embedded = false,
  heroActions = null,
  currentParticipant = null,
  onConversationCreated = null,
  onWorkspaceMetricsChange = null
}) {
  const [sessionRole, setSessionRole] = useState(() =>
    normaliseRole(resolveSessionTelemetryContext().role)
  );
  const telemetryContext = useMemo(() => resolveSessionTelemetryContext(), []);
  const copy = VARIANT_COPY[variant] ?? VARIANT_COPY.default;
  const resolvedAllowedRoles = useMemo(
    () => (Array.isArray(allowedRoles) && allowedRoles.length > 0 ? allowedRoles : COMMUNICATIONS_ALLOWED_ROLES),
    [allowedRoles]
  );
  const allowedRoleLabels = useMemo(
    () => resolvedAllowedRoles.map((role) => formatRoleLabel(role)),
    [resolvedAllowedRoles]
  );
  const hasAccess = useMemo(
    () => hasCommunicationsAccess(sessionRole, resolvedAllowedRoles),
    [sessionRole, resolvedAllowedRoles]
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const urlParticipant = searchParams.get('participantId') || '';
  const resolvedInitialParticipant = urlParticipant || initialParticipantId || '';
  const [participantInput, setParticipantInput] = useState(resolvedInitialParticipant);
  const [participantId, setParticipantId] = useState(resolvedInitialParticipant);
  const hasUrlParticipant = Boolean(urlParticipant);
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
  const [createDraft, setCreateDraft] = useState({ ...DEFAULT_CREATE_DRAFT });
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [createConversationError, setCreateConversationError] = useState(null);
  const [createConversationSuccess, setCreateConversationSuccess] = useState(null);
  const [activeSection, setActiveSection] = useState('inbox');
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const messagesViewportRef = useRef(null);
  const messagesEndRef = useRef(null);
  const createSuccessTimeoutRef = useRef(null);

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

  useEffect(() => () => {
    if (createSuccessTimeoutRef.current) {
      clearTimeout(createSuccessTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (!hasUrlParticipant && initialParticipantId && !participantId) {
      setParticipantInput(initialParticipantId);
      setParticipantId(initialParticipantId);
    }
  }, [hasUrlParticipant, initialParticipantId, participantId]);

  useEffect(() => {
    if (hasUrlParticipant || initialParticipantId) {
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
  }, [hasUrlParticipant, initialParticipantId, participantId, setSearchParams]);

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
    if (typeof onWorkspaceMetricsChange !== 'function') {
      return;
    }

    if (!hasAccess) {
      onWorkspaceMetricsChange({
        conversations: 0,
        activeThreads: 0,
        entryPoints: 0,
        quickReplies: 0,
        escalationRules: 0
      });
    }
  }, [hasAccess, onWorkspaceMetricsChange]);

  useEffect(() => {
    if (!hasAccess || typeof onWorkspaceMetricsChange !== 'function') {
      return;
    }

    onWorkspaceMetricsChange({
      conversations: conversations.length,
      activeThreads: conversations.length,
      entryPoints: entryPoints.length,
      quickReplies: quickReplies.length,
      escalationRules: escalationRules.length
    });
  }, [
    conversations,
    entryPoints,
    quickReplies,
    escalationRules,
    hasAccess,
    onWorkspaceMetricsChange
  ]);

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

  const handleCreateFieldChange = useCallback((field, value) => {
    setCreateDraft((current) => ({
      ...current,
      [field]: value
    }));
  }, []);

  const handleCreateConversation = useCallback(
    async (event) => {
      event.preventDefault();
      setCreateConversationError(null);
      setCreateConversationSuccess(null);

      const subject = createDraft.subject.trim();
      const customerReference = createDraft.customerReference.trim();
      const initialMessage = createDraft.initialMessage.trim();

      if (subject.length < 3) {
        setCreateConversationError('Subject must be at least three characters long.');
        return;
      }
      if (!customerReference) {
        setCreateConversationError('Customer reference is required to link the chat.');
        return;
      }

      setCreatingConversation(true);
      try {
        const creatorReference =
          currentParticipant?.participantReferenceId ||
          telemetryContext.userId ||
          telemetryContext.tenantId ||
          'serviceman';
        const creatorRole = normaliseRole(currentParticipant?.role || sessionRole || 'serviceman');
        const creatorType = currentParticipant?.participantType || creatorRole || 'serviceman';
        const creatorDisplayName = currentParticipant?.displayName || copy.creatorName;

        const conversation = await createConversation({
          subject,
          createdBy: {
            id: creatorReference,
            type: creatorType
          },
          participants: [
            {
              participantType: creatorType,
              participantReferenceId: creatorReference,
              displayName: creatorDisplayName,
              role: creatorRole || 'serviceman',
              aiAssistEnabled: true,
              notificationsEnabled: true,
              videoEnabled: true,
              timezone: currentParticipant?.timezone || inboxConfiguration.timezone || 'Europe/London'
            },
            {
              participantType: createDraft.customerType || 'user',
              participantReferenceId: customerReference,
              displayName: createDraft.customerName.trim() || 'Customer contact',
              role: 'customer',
              aiAssistEnabled: true,
              notificationsEnabled: true,
              videoEnabled: true,
              timezone: inboxConfiguration.timezone || 'Europe/London'
            }
          ],
          metadata: {
            jobId: createDraft.jobId ? createDraft.jobId.trim() : undefined,
            location: createDraft.location ? createDraft.location.trim() : undefined
          },
          aiAssist: {
            defaultEnabled: createDraft.aiAssistEnabled,
            displayName: inboxConfiguration.aiAssistDisplayName,
            description: inboxConfiguration.aiAssistDescription
          }
        });

        setConversations((current) => {
          const existingIds = new Set(current.map((item) => item.id));
          if (existingIds.has(conversation.id)) {
            return current.map((item) => (item.id === conversation.id ? conversation : item));
          }
          return [conversation, ...current];
        });

        const viewerParticipant = conversation.participants?.find(
          (participant) =>
            participant.participantReferenceId === creatorReference && participant.participantType === creatorType
        );

        if (viewerParticipant) {
          setParticipantInput(viewerParticipant.id);
          setParticipantId(viewerParticipant.id);
          setSearchParams({ participantId: viewerParticipant.id });
          try {
            if (typeof window !== 'undefined') {
              window.localStorage?.setItem('fx.profile.participantId', viewerParticipant.id);
            }
          } catch (storageError) {
            console.warn('Unable to persist participant id', storageError);
          }
        }

        setActiveConversationId(conversation.id);

        if (viewerParticipant && initialMessage) {
          try {
            await postMessage(conversation.id, {
              senderParticipantId: viewerParticipant.id,
              body: initialMessage
            });
          } catch (messageError) {
            console.warn('Failed to send initial message', messageError);
            setComposerPrefill(initialMessage);
          }
        } else if (initialMessage) {
          setComposerPrefill(initialMessage);
        } else {
          setComposerPrefill('');
        }

        setCreateDraft({ ...DEFAULT_CREATE_DRAFT });
        setShowCreateWizard(false);
        setCreateConversationSuccess(copy.createSuccess);
        if (createSuccessTimeoutRef.current) {
          clearTimeout(createSuccessTimeoutRef.current);
        }
        createSuccessTimeoutRef.current = setTimeout(() => {
          setCreateConversationSuccess(null);
        }, 4000);

        if (typeof onConversationCreated === 'function') {
          onConversationCreated(conversation);
        }
      } catch (caught) {
        setCreateConversationError(
          caught instanceof Error ? caught.message : 'Unable to start conversation. Please try again.'
        );
      } finally {
        setCreatingConversation(false);
      }
    },
    [
      copy.createSuccess,
      createDraft,
      currentParticipant,
      inboxConfiguration.aiAssistDescription,
      inboxConfiguration.aiAssistDisplayName,
      inboxConfiguration.timezone,
      onConversationCreated,
      setSearchParams,
      setActiveConversationId,
      setComposerPrefill,
      setConversations,
      setCreateConversationError,
      setCreateConversationSuccess,
      setCreateDraft,
      setParticipantId,
      setParticipantInput,
      setCreatingConversation,
      sessionRole,
      telemetryContext,
      setShowCreateWizard
    ]
  );

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

  const creatorDisplayName = currentParticipant?.displayName || copy.creatorName;
  const creatorRoleLabel = formatRoleLabel(currentParticipant?.role || sessionRole || 'serviceman');
  const wrapperClassName = embedded
    ? 'w-full space-y-6'
    : 'min-h-screen w-full bg-slate-100 px-4 py-8 sm:px-8 lg:px-12';
  const panelClassName = embedded
    ? 'flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60'
    : 'mx-auto flex w-full max-w-[1400px] flex-col gap-6 rounded-4xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/80';

  if (!hasAccess) {
    return (
      <div className={clsx('flex min-h-screen w-full items-center justify-center bg-slate-50 px-4 py-12', {
        'bg-transparent px-0 py-0': embedded
      })}>
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-3xl border border-amber-200 bg-white/95 p-8 text-center shadow-xl shadow-amber-100">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-600">Locked</p>
          <h1 className="text-2xl font-semibold text-slate-900">{copy.accessTitle}</h1>
          <p className="text-sm text-slate-600">{copy.accessDescription}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-3 text-sm font-semibold">
            <a
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-600 shadow-sm transition hover:border-amber-300 hover:text-amber-600"
              href="mailto:enablement@fixnado.com?subject=Communications%20workspace%20access"
            >
              Request
            </a>
            <button
              type="button"
              onClick={() => {
                const resolvedRole = normaliseRole(resolveSessionTelemetryContext().role);
                setSessionRole(resolvedRole);
              }}
              className="inline-flex items-center justify-center rounded-full bg-amber-500 px-4 py-2 text-amber-950 shadow hover:bg-amber-400"
            >
              Refresh
            </button>
          </div>
          <dl className="mt-4 grid w-full gap-3 text-left text-xs text-slate-500">
            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
              <dt className="font-semibold uppercase tracking-[0.3em] text-amber-700">Role</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">{formatRoleLabel(sessionRole)}</dd>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <dt className="font-semibold uppercase tracking-[0.3em] text-slate-500">Allowed</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">{allowedRoleLabels.join(', ')}</dd>
            </div>
          </dl>
        </div>
      </div>
    );
  }

  return (
    <div className={wrapperClassName}>
      <div className={panelClassName}>
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 rounded-3xl bg-slate-900 px-6 py-6 text-white lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/60">{copy.eyebrow}</p>
            <h1 className="text-3xl font-semibold">{copy.title}</h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            {heroActions ? <div className="flex flex-wrap justify-end gap-2">{heroActions}</div> : null}
            <span
              className={clsx(
                'inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold shadow-lg shadow-black/20',
                inboxConfiguration.liveRoutingEnabled ? 'bg-white/10 text-white' : 'bg-white/5 text-white/70'
              )}
            >
              <span
                className={clsx(
                  'inline-flex h-2 w-2 rounded-full',
                  inboxConfiguration.liveRoutingEnabled ? 'animate-pulse bg-emerald-300' : 'bg-white/60'
                )}
                aria-hidden="true"
              />
              {inboxConfiguration.liveRoutingEnabled ? copy.badgeActive : copy.badgePaused}
            </span>
          </div>
        </div>
      </header>

        <nav className="flex flex-wrap gap-3" role="tablist" aria-label="Communications sections">
          {SECTION_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id)}
              className={clsx(
                'inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold transition',
                activeSection === tab.id
                  ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
              role="tab"
              aria-selected={activeSection === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {createConversationSuccess ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-sm">
            {createConversationSuccess}
          </div>
        ) : null}

        {activeSection === 'inbox' ? (
          <section className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg shadow-slate-200/60">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const trimmed = participantInput.trim();
                  setParticipantId(trimmed);
                  setSearchParams(trimmed ? { participantId: trimmed } : {});
                }}
                className="flex w-full flex-col gap-2 lg:max-w-lg"
              >
                <label className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Viewer</label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={participantInput}
                    onChange={(event) => setParticipantInput(event.target.value)}
                    placeholder="Participant ID"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder-slate-400 transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-200 transition hover:bg-sky-400"
                  >
                    Load
                  </button>
                </div>
              </form>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">{creatorDisplayName}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">{creatorRoleLabel}</span>
                <button
                  type="button"
                  onClick={() => setShowCreateWizard(true)}
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-slate-900/20 transition hover:bg-slate-800"
                >
                  {copy.createTitle}
                </button>
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 shadow-sm">
                {error}
              </div>
            ) : null}
            {!hasParticipant ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 shadow-sm">
                Enter a participant ID to load chats.
              </div>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)_280px] xl:grid-cols-[320px_minmax(0,1fr)_320px] lg:items-start">
              <aside className="flex h-[620px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-950/5">
                <div className="flex items-center justify-between border-b border-slate-200 bg-white/70 px-5 py-4">
                  <h2 className="text-sm font-semibold text-slate-900">Inbox</h2>
                  {listLoading ? (
                    <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">Loading</span>
                  ) : null}
                </div>
                <div className="flex-1 overflow-y-auto">
                  <ConversationList
                    conversations={conversations}
                    activeConversationId={activeConversationId}
                    onSelect={(conversationId) => setActiveConversationId(conversationId)}
                  />
                </div>
              </aside>

              <div className="flex min-h-[620px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white">
                {!activeConversation ? (
                  <div className="m-auto px-6 text-center text-sm text-slate-500">
                    {hasParticipant ? 'Select a chat.' : 'Load a participant.'}
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4">
                      <div className="min-w-[200px]">
                        <h2 className="text-lg font-semibold text-slate-900">{activeConversation.subject}</h2>
                        <p className="text-xs text-slate-500">
                          {activeConversation.participants
                            .filter((participant) => participant.role !== 'ai_assistant')
                            .map((participant) => participant.displayName)
                            .join(' • ')}
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                        {activeConversation.aiAssistDefault ? (
                          <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-600">AI</span>
                        ) : null}
                        <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-600">{activeConversation.retentionDays}d</span>
                        {activeConversation.metadata?.bookingId ? (
                          <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-600">#{activeConversation.metadata.bookingId}</span>
                        ) : null}
                      </div>
                    </div>

                    <div ref={messagesViewportRef} className="flex flex-1 flex-col gap-4 overflow-y-auto bg-white px-6 py-5">
                      {messagesLoading ? (
                        <p className="text-sm text-slate-500">Loading…</p>
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
                            <p className="text-sm text-slate-500">No messages yet.</p>
                          ) : null}
                          <span ref={messagesEndRef} aria-hidden="true" />
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                      <MessageComposer
                        onSend={handleSendMessage}
                        disabled={!viewerParticipant}
                        aiAssistAvailable={Boolean(
                          viewerParticipant?.aiAssistEnabled && activeConversation?.aiAssistDefault
                        )}
                        defaultAiAssist={viewerParticipant?.aiAssistEnabled}
                        prefill={composerPrefill}
                        onPrefillConsumed={() => setComposerPrefill('')}
                      />
                    </div>
                  </>
                )}
              </div>

              <aside className="flex min-h-[620px] flex-col gap-4 rounded-3xl border border-slate-200 bg-white/80 p-4">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Viewer</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {viewerParticipant?.displayName || creatorDisplayName}
                  </p>
                  <p className="text-xs text-slate-500">{creatorRoleLabel}</p>
                </div>
                <ParticipantControls
                  participant={viewerParticipant}
                  onPreferencesChange={handlePreferencesChange}
                  disabled={preferencesSaving}
                />
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-900">Video link</span>
                    <button
                      type="button"
                      onClick={handleVideoSession}
                      className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-400"
                    >
                      {videoSession ? 'Refresh' : 'Launch'}
                    </button>
                  </div>
                  {videoSession ? (
                    <dl className="mt-3 space-y-2 text-xs text-slate-500">
                      <div className="flex items-center justify-between gap-3">
                        <dt className="uppercase tracking-[0.3em] text-slate-400">Room</dt>
                        <dd className="font-mono text-sm text-slate-900">{videoSession.channelName}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="uppercase tracking-[0.3em] text-slate-400">Expires</dt>
                        <dd>{new Date(videoSession.expiresAt).toLocaleString()}</dd>
                      </div>
                      <div>
                        <dt className="uppercase tracking-[0.3em] text-slate-400">Token</dt>
                        <dd className="mt-1 break-all font-mono text-[10px] text-slate-900">{videoSession.token}</dd>
                      </div>
                    </dl>
                  ) : null}
                </div>
              </aside>
            </div>

            {showCreateWizard ? (
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 px-4 py-8">
                <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">{copy.createTitle}</h2>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateWizard(false);
                        setCreateConversationError(null);
                      }}
                      className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
                    >
                      Close
                    </button>
                  </div>
                  {createConversationError ? (
                    <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
                      {createConversationError}
                    </div>
                  ) : null}
                  <form onSubmit={handleCreateConversation} className="mt-4 grid gap-3 lg:grid-cols-2">
                    <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                      Subject
                      <input
                        type="text"
                        value={createDraft.subject}
                        onChange={(event) => handleCreateFieldChange('subject', event.target.value)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                        placeholder="Job chat"
                        minLength={3}
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                      Contact
                      <input
                        type="text"
                        value={createDraft.customerName}
                        onChange={(event) => handleCreateFieldChange('customerName', event.target.value)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                        placeholder="Client name"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                      Reference
                      <input
                        type="text"
                        value={createDraft.customerReference}
                        onChange={(event) => handleCreateFieldChange('customerReference', event.target.value)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                        placeholder="FAC-1029"
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                      Type
                      <select
                        value={createDraft.customerType}
                        onChange={(event) => handleCreateFieldChange('customerType', event.target.value)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                      >
                        <option value="user">Client</option>
                        <option value="company">Company</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                      Job
                      <input
                        type="text"
                        value={createDraft.jobId}
                        onChange={(event) => handleCreateFieldChange('jobId', event.target.value)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                        placeholder="JOB-4732"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                      Location
                      <input
                        type="text"
                        value={createDraft.location}
                        onChange={(event) => handleCreateFieldChange('location', event.target.value)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                        placeholder="Site"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600 lg:col-span-2">
                      Message
                      <textarea
                        rows={3}
                        value={createDraft.initialMessage}
                        onChange={(event) => handleCreateFieldChange('initialMessage', event.target.value)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                        placeholder="Kick-off note"
                      />
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 lg:col-span-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-sky-500"
                        checked={createDraft.aiAssistEnabled}
                        onChange={(event) => handleCreateFieldChange('aiAssistEnabled', event.target.checked)}
                      />
                      <span>AI assist</span>
                    </label>
                    <div className="flex flex-wrap items-center justify-end gap-2 lg:col-span-2">
                      <button
                        type="button"
                        onClick={() => setCreateDraft({ ...DEFAULT_CREATE_DRAFT })}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                        disabled={creatingConversation}
                      >
                        Reset
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-200 transition hover:bg-sky-400 disabled:opacity-60"
                        disabled={creatingConversation}
                      >
                        {creatingConversation ? 'Saving…' : copy.createButton}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {activeSection === 'setup' ? (
          <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <InboxSettingsForm
              configuration={inboxConfiguration}
              loading={settingsLoading}
              saving={settingsSaving}
              error={settingsError}
              onFieldChange={handleConfigurationChange}
              onSubmit={handleSettingsSubmit}
              onRefresh={handleSettingsRefresh}
            />
          </section>
        ) : null}

        {activeSection === 'channels' ? (
          <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
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
          </section>
        ) : null}

        {activeSection === 'replies' ? (
          <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
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
          </section>
        ) : null}

        {activeSection === 'escalate' ? (
          <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
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
        ) : null}
      </div>
    </div>
  );
}

Communications.propTypes = {
  variant: PropTypes.oneOf(['default', 'serviceman']),
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
  initialParticipantId: PropTypes.string,
  embedded: PropTypes.bool,
  heroActions: PropTypes.node,
  currentParticipant: PropTypes.shape({
    participantReferenceId: PropTypes.string,
    participantType: PropTypes.string,
    displayName: PropTypes.string,
    role: PropTypes.string,
    timezone: PropTypes.string
  }),
  onConversationCreated: PropTypes.func,
  onWorkspaceMetricsChange: PropTypes.func
};

Communications.defaultProps = {
  variant: 'default',
  allowedRoles: COMMUNICATIONS_ALLOWED_ROLES,
  initialParticipantId: '',
  embedded: false,
  heroActions: null,
  currentParticipant: null,
  onConversationCreated: null,
  onWorkspaceMetricsChange: null
};

export default Communications;
