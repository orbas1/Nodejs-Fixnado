import PropTypes from 'prop-types';
import { formatDateTime, formatRelative, toFriendlyLabel } from '../utils.js';

export default function RentalTimeline({ timeline }) {
  if (!timeline?.length) {
    return <p className="text-sm text-slate-500">No timeline checkpoints captured yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {timeline.map((entry) => (
        <li key={entry.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-primary">{entry.description}</p>
              <p className="text-xs text-slate-500 capitalize">{toFriendlyLabel(entry.type)}</p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p>{formatDateTime(entry.occurredAt)}</p>
              <p>{formatRelative(entry.occurredAt) || '—'}</p>
            </div>
          </div>
          {entry.payload && Object.keys(entry.payload).length ? (
            <pre className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              {JSON.stringify(entry.payload, null, 2)}
            </pre>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

RentalTimeline.propTypes = {
  timeline: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
    })
  )
};

RentalTimeline.defaultProps = {
  timeline: []
};
