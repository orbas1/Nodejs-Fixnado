import PropTypes from 'prop-types';

export default function CoverageInsights({ coverage }) {
  const regions = Array.isArray(coverage?.regions) ? coverage.regions : [];
  return (
    <div className="rounded-3xl border border-accent/10 bg-white p-6 shadow-md">
      <h3 className="text-lg font-semibold text-primary">Coverage insights</h3>
      <p className="mt-1 text-sm text-slate-600">Regional staffing health and standby coverage.</p>
      <ul className="mt-4 space-y-3">
        {regions.length > 0 ? (
          regions.map((region) => (
            <li key={region.id} className="rounded-2xl border border-accent/20 bg-secondary px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-primary">{region.label}</p>
                <span className="rounded-full border border-accent/20 bg-white px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-primary/70">
                  {region.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {region.crews} crew • {region.standbyCrews} standby • {region.availableSlots} open slots
              </p>
            </li>
          ))
        ) : (
          <li className="rounded-2xl border border-dashed border-accent/30 bg-secondary px-4 py-4 text-sm text-slate-500">
            Rosters have not been linked to zones yet. Assign primary zones to each crew member to track coverage.
          </li>
        )}
      </ul>
    </div>
  );
}

CoverageInsights.propTypes = {
  coverage: PropTypes.shape({
    regions: PropTypes.array
  })
};

CoverageInsights.defaultProps = {
  coverage: undefined
};
