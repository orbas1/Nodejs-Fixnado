import PropTypes from 'prop-types';

export default function RentalMetricsGrid({ metrics }) {
  if (!Array.isArray(metrics) || metrics.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {metrics.map((metric) => (
        <div
          key={metric.id}
          className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm"
          data-qa={`rental-metric-${metric.id}`}
        >
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{metric.label}</p>
          <p className="mt-2 text-2xl font-semibold text-primary">{metric.value ?? 0}</p>
        </div>
      ))}
    </div>
  );
}

RentalMetricsGrid.propTypes = {
  metrics: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    })
  )
};

RentalMetricsGrid.defaultProps = {
  metrics: []
};

