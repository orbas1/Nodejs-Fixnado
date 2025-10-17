import PropTypes from 'prop-types';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

function AvailabilityTimeline({ availability, loading, error, onRefresh }) {
  const timeline = availability?.timeline ?? [];
  const asset = availability?.asset ?? null;
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <CalendarDaysIcon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-primary">Availability window</h3>
            <p className="text-sm text-slate-500">
              Rolling 14-day hire outlook. Availability factors in deposit holds and active rentals.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Available</th>
              <th className="px-4 py-3 text-left">Reserved</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white/70">
            {timeline.length ? (
              timeline.map((entry) => (
                <tr key={entry.date}>
                  <td className="px-4 py-3 font-medium text-primary">{entry.date}</td>
                  <td className="px-4 py-3">{entry.available}</td>
                  <td className="px-4 py-3">{entry.reserved}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                        entry.status === 'sold_out'
                          ? 'border-rose-200 bg-rose-50 text-rose-600'
                          : entry.status === 'limited'
                            ? 'border-amber-200 bg-amber-50 text-amber-600'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      {entry.status?.replace(/_/g, ' ') || 'available'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-sm text-slate-500" colSpan={4}>
                  {asset ? 'No availability timeline available.' : 'Select a tool to view availability.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

AvailabilityTimeline.propTypes = {
  availability: PropTypes.shape({
    asset: PropTypes.object,
    timeline: PropTypes.arrayOf(
      PropTypes.shape({
        date: PropTypes.string.isRequired,
        available: PropTypes.number,
        reserved: PropTypes.number,
        status: PropTypes.string
      })
    )
  }),
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRefresh: PropTypes.func
};

AvailabilityTimeline.defaultProps = {
  availability: null,
  loading: false,
  error: null,
  onRefresh: () => {}
};

export default AvailabilityTimeline;
