import PropTypes from 'prop-types';
import { STATUS_BADGE_CLASSES, USER_STATUS_LABELS } from '../constants.js';

function StatusChip({ status }) {
  if (!status) return null;
  const className = STATUS_BADGE_CLASSES[status] ?? 'border-slate-200 bg-slate-100 text-slate-600';
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${className}`}
    >
      {USER_STATUS_LABELS[status] ?? status}
    </span>
  );
}

StatusChip.propTypes = {
  status: PropTypes.string
};

StatusChip.defaultProps = {
  status: null
};

export default StatusChip;
