import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useParams } from 'react-router-dom';
import { getBusinessFront, PanelApiError } from '../api/panelClient.js';
import Skeleton from '../components/ui/Skeleton.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import {
  ArrowPathIcon,
  BuildingStorefrontIcon,
  CheckBadgeIcon,
  EnvelopeIcon,
  LockClosedIcon,
  MapPinIcon,
  PhoneArrowDownLeftIcon,
  PlayIcon,
  SparklesIcon,
  StarIcon,
  TagIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { useLocale } from '../hooks/useLocale.js';

function StatCard({ stat }) {
  const { format, t } = useLocale();
  const value = useMemo(() => {
    if (stat.format === 'percent') return format.percentage(stat.value ?? 0);
    if (stat.format === 'minutes')
      return t('businessFront.statMinutes', {
        value: format.number(Math.round(stat.value ?? 0))
      });
    if (stat.format === 'currency') return format.currency(stat.value ?? 0);
    return format.number(stat.value ?? 0);
  }, [format, stat, t]);

  return (
    <li className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm" data-qa={`business-front-stat-${stat.id}`}>
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{stat.label}</p>
      <p className="mt-2 text-2xl font-semibold text-primary">{value}</p>
      {stat.caption ? <p className="mt-2 text-xs text-slate-500">{stat.caption}</p> : null}
    </li>
  );
}

StatCard.propTypes = {
  stat: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    format: PropTypes.string,
    caption: PropTypes.string
  }).isRequired
};

function PackageCard({ pkg }) {
  const { t, format } = useLocale();

  return (
    <article
      className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm"
      data-qa={`business-front-package-${pkg.id}`}
    >
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t('businessFront.servicePackageLabel')}</p>
        <h3 className="mt-2 text-lg font-semibold text-primary">{pkg.name}</h3>
        <p className="mt-2 text-sm text-slate-600">{pkg.description}</p>
      </div>
      <ul className="mt-4 space-y-2 text-sm text-primary">
        {pkg.highlights.map((highlight) => (
          <li key={highlight} className="flex items-start gap-2">
            <CheckBadgeIcon className="mt-1 h-4 w-4" aria-hidden="true" />
            <span>{highlight}</span>
          </li>
        ))}
      </ul>
      {pkg.price != null ? (
        <p className="mt-6 text-sm font-semibold text-primary/90">
          {t('businessFront.packagesStarting', {
            price: format.currency(pkg.price),
            currency: pkg.currency || 'GBP'
          })}
        </p>
      ) : null}
    </article>
  );
}

PackageCard.propTypes = {
  pkg: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    highlights: PropTypes.arrayOf(PropTypes.string).isRequired,
    price: PropTypes.number,
    currency: PropTypes.string
  }).isRequired
};

function TestimonialCard({ testimonial }) {
  return (
    <blockquote
      className="flex h-full flex-col justify-between rounded-3xl border border-primary/20 bg-primary/5 p-6 shadow-sm"
      data-qa={`business-front-testimonial-${testimonial.id}`}
    >
      <p className="text-sm text-primary">“{testimonial.quote}”</p>
      <footer className="mt-4 text-xs uppercase tracking-[0.3em] text-primary/70">
        {testimonial.client}
        {testimonial.role ? <span className="block text-[0.65rem] text-primary/50 normal-case">{testimonial.role}</span> : null}
      </footer>
    </blockquote>
  );
}

TestimonialCard.propTypes = {
  testimonial: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    quote: PropTypes.string.isRequired,
    client: PropTypes.string.isRequired,
    role: PropTypes.string
  }).isRequired
};

function Chip({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600">
      {Icon ? <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

Chip.propTypes = {
  icon: PropTypes.elementType,
  children: PropTypes.node.isRequired
};

Chip.defaultProps = {
  icon: null
};

function ServiceCatalogueCard({ service }) {
  const { t, format } = useLocale();
  const availability = service.availability || {};

  let availabilityLabel = t('businessFront.serviceAvailabilityNow');
  if (availability.status === 'scheduled' && availability.detail) {
    availabilityLabel = t('businessFront.serviceAvailabilityNext', {
      date: format.dateTime(availability.detail)
    });
  } else if (availability.status && availability.status !== 'open') {
    availabilityLabel = availability.label || t('businessFront.serviceAvailabilityUnknown');
  }

  const priceLabel =
    service.price != null
      ? format.currency(service.price, { currency: service.currency || 'GBP' })
      : t('common.notAvailable');

  return (
    <article
      className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm"
      data-qa={`business-front-catalogue-${service.id}`}
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary/60">{service.type}</p>
          <h3 className="mt-1 text-lg font-semibold text-primary">{service.name}</h3>
          <p className="mt-1 text-xs uppercase tracking-[0.3em] text-slate-400">{service.category}</p>
        </div>
        <SparklesIcon className="h-5 w-5 text-primary" aria-hidden="true" />
      </header>
      <p className="flex-1 text-sm text-slate-600">{service.description}</p>
      <div className="space-y-2 text-sm">
        <p className="font-semibold text-primary">{priceLabel}</p>
        <p className="text-xs text-slate-500">{availabilityLabel}</p>
        {service.provider ? (
          <p className="text-xs text-slate-500">{t('businessFront.catalogueProvider', { provider: service.provider })}</p>
        ) : null}
      </div>
      {service.tags?.length ? (
        <div className="flex flex-wrap gap-2">
          {service.tags.slice(0, 4).map((tag) => (
            <Chip key={tag} icon={TagIcon}>
              {tag}
            </Chip>
          ))}
        </div>
      ) : null}
      {service.coverage?.length ? (
        <div className="flex flex-wrap gap-2">
          {service.coverage.slice(0, 4).map((zone) => (
            <Chip key={zone} icon={MapPinIcon}>
              {zone}
            </Chip>
          ))}
        </div>
      ) : null}
    </article>
  );
}

ServiceCatalogueCard.propTypes = {
  service: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    category: PropTypes.string,
    type: PropTypes.string,
    price: PropTypes.number,
    currency: PropTypes.string,
    availability: PropTypes.shape({
      status: PropTypes.string,
      label: PropTypes.string,
      detail: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)])
    }),
    tags: PropTypes.arrayOf(PropTypes.string),
    coverage: PropTypes.arrayOf(PropTypes.string),
    provider: PropTypes.string
  }).isRequired
};

function DealCard({ deal }) {
  const { t, format } = useLocale();
  const savings = deal.savings != null ? format.currency(deal.savings, { currency: deal.currency || 'GBP' }) : null;
  const validUntil = deal.validUntil ? format.date(deal.validUntil) : null;

  return (
    <article className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm" data-qa={`business-front-deal-${deal.id}`}>
      <div className="space-y-3">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary/60">{t('businessFront.dealsLabel')}</p>
            <h3 className="mt-1 text-lg font-semibold text-primary">{deal.title}</h3>
          </div>
          <TagIcon className="h-5 w-5 text-primary" aria-hidden="true" />
        </header>
        <p className="text-sm text-slate-600">{deal.description}</p>
        {deal.tags?.length ? (
          <div className="flex flex-wrap gap-2">
            {deal.tags.slice(0, 3).map((tag) => (
              <Chip key={tag} icon={SparklesIcon}>
                {tag}
              </Chip>
            ))}
          </div>
        ) : null}
      </div>
      <div className="mt-4 space-y-1 text-sm">
        {savings ? <p className="font-semibold text-primary">{t('businessFront.dealSavings', { savings })}</p> : null}
        {validUntil ? <p className="text-xs text-slate-500">{t('businessFront.dealValidUntil', { date: validUntil })}</p> : null}
      </div>
    </article>
  );
}

DealCard.propTypes = {
  deal: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    savings: PropTypes.number,
    currency: PropTypes.string,
    validUntil: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    tags: PropTypes.arrayOf(PropTypes.string)
  }).isRequired
};

function ReviewCard({ review, highlighted }) {
  const { format, t } = useLocale();
  const submittedLabel = review.submittedAt ? format.date(review.submittedAt) : null;
  const responseLabel = Number.isFinite(review.responseTimeMinutes)
    ? t('businessFront.reviewResponseTime', { minutes: format.number(Math.max(review.responseTimeMinutes, 1)) })
    : null;

  return (
    <article
      className={`flex h-full flex-col gap-4 rounded-3xl border bg-white/90 p-6 shadow-sm transition focus-within:ring-2 focus-within:ring-primary/40 ${
        highlighted ? 'border-primary/40 shadow-primary/10 ring-1 ring-primary/30' : 'border-slate-200'
      }`}
      data-qa={`business-front-review-${review.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-primary">
          <StarIcon className="h-5 w-5" aria-hidden="true" />
          <span className="text-base font-semibold">
            {Number.isFinite(review.rating) ? review.rating.toFixed(1) : t('businessFront.reviewNoScore')}
          </span>
        </div>
        {review.verified ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-primary">
            <CheckBadgeIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {t('businessFront.reviewVerified')}
          </span>
        ) : null}
      </div>
      {submittedLabel ? (
        <p className="text-xs uppercase tracking-[0.3em] text-primary/50">
          {t('businessFront.reviewSubmittedOn', { date: submittedLabel })}
        </p>
      ) : null}
      <p className="flex-1 text-sm leading-relaxed text-slate-600">“{review.comment}”</p>
      {review.response ? (
        <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-xs leading-relaxed text-primary/80">
          <p className="font-semibold uppercase tracking-[0.3em] text-primary/70">
            {t('businessFront.reviewProviderResponse')}
          </p>
          <p className="mt-2 text-[0.85rem] text-primary/80">{review.response}</p>
          {responseLabel ? (
            <p className="mt-3 text-[0.65rem] uppercase tracking-[0.3em] text-primary/50">{responseLabel}</p>
          ) : null}
        </div>
      ) : null}
      <footer className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-primary/60">{review.reviewer}</p>
        <div className="flex flex-wrap gap-2 text-xs text-primary/60">
          {review.job ? <Chip icon={SparklesIcon}>{review.job}</Chip> : null}
        </div>
      </footer>
    </article>
  );
}

ReviewCard.propTypes = {
  review: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    reviewer: PropTypes.string.isRequired,
    rating: PropTypes.number,
    comment: PropTypes.string.isRequired,
    job: PropTypes.string,
    submittedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    verified: PropTypes.bool,
    response: PropTypes.string,
    responseTimeMinutes: PropTypes.number
  }).isRequired,
  highlighted: PropTypes.bool
};

ReviewCard.defaultProps = {
  highlighted: false
};

function ServicemanCard({ member }) {
  return (
    <article className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-6" data-qa={`business-front-serviceman-${member.id}`}>
      <div className="flex items-center gap-3">
        {member.avatar ? (
          <img src={member.avatar} alt={member.name} className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">{member.name.slice(0, 2)}</div>
        )}
        <div>
          <h3 className="text-sm font-semibold text-primary">{member.name}</h3>
          <p className="text-xs text-slate-500">{member.availability}</p>
        </div>
      </div>
      {member.trades?.length ? (
        <div className="flex flex-wrap gap-2">
          {member.trades.map((trade) => (
            <Chip key={trade} icon={UserGroupIcon}>
              {trade}
            </Chip>
          ))}
        </div>
      ) : null}
    </article>
  );
}

ServicemanCard.propTypes = {
  member: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    trades: PropTypes.arrayOf(PropTypes.string),
    availability: PropTypes.string,
    avatar: PropTypes.string
  }).isRequired
};

function InventoryCard({ item, variant }) {
  const { t, format } = useLocale();
  const quantityLabel = Number.isFinite(item.quantityOnHand)
    ? format.number(item.quantityOnHand)
    : item.quantityOnHand ?? 0;
  const rentalLabel =
    item.rentalRate != null
      ? format.currency(item.rentalRate, { currency: item.rentalRateCurrency || 'GBP', maximumFractionDigits: 0 })
      : null;
  return (
    <article className="flex h-full flex-col gap-3 rounded-3xl border border-slate-200 bg-white/85 p-6" data-qa={`business-front-inventory-${variant}-${item.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-primary">{item.name}</h3>
          {item.category ? <p className="text-xs text-slate-500">{item.category}</p> : null}
        </div>
        {item.image ? (
          <img src={item.image} alt={item.name} className="h-12 w-12 rounded-lg object-cover" />
        ) : (
          <WrenchScrewdriverIcon className="h-5 w-5 text-primary" aria-hidden="true" />
        )}
      </div>
      {variant === 'materials' ? (
        <p className="text-xs text-slate-500">{t('businessFront.materialQuantity', { quantity: quantityLabel, unit: item.unitType || 'units' })}</p>
      ) : null}
      {variant === 'tools' && rentalLabel ? (
        <p className="text-xs text-slate-500">{t('businessFront.toolRentalRate', { amount: rentalLabel })}</p>
      ) : null}
      {item.sku ? <p className="text-xs text-slate-400">SKU: {item.sku}</p> : null}
    </article>
  );
}

InventoryCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    category: PropTypes.string,
    quantityOnHand: PropTypes.number,
    unitType: PropTypes.string,
    sku: PropTypes.string,
    image: PropTypes.string,
    rentalRate: PropTypes.number,
    rentalRateCurrency: PropTypes.string
  }).isRequired,
  variant: PropTypes.oneOf(['materials', 'tools']).isRequired
};

function ReviewSummaryPanel({ summary, reviews }) {
  const { format, t } = useLocale();
  const highlighted = reviews.find((review) => review.id === summary.highlightedReviewId) || reviews[0];
  const lastReviewLabel = summary.lastReviewAt ? format.date(summary.lastReviewAt) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-3" data-qa="business-front-review-summary">
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-white to-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-primary/70">{t('businessFront.reviewsOverall')}</p>
        <div className="mt-4 flex items-end gap-3">
          <span className="text-4xl font-semibold text-primary">
            {Number.isFinite(summary.averageRating) ? summary.averageRating.toFixed(2) : '—'}
          </span>
          <span className="text-sm text-primary/70">
            {t('businessFront.reviewsAverage', { total: format.number(summary.totalReviews ?? 0) })}
          </span>
        </div>
        <dl className="mt-6 space-y-3 text-sm text-primary/70">
          <div className="flex items-center justify-between">
            <dt className="uppercase tracking-[0.3em] text-[0.65rem]">{t('businessFront.reviewsVerifiedShare')}</dt>
            <dd className="font-semibold text-primary">{format.percentage(summary.verifiedShare ?? 0)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="uppercase tracking-[0.3em] text-[0.65rem]">{t('businessFront.reviewsResponseRate')}</dt>
            <dd className="font-semibold text-primary">{format.percentage(summary.responseRate ?? 0)}</dd>
          </div>
        </dl>
        {lastReviewLabel ? (
          <p className="mt-6 text-xs uppercase tracking-[0.3em] text-primary/50">
            {t('businessFront.reviewsLastUpdated', { date: lastReviewLabel })}
          </p>
        ) : null}
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-primary/60">{t('businessFront.reviewsDistribution')}</p>
        <ul className="mt-5 space-y-4">
          {[...summary.ratingBuckets]
            .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
            .map((bucket) => {
            const share = summary.totalReviews ? bucket.count / summary.totalReviews : 0;
            const widthPercent = Math.max(share * 100, bucket.count > 0 ? 6 : 0);
            return (
              <li key={bucket.score}>
                <div className="flex items-center justify-between text-sm text-primary">
                  <span className="font-medium">{t('businessFront.reviewScoreLabel', { score: bucket.score })}</span>
                  <span>{format.percentage(share)}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-primary/60 transition-all"
                    style={{ width: `${widthPercent}%` }}
                    aria-hidden="true"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      {highlighted ? (
        <div className="rounded-3xl border border-primary/15 bg-primary/5 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-primary/70">{t('businessFront.reviewsHighlight')}</p>
          <p className="mt-4 text-sm leading-relaxed text-primary/80">“{summary.excerpt || highlighted.comment}”</p>
          <div className="mt-5 space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-primary/60">{highlighted.reviewer}</p>
            <div className="flex flex-wrap gap-2 text-xs text-primary/60">
              {highlighted.job ? <Chip icon={SparklesIcon}>{highlighted.job}</Chip> : null}
              <Chip icon={StarIcon}>{Number.isFinite(highlighted.rating) ? highlighted.rating.toFixed(1) : '—'}</Chip>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

ReviewSummaryPanel.propTypes = {
  summary: PropTypes.shape({
    averageRating: PropTypes.number,
    totalReviews: PropTypes.number,
    verifiedShare: PropTypes.number,
    responseRate: PropTypes.number,
    ratingBuckets: PropTypes.arrayOf(
      PropTypes.shape({
        score: PropTypes.number,
        count: PropTypes.number
      })
    ).isRequired,
    lastReviewAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    highlightedReviewId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    excerpt: PropTypes.string
  }).isRequired,
  reviews: PropTypes.arrayOf(ReviewCard.propTypes.review).isRequired
};

function ZoneBadge({ zone }) {
  return (
    <li className="rounded-3xl border border-slate-200 bg-white/80 p-4" data-qa={`business-front-zone-${zone.id ?? zone.name}`}>
      <p className="text-sm font-semibold text-primary">{zone.name}</p>
      <p className="text-xs text-slate-500 capitalize">{zone.demandLevel || 'balanced'}</p>
    </li>
  );
}

ZoneBadge.propTypes = {
  zone: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string.isRequired,
    demandLevel: PropTypes.string
  }).isRequired
};

export default function BusinessFront() {
  const { slug } = useParams();
  const { t, format } = useLocale();
  const [state, setState] = useState({ loading: true, data: null, meta: null, error: null });

  const loadFront = useCallback(async ({ forceRefresh = false, signal } = {}) => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const result = await getBusinessFront(slug, { forceRefresh, signal });
      setState({ loading: false, data: result.data, meta: result.meta, error: result.meta?.error || null });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error instanceof PanelApiError ? error : new PanelApiError('Unable to load business front', 500, { cause: error })
      }));
    }
  }, [slug]);

  useEffect(() => {
    const controller = new AbortController();
    loadFront({ signal: controller.signal });
    return () => controller.abort();
  }, [loadFront]);

  const hero = state.data?.hero;
  const packages = state.data?.packages ?? [];
  const testimonials = state.data?.testimonials ?? [];
  const certifications = state.data?.certifications ?? [];
  const gallery = state.data?.gallery ?? [];
  const support = state.data?.support ?? {};
  const stats = state.data?.stats ?? [];
  const serviceCatalogue = state.data?.serviceCatalogue ?? [];
  const deals = state.data?.deals ?? [];
  const previousJobs = state.data?.previousJobs ?? [];
  const reviews = state.data?.reviews ?? [];
  const reviewSummary = state.data?.reviewSummary ?? null;
  const materials = state.data?.materials ?? [];
  const tools = state.data?.tools ?? [];
  const servicemen = state.data?.servicemen ?? [];
  const serviceZones = state.data?.serviceZones ?? [];
  const reviewAccess = state.meta?.reviewAccess ?? {};
  const canViewReviews = reviewAccess.granted !== false;
  const conciergeHeading = hero?.name
    ? t('businessFront.supportHeadline', { name: hero.name })
    : t('businessFront.supportFallbackHeadline');
  const heroName = hero?.name ?? t('businessFront.heroFeatured');
  const heroStrapline = hero?.strapline ?? t('businessFront.heroStraplineFallback');
  const heroTags = hero?.tags ?? [];
  const heroCategories = hero?.categories ?? [];
  const showcaseCarousel = hero?.media?.carousel ?? [];
  const showcaseVideo = hero?.media?.showcaseVideo;
  const hasShowcase = Boolean(showcaseVideo || showcaseCarousel.length > 0 || gallery.length > 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-24" data-qa="business-front">
      <header className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-primary/10 via-white to-white">
        {hero?.media?.bannerImage ? (
          <img
            src={hero.media.bannerImage}
            alt={heroName}
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
        ) : hero?.media?.heroImage ? (
          <img
            src={hero.media.heroImage}
            alt={heroName}
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
        ) : null}
        <div className="relative mx-auto max-w-6xl space-y-10 px-6 py-16">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                {hero?.media?.brandImage ? (
                  <img
                    src={hero.media.brandImage}
                    alt={`${heroName} brand`}
                    className="h-16 w-16 rounded-2xl border border-white/40 object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-xl font-semibold text-primary">
                    {heroName.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-primary/80">{t('businessFront.heroFeatured')}</p>
                  <h1 className="text-4xl font-semibold text-primary" data-qa="business-front-name">
                    {heroName}
                  </h1>
                </div>
                {hero?.media?.profileImage ? (
                  <img
                    src={hero.media.profileImage}
                    alt={`${heroName} profile`}
                    className="h-16 w-16 rounded-full border border-white/40 object-cover shadow-sm"
                  />
                ) : null}
              </div>
              {hero?.tagline ? (
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-primary/60">{t('businessFront.heroTaglineLabel')}</p>
                  <p className="mt-1 text-lg text-primary/80">{hero.tagline}</p>
                </div>
              ) : null}
              <p className="text-sm text-slate-600" data-qa="business-front-strapline">
                {heroStrapline}
              </p>
              {hero?.bio ? (
                <p className="text-sm text-slate-500">{hero.bio}</p>
              ) : null}
              {heroCategories.length ? (
                <div className="flex flex-wrap gap-2">
                  {heroCategories.map((category) => (
                    <Chip key={category} icon={SparklesIcon}>
                      {category}
                    </Chip>
                  ))}
                </div>
              ) : null}
              {heroTags.length ? (
                <div className="flex flex-wrap gap-2">
                  {heroTags.map((tag) => (
                    <Chip key={tag} icon={TagIcon}>
                      {tag}
                    </Chip>
                  ))}
                </div>
              ) : null}
              {hero?.locations?.length ? (
                <div className="flex flex-wrap gap-2">
                  {hero.locations.map((location) => (
                    <Chip key={location} icon={MapPinIcon}>
                      {location}
                    </Chip>
                  ))}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
                >
                  {t('businessFront.bookProgramme')}
                </Link>
                <Link
                  to="/communications"
                  className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white/80 px-6 py-2 text-sm font-semibold text-primary shadow-sm transition hover:border-primary/50"
                >
                  {t('businessFront.chatOperations')}
                </Link>
              </div>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:w-1/2" aria-label={t('businessFront.metricsAria')}>
              {state.loading
                ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-3xl" />)
                : stats.map((stat) => <StatCard key={stat.id} stat={stat} />)}
            </ul>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12 space-y-12">
        <div className="flex justify-end">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-primary shadow-sm transition hover:border-primary/40"
            onClick={() => loadFront({ forceRefresh: true })}
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" /> {t('businessFront.refresh')}
          </button>
        </div>

        {!state.loading && state.error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5" role="alert">
            <p className="text-sm font-semibold text-rose-600">{t('businessFront.errorSummary')}</p>
            <p className="mt-1 text-xs text-rose-500">
              {state.error.message}
              {state.meta?.fallback ? ` — ${t('businessFront.errorFallbackHint')}` : ''}
            </p>
          </div>
        ) : null}

        {hasShowcase ? (
          <section aria-labelledby="business-front-showcase" className="space-y-5">
            <header className="flex items-center gap-3">
              <PlayIcon className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 id="business-front-showcase" className="text-lg font-semibold text-primary">
                {t('businessFront.showcaseHeadline')}
              </h2>
            </header>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-black/80 shadow-sm">
                {showcaseVideo ? (
                  <video src={showcaseVideo} controls className="h-full w-full" poster={hero?.media?.heroImage}>
                    {t('businessFront.showcaseVideoFallback')}
                  </video>
                ) : hero?.media?.heroImage ? (
                  <img src={hero.media.heroImage} alt={heroName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-48 items-center justify-center text-sm text-white/80">
                    {t('businessFront.showcasePlaceholder')}
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {showcaseCarousel.length ? (
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {showcaseCarousel.map((item) => (
                      <article key={item.id} className="min-w-[200px] rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="h-28 w-full rounded-2xl object-cover" />
                        ) : null}
                        <h3 className="mt-3 text-sm font-semibold text-primary">{item.title}</h3>
                        {item.description ? <p className="text-xs text-slate-500">{item.description}</p> : null}
                      </article>
                    ))}
                  </div>
                ) : null}
                {gallery.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {gallery.slice(0, 2).map((item) => (
                      <article key={item.id} className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                        <h3 className="text-sm font-semibold text-primary">{item.title}</h3>
                        {item.description ? <p className="mt-1 text-xs text-slate-500">{item.description}</p> : null}
                      </article>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        <section aria-labelledby="business-front-catalogue" className="space-y-5">
          <header>
            <h2 id="business-front-catalogue" className="text-lg font-semibold text-primary">
              {t('businessFront.catalogueHeadline')}
            </h2>
            <p className="text-sm text-slate-600">{t('businessFront.catalogueDescription')}</p>
          </header>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {serviceCatalogue.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                {t('businessFront.catalogueEmpty')}
              </p>
            ) : (
              serviceCatalogue.map((service) => <ServiceCatalogueCard key={service.id} service={service} />)
            )}
          </div>
        </section>

        <section aria-labelledby="business-front-deals" className="space-y-5">
          <header>
            <h2 id="business-front-deals" className="text-lg font-semibold text-primary">
              {t('businessFront.dealsHeadline')}
            </h2>
            <p className="text-sm text-slate-600">{t('businessFront.dealsDescription')}</p>
          </header>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {deals.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                {t('businessFront.dealsEmpty')}
              </p>
            ) : (
              deals.map((deal) => <DealCard key={deal.id} deal={deal} />)
            )}
          </div>
        </section>

        <section aria-labelledby="business-front-packages" className="space-y-5">
          <header>
            <h2 id="business-front-packages" className="text-lg font-semibold text-primary">
              {t('businessFront.packagesHeadline')}
            </h2>
            <p className="text-sm text-slate-600">{t('businessFront.packagesDescription')}</p>
          </header>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {packages.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                {t('businessFront.packagesEmpty')}
              </p>
            ) : (
              packages.map((pkg) => <PackageCard key={pkg.id} pkg={pkg} />)
            )}
          </div>
        </section>

        <section aria-labelledby="business-front-previous-jobs" className="space-y-5">
          <header>
            <h2 id="business-front-previous-jobs" className="text-lg font-semibold text-primary">
              {t('businessFront.previousJobsHeadline')}
            </h2>
            <p className="text-sm text-slate-600">{t('businessFront.previousJobsDescription')}</p>
          </header>
          <div className="grid gap-6 md:grid-cols-2">
            {previousJobs.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                {t('businessFront.previousJobsEmpty')}
              </p>
            ) : (
              previousJobs.map((job) => (
                <article key={job.id} className="flex h-full flex-col gap-3 rounded-3xl border border-slate-200 bg-white/90 p-6" data-qa={`business-front-job-${job.id}`}>
                  {job.image ? <img src={job.image} alt={job.title} className="h-40 w-full rounded-2xl object-cover" /> : null}
                  <h3 className="text-sm font-semibold text-primary">{job.title}</h3>
                  <p className="text-xs text-slate-500">{job.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    {job.zone ? <Chip icon={MapPinIcon}>{job.zone}</Chip> : null}
                    {job.completedOn ? <Chip>{format.date(job.completedOn)}</Chip> : null}
                    {job.value ? (
                      <Chip>{t('businessFront.previousJobValue', { amount: format.currency(job.value, { currency: job.currency || 'GBP' }) })}</Chip>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section aria-labelledby="business-front-reviews" className="space-y-5">
          <header>
            <h2 id="business-front-reviews" className="text-lg font-semibold text-primary">
              {t('businessFront.reviewsHeadline')}
            </h2>
            <p className="text-sm text-slate-600">{t('businessFront.reviewsDescription')}</p>
          </header>
          {canViewReviews ? (
            <>
              {reviewSummary && reviews.length ? (
                <ReviewSummaryPanel summary={reviewSummary} reviews={reviews} />
              ) : null}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {reviews.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                    {t('businessFront.reviewsEmpty')}
                  </p>
                ) : (
                  reviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      highlighted={reviewSummary?.highlightedReviewId === review.id}
                    />
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-3 rounded-3xl border border-primary/30 bg-white/80 p-6 text-sm text-primary/70">
              <div className="flex items-center gap-3">
                <LockClosedIcon className="h-5 w-5 text-primary" aria-hidden="true" />
                <p className="font-semibold text-primary">
                  {reviewAccess.reason || t('businessFront.reviewsAccessRestricted')}
                </p>
              </div>
              {Array.isArray(reviewAccess.allowedRoles) && reviewAccess.allowedRoles.length ? (
                <p className="text-xs uppercase tracking-[0.3em] text-primary/50">
                  {t('businessFront.reviewsAccessCta', {
                    roles: reviewAccess.allowedRoles.join(' • ')
                  })}
                </p>
              ) : null}
              {reviewSummary ? (
                <p className="text-xs text-primary/50">
                  {t('businessFront.reviewsAccessSummary', {
                    total: format.number(reviewSummary.totalReviews ?? 0)
                  })}
                </p>
              ) : null}
            </div>
          )}
        </section>

        <section aria-labelledby="business-front-testimonials" className="space-y-5">
          <header>
            <h2 id="business-front-testimonials" className="text-lg font-semibold text-primary">
              {t('businessFront.testimonialsHeadline')}
            </h2>
          </header>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                {t('businessFront.testimonialsEmpty')}
              </p>
            ) : (
              testimonials.map((testimonial) => <TestimonialCard key={testimonial.id} testimonial={testimonial} />)
            )}
          </div>
        </section>

        <section aria-labelledby="business-front-servicemen" className="space-y-5">
          <header>
            <h2 id="business-front-servicemen" className="text-lg font-semibold text-primary">
              {t('businessFront.servicemenHeadline')}
            </h2>
            <p className="text-sm text-slate-600">{t('businessFront.servicemenDescription')}</p>
          </header>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {servicemen.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                {t('businessFront.servicemenEmpty')}
              </p>
            ) : (
              servicemen.map((member) => <ServicemanCard key={member.id} member={member} />)
            )}
          </div>
        </section>

        <section aria-labelledby="business-front-inventory" className="space-y-5">
          <header>
            <h2 id="business-front-inventory" className="text-lg font-semibold text-primary">
              {t('businessFront.inventoryHeadline')}
            </h2>
          </header>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                <BuildingStorefrontIcon className="h-5 w-5" aria-hidden="true" />
                {t('businessFront.materialsHeadline')}
              </h3>
              <div className="grid gap-3">
                {materials.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-xs text-slate-500">
                    {t('businessFront.materialsEmpty')}
                  </p>
                ) : (
                  materials.map((item) => <InventoryCard key={item.id} item={item} variant="materials" />)
                )}
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                <WrenchScrewdriverIcon className="h-5 w-5" aria-hidden="true" />
                {t('businessFront.toolsHeadline')}
              </h3>
              <div className="grid gap-3">
                {tools.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-xs text-slate-500">
                    {t('businessFront.toolsEmpty')}
                  </p>
                ) : (
                  tools.map((item) => <InventoryCard key={item.id} item={item} variant="tools" />)
                )}
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="business-front-zones" className="space-y-5">
          <header>
            <h2 id="business-front-zones" className="text-lg font-semibold text-primary">
              {t('businessFront.serviceZonesHeadline')}
            </h2>
            <p className="text-sm text-slate-600">{t('businessFront.serviceZonesDescription')}</p>
          </header>
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {serviceZones.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                {t('businessFront.serviceZonesEmpty')}
              </p>
            ) : (
              serviceZones.map((zone) => <ZoneBadge key={zone.id ?? zone.name} zone={zone} />)
            )}
          </ul>
        </section>

        {certifications.length ? (
          <section aria-labelledby="business-front-certifications" className="space-y-5">
            <header className="flex items-center gap-3">
              <CheckBadgeIcon className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 id="business-front-certifications" className="text-lg font-semibold text-primary">
                {t('businessFront.certificationsHeadlineFull')}
              </h2>
            </header>
            <ul className="grid gap-3 md:grid-cols-2">
              {certifications.map((cert) => (
                <li
                  key={cert.id}
                  className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white/80 p-4"
                  data-qa={`business-front-certification-${cert.id}`}
                >
                  <span className="text-sm font-semibold text-primary">{cert.name}</span>
                  {cert.issuer ? <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{cert.issuer}</span> : null}
                  {cert.expiresOn ? (
                    <span className="text-xs text-slate-500">
                      {t('businessFront.certificationExpires', { date: format.date(cert.expiresOn) })}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="business-front-support" className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <h2 id="business-front-support" className="text-lg font-semibold text-primary">
              {conciergeHeading}
            </h2>
            <p className="text-sm text-slate-600">{t('businessFront.supportDescription')}</p>
          </div>
          <div className="flex flex-col gap-3 rounded-3xl border border-primary/15 bg-primary/5 p-6">
            {support.email ? (
              <a
                href={`mailto:${support.email}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
                data-qa="business-front-support-email"
              >
                <EnvelopeIcon className="h-5 w-5" aria-hidden="true" />
                {support.email}
              </a>
            ) : null}
            {support.phone ? (
              <a
                href={`tel:${support.phone}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
                data-qa="business-front-support-phone"
              >
                <PhoneArrowDownLeftIcon className="h-5 w-5" aria-hidden="true" />
                {support.phone}
              </a>
            ) : null}
            {support.concierge ? (
              <p className="text-xs text-slate-600" data-qa="business-front-support-concierge">
                {t('businessFront.supportConcierge', { name: support.concierge })}
              </p>
            ) : null}
            {!support.email && !support.phone ? (
              <p className="text-xs text-slate-600" data-qa="business-front-support-fallback">
                {t('businessFront.supportFallback')}
              </p>
            ) : null}
          </div>
        </section>
      </main>

      {state.loading && !state.data ? (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/30" role="status" aria-live="polite">
          <Spinner />
          <span className="sr-only">{t('businessFront.loadingOverlay')}</span>
        </div>
      ) : null}
    </div>
  );
}

