import PropTypes from 'prop-types';
import { ClockIcon, MapPinIcon, TagIcon } from '@heroicons/react/24/outline';
import { useLocale } from '../../../hooks/useLocale.js';

export default function ServiceCatalogueCard({ service }) {
  const { format, t } = useLocale();
  const priceLabel = service.price != null ? format.currency(service.price, { currency: service.currency || 'GBP' }) : t('common.notAvailable');
  const availabilityLabel = service.availability?.detail
    ? t('providerDashboard.serviceAvailabilityScheduled', { date: format.dateTime(service.availability.detail) })
    : service.availability?.label || t('providerDashboard.serviceAvailabilityDefault');

  return (
    <li className="provider-dashboard__card provider-dashboard__card-muted" data-qa={`provider-dashboard-catalogue-${service.id}`}>
      <header className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <p className="provider-dashboard__card-label">{service.type}</p>
          <h3 className="provider-dashboard__card-title text-xl">{service.name}</h3>
          {service.thumbnail ? (
            <img src={service.thumbnail} alt={service.name} className="provider-dashboard__thumbnail" loading="lazy" />
          ) : null}
        </div>
        <span className="text-sm font-semibold text-[var(--provider-text-primary)]">{priceLabel}</span>
      </header>
      <p className="provider-dashboard__card-meta">{service.description}</p>
      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--provider-text-secondary)]">
        <span className="inline-flex items-center gap-1">
          <TagIcon className="h-4 w-4 text-[var(--provider-accent)]" aria-hidden="true" />
          {service.category}
        </span>
        <span className="inline-flex items-center gap-1">
          <ClockIcon className="h-4 w-4 text-[var(--provider-accent)]" aria-hidden="true" />
          {availabilityLabel}
        </span>
      </div>
      {service.tags?.length ? (
        <div className="provider-dashboard__chip-row">
          {service.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="provider-dashboard__chip">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      {service.coverage?.length ? (
        <div className="flex flex-wrap gap-2 text-xs text-[var(--provider-text-secondary)]">
          {service.coverage.slice(0, 4).map((zone) => (
            <span key={zone} className="inline-flex items-center gap-1 rounded-full border border-[var(--provider-border)] bg-white/10 px-3 py-1">
              <MapPinIcon className="h-4 w-4 text-[var(--provider-accent)]" aria-hidden="true" />
              {zone}
            </span>
          ))}
        </div>
      ) : null}
    </li>
  );
}

ServiceCatalogueCard.propTypes = {
  service: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    type: PropTypes.string,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    category: PropTypes.string,
    price: PropTypes.number,
    currency: PropTypes.string,
    availability: PropTypes.shape({
      detail: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
      label: PropTypes.string
    }),
    tags: PropTypes.arrayOf(PropTypes.string),
    coverage: PropTypes.arrayOf(PropTypes.string)
  }).isRequired
};
