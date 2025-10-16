import PropTypes from 'prop-types';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const toneClasses = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700'
};

function ActionBanner({ message, onDismiss }) {
  if (!message) return null;
  const Icon = message.tone === 'danger' ? ExclamationTriangleIcon : CheckCircleIcon;
  return (
    <div className={`mb-6 flex items-start gap-3 rounded-3xl border px-4 py-3 text-sm ${toneClasses[message.tone] ?? toneClasses.info}`}>
      <Icon className="mt-1 h-5 w-5" aria-hidden="true" />
      <div className="flex-1">
        <p className="font-semibold">{message.title}</p>
        {message.description ? <p className="mt-1 whitespace-pre-line text-xs">{message.description}</p> : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full px-2 py-1 text-xs font-semibold uppercase text-current hover:bg-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          Close
        </button>
      ) : null}
    </div>
  );
}

ActionBanner.propTypes = {
  message: PropTypes.shape({
    tone: PropTypes.oneOf(['success', 'info', 'warning', 'danger']).isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string
  }),
  onDismiss: PropTypes.func
};

ActionBanner.defaultProps = {
  message: null,
  onDismiss: undefined
};

export default ActionBanner;
