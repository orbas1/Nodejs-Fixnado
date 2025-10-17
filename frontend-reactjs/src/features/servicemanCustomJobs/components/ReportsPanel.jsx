import PropTypes from 'prop-types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

function formatCurrency(value, currency = 'GBP') {
  if (!Number.isFinite(value)) {
    return '—';
  }
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export default function ReportsPanel({ reports, loading }) {
  if (loading) {
    return (
      <div className="rounded-3xl border border-accent/10 bg-white/95 p-6 shadow-sm">
        <p className="text-sm text-slate-500">Loading performance reports…</p>
      </div>
    );
  }

  if (!reports) {
    return (
      <div className="rounded-3xl border border-accent/10 bg-white/95 p-6 shadow-sm">
        <p className="text-sm text-slate-500">Reports will populate once you begin bidding on custom jobs.</p>
      </div>
    );
  }

  const { totals = {}, value = {}, responseTimes = {}, velocity = [], zones = [], generatedAt } = reports;

  return (
    <div className="space-y-6 rounded-3xl border border-accent/10 bg-white/95 p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-primary">Performance summary</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-accent/10 bg-secondary/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total bids</p>
            <p className="mt-1 text-2xl font-semibold text-primary">{totals.bids ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-accent/10 bg-secondary/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Wins</p>
            <p className="mt-1 text-2xl font-semibold text-primary">{totals.wins ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-accent/10 bg-secondary/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Pending</p>
            <p className="mt-1 text-2xl font-semibold text-primary">{totals.pending ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-accent/10 bg-secondary/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Avg. response</p>
            <p className="mt-1 text-2xl font-semibold text-primary">
              {responseTimes.averageMinutes != null ? `${responseTimes.averageMinutes} mins` : '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-accent/10 bg-secondary/30 p-4">
          <h4 className="text-sm font-semibold text-primary">Velocity (last 8 weeks)</h4>
          <div className="mt-4 h-64">
            {velocity.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={velocity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="submitted" fill="#38bdf8" name="Submitted" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="awarded" fill="#10b981" name="Awarded" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500">We need more bidding activity to display velocity trends.</p>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-accent/10 bg-secondary/30 p-4">
          <h4 className="text-sm font-semibold text-primary">Value</h4>
          <ul className="mt-4 space-y-3 text-sm text-primary">
            <li>
              <span className="font-semibold">Awarded:</span> {formatCurrency(value.awarded, value.currency)}
            </li>
            <li>
              <span className="font-semibold">Pending:</span> {formatCurrency(value.pending, value.currency)}
            </li>
            <li>
              <span className="font-semibold">Response p90:</span>{' '}
              {responseTimes.p90Minutes != null ? `${responseTimes.p90Minutes} mins` : '—'}
            </li>
            <li className="text-xs text-slate-500">Generated {generatedAt ? new Date(generatedAt).toLocaleString() : new Date().toLocaleString()}</li>
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-accent/10 bg-secondary/30 p-4">
        <h4 className="text-sm font-semibold text-primary">Top performing zones</h4>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full divide-y divide-accent/20 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                <th className="px-3 py-2">Zone</th>
                <th className="px-3 py-2">Bids</th>
                <th className="px-3 py-2">Wins</th>
                <th className="px-3 py-2">Pending</th>
                <th className="px-3 py-2">Win rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-accent/20">
              {zones.length ? (
                zones.map((zone) => (
                  <tr key={zone.id} className="text-slate-600">
                    <td className="px-3 py-2 font-semibold text-primary">{zone.name}</td>
                    <td className="px-3 py-2">{zone.bids}</td>
                    <td className="px-3 py-2">{zone.wins}</td>
                    <td className="px-3 py-2">{zone.pending}</td>
                    <td className="px-3 py-2">{zone.winRate}%</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-xs text-slate-500">
                    Win rates by zone will appear once you have bidding history across multiple territories.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

ReportsPanel.propTypes = {
  reports: PropTypes.shape({
    totals: PropTypes.object,
    value: PropTypes.shape({
      awarded: PropTypes.number,
      pending: PropTypes.number,
      currency: PropTypes.string
    }),
    responseTimes: PropTypes.shape({
      averageMinutes: PropTypes.number,
      p90Minutes: PropTypes.number
    }),
    velocity: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        submitted: PropTypes.number,
        awarded: PropTypes.number
      })
    ),
    zones: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        bids: PropTypes.number,
        wins: PropTypes.number,
        pending: PropTypes.number,
        winRate: PropTypes.number
      })
    ),
    generatedAt: PropTypes.string
  }),
  loading: PropTypes.bool
};

ReportsPanel.defaultProps = {
  reports: null,
  loading: false
};
