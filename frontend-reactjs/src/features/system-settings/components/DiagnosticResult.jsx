import PropTypes from 'prop-types';
import { STATUS_STYLES } from '../utils.js';

function DiagnosticResult({ result }) {
  if (!result) return null;
  const style = STATUS_STYLES[result.status] || STATUS_STYLES.warning;
  const timestamp = result.createdAt instanceof Date && !Number.isNaN(result.createdAt.valueOf())
    ? result.createdAt.toLocaleString()
    : null;

  return (
    <div className={`rounded-xl border px-3 py-2 text-sm shadow-sm ${style}`}>
      <p className="font-medium">{result.message}</p>
      <div className="mt-1 flex flex-wrap gap-2 text-xs">
        <span className="font-semibold uppercase tracking-wide">{result.status}</span>
        {timestamp ? <span>{timestamp}</span> : null}
        {result.performedBy ? <span>by {result.performedBy}</span> : null}
      </div>
    </div>
  );
}

DiagnosticResult.propTypes = {
  result: PropTypes.shape({
    status: PropTypes.string,
    message: PropTypes.string,
    createdAt: PropTypes.instanceOf(Date),
    performedBy: PropTypes.string
  })
};

DiagnosticResult.defaultProps = {
  result: null
};

export default DiagnosticResult;
