import PropTypes from 'prop-types';
import { XMarkIcon } from '@heroicons/react/24/outline';

const STYLES = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  error: 'border-rose-200 bg-rose-50 text-rose-700',
  info: 'border-sky-200 bg-sky-50 text-sky-700'
};

export default function FeedbackBanner({ feedback, onDismiss }) {
  if (!feedback) {
    return null;
  }

  const tone = STYLES[feedback.type] ? feedback.type : 'info';

  return (
    <div
      className={`flex items-start justify-between gap-4 rounded-2xl border px-5 py-4 text-sm shadow-sm ${STYLES[tone]}`}
      role="status"
    >
      <div>
        <p className="font-semibold">{feedback.title ?? (tone === 'error' ? 'Something went wrong' : 'Update complete')}</p>
        <p className="mt-1 leading-6">{feedback.message}</p>
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full p-1 text-current transition hover:bg-white/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          aria-label="Dismiss notification"
        >
          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

FeedbackBanner.propTypes = {
  feedback: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error', 'info']).isRequired,
    message: PropTypes.string.isRequired,
    title: PropTypes.string
  }),
  onDismiss: PropTypes.func
};

FeedbackBanner.defaultProps = {
  feedback: null,
  onDismiss: undefined
};
