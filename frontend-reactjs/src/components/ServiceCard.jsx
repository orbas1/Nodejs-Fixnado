import PropTypes from 'prop-types';
import clsx from 'clsx';

export default function ServiceCard({ service, compact }) {
  return (
    <div
      className={clsx(
        'flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-lg',
        compact ? 'p-4 text-sm' : 'p-6'
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={clsx(
            'flex items-center justify-center rounded-2xl bg-accent/10 text-accent font-bold',
            compact ? 'h-10 w-10 text-lg' : 'h-12 w-12 text-xl'
          )}
        >
          {service.icon}
        </div>
        <div>
          <h3 className={clsx('font-semibold text-primary', compact ? 'text-base' : 'text-lg')}>{service.name}</h3>
          <p className="text-xs text-slate-500">{service.category}</p>
        </div>
      </div>
      <p className={clsx('flex-1 text-slate-600', compact ? 'text-xs' : 'text-sm')}>{service.description}</p>
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <span className="font-semibold text-accent">Starting at {service.price}</span>
        <button type="button" className="font-semibold text-primary hover:text-accent">
          Book now →
        </button>
      </div>
    </div>
  );
}

ServiceCard.propTypes = {
  service: PropTypes.shape({
    icon: PropTypes.node.isRequired,
    name: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    price: PropTypes.string.isRequired
  }).isRequired,
  compact: PropTypes.bool
};

ServiceCard.defaultProps = {
  compact: false
};
