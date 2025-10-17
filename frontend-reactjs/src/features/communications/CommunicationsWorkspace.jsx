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
    eyebrow: 'Inbox',
    title: 'Messaging & AI assist',
    description: 'A clean, social-style space for every conversation.',
    badgeActive: 'Live routing enabled',
    badgePaused: 'Live routing paused',
    accessTitle: 'Communications workspace is limited',
    accessDescription:
      'Messaging is reserved for Fixnado provider, enterprise, and operations cohorts. Switch to an authorised workspace role or request access so conversations remain governed.',
    creatorName: 'Team member',
    createTitle: 'Start a new conversation',
    createDescription: 'Invite participants and spin up a fresh inbox thread with AI assist on standby.',
    createButton: 'Start conversation',
    createSuccess: 'Conversation created and ready to chat.'
  },
  serviceman: {
    eyebrow: 'Crew inbox',
    title: 'Job communications',
    description:
      'Coordinate dispatch updates, upload job evidence, and escalate blockers without leaving the cockpit.',
    badgeActive: 'Crew routing live',
    badgePaused: 'Crew routing paused',
    accessTitle: 'Crew messaging is limited',
    accessDescription:
      'Switch to an authorised crew or operations persona to manage inbox conversations, or request access from operations enablement.',
    creatorName: 'Crew lead',
    createTitle: 'Raise a new job chat',
    createDescription:
      'Loop in building contacts, drop job context, and let AI suggestions draft the first response.',
    createButton: 'Open conversation',
    createSuccess: 'Chat ready — you have been added to the thread.'
  }
};

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
      telemetryContext
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

  const outerClassName = embedded
    ? 'w-full space-y-6'
    : 'relative mx-auto w-full max-w-6xl px-4 py-12';
  const shellClassName = embedded
    ? 'relative overflow-hidden rounded-3xl border border-slate-200 bg-white/95 px-6 py-8 shadow-xl shadow-slate-200/60'
    : 'relative overflow-hidden rounded-3xl border border-slate-200 bg-white/95 px-6 py-10 shadow-xl shadow-slate-200/80';
  const creatorDisplayName = currentParticipant?.displayName || copy.creatorName;
  const creatorRoleLabel = formatRoleLabel(currentParticipant?.role || sessionRole || 'serviceman');

  if (!hasAccess) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-4xl flex-col items-center justify-center px-4 py-12 text-center">
        <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-10 shadow-lg shadow-amber-100">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-600">Access restricted</p>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">{copy.accessTitle}</h1>
          <p className="mt-3 text-sm text-slate-600">{copy.accessDescription}</p>
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
                {allowedRoleLabels.join(', ')}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    );
  }

  return (
    <div className={outerClassName}>
      <div className={shellClassName}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{copy.eyebrow}</p>
            <h1 className="text-3xl font-semibold text-slate-900">{copy.title}</h1>
            <p className="text-sm text-slate-500">{copy.description}</p>
          </header>
          <div className="flex flex-col items-end gap-3">
            {heroActions ? <div className="flex flex-wrap justify-end gap-2">{heroActions}</div> : null}
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
              {inboxConfiguration.liveRoutingEnabled ? copy.badgeActive : copy.badgePaused}
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <form
            onSubmit={handleCreateConversation}
            className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-700">{copy.createTitle}</h2>
                <p className="mt-1 text-xs text-slate-500">{copy.createDescription}</p>
              </div>
              <div className="flex flex-col items-end gap-2 text-xs">
                {createConversationError ? (
                  <span className="rounded-full bg-rose-50 px-3 py-1 font-semibold text-rose-600">
                    {createConversationError}
                  </span>
                ) : null}
                {createConversationSuccess ? (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-600">
                    {createConversationSuccess}
                  </span>
                ) : null}
              </div>
            </div>
            <p className="mt-3 text-[11px] uppercase tracking-[0.3em] text-slate-400">
              You will appear as {creatorDisplayName} · {creatorRoleLabel}
            </p>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                Subject
                <input
                  type="text"
                  value={createDraft.subject}
                  onChange={(event) => handleCreateFieldChange('subject', event.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                  placeholder="Leak investigation for unit 12"
                  minLength={3}
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                Customer name
                <input
                  type="text"
                  value={createDraft.customerName}
                  onChange={(event) => handleCreateFieldChange('customerName', event.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                  placeholder="Jordan (Facilities Lead)"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                Customer reference
                <input
                  type="text"
                  value={createDraft.customerReference}
                  onChange={(event) => handleCreateFieldChange('customerReference', event.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                  placeholder="FAC-1029"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                Participant type
                <select
                  value={createDraft.customerType}
                  onChange={(event) => handleCreateFieldChange('customerType', event.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                >
                  <option value="user">Client contact</option>
                  <option value="company">Company stakeholder</option>
                  <option value="enterprise">Enterprise team</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                Job / order ID
                <input
                  type="text"
                  value={createDraft.jobId}
                  onChange={(event) => handleCreateFieldChange('jobId', event.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                  placeholder="JOB-4732"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                Location or asset
                <input
                  type="text"
                  value={createDraft.location}
                  onChange={(event) => handleCreateFieldChange('location', event.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                  placeholder="Tower B · Pump room"
                />
              </label>
            </div>
            <label className="mt-4 flex flex-col gap-1 text-xs font-medium text-slate-600">
              Initial message
              <textarea
                rows={3}
                value={createDraft.initialMessage}
                onChange={(event) => handleCreateFieldChange('initialMessage', event.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                placeholder="Hi team — sharing a quick update before arrival."
              />
            </label>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-sky-500"
                  checked={createDraft.aiAssistEnabled}
                  onChange={(event) => handleCreateFieldChange('aiAssistEnabled', event.target.checked)}
                />
                <span>Keep AI suggestions enabled</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-sky-500 px-5 py-2 text-xs font-semibold text-white shadow-sm shadow-sky-200 transition hover:bg-sky-400 disabled:opacity-60"
                  disabled={creatingConversation}
                >
                  {creatingConversation ? 'Creating…' : copy.createButton}
                </button>
                <button
                  type="button"
                  onClick={() => setCreateDraft({ ...DEFAULT_CREATE_DRAFT })}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                  disabled={creatingConversation}
                >
                  Reset
                </button>
              </div>
            </div>
          </form>

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
