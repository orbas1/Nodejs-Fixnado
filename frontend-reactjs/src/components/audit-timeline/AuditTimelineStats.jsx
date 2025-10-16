import PropTypes from 'prop-types';

const StatList = ({ title, emptyLabel, stats }) => (
  <div className="rounded-2xl border border-accent/10 bg-white/80 p-4 shadow-sm">
    <h3 className="text-sm font-semibold text-primary">{title}</h3>
    <ul className="mt-3 space-y-2 text-sm text-slate-600">
      {stats.length === 0 ? (
        <li>{emptyLabel}</li>
      ) : (
        stats.map((stat) => (
          <li key={stat.key} className="flex items-center justify-between">
            <span>{stat.label}</span>
            <span className="font-semibold text-primary">{stat.count}</span>
          </li>
        ))
      )}
    </ul>
  </div>
);

StatList.propTypes = {
  title: PropTypes.string.isRequired,
  emptyLabel: PropTypes.string.isRequired,
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired
    })
  ).isRequired
};

const AuditTimelineStats = ({ categoryStats, statusStats }) => (
  <div className="grid gap-4 lg:grid-cols-2">
    <StatList title="Categories" emptyLabel="No activity recorded for this window." stats={categoryStats} />
    <StatList title="Statuses" emptyLabel="No audit statuses tracked yet." stats={statusStats} />
  </div>
);

AuditTimelineStats.propTypes = {
  categoryStats: PropTypes.array.isRequired,
  statusStats: PropTypes.array.isRequired
};

export default AuditTimelineStats;
