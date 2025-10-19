import { useState } from 'react';
import PropTypes from 'prop-types';
import { useLocale } from '../../hooks/useLocale.js';
import StatusPill from '../ui/StatusPill.jsx';

const priorityTone = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  urgent: 'critical'
};

export default function InstructorSupportInbox({ tickets, onReply, replyingId }) {
  const { t, format } = useLocale();
  const [messageDrafts, setMessageDrafts] = useState({});

  if (tickets.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-6 py-8 text-center text-sm text-slate-500">
        {t('instructor.support.empty')}
      </p>
    );
  }

  const handleChange = (ticketId, value) => {
    setMessageDrafts((current) => ({ ...current, [ticketId]: value }));
  };

  const handleSubmit = async (event, ticketId) => {
    event.preventDefault();
    if (!onReply) {
      return;
    }
    const message = messageDrafts[ticketId];
    if (!message || !message.trim()) {
      return;
    }
    await onReply(ticketId, message.trim());
    setMessageDrafts((current) => ({ ...current, [ticketId]: '' }));
  };

  return (
    <ul className="space-y-6">
      {tickets.map((ticket) => (
        <li key={ticket.id} className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm" data-qa={`instructor-support-${ticket.id}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-primary">{ticket.subject}</h3>
              <p className="text-sm text-slate-600">
                {t('instructor.support.meta', {
                  requester: ticket.requester,
                  updated: ticket.updatedAt ? format.dateTime(ticket.updatedAt) : t('instructor.support.updatedUnknown')
                })}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill tone={priorityTone[ticket.priority] ?? 'neutral'}>{t(`instructor.support.priority.${ticket.priority}`)}</StatusPill>
              <StatusPill tone="info">{t(`instructor.support.status.${ticket.status}`)}</StatusPill>
              {ticket.unreadCount > 0 ? (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {t('instructor.support.unreadCount', { count: ticket.unreadCount })}
                </span>
              ) : null}
            </div>
          </div>
          {ticket.lastMessagePreview ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-600">
              {ticket.lastMessagePreview}
            </div>
          ) : null}
          <form onSubmit={(event) => handleSubmit(event, ticket.id)} className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              {t('instructor.support.replyLabel')}
              <textarea
                name="message"
                rows={3}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none"
                placeholder={t('instructor.support.replyPlaceholder')}
                value={messageDrafts[ticket.id] ?? ''}
                onChange={(event) => handleChange(ticket.id, event.target.value)}
                disabled={replyingId === ticket.id}
              />
            </label>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-slate-400"
                onClick={() => handleChange(ticket.id, '')}
                disabled={replyingId === ticket.id}
              >
                {t('instructor.support.clearDraft')}
              </button>
              <button
                type="submit"
                className="rounded-full border border-primary/20 bg-primary px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90"
                disabled={replyingId === ticket.id}
              >
                {replyingId === ticket.id ? t('instructor.support.sending') : t('instructor.support.sendReply')}
              </button>
            </div>
          </form>
        </li>
      ))}
    </ul>
  );
}

InstructorSupportInbox.propTypes = {
  tickets: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      subject: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      priority: PropTypes.string.isRequired,
      requester: PropTypes.string.isRequired,
      updatedAt: PropTypes.string,
      lastMessagePreview: PropTypes.string,
      unreadCount: PropTypes.number
    })
  ).isRequired,
  onReply: PropTypes.func,
  replyingId: PropTypes.string
};

InstructorSupportInbox.defaultProps = {
  onReply: undefined,
  replyingId: undefined
};
