import PropTypes from 'prop-types';

export default function ServiceCard({ service }) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center text-xl font-bold">
          {service.icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-primary">{service.name}</h3>
          <p className="text-sm text-slate-500">{service.category}</p>
        </div>
      </div>
      <p className="text-sm text-slate-600 flex-1">{service.description}</p>
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-accent">Starting at {service.price}</span>
        <button className="text-primary font-semibold hover:text-accent">Book now →</button>
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
  }).isRequired
};
