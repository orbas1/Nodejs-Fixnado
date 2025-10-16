import PropTypes from 'prop-types';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

function StatusBanner({ status, className = '' }) {
  if (!status) return null;
  const isError = status.type === 'error';
  const Icon = isError ? ExclamationTriangleIcon : CheckCircleIcon;
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
        isError ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      } ${className}`.trim()}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span>{status.message}</span>
    </div>
  );
}

StatusBanner.propTypes = {
  status: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']).isRequired,
    message: PropTypes.string.isRequired
  }),
  className: PropTypes.string
};

export default StatusBanner;
