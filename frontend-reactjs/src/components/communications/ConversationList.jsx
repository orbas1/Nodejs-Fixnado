import PropTypes from 'prop-types';
import clsx from 'clsx';

function formatRelativeTime(timestamp) {
  if (!timestamp) {
    return 'just now';
  }

  const now = Date.now();
  const value = new Date(timestamp).getTime();
  if (Number.isNaN(value)) {
    return 'just now';
  }

  const diff = value - now;
  const absDiff = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (absDiff < minute) {
    return rtf.format(Math.round(diff / 1000), 'second');
  }
  if (absDiff < hour) {
    return rtf.format(Math.round(diff / minute), 'minute');
  }
  if (absDiff < day) {
    return rtf.format(Math.round(diff / hour), 'hour');
  }
  return rtf.format(Math.round(diff / day), 'day');
}

function ConversationList({ conversations, activeConversationId, onSelect }) {
  if (!conversations.length) {
    return (
      <div className="px-5 py-10 text-center text-sm text-slate-500">
        No conversations yet. Start chatting to see threads here.
      </div>
    );
  }

  return (
    <ul className="space-y-2 p-3">
      {conversations.map((conversation) => {
        const participantSummary = conversation.participants
          .filter((participant) => participant.role !== 'ai_assistant')
          .map((participant) => participant.displayName)
          .join(', ');
        const latestMessage = conversation.messages?.at(-1);
        const initials = conversation.subject?.slice(0, 2)?.toUpperCase() || 'FX';
        return (
          <li key={conversation.id}>
            <button
              type="button"
              onClick={() => onSelect(conversation.id)}
              className={clsx(
                'w-full rounded-2xl border px-4 py-3 text-left transition',
                activeConversationId === conversation.id
                  ? 'border-sky-200 bg-sky-50 text-slate-900 shadow-sm shadow-sky-100'
                  : 'border-transparent bg-white/60 text-slate-700 hover:border-slate-200 hover:bg-white'
              )}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold" title={conversation.subject}>
                      {conversation.subject}
                    </p>
                    <span className="text-[11px] text-slate-400">{formatRelativeTime(latestMessage?.createdAt)}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500" title={participantSummary}>
                    {participantSummary || 'No participants yet'}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-400" title={latestMessage?.body}>
                    {latestMessage
                      ? `${latestMessage.messageType === 'assistant' ? 'Assistant • ' : ''}${latestMessage.body}`
                      : 'No messages yet'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.3em] text-slate-400">
                    {conversation.aiAssistDefault ? <span>AI</span> : null}
                    {conversation.metadata?.priority ? <span>{conversation.metadata.priority}</span> : null}
                    {conversation.metadata?.bookingId ? <span>#{conversation.metadata.bookingId}</span> : null}
                  </div>
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

ConversationList.propTypes = {
  conversations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      subject: PropTypes.string.isRequired,
      participants: PropTypes.arrayOf(
        PropTypes.shape({
          displayName: PropTypes.string,
          role: PropTypes.string,
          participantType: PropTypes.string
        })
      ).isRequired,
      metadata: PropTypes.object,
      aiAssistDefault: PropTypes.bool,
      messages: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          body: PropTypes.string,
          createdAt: PropTypes.string,
          messageType: PropTypes.string
        })
      )
    })
  ).isRequired,
  activeConversationId: PropTypes.string,
  onSelect: PropTypes.func.isRequired
};

ConversationList.defaultProps = {
  activeConversationId: undefined
};

export default ConversationList;
