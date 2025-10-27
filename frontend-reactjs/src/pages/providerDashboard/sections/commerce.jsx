import { ArrowUpRightIcon, BuildingStorefrontIcon, ClockIcon, TagIcon, UsersIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import ToolSalesManagement from '../../../modules/providerTools/ToolSalesManagement.jsx';
import { ProviderAdsWorkspace } from '../../../modules/providerAds/index.js';
import { StorefrontStatCard, ServiceCatalogueCard } from '../components/index.js';

export function createCommerceTabs({
  t,
  format,
  storefrontSummary,
  serviceCatalogue,
  toolSales,
  hasAdsWorkspace,
  adsCompanyId,
  adsWorkspace
}) {
  const tabs = [];

  const storefrontSections = [];

  if (storefrontSummary.stats.length) {
    storefrontSections.push(
      <section key="storefront" className="provider-dashboard__section provider-dashboard__section--muted">
        <header className="provider-dashboard__section-header">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-4">
            <div className="flex items-center gap-3">
              <BuildingStorefrontIcon className="h-6 w-6 text-[var(--provider-accent)]" aria-hidden="true" />
              <div>
                <h3 className="provider-dashboard__section-heading">{t('providerDashboard.storefront.heading')}</h3>
                <p className="provider-dashboard__section-description">
                  {t('providerDashboard.storefront.description')}
                </p>
              </div>
            </div>
          </div>
          <div className="provider-dashboard__section-actions">
            <Link
              to="/provider/storefront"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--provider-border)] bg-[var(--provider-accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--provider-text-primary)] transition hover:border-[var(--provider-accent)] hover:text-[var(--provider-text-primary)]"
            >
              {t('providerDashboard.storefront.manageCta')}
              <ArrowUpRightIcon className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </header>
        <div className="provider-dashboard__grid provider-dashboard__grid--wide">
          {storefrontSummary.stats.map((stat) => (
            <StorefrontStatCard key={stat.id} label={stat.label} value={stat.value} caption={stat.caption} />
          ))}
        </div>
      </section>
    );
  }

  if (storefrontSummary.topListing) {
    const listing = storefrontSummary.topListing;
    storefrontSections.push(
      <article key="top-listing" className="provider-dashboard__section provider-dashboard__section--muted">
        <header className="provider-dashboard__section-header">
          <div>
            <p className="provider-dashboard__card-label">
              {t('providerDashboard.storefront.topListingEyebrow')}
            </p>
            <h3 className="provider-dashboard__section-heading">{listing.name}</h3>
            {listing.description ? (
              <p className="provider-dashboard__section-description">{listing.description}</p>
            ) : null}
          </div>
        </header>
        <div className="provider-dashboard__grid">
          <article className="provider-dashboard__card">
            <p className="provider-dashboard__card-label">{t('providerDashboard.storefront.category')}</p>
            <p className="provider-dashboard__card-title text-xl">{listing.category}</p>
            {listing.thumbnail ? (
              <img src={listing.thumbnail} alt={listing.name} className="provider-dashboard__thumbnail" loading="lazy" />
            ) : null}
            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--provider-text-secondary)]">
              {listing.availability?.label ? (
                <span className="inline-flex items-center gap-1">
                  <ClockIcon className="h-4 w-4 text-[var(--provider-accent)]" aria-hidden="true" />
                  {listing.availability.label}
                </span>
              ) : null}
              {listing.availability?.detail ? (
                <span className="inline-flex items-center gap-1">
                  <ClockIcon className="h-4 w-4 text-[var(--provider-accent)]" aria-hidden="true" />
                  {t('providerDashboard.serviceAvailabilityScheduled', {
                    date: format.dateTime(listing.availability.detail)
                  })}
                </span>
              ) : null}
            </div>
            <div className="text-sm font-semibold text-[var(--provider-text-primary)]">
              {listing.price != null
                ? format.currency(listing.price, { currency: listing.currency || 'GBP' })
                : t('common.notAvailable')}
            </div>
            {listing.coverage?.length ? (
              <div className="provider-dashboard__chip-row">
                {listing.coverage.slice(0, 4).map((zone) => (
                  <span key={zone} className="provider-dashboard__chip">
                    {zone}
                  </span>
                ))}
              </div>
            ) : null}
          </article>
          {listing.highlights?.length ? (
            <article className="provider-dashboard__card provider-dashboard__card-muted">
              <p className="provider-dashboard__card-label">{t('providerDashboard.storefront.highlights')}</p>
              <ul className="space-y-2 text-sm text-[var(--provider-text-primary)]">
                {listing.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-2">
                    <TagIcon className="mt-1 h-4 w-4 text-[var(--provider-accent)]" aria-hidden="true" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </article>
          ) : null}
        </div>
      </article>
    );
  }

  if (serviceCatalogue.length) {
    storefrontSections.push(
      <section key="catalogue" className="provider-dashboard__section provider-dashboard__section--muted">
        <header className="provider-dashboard__section-header">
          <div className="flex items-center gap-3">
            <UsersIcon className="h-6 w-6 text-[var(--provider-accent)]" aria-hidden="true" />
            <h3 className="provider-dashboard__section-heading">{t('providerDashboard.serviceCatalogueHeadline')}</h3>
          </div>
        </header>
        <ul className="provider-dashboard__grid provider-dashboard__grid--wide">
          {serviceCatalogue.map((service) => (
            <ServiceCatalogueCard key={service.id} service={service} />
          ))}
        </ul>
      </section>
    );
  }

  if (storefrontSections.length) {
    tabs.push({
      id: 'provider-dashboard-commerce-storefront',
      label: t('providerDashboard.tabs.commerceStorefront'),
      content: storefrontSections
    });
  }

  const growthSections = [];

  if (toolSales) {
    growthSections.push(
      <section key="tool-sales" className="provider-dashboard__section provider-dashboard__section--muted">
        <ToolSalesManagement initialData={toolSales} />
      </section>
    );
  }

  if (hasAdsWorkspace) {
    growthSections.push(
      <section key="ads" className="provider-dashboard__section provider-dashboard__section--muted">
        <header className="provider-dashboard__section-header">
          <div>
            <h3 className="provider-dashboard__section-heading">{t('providerDashboard.adsHeadline')}</h3>
            <p className="provider-dashboard__section-description">
              {t('providerDashboard.adsDescription')}
            </p>
          </div>
        </header>
        <ProviderAdsWorkspace companyId={adsCompanyId} initialData={adsWorkspace} />
      </section>
    );
  }

  if (growthSections.length) {
    tabs.push({
      id: 'provider-dashboard-commerce-growth',
      label: t('providerDashboard.tabs.commerceGrowth'),
      content: growthSections
    });
  }

  return tabs;
}
