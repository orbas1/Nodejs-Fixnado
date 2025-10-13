import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
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

function MessageBubble({ message, isSelf, viewerParticipantId }) {
  const delivery = message.deliveries?.find((item) => item.participantId === viewerParticipantId) ?? message.deliveries?.[0];
  const statusLabel = delivery?.status === 'suppressed' ? `muted (${delivery.suppressedReason || 'quiet hours'})` : delivery?.status;
  return (
    <div
      className={`max-w-xl rounded-2xl border px-4 py-3 text-sm shadow-sm ${
        isSelf
          ? 'ml-auto border-sky-200 bg-sky-50 text-slate-900'
          : message.messageType === 'assistant'
            ? 'border-indigo-200 bg-indigo-50 text-indigo-900'
            : 'border-slate-200 bg-white text-slate-900'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="whitespace-pre-wrap font-medium leading-relaxed">{message.body}</p>
        <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.3em] text-slate-500">
        <span>
          {message.messageType === 'assistant' ? 'AI Assist' : isSelf ? 'You' : 'Participant'}
        </span>
        {statusLabel ? <span>{statusLabel}</span> : null}
        {message.aiConfidenceScore ? <span>Confidence {Math.round(message.aiConfidenceScore * 100)}%</span> : null}
      </div>
    </div>
  );
}

function ParticipantControls({ participant, onPreferencesChange, disabled }) {
  if (!participant) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 shadow-inner shadow-slate-100">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Notification preferences</h3>
        <label className="mt-2 flex items-center gap-2">
          <input
            type="checkbox"
            className="h-3 w-3 accent-sky-500"
            checked={participant.notificationsEnabled}
            onChange={(event) => onPreferencesChange({ notificationsEnabled: event.target.checked })}
            disabled={disabled}
          />
          Enable real-time alerts outside quiet hours
        </label>
        <label className="mt-2 flex items-center gap-2">
          <input
            type="checkbox"
            className="h-3 w-3 accent-sky-500"
            checked={participant.aiAssistEnabled}
            onChange={(event) => onPreferencesChange({ aiAssistEnabled: event.target.checked })}
            disabled={disabled}
          />
          Allow AI follow-ups on your behalf
        </label>
        <label className="mt-2 flex items-center gap-2">
          <input
            type="checkbox"
            className="h-3 w-3 accent-sky-500"
            checked={participant.videoEnabled}
            onChange={(event) => onPreferencesChange({ videoEnabled: event.target.checked })}
            disabled={disabled}
          />
          Permit instant video escalation
        </label>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-600">
        <label className="flex flex-col gap-1">
          Quiet hours start
          <input
            type="time"
            value={participant.quietHoursStart || ''}
            onChange={(event) => onPreferencesChange({ quietHoursStart: event.target.value || null })}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-900"
            disabled={disabled}
          />
        </label>
        <label className="flex flex-col gap-1">
          Quiet hours end
          <input
            type="time"
            value={participant.quietHoursEnd || ''}
            onChange={(event) => onPreferencesChange({ quietHoursEnd: event.target.value || null })}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-900"
            disabled={disabled}
          />
        </label>
      </div>
      <p className="mt-3 text-[11px] text-slate-500">
        Quiet hour suppressions retain audit metadata so compliance can evidence consented contact rules during regulator reviews.
      </p>
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
        description: 'Drop customers a note the moment a service kicks off so everyone stays aligned on arrivals and crew status.',
        template: 'Hi there! Your Fixnado service has just launched. Let us know if anything on-site needs attention.'
      },
      {
        key: 'toolsMaterials',
        title: 'Tools & materials displays',
        description: 'Let specialists answer questions directly from equipment and material detail pages without leaving the catalog.',
        template:
          'Hello! I noticed you are reviewing our tools and material display. I am here to help with specs, availability, or bundle suggestions.'
      },
      {
        key: 'shopFronts',
        title: 'Shop fronts',
        description: 'Keep storefront visitors in touch with your team through the floating speech bubble on every listing.',
        template: 'Welcome to our Fixnado shop front! How can we help you find the right service or product today?'
      },
      {
        key: 'businessFronts',
        title: 'Business fronts',
        description: 'Route inquiries from your business profile straight into this inbox to speed up introductions.',
        template:
          'Thanks for visiting our Fixnado business front. I am on hand if you need recommendations or want to schedule a consult.'
      },
      {
        key: 'bookingFlow',
        title: 'During booking',
        description: 'Offer reassurance while customers schedule services so questions are handled before confirmation.',
        template:
          'I am here while you complete your booking. Let me know if you need help picking a time or clarifying what is included.'
      },
      {
        key: 'purchaseFlow',
        title: 'During purchase',
        description: 'Answer last-minute questions during checkout to reduce drop-off and keep purchases moving.',
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

  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 py-12">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-10 shadow-xl shadow-slate-200/80">
        <div className="speech-bubble pointer-events-none" aria-hidden="true">
          <span className="text-xs uppercase tracking-[0.35em] text-white/80">Fixnado chat</span>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-white">
            The light bubble now floats wherever customers need a hand.
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <header className="max-w-2xl space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Messaging workspace</p>
            <h1 className="text-3xl font-semibold text-slate-900">Conversations stay connected to your profile</h1>
            <p className="text-sm text-slate-600">
              You are already signed in with your Fixnado profile. Launch chats from services, tools, shop fronts, and every checkout without another login screen.
            </p>
          </header>
          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 shadow-sm">
            <span className="text-xl" aria-hidden="true">
              💬
            </span>
            <div>
              <p className="font-semibold text-slate-900">Speech bubble launcher</p>
              <p>The refreshed bubble mirrors the entry points you enable below.</p>
            </div>
          </div>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/70 p-6 shadow-inner shadow-slate-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Messaging entry points</h2>
              <p className="mt-2 text-sm text-slate-600">
                Choose where the speech bubble appears so customers can message the right individual while launching services, browsing tools and materials, shopping storefronts, or checking out.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {entryPointDefinitions.map(({ key, title, description, template }) => (
              <div
                key={key}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                      <p className="text-sm text-slate-600">{description}</p>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-sky-500"
                        checked={entryPointSettings[key]}
                        onChange={() => handleEntryPointToggle(key)}
                      />
                      Active
                    </label>
                  </div>
                  <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    Bubble message preview: “{template}”
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleEntryPointMessage(template)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-slate-900"
                >
                  <span aria-hidden="true">💬</span>
                  Open message composer
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
          className="mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Participant routing</span>
          <p className="text-xs text-slate-600">
            Your Fixnado profile is already linked. Adjust the participant ID if you need to inspect another customer or teammate thread.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={participantInput}
              onChange={(event) => setParticipantInput(event.target.value)}
              placeholder="Conversation participant ID"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder-slate-400 transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-200 transition hover:bg-sky-400"
            >
              Load participant
            </button>
          </div>
        </form>

        {!hasParticipant ? (
          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700 shadow-sm">
            Provide a participant ID to pull live threads from bookings, services, storefronts, or business fronts.
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600 shadow-sm">
            {error}
          </p>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/80">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">Conversations</h2>
              {listLoading ? <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Loading…</span> : null}
            </div>
            <ConversationList
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelect={(conversationId) => setActiveConversationId(conversationId)}
            />
          </aside>

          <section className="flex min-h-[480px] flex-col rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-200/80">
            {!activeConversation ? (
              <div className="m-auto max-w-md px-6 text-center text-sm text-slate-600">
                {hasParticipant
                  ? 'Select a conversation from the left panel to review transcripts, toggle AI assists, and share quick updates.'
                  : 'Enter a participant identifier to retrieve communications threads across Fixnado channels.'}
              </div>
            ) : (
              <>
                <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
                  <h2 className="text-lg font-semibold text-slate-900">{activeConversation.subject}</h2>
                  <p className="mt-2 text-xs text-slate-600">
                    {activeConversation.participants
                      .filter((participant) => participant.role !== 'ai_assistant')
                      .map((participant) => `${participant.displayName} (${participant.role})`)
                      .join(' • ')}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.3em] text-sky-600">
                    <span>AI Assist {activeConversation.aiAssistDefault ? 'enabled' : 'disabled'}</span>
                    <span>Retention {activeConversation.retentionDays} days</span>
                    {activeConversation.metadata?.bookingId ? <span>Booking #{activeConversation.metadata.bookingId}</span> : null}
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
                  {messagesLoading ? (
                    <p className="text-sm text-slate-600">Loading conversation…</p>
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
                        <p className="text-sm text-slate-500">
                          No messages yet. Start the thread with context so AI assist can apply response guardrails.
                        </p>
                      ) : null}
                    </div>
                  )}

                  <ParticipantControls
                    participant={viewerParticipant}
                    onPreferencesChange={handlePreferencesChange}
                    disabled={preferencesSaving}
                  />

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Need to escalate to video?</p>
                        <p className="text-xs text-slate-600">
                          Generate an Agora session link when customers want to walk through issues live.
                        </p>
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
                      <dl className="mt-4 grid gap-3 text-xs text-slate-600 sm:grid-cols-2">
                        <div>
                          <dt className="uppercase tracking-[0.3em] text-slate-500">Channel</dt>
                          <dd className="font-mono text-sm text-slate-900">{videoSession.channelName}</dd>
                        </div>
                        <div>
                          <dt className="uppercase tracking-[0.3em] text-slate-500">Expires</dt>
                          <dd>{new Date(videoSession.expiresAt).toLocaleString()}</dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="uppercase tracking-[0.3em] text-slate-500">Token</dt>
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
