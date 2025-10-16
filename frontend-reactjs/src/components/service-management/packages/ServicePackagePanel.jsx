import PropTypes from 'prop-types';
import Button from '../../ui/Button.jsx';

function ServicePackagePanel({ packages, onManage }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {packages.map((pkg) => (
        <div
          key={pkg.id}
          className="rounded-3xl border border-accent/10 bg-gradient-to-br from-white via-slate-50 to-accent/10 p-5 shadow-sm"
        >
          <p className="text-sm font-semibold text-primary">{pkg.name}</p>
          <p className="mt-2 text-xs text-slate-500">{pkg.description}</p>
          <p className="mt-3 text-lg font-semibold text-primary">
            {pkg.currency ?? 'GBP'} {pkg.price != null ? Number(pkg.price).toLocaleString() : '—'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
            {(pkg.highlights ?? []).map((highlight) => (
              <span key={highlight} className="rounded-full bg-white px-2 py-1 text-slate-600 shadow-sm">
                {highlight}
              </span>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onManage?.(pkg)}
              disabled={!onManage}
            >
              Manage listing
            </Button>
          </div>
        </div>
      ))}
      {packages.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
          No service packages published yet. Use the listing form to flag key offerings as packages.
        </div>
      ) : null}
    </div>
  );
}

ServicePackagePanel.propTypes = {
  packages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      currency: PropTypes.string,
      highlights: PropTypes.arrayOf(PropTypes.string)
    })
  ),
  onManage: PropTypes.func
};

ServicePackagePanel.defaultProps = {
  packages: [],
  onManage: undefined
};

export default ServicePackagePanel;
