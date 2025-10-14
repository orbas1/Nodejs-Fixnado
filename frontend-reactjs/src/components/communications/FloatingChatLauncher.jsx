import { useState } from 'react';
import { ChatBubbleOvalLeftEllipsisIcon, XMarkIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';

export default function FloatingChatLauncher({ isAuthenticated = false }) {
  const [open, setOpen] = useState(false);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {open ? (
        <div className="pointer-events-auto w-72 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">Need a hand?</p>
              <p className="mt-1 text-xs text-slate-500">
                Start a new conversation with operations support or jump back into your most recent thread.
              </p>
            </div>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-colors hover:text-primary"
              onClick={() => setOpen(false)}
              aria-label="Close chat preview"
            >
              <XMarkIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-4 space-y-3 text-xs text-slate-500">
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3">
              Dispatch desk · &ldquo;We can patch you into the night shift coverage call at 18:30.&rdquo;
            </p>
            <a
              href="/communications"
              className="flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-transform hover:-translate-y-0.5 hover:bg-primary/90"
            >
              Open inbox
            </a>
          </div>
        </div>
      ) : null}
      <button
        type="button"
        className="pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-xl shadow-primary/40 transition-transform hover:-translate-y-1"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? 'Hide chat launcher' : 'Open chat launcher'}
      >
        <ChatBubbleOvalLeftEllipsisIcon className="h-7 w-7" aria-hidden="true" />
      </button>
    </div>
  );
}

FloatingChatLauncher.propTypes = {
  isAuthenticated: PropTypes.bool
};
