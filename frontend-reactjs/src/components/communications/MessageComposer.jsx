import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

function MessageComposer({ onSend, disabled, aiAssistAvailable, defaultAiAssist, prefill, onPrefillConsumed }) {
  const [message, setMessage] = useState('');
  const [requestAiAssist, setRequestAiAssist] = useState(Boolean(defaultAiAssist));
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (prefill) {
      setMessage(prefill);
      setError(null);
      if (textareaRef.current) {
        textareaRef.current.focus({ preventScroll: true });
      }
      if (onPrefillConsumed) {
        onPrefillConsumed();
      }
    }
  }, [prefill, onPrefillConsumed]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    if (!disabled && !isSending && textareaRef.current && document.activeElement !== textareaRef.current) {
      textareaRef.current.focus({ preventScroll: true });
    }
  }, [disabled, isSending]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!message.trim()) {
      setError('Message cannot be empty.');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      await onSend({ body: message.trim(), requestAiAssist: requestAiAssist && aiAssistAvailable });
      setMessage('');
    } catch (sendError) {
      setError(sendError.message || 'Unable to send message.');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm"
    >
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(event) => {
          setMessage(event.target.value);
          setError(null);
        }}
        placeholder="Type your response…"
        rows={3}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
        disabled={disabled || isSending}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-xs text-slate-500">
          <input
            type="checkbox"
            className="h-3 w-3 accent-sky-500"
            checked={requestAiAssist && aiAssistAvailable}
            onChange={() => setRequestAiAssist((current) => !current)}
            disabled={!aiAssistAvailable || disabled || isSending}
          />
          Loop in AI follow-up
        </label>
        <button
          type="submit"
          disabled={disabled || isSending}
          className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-200 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSending ? 'Sending…' : 'Send message'}
        </button>
      </div>
      {error ? (
        <p className="text-xs text-red-500" role="alert" aria-live="assertive">
          {error}
        </p>
      ) : null}
    </form>
  );
}

MessageComposer.propTypes = {
  onSend: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  aiAssistAvailable: PropTypes.bool,
  defaultAiAssist: PropTypes.bool,
  prefill: PropTypes.string,
  onPrefillConsumed: PropTypes.func
};

MessageComposer.defaultProps = {
  disabled: false,
  aiAssistAvailable: false,
  defaultAiAssist: true,
  prefill: '',
  onPrefillConsumed: undefined
};

export default MessageComposer;
