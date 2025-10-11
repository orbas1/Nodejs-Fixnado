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
      <div className="p-4 text-sm text-slate-400">
        No conversations yet. Start a chat from a booking, rental, or campaign record to see it listed here.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-800/40">
      {conversations.map((conversation) => {
        const participantSummary = conversation.participants
          .filter((participant) => participant.role !== 'ai_assistant')
          .map((participant) => participant.displayName)
          .join(', ');
        const latestMessage = conversation.messages?.at(-1);
        return (
          <li key={conversation.id}>
            <button
              type="button"
              onClick={() => onSelect(conversation.id)}
              className={clsx(
                'w-full text-left px-4 py-3 transition-colors duration-150',
                activeConversationId === conversation.id
                  ? 'bg-slate-800/70 border-l-4 border-emerald-400 text-white'
                  : 'hover:bg-slate-800/40 text-slate-200'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm truncate" title={conversation.subject}>
                  {conversation.subject}
                </p>
                <span className="text-xs text-slate-400">{formatRelativeTime(latestMessage?.createdAt)}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400 truncate" title={participantSummary}>
                {participantSummary}
              </p>
              {latestMessage?.body ? (
                <p className="mt-1 text-xs text-slate-500 truncate" title={latestMessage.body}>
                  {latestMessage.messageType === 'assistant' ? 'Assistant • ' : ''}
                  {latestMessage.body}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-emerald-300">
                {conversation.aiAssistDefault ? <span className="uppercase tracking-wide">AI Assist</span> : null}
                {conversation.metadata?.bookingId ? (
                  <span className="uppercase tracking-wide">Booking #{conversation.metadata.bookingId}</span>
                ) : null}
                {conversation.metadata?.priority ? (
                  <span className="uppercase tracking-wide">{conversation.metadata.priority}</span>
                ) : null}
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
