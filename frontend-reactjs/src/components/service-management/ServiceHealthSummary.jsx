import PropTypes from 'prop-types';

function ServiceHealthSummary({ metrics }) {
  if (!metrics.length) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {metrics.map((metric) => (
        <div key={metric.id} className="rounded-2xl border border-accent/10 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{metric.label}</p>
          <p className="mt-2 text-2xl font-semibold text-primary">{metric.value}</p>
          <p className="mt-1 text-xs text-slate-500">{metric.caption}</p>
        </div>
      ))}
    </div>
  );
}

ServiceHealthSummary.propTypes = {
  metrics: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      caption: PropTypes.string
    })
  )
};

ServiceHealthSummary.defaultProps = {
  metrics: []
};

export default ServiceHealthSummary;
