import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

function MessageBubble({ message, isOwn }) {
  return (
    <div className={clsx('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={clsx(
          'max-w-xl rounded-3xl border px-4 py-3 text-sm shadow-sm',
          isOwn
            ? 'border-primary bg-primary text-white'
            : 'border-slate-200 bg-white text-slate-700'
        )}
      >
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-[0.3em]">{message.author}</span>
          <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <p className="mt-2 whitespace-pre-line leading-relaxed">{message.body}</p>
        {message.attachments?.length ? (
          <ul className="mt-2 space-y-1 text-xs underline">
            {message.attachments.map((attachment) => (
              <li key={attachment.url}>
                <a href={attachment.url} className="hover:text-accent" target="_blank" rel="noopener noreferrer">
                  {attachment.label ?? attachment.url}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

MessageBubble.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.string,
    author: PropTypes.string,
    body: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    persona: PropTypes.string,
    attachments: PropTypes.arrayOf(
      PropTypes.shape({
        url: PropTypes.string.isRequired,
        label: PropTypes.string
      })
    )
  }).isRequired,
  isOwn: PropTypes.bool
};

MessageBubble.defaultProps = {
  isOwn: false
};

export default function CommunityMessageThread({ conversation, currentUser }) {
  const scrollerRef = useRef(null);

  useEffect(() => {
    if (!scrollerRef.current) {
      return;
    }
    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [conversation?.messages]);

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-sm text-slate-500">
        Select a conversation to view the message history.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{conversation.channel}</p>
          <h2 className="text-lg font-semibold text-primary">{conversation.subject}</h2>
          <p className="text-xs text-slate-500">{conversation.participants?.join(', ')}</p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>Last activity {new Date(conversation.updatedAt).toLocaleString()}</p>
          {conversation.slaBreaches ? (
            <p className="font-semibold text-rose-500">{conversation.slaBreaches} SLA alerts</p>
          ) : null}
        </div>
      </header>
      <div ref={scrollerRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-6">
        {conversation.messages.map((message) => (
          <MessageBubble
            key={message.id ?? `${message.createdAt}-${message.author}`}
            message={message}
            isOwn={message.persona === currentUser}
          />
        ))}
      </div>
    </div>
  );
}

CommunityMessageThread.propTypes = {
  conversation: PropTypes.shape({
    id: PropTypes.string,
    channel: PropTypes.string,
    subject: PropTypes.string,
    participants: PropTypes.arrayOf(PropTypes.string),
    updatedAt: PropTypes.string,
    slaBreaches: PropTypes.number,
    messages: PropTypes.arrayOf(PropTypes.object)
  }),
  currentUser: PropTypes.string
};

CommunityMessageThread.defaultProps = {
  conversation: null,
  currentUser: 'guest'
};
