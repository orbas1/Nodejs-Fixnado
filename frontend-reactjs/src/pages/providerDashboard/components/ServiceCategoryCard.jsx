import PropTypes from 'prop-types';
import { ChartBarIcon, TagIcon } from '@heroicons/react/24/outline';
import { useLocale } from '../../../hooks/useLocale.js';

export default function ServiceCategoryCard({ category }) {
  const { format, t } = useLocale();
  const performanceLabel =
    category.performance != null
      ? format.percentage(category.performance, { maximumFractionDigits: 0 })
      : null;

  return (
    <article className="provider-dashboard__card" data-qa={`provider-dashboard-category-${category.id}`}>
      <div className="space-y-3">
        <p className="provider-dashboard__card-label">{category.type}</p>
        <h3 className="provider-dashboard__card-title text-xl">{category.label}</h3>
        {category.thumbnail ? (
          <img
            src={category.thumbnail}
            alt={category.label}
            loading="lazy"
            className="provider-dashboard__thumbnail"
          />
        ) : null}
        {category.description ? <p className="provider-dashboard__card-meta">{category.description}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--provider-text-secondary)]">
        <span className="inline-flex items-center gap-1">
          <TagIcon className="h-4 w-4 text-[var(--provider-accent)]" aria-hidden="true" />
          {t('providerDashboard.serviceCategoryServices', { count: category.activeServices })}
        </span>
        {performanceLabel ? (
          <span className="inline-flex items-center gap-1 font-semibold text-[var(--provider-text-primary)]">
            <ChartBarIcon className="h-4 w-4 text-[var(--provider-accent)]" aria-hidden="true" />
            {performanceLabel}
          </span>
        ) : null}
      </div>
    </article>
  );
}

ServiceCategoryCard.propTypes = {
  category: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    type: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
    performance: PropTypes.number,
    activeServices: PropTypes.number,
    thumbnail: PropTypes.string
  }).isRequired
};
