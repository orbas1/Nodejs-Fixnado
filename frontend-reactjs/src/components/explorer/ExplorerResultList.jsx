import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import StatusPill from '../ui/StatusPill.jsx';
import Button from '../ui/Button.jsx';
import ExplorerSkeleton from './ExplorerSkeleton.jsx';
import './explorer.css';

function formatCurrency(value, currency = 'USD') {
  if (!value) {
    return 'Pricing on request';
  }

  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(Number(value));
  } catch (error) {
    return `${value} ${currency}`;
  }
}

function ServiceCard({ service }) {
  const providerName = service.provider
    ? `${service.provider.firstName ?? ''} ${service.provider.lastName ?? ''}`.trim()
    : service.Company?.contactName;

  return (
    <article className="fx-explorer-card" data-qa="explorer-service">
      <header>
        <StatusPill tone="info">Service</StatusPill>
        <h3>{service.title}</h3>
        {service.category ? <p className="fx-explorer-card__category">{service.category}</p> : null}
      </header>
      <p className="fx-explorer-card__description">{service.description}</p>
      <dl className="fx-explorer-card__meta">
        {providerName ? (
          <div>
            <dt>Lead provider</dt>
            <dd>{providerName}</dd>
          </div>
        ) : null}
        {service.Company?.contactName ? (
          <div>
            <dt>Organisation</dt>
            <dd>{service.Company.contactName}</dd>
          </div>
        ) : null}
        <div>
          <dt>Base price</dt>
          <dd>{formatCurrency(service.price, service.currency)}</dd>
        </div>
      </dl>
      <footer>
        <Button as={Link} to={`/services?highlight=${service.id}`} variant="primary">
          View programme
        </Button>
      </footer>
    </article>
  );
}

ServiceCard.propTypes = {
  service: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    category: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string,
    provider: PropTypes.shape({
      firstName: PropTypes.string,
      lastName: PropTypes.string
    }),
    Company: PropTypes.shape({
      contactName: PropTypes.string
    })
  }).isRequired
};

function MarketplaceCard({ item }) {
  return (
    <article className="fx-explorer-card" data-qa="explorer-marketplace">
      <header>
        <StatusPill tone="success">Marketplace</StatusPill>
        <h3>{item.title}</h3>
        <p className="fx-explorer-card__category">{item.availability === 'buy' ? 'For purchase' : 'Rental ready'}</p>
      </header>
      <p className="fx-explorer-card__description">{item.description}</p>
      <dl className="fx-explorer-card__meta">
        <div>
          <dt>Provider</dt>
          <dd>{item.Company?.contactName ?? 'Fixnado network partner'}</dd>
        </div>
        {item.pricePerDay ? (
          <div>
            <dt>Rental</dt>
            <dd>{formatCurrency(item.pricePerDay, item.currency ?? 'USD')} / day</dd>
          </div>
        ) : null}
        {item.purchasePrice ? (
          <div>
            <dt>Purchase</dt>
            <dd>{formatCurrency(item.purchasePrice, item.currency ?? 'USD')}</dd>
          </div>
        ) : null}
      </dl>
      <footer>
        <Button as={Link} to={`/services?inventory=${item.id}`} variant="secondary">
          Request booking support
        </Button>
      </footer>
    </article>
  );
}

MarketplaceCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    availability: PropTypes.string,
    Company: PropTypes.shape({ contactName: PropTypes.string }),
    pricePerDay: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    purchasePrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string
  }).isRequired
};

export default function ExplorerResultList({ services, items, isLoading, error, onRetry }) {
  if (isLoading) {
    return <ExplorerSkeleton />;
  }

  if (error) {
    return (
      <div className="fx-explorer-error" role="alert">
        <p>{error}</p>
        <Button type="button" onClick={onRetry} variant="secondary">
          Retry search
        </Button>
      </div>
    );
  }

  if (services.length === 0 && items.length === 0) {
    return (
      <div className="fx-explorer-empty" role="status">
        <h3>No matches just yet</h3>
        <p>Adjust your filters or expand to additional zones to surface providers and marketplace inventory.</p>
      </div>
    );
  }

  return (
    <div className="fx-explorer-results">
      {services.length > 0 ? (
        <section aria-label="Service matches">
          <header className="fx-explorer-results__header">
            <h2>Service programmes</h2>
            <p>{services.length} programmes available</p>
          </header>
          <div className="fx-explorer-results__grid">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </section>
      ) : null}

      {items.length > 0 ? (
        <section aria-label="Marketplace inventory">
          <header className="fx-explorer-results__header">
            <h2>Marketplace inventory</h2>
            <p>{items.length} items ready to attach to bookings</p>
          </header>
          <div className="fx-explorer-results__grid">
            {items.map((item) => (
              <MarketplaceCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

ExplorerResultList.propTypes = {
  services: PropTypes.arrayOf(ServiceCard.propTypes.service).isRequired,
  items: PropTypes.arrayOf(MarketplaceCard.propTypes.item).isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func
};

ExplorerResultList.defaultProps = {
  isLoading: false,
  error: undefined,
  onRetry: undefined
};
