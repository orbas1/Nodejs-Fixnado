import PropTypes from 'prop-types';
import StatusPill from '../../../components/ui/StatusPill.jsx';

function resolveTone(severity) {
  switch (severity) {
    case 'critical':
      return 'danger';
    case 'high':
    case 'medium':
      return 'warning';
    case 'low':
      return 'info';
    default:
      return 'info';
  }
}

export default function FraudSignalsPanel({ signals }) {
  if (!signals.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-primary">Risk insights</h3>
        <p className="mt-2 text-sm text-slate-600">No active fraud or quality alerts for your campaigns.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-primary">Risk insights</h3>
      <p className="mt-2 text-sm text-slate-600">
        Monitor pacing variance, bot filtering, and creative quality signals across flights.
      </p>
      <ul className="mt-4 space-y-3">
        {signals.map((signal) => {
          const tone = resolveTone(signal.severity);
          const detectedLabel = signal.detectedAt ? new Date(signal.detectedAt).toLocaleString() : 'Unknown';

          return (
            <li key={signal.id} className="flex flex-col gap-1 rounded-2xl border border-slate-100 bg-white/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-primary">{signal.title}</p>
                  <p className="text-xs text-slate-500">Campaign {signal.campaignId}</p>
                </div>
                <StatusPill tone={tone}>{signal.severity}</StatusPill>
              </div>
              <p className="text-xs text-slate-500">Detected {detectedLabel}</p>
              {signal.metadata ? (
                <pre className="overflow-x-auto rounded-2xl bg-slate-900/90 p-3 text-[11px] text-slate-200">
                  {JSON.stringify(signal.metadata, null, 2)}
                </pre>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

FraudSignalsPanel.propTypes = {
  signals: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string,
      severity: PropTypes.string,
      detectedAt: PropTypes.string,
      campaignId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      metadata: PropTypes.object
    })
  )
};

FraudSignalsPanel.defaultProps = {
  signals: []
};
