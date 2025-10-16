import PropTypes from 'prop-types';
import StatusPill from '../../ui/StatusPill.jsx';
import { STATUS_LABELS, STATUS_TONES } from './constants.js';

function SummaryChips({ meta }) {
  const totals = meta?.statusCounts || {};
  const entries = Object.entries(STATUS_LABELS);

  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {entries.map(([status, label]) => (
        <span
          key={status}
          className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-secondary px-3 py-1 font-semibold text-primary/80"
        >
          <StatusPill tone={STATUS_TONES[status] || 'neutral'}>{label}</StatusPill>
          {totals[status] ?? 0}
        </span>
      ))}
    </div>
  );
}

SummaryChips.propTypes = {
  meta: PropTypes.shape({
    statusCounts: PropTypes.object
  })
};

SummaryChips.defaultProps = {
  meta: { statusCounts: {} }
};

export default SummaryChips;
