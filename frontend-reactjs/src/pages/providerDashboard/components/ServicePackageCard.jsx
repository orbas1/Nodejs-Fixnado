import PropTypes from 'prop-types';
import { CheckBadgeIcon } from '@heroicons/react/24/outline';
import { useLocale } from '../../../hooks/useLocale.js';

export default function ServicePackageCard({ pkg }) {
  const { format, t } = useLocale();
  const priceLabel = pkg.price != null ? format.currency(pkg.price, { currency: pkg.currency || 'GBP' }) : t('common.notAvailable');

  return (
    <article className="provider-dashboard__card" data-qa={`provider-dashboard-package-${pkg.id}`}>
      <div className="space-y-3">
        <p className="provider-dashboard__card-label">{t('providerDashboard.servicePackageLabel')}</p>
        <h3 className="provider-dashboard__card-title text-xl">{pkg.name}</h3>
        {pkg.thumbnail ? (
          <img src={pkg.thumbnail} alt={pkg.name} loading="lazy" className="provider-dashboard__thumbnail" />
        ) : null}
        <p className="provider-dashboard__card-meta">{pkg.description}</p>
      </div>
      {pkg.highlights?.length ? (
        <ul className="space-y-2 text-sm text-[var(--provider-text-primary)]">
          {pkg.highlights.map((highlight) => (
            <li key={highlight} className="flex items-start gap-2">
              <CheckBadgeIcon className="mt-1 h-4 w-4" aria-hidden="true" />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="text-sm font-semibold text-[var(--provider-text-primary)]">{priceLabel}</div>
      {pkg.serviceName ? (
        <p className="provider-dashboard__card-label">
          {t('providerDashboard.servicePackageLinkedService', { name: pkg.serviceName })}
        </p>
      ) : null}
    </article>
  );
}

ServicePackageCard.propTypes = {
  pkg: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    price: PropTypes.number,
    currency: PropTypes.string,
    highlights: PropTypes.arrayOf(PropTypes.string),
    serviceName: PropTypes.string
  }).isRequired
};
