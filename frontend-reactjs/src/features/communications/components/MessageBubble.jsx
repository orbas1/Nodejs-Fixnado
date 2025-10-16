import { useMemo } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

const toneStyles = {
  self:
    'bg-white text-slate-900 shadow-[0_20px_45px_-24px_rgba(12,74,110,0.55)] border border-sky-100/80 ring-1 ring-sky-50/80',
  assistant:
    'bg-white text-indigo-900 shadow-[0_20px_45px_-24px_rgba(67,56,202,0.55)] border border-indigo-100/70 ring-1 ring-indigo-50/80',
  participant:
    'bg-white text-slate-900 shadow-[0_24px_40px_-32px_rgba(15,23,42,0.45)] border border-slate-100/80'
};

const toneMeta = {
  self: 'text-sky-400',
  assistant: 'text-indigo-400',
  participant: 'text-slate-400'
};

const avatarTone = {
  self: 'border-sky-100 bg-sky-50 text-sky-600',
  assistant: 'border-indigo-100 bg-indigo-50 text-indigo-600',
  participant: 'border-slate-100 bg-slate-50 text-slate-500'
};

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
    'relative max-w-[75%] rounded-2xl px-5 py-4 text-sm leading-relaxed transition-shadow',
    toneStyles[tone]
  );
  const metaTextClasses = clsx(
    'mt-3 flex flex-wrap gap-3 text-[11px] font-semibold uppercase tracking-[0.3em]',
    toneMeta[tone]
  );
  const avatarClasses = clsx(
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold uppercase shadow-sm',
    avatarTone[tone]
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
              {[statusLabel, confidenceLabel]
                .filter(Boolean)
                .map((item) => item.replace(/\s+/g, ' ').trim())
                .join(' • ')}
            </div>
          ) : null}
        </div>
      </div>
      {isSelf ? <span className={avatarClasses} aria-hidden="true">{initials}</span> : null}
    </article>
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

export default MessageBubble;
