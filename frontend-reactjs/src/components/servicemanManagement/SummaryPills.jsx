import PropTypes from 'prop-types';
import { formatSummaryKey } from './constants.js';

export default function SummaryPills({ summary }) {
  if (!summary || Object.keys(summary).length === 0) {
    return null;
  }

  return (
    <div className="mb-6 flex flex-wrap gap-2 text-xs">
      {Object.entries(summary).map(([key, value]) => (
        <span
          key={key}
          className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-secondary px-3 py-1 font-semibold text-primary/80"
        >
          <span className="h-2 w-2 rounded-full bg-accent" />
          {value} {formatSummaryKey(key)}
        </span>
      ))}
    </div>
  );
}

SummaryPills.propTypes = {
  summary: PropTypes.object
};

SummaryPills.defaultProps = {
  summary: undefined
};
