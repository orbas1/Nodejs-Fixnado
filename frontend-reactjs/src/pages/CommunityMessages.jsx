import { useEffect, useMemo, useState } from 'react';
import ConversationList from '../components/communications/ConversationList.jsx';
import MessageComposer from '../components/communications/MessageComposer.jsx';
import CommunityMessageThread from '../components/community/CommunityMessageThread.jsx';
import {
  fetchCommunityMessages,
  sendCommunityMessage
} from '../api/communityClient.js';
import Spinner from '../components/ui/Spinner.jsx';
import { recordPersonaAnalytics } from '../utils/personaAnalytics.js';
import { useCurrentRole } from '../hooks/useCurrentRole.js';

export default function CommunityMessages() {
  const persona = useCurrentRole();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const payload = await fetchCommunityMessages({}, { signal: abortController.signal });
        if (!isMounted) {
          return;
        }
        setConversations(payload.conversations);
        setMessages(payload.messages);
        setActiveConversationId((current) => current ?? payload.conversations[0]?.id ?? null);
        recordPersonaAnalytics('community.messages.view', {
          persona,
          outcome: 'success',
          metadata: {
            conversations: payload.conversations.length,
            unread: payload.conversations.filter((conversation) => conversation.metadata?.unreadCount).length
          }
        });
      } catch (loadError) {
        if (loadError.name === 'AbortError') {
          return;
        }
        console.warn('[CommunityMessages] failed to load conversations', loadError);
        if (isMounted) {
          setError(loadError.message || 'Unable to load conversations');
          recordPersonaAnalytics('community.messages.view', {
            persona,
            outcome: 'error',
            reason: loadError.message
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    load();

    const refresh = window.setInterval(load, 1000 * 60 * 3);

    return () => {
      isMounted = false;
      abortController.abort();
      window.clearInterval(refresh);
    };
  }, [persona]);

  const enrichedConversations = useMemo(() => {
    if (!conversations.length) {
      return [];
    }
    return conversations.map((conversation) => ({
      ...conversation,
      messages:
        conversation.messages?.length
          ? conversation.messages
          : messages.filter((message) => message.conversationId === conversation.id)
    }));
  }, [conversations, messages]);

  const activeConversation = useMemo(
    () => enrichedConversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [enrichedConversations, activeConversationId]
  );

  const handleSend = async ({ body, requestAiAssist }) => {
    if (!activeConversationId) {
      throw new Error('Select a conversation first.');
    }
    const message = await sendCommunityMessage(activeConversationId, {
      body,
      requestAiAssist
    });
    setMessages((current) => [...current, { ...message, conversationId: activeConversationId }]);
    recordPersonaAnalytics('community.messages.send', {
      persona,
      outcome: 'success',
      metadata: {
        conversationId: activeConversationId,
        requestAiAssist
      }
    });
  };

  const handleSelectConversation = (conversationId) => {
    setActiveConversationId(conversationId);
    recordPersonaAnalytics('community.messages.select', {
      persona,
      outcome: 'success',
      metadata: { conversationId }
    });
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-160px)] max-w-6xl gap-6 px-4 py-10">
      <aside className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white/90 shadow-inner">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-400">Conversations</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner className="h-6 w-6 text-primary" />
          </div>
        ) : error ? (
          <div className="px-5 py-6 text-sm font-semibold text-rose-500">{error}</div>
        ) : (
          <ConversationList
            conversations={enrichedConversations}
            activeConversationId={activeConversationId}
            onSelect={handleSelectConversation}
          />
        )}
      </aside>
      <section className="flex w-full flex-1 flex-col rounded-3xl border border-slate-200 bg-white/95 shadow-lg">
        {loading && !activeConversation ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner className="h-8 w-8 text-primary" />
          </div>
        ) : error && !activeConversation ? (
          <div className="flex flex-1 items-center justify-center px-6 text-sm font-semibold text-rose-500">{error}</div>
        ) : (
          <CommunityMessageThread conversation={activeConversation} currentUser={persona} />
        )}
        <div className="border-t border-slate-200 p-5">
          <MessageComposer
            onSend={handleSend}
            disabled={!activeConversationId}
            aiAssistAvailable={Boolean(activeConversation?.aiAssistDefault)}
            defaultAiAssist={Boolean(activeConversation?.aiAssistDefault)}
          />
        </div>
      </section>
    </div>
  );
}
