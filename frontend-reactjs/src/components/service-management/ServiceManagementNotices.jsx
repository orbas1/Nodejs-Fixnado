import PropTypes from 'prop-types';
import Spinner from '../ui/Spinner.jsx';

function ServiceManagementNotices({ alerts, loading, error, feedback }) {
  return (
    <div className="space-y-4">
      {alerts ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          <p className="font-semibold">Marketplace alerts</p>
          <p className="mt-1">
            {alerts.published} published • {alerts.paused} paused • {alerts.draft} in review • {alerts.archived} archived.
          </p>
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          <Spinner size="sm" /> Loading service intelligence…
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
          Failed to load service intelligence. {error.message ?? ''}
        </div>
      ) : null}

      {feedback ? (
        <div
          className={`rounded-3xl border p-4 text-sm ${
            feedback.type === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-600'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}
    </div>
  );
}

ServiceManagementNotices.propTypes = {
  alerts: PropTypes.shape({
    published: PropTypes.number,
    paused: PropTypes.number,
    draft: PropTypes.number,
    archived: PropTypes.number
  }),
  loading: PropTypes.bool,
  error: PropTypes.shape({ message: PropTypes.string }),
  feedback: PropTypes.shape({
    type: PropTypes.oneOf(['error', 'success']).isRequired,
    message: PropTypes.string.isRequired
  })
};

ServiceManagementNotices.defaultProps = {
  alerts: null,
  loading: false,
  error: null,
  feedback: null
};

export default ServiceManagementNotices;
