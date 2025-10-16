import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../components/ui/Button.jsx';
import Textarea from '../../../components/ui/Textarea.jsx';
import Skeleton from '../../../components/ui/Skeleton.jsx';

function ThreadList({ threads, activeId, onSelect }) {
  if (threads.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-6 text-sm text-slate-500">
        No conversation history yet.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {threads.map((thread) => {
        const isActive = thread.bidId === activeId;
        return (
          <li key={thread.bidId}>
            <button
              type="button"
              onClick={() => onSelect(thread.bidId)}
              className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                isActive
                  ? 'border-primary/40 bg-primary/5 text-primary shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-primary/20 hover:bg-primary/5'
              }`}
            >
              <p className="text-sm font-semibold">{thread.jobTitle ?? 'Custom job'}</p>
              <p className="text-xs text-slate-500">{thread.lastMessage?.author?.name ?? 'System'} — {thread.lastMessage?.body ?? 'No messages yet'}</p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

ThreadList.propTypes = {
  threads: PropTypes.arrayOf(
    PropTypes.shape({
      bidId: PropTypes.string.isRequired,
      jobTitle: PropTypes.string,
      lastMessage: PropTypes.shape({
        body: PropTypes.string,
        author: PropTypes.shape({ name: PropTypes.string })
      })
    })
  ).isRequired,
  activeId: PropTypes.string,
  onSelect: PropTypes.func.isRequired
};

ThreadList.defaultProps = {
  activeId: null
};

function MessageBubble({ message }) {
  const timestamp = message.createdAt ? new Date(message.createdAt).toLocaleString() : '';
  const isProvider = message.authorRole === 'provider';
  return (
    <div className={`max-w-[85%] rounded-2xl border px-4 py-3 text-sm shadow-sm ${isProvider ? 'ml-auto border-primary/40 bg-primary/5 text-primary-900' : 'border-slate-200 bg-white text-slate-700'}`}>
      <p className="text-xs font-semibold text-slate-500">
        {message.author?.name ?? 'System'} {timestamp ? `• ${timestamp}` : ''}
      </p>
      <p className="mt-1 whitespace-pre-wrap leading-5">{message.body}</p>
      {message.attachments?.length ? (
        <ul className="mt-2 space-y-1 text-xs text-primary">
          {message.attachments.map((attachment) => (
            <li key={attachment.url}>
              <a href={attachment.url} target="_blank" rel="noreferrer" className="underline">
                {attachment.label || attachment.url}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

MessageBubble.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.string,
    body: PropTypes.string.isRequired,
    createdAt: PropTypes.string,
    author: PropTypes.shape({ name: PropTypes.string }),
    authorRole: PropTypes.string,
    attachments: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        url: PropTypes.string
      })
    )
  }).isRequired
};

export default function CommunicationsPanel({ threads, loading, messagingBidId, onSendMessage }) {
  const [activeId, setActiveId] = useState(null);
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([{ label: '', url: '' }]);

  useEffect(() => {
    if (!activeId && threads.length > 0) {
      setActiveId(threads[0].bidId);
    }
  }, [threads, activeId]);

  const activeThread = useMemo(() => threads.find((thread) => thread.bidId === activeId) ?? null, [threads, activeId]);

  const handleAddAttachment = () => {
    setAttachments((current) => [...current, { label: '', url: '' }]);
  };

  const handleAttachmentChange = (index, key, value) => {
    setAttachments((current) => {
      const next = [...current];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const handleRemoveAttachment = (index) => {
    setAttachments((current) => current.filter((_, attachmentIndex) => attachmentIndex !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!activeThread || !message.trim()) return;
    const payload = {
      body: message,
      attachments: attachments
        .filter((attachment) => attachment.url && attachment.url.trim())
        .map((attachment) => ({ label: attachment.label, url: attachment.url }))
    };
    await onSendMessage(activeThread.bidId, payload);
    setMessage('');
    setAttachments([{ label: '', url: '' }]);
  };

  return (
    <section id="provider-custom-jobs-communications" className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">Communication hub</h2>
          <p className="text-sm text-slate-500">Manage negotiation threads and follow-ups with buyers.</p>
        </div>
      </header>
      {loading ? (
        <Skeleton className="h-80 rounded-3xl" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
          <aside className="rounded-3xl border border-slate-200 bg-white/80 p-4">
            <ThreadList threads={threads} activeId={activeId} onSelect={setActiveId} />
          </aside>
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-4">
            {activeThread ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-primary">{activeThread.jobTitle ?? 'Custom job'}</h3>
                    <p className="text-xs text-slate-500">
                      {activeThread.participants?.length ? `${activeThread.participants.length} participants` : 'No participants listed'}
                    </p>
                  </div>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl bg-slate-50/80 p-4">
                  {activeThread.messages?.length ? (
                    activeThread.messages.map((msg) => <MessageBubble key={msg.id ?? msg.createdAt} message={msg} />)
                  ) : (
                    <p className="text-sm text-slate-500">No messages yet. Start the conversation below.</p>
                  )}
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <Textarea
                    label="Send a message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={4}
                  />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">Attachments</span>
                      <Button type="button" size="sm" variant="secondary" onClick={handleAddAttachment}>
                        Add link
                      </Button>
                    </div>
                    {attachments.map((attachment, index) => (
                      <div key={`attachment-${index}`} className="grid gap-2 rounded-2xl border border-slate-200 bg-white/90 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                        <input
                          type="text"
                          value={attachment.label}
                          onChange={(event) => handleAttachmentChange(index, 'label', event.target.value)}
                          placeholder="Label"
                          className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none"
                        />
                        <input
                          type="url"
                          value={attachment.url}
                          onChange={(event) => handleAttachmentChange(index, 'url', event.target.value)}
                          placeholder="https://"
                          className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none"
                        />
                        <Button type="button" size="sm" variant="danger" onClick={() => handleRemoveAttachment(index)}>
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" loading={messagingBidId === activeThread.bidId} disabled={!message.trim()}>
                      Send message
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-2xl bg-slate-50/80 p-6 text-sm text-slate-500">
                Select a thread to view messages.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

CommunicationsPanel.propTypes = {
  threads: PropTypes.arrayOf(
    PropTypes.shape({
      bidId: PropTypes.string.isRequired,
      jobTitle: PropTypes.string,
      messages: PropTypes.array
    })
  ),
  loading: PropTypes.bool,
  messagingBidId: PropTypes.string,
  onSendMessage: PropTypes.func.isRequired
};

CommunicationsPanel.defaultProps = {
  threads: [],
  loading: false,
  messagingBidId: null
};
