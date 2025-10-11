import { useState } from 'react';
import PropTypes from 'prop-types';

function MessageComposer({ onSend, disabled, aiAssistAvailable, defaultAiAssist }) {
  const [message, setMessage] = useState('');
  const [requestAiAssist, setRequestAiAssist] = useState(Boolean(defaultAiAssist));
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

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
    <form onSubmit={handleSubmit} className="border-t border-slate-800/60 bg-slate-900/70 p-4 space-y-3">
      <textarea
        value={message}
        onChange={(event) => {
          setMessage(event.target.value);
          setError(null);
        }}
        placeholder="Type your response…"
        rows={3}
        className="w-full rounded-md bg-slate-950/80 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        disabled={disabled || isSending}
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            className="h-3 w-3 accent-emerald-400"
            checked={requestAiAssist && aiAssistAvailable}
            onChange={() => setRequestAiAssist((current) => !current)}
            disabled={!aiAssistAvailable || disabled || isSending}
          />
          Request AI assist follow-up
        </label>
        <button
          type="submit"
          disabled={disabled || isSending}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSending ? 'Sending…' : 'Send message'}
        </button>
      </div>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </form>
  );
}

MessageComposer.propTypes = {
  onSend: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  aiAssistAvailable: PropTypes.bool,
  defaultAiAssist: PropTypes.bool
};

MessageComposer.defaultProps = {
  disabled: false,
  aiAssistAvailable: false,
  defaultAiAssist: true
};

export default MessageComposer;
