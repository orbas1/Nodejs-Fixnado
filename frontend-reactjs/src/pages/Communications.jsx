import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { useSearchParams } from 'react-router-dom';
import ConversationList from '../components/communications/ConversationList.jsx';
import MessageComposer from '../components/communications/MessageComposer.jsx';
import {
  listConversations,
  fetchConversation,
  postMessage,
  updateParticipantPreferences,
  createVideoSession,
  CommunicationsApiError
} from '../api/communicationsClient.js';
import { resolveSessionTelemetryContext } from '../utils/telemetry.js';
import {
  COMMUNICATIONS_ALLOWED_ROLES,
  hasCommunicationsAccess,
  normaliseRole,
  formatRoleLabel
} from '../constants/accessControl.js';

function MessageBubble({ message, isSelf, viewerParticipantId }) {
  const delivery =
    message.deliveries?.find((item) => item.participantId === viewerParticipantId) ??
    message.deliveries?.[0];
  const rawStatus = delivery?.status === 'suppressed'
    ? `Muted (${delivery.suppressedReason || 'quiet hours'})`
    : delivery?.status;
  const statusLabel = rawStatus && rawStatus.toLowerCase() !== 'delivered' ? rawStatus : null;
  const roleLabel = message.messageType === 'assistant' ? 'AI Assist' : isSelf ? 'You' : 'Participant';
  const timeLabel = useMemo(() => {
    try {
      const created = new Date(message.createdAt);
      if (Number.isNaN(created.getTime())) {
        return 'Pending timestamp';
      }
      return new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      }).format(created);
    } catch {
      return 'Pending timestamp';
    }
  }, [message.createdAt]);

  const tone = message.messageType === 'assistant' ? 'assistant' : isSelf ? 'self' : 'participant';
  const wrapperClasses = clsx('flex w-full items-end gap-3', isSelf ? 'justify-end' : 'justify-start');
  const bubbleClasses = clsx(
    'relative max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
    {
      'bg-sky-500 text-white shadow-sky-200/50': tone === 'self',
      'bg-indigo-500 text-white shadow-indigo-200/50': tone === 'assistant',
      'bg-slate-100 text-slate-900 shadow-slate-200/60': tone === 'participant'
    }
  );
  const metaTextClasses = clsx(
    'mt-2 text-[11px] font-semibold uppercase tracking-[0.25em]',
    tone === 'assistant' || tone === 'self' ? 'text-white/70' : 'text-slate-500'
  );
  const avatarClasses = clsx(
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase',
    tone === 'assistant' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-600'
  );
  const initials = useMemo(() => roleLabel.slice(0, 2).toUpperCase(), [roleLabel]);

  const confidenceLabel =
    message.aiConfidenceScore != null
      ? `Confidence ${Math.round(Number(message.aiConfidenceScore) * 100)}%`
      : null;

  return (
    <article
      className={wrapperClasses}
      data-qa="communications-message"
      role="group"
      aria-label={`${roleLabel} message sent ${timeLabel}`}
    >
      {!isSelf ? <span className={avatarClasses} aria-hidden="true">{initials}</span> : null}
      <div className={clsx('flex max-w-full flex-col', isSelf ? 'items-end' : 'items-start')}>
        <div className="mb-1 flex items-baseline gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">{roleLabel}</span>
          <time dateTime={message.createdAt}>{timeLabel}</time>
        </div>
        <div className={bubbleClasses}>
          <p className="whitespace-pre-wrap break-words" data-qa="communications-message-body">
            {message.body}
          </p>
          {statusLabel || confidenceLabel ? (
            <div className={metaTextClasses}>
              {[statusLabel, confidenceLabel].filter(Boolean).join(' • ')}
            </div>
          ) : null}
        </div>
      </div>
      {isSelf ? <span className={avatarClasses} aria-hidden="true">{initials}</span> : null}
    </article>
  );
}

function ParticipantControls({ participant, onPreferencesChange, disabled }) {
  if (!participant) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-700 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Participant settings</h3>
        <span className="text-xs text-slate-400">{participant.displayName || 'Participant'}</span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <label className="flex items-center justify-between gap-3 rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
          <span className="text-slate-700">Alerts</span>
          <input
            type="checkbox"
            className="h-4 w-4 accent-sky-500"
            checked={participant.notificationsEnabled}
            onChange={(event) => onPreferencesChange({ notificationsEnabled: event.target.checked })}
            disabled={disabled}
          />
        </label>
        <label className="flex items-center justify-between gap-3 rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
          <span className="text-slate-700">AI assist</span>
          <input
            type="checkbox"
            className="h-4 w-4 accent-sky-500"
            checked={participant.aiAssistEnabled}
            onChange={(event) => onPreferencesChange({ aiAssistEnabled: event.target.checked })}
            disabled={disabled}
          />
        </label>
        <label className="flex items-center justify-between gap-3 rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
          <span className="text-slate-700">Video</span>
          <input
            type="checkbox"
            className="h-4 w-4 accent-sky-500"
            checked={participant.videoEnabled}
            onChange={(event) => onPreferencesChange({ videoEnabled: event.target.checked })}
            disabled={disabled}
          />
        </label>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600">
        <label className="flex flex-col gap-1 rounded-xl bg-slate-100 px-3 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Quiet hours start</span>
          <input
            type="time"
            value={participant.quietHoursStart || ''}
            onChange={(event) => onPreferencesChange({ quietHoursStart: event.target.value || null })}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-900"
            disabled={disabled}
          />
        </label>
        <label className="flex flex-col gap-1 rounded-xl bg-slate-100 px-3 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Quiet hours end</span>
          <input
            type="time"
            value={participant.quietHoursEnd || ''}
            onChange={(event) => onPreferencesChange({ quietHoursEnd: event.target.value || null })}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-900"
            disabled={disabled}
          />
        </label>
      </div>
    </div>
  );
}

MessageBubble.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.string,
    body: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    messageType: PropTypes.string,
    senderParticipantId: PropTypes.string,
    aiConfidenceScore: PropTypes.number,
    deliveries: PropTypes.arrayOf(
      PropTypes.shape({
        participantId: PropTypes.string,
        status: PropTypes.string,
        suppressedReason: PropTypes.string
      })
    )
  }).isRequired,
  isSelf: PropTypes.bool.isRequired,
  viewerParticipantId: PropTypes.string
};

MessageBubble.defaultProps = {
  viewerParticipantId: undefined
};

ParticipantControls.propTypes = {
  participant: PropTypes.shape({
    displayName: PropTypes.string,
    notificationsEnabled: PropTypes.bool,
    aiAssistEnabled: PropTypes.bool,
    videoEnabled: PropTypes.bool,
    quietHoursStart: PropTypes.string,
    quietHoursEnd: PropTypes.string
  }),
  onPreferencesChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

ParticipantControls.defaultProps = {
  participant: null,
  disabled: false
};

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
  const [entryPointSettings, setEntryPointSettings] = useState({
    serviceLaunch: true,
    toolsMaterials: true,
    shopFronts: true,
    businessFronts: true,
    bookingFlow: true,
    purchaseFlow: true
  });

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

  const entryPointDefinitions = useMemo(
    () => [
      {
        key: 'serviceLaunch',
        title: 'Service launch',
        tagline: 'Kickoff updates when crews roll out.',
        emoji: '🚚',
        template: 'Hi there! Your Fixnado service has just launched. Let us know if anything on-site needs attention.'
      },
      {
        key: 'toolsMaterials',
        title: 'Tools & materials',
        tagline: 'Assist shoppers reviewing equipment.',
        emoji: '🛠️',
        template:
          'Hello! I noticed you are reviewing our tools and material display. I am here to help with specs, availability, or bundle suggestions.'
      },
      {
        key: 'shopFronts',
        title: 'Shop fronts',
        tagline: 'Chat from every storefront card.',
        emoji: '🛍️',
        template: 'Welcome to our Fixnado shop front! How can we help you find the right service or product today?'
      },
      {
        key: 'businessFronts',
        title: 'Business fronts',
        tagline: 'Keep profile visitors engaged.',
        emoji: '🏢',
        template:
          'Thanks for visiting our Fixnado business front. I am on hand if you need recommendations or want to schedule a consult.'
      },
      {
        key: 'bookingFlow',
        title: 'Booking flow',
        tagline: 'Guide customers as they schedule.',
        emoji: '📅',
        template:
          'I am here while you complete your booking. Let me know if you need help picking a time or clarifying what is included.'
      },
      {
        key: 'purchaseFlow',
        title: 'Checkout',
        tagline: 'Answer questions before payment.',
        emoji: '🧾',
        template:
          'I can help as you finalize your purchase. If anything looks unclear, send a quick note and I will respond right away.'
      }
    ],
    []
  );

  const handleEntryPointToggle = useCallback((key) => {
    setEntryPointSettings((current) => ({
      ...current,
      [key]: !current[key]
    }));
  }, []);

  const handleEntryPointMessage = useCallback(
    (template) => {
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
          <div className="flex items-center gap-2 rounded-full bg-slate-900/90 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20">
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" aria-hidden="true" />
            Live routing enabled
          </div>
        </div>

        <section className="mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Entry points</h2>
          <p className="mt-2 text-xs text-slate-500">Switch on the surfaces you want to cover and send a quick hello.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {entryPointDefinitions.map(({ key, title, tagline, emoji, template }) => (
              <div key={key} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-left">
                    <span className="text-lg" aria-hidden="true">
                      {emoji}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{title}</p>
                      <p className="text-xs text-slate-500">{tagline}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEntryPointToggle(key)}
                    aria-pressed={entryPointSettings[key]}
                    className={clsx(
                      'rounded-full border px-3 py-1 text-xs font-semibold transition',
                      entryPointSettings[key]
                        ? 'border-sky-300 bg-sky-50 text-sky-600'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    )}
                  >
                    {entryPointSettings[key] ? 'On' : 'Off'}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleEntryPointMessage(template)}
                  className="self-start rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                >
                  Use template
                </button>
              </div>
            ))}
          </div>
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

                <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
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
