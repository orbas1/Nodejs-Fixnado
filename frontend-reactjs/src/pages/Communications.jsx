import { useCallback, useEffect, useMemo, useState } from 'react';
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
      className={`max-w-xl rounded-lg px-4 py-3 text-sm shadow-md ${
        isSelf
          ? 'ml-auto bg-emerald-500/90 text-slate-950 border border-emerald-300'
          : message.messageType === 'assistant'
            ? 'bg-indigo-900/60 border border-indigo-500/40 text-indigo-100'
            : 'bg-slate-800/70 border border-slate-700 text-slate-100'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="leading-relaxed whitespace-pre-wrap">{message.body}</p>
        <span className="text-[10px] uppercase tracking-wide opacity-70">
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-[10px] tracking-wide">
        <span className="uppercase">
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
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 space-y-3 text-sm text-slate-200">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notification preferences</h3>
        <label className="mt-2 flex items-center gap-2">
          <input
            type="checkbox"
            className="h-3 w-3 accent-emerald-400"
            checked={participant.notificationsEnabled}
            onChange={(event) => onPreferencesChange({ notificationsEnabled: event.target.checked })}
            disabled={disabled}
          />
          Enable real-time alerts outside quiet hours
        </label>
        <label className="mt-2 flex items-center gap-2">
          <input
            type="checkbox"
            className="h-3 w-3 accent-emerald-400"
            checked={participant.aiAssistEnabled}
            onChange={(event) => onPreferencesChange({ aiAssistEnabled: event.target.checked })}
            disabled={disabled}
          />
          Allow AI follow-ups on your behalf
        </label>
        <label className="mt-2 flex items-center gap-2">
          <input
            type="checkbox"
            className="h-3 w-3 accent-emerald-400"
            checked={participant.videoEnabled}
            onChange={(event) => onPreferencesChange({ videoEnabled: event.target.checked })}
            disabled={disabled}
          />
          Permit instant video escalation
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <label className="flex flex-col gap-1">
          Quiet hours start
          <input
            type="time"
            value={participant.quietHoursStart || ''}
            onChange={(event) => onPreferencesChange({ quietHoursStart: event.target.value || null })}
            className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
            disabled={disabled}
          />
        </label>
        <label className="flex flex-col gap-1">
          Quiet hours end
          <input
            type="time"
            value={participant.quietHoursEnd || ''}
            onChange={(event) => onPreferencesChange({ quietHoursEnd: event.target.value || null })}
            className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
            disabled={disabled}
          />
        </label>
      </div>
      <p className="text-[11px] text-slate-400">
        Quiet hour suppressions retain audit metadata so compliance can evidence consented contact rules during regulator
        reviews.
      </p>
    </div>
  );
}

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

  useEffect(() => {
    if (!participantId) {
      setConversations([]);
      setActiveConversation(null);
      setActiveConversationId(null);
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
          setActiveConversationId((current) => current || payload[0].id);
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
    if (!activeConversationId) {
      setActiveConversation(null);
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
  }, [activeConversationId]);

  const viewerParticipant = useMemo(() => {
    return activeConversation?.participants?.find((participant) => participant.id === participantId) || null;
  }, [activeConversation, participantId]);

  const conversationMessages = activeConversation?.messages ?? [];

  const handleSendMessage = useCallback(
    async ({ body, requestAiAssist }) => {
      if (!activeConversationId || !participantId) {
        throw new CommunicationsApiError('Select a conversation before sending a message.');
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

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 text-slate-100">
      <header className="mb-6 flex flex-col gap-3">
        <h1 className="text-2xl font-semibold text-white">Cross-channel communications</h1>
        <p className="text-sm text-slate-400">
          Manage chat, AI assists, and Agora escalations across Fixnado web and mobile clients. Use the participant identifier
          from the admin dashboard or booking timeline to hydrate conversations in real time.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = participantInput.trim();
            setParticipantId(trimmed);
            setSearchParams(trimmed ? { participantId: trimmed } : {});
          }}
          className="flex flex-wrap gap-3"
        >
          <input
            type="text"
            value={participantInput}
            onChange={(event) => setParticipantInput(event.target.value)}
            placeholder="Conversation participant ID"
            className="w-full max-w-md rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <button
            type="submit"
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Load participant
          </button>
        </form>
        {!hasParticipant ? (
          <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Provide a conversation participant ID to pull live threads. Each conversation exposes participant IDs via the admin
            console and booking dashboards.
          </p>
        ) : null}
        {error ? (
          <p className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>
        ) : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between border-b border-slate-800/70 px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Conversations</h2>
            {listLoading ? <span className="text-[10px] uppercase text-slate-500">Loading…</span> : null}
          </div>
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelect={(conversationId) => setActiveConversationId(conversationId)}
          />
        </aside>

        <section className="flex min-h-[480px] flex-col rounded-lg border border-slate-800 bg-slate-900/50">
          {!activeConversation ? (
            <div className="m-auto max-w-md text-center text-sm text-slate-400">
              {hasParticipant
                ? 'Select a conversation from the left panel to review transcripts, toggle AI assists, and issue session tokens.'
                : 'Enter a participant identifier to retrieve communications threads across Fixnado channels.'}
            </div>
          ) : (
            <>
              <div className="border-b border-slate-800/70 px-6 py-4">
                <h2 className="text-lg font-semibold text-white">{activeConversation.subject}</h2>
                <p className="mt-1 text-xs text-slate-400">
                  {activeConversation.participants
                    .filter((participant) => participant.role !== 'ai_assistant')
                    .map((participant) => `${participant.displayName} (${participant.role})`)
                    .join(' • ')}
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-[11px] uppercase tracking-wide text-emerald-300">
                  <span>AI Assist {activeConversation.aiAssistDefault ? 'enabled' : 'disabled'}</span>
                  <span>Retention {activeConversation.retentionDays} days</span>
                  {activeConversation.metadata?.bookingId ? <span>Booking #{activeConversation.metadata.bookingId}</span> : null}
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
                {messagesLoading ? (
                  <p className="text-sm text-slate-400">Loading conversation…</p>
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

                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Video escalation</h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Issue secure Agora tokens that keep chat and call transcripts in sync for audit trails.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleVideoSession}
                      className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                    >
                      Generate session
                    </button>
                  </div>
                  {videoSession ? (
                    <dl className="mt-3 grid grid-cols-1 gap-2 text-[11px] text-emerald-200 sm:grid-cols-2">
                      <div>
                        <dt className="uppercase tracking-wide text-emerald-400">Channel</dt>
                        <dd className="break-all">{videoSession.channelName}</dd>
                      </div>
                      <div>
                        <dt className="uppercase tracking-wide text-emerald-400">Expires</dt>
                        <dd>{new Date(videoSession.expiresAt).toLocaleString()}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="uppercase tracking-wide text-emerald-400">Token</dt>
                        <dd className="break-all font-mono text-[10px]">{videoSession.token}</dd>
                      </div>
                    </dl>
                  ) : null}
                </div>
              </div>

              <MessageComposer
                onSend={handleSendMessage}
                disabled={!viewerParticipant}
                aiAssistAvailable={Boolean(viewerParticipant?.aiAssistEnabled && activeConversation.aiAssistDefault)}
                defaultAiAssist={viewerParticipant?.aiAssistEnabled}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default Communications;
