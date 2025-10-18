import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowPathIcon,
  BuildingStorefrontIcon,
  CheckBadgeIcon,
  EnvelopeIcon,
  LockClosedIcon,
  MapPinIcon,
  PhoneArrowDownLeftIcon,
  PhotoIcon,
  PlayIcon,
  StarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { Button, Modal, SegmentedControl, Spinner, StatusPill, TextInput } from '../components/ui/index.js';
import { getBusinessFront, PanelApiError } from '../api/panelClient.js';
import { fetchExplorerResults, fetchTalent, ExplorerApiError } from '../api/explorerClient.js';
import { useLocale } from '../hooks/useLocale.js';
import { useSession } from '../hooks/useSession.js';
import { BUSINESS_FRONT_ALLOWED_ROLES, ROLE_DISPLAY_NAMES } from '../constants/accessControl.js';

const SCORE_LABELS = {
  trust: 'Trust',
  review: 'Reviews',
  delivery: 'Delivery',
  quality: 'Quality',
  support: 'Support'
};

const DIRECTORY_TABS = [
  { value: 'providers', label: 'Providers' },
  { value: 'servicemen', label: 'Servicemen' }
];

function formatScoreLabel(key) {
  if (!key) {
    return 'Score';
  }

  if (SCORE_LABELS[key]) {
    return SCORE_LABELS[key];
  }

  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

function formatScoreBand(value) {
  if (!value) {
    return '';
  }

  return value
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

function resolveScoreTone(band) {
  if (!band) {
    return 'neutral';
  }

  const value = band.toLowerCase();
  if (['gold', 'platinum', 'worldclass', 'elite'].includes(value)) {
    return 'success';
  }

  if (['silver'].includes(value)) {
    return 'info';
  }

  if (['watch', 'amber', 'attention', 'bronze'].includes(value)) {
    return 'warning';
  }

  if (['critical', 'at-risk', 'red'].includes(value)) {
    return 'danger';
  }

  return 'info';
}

function formatStatValue(stat, format) {
  if (!stat) {
    return '—';
  }

  const numeric = Number(stat.value);

  switch (stat.format) {
    case 'percent':
    case 'percentage': {
      if (!Number.isFinite(numeric)) {
        return '—';
      }
      const base = numeric > 1 ? numeric / 100 : numeric;
      return format.percentage(base, { maximumFractionDigits: base < 0.1 ? 1 : 0 });
    }
    case 'currency':
      if (!Number.isFinite(numeric)) {
        return '—';
      }
      return format.currency(numeric, { maximumFractionDigits: 0 });
    case 'minutes':
      if (!Number.isFinite(numeric)) {
        return '—';
      }
      return `${format.number(Math.round(numeric), { maximumFractionDigits: 0 })} min`;
    default:
      if (!Number.isFinite(numeric)) {
        return typeof stat.value === 'string' ? stat.value : '—';
      }
      return format.number(numeric, { maximumFractionDigits: Number.isInteger(numeric) ? 0 : 1 });
  }
}

function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function truncate(text, max = 120) {
  if (!text) {
    return '';
  }

  if (text.length <= max) {
    return text;
  }

  return `${text.slice(0, max).trimEnd()}…`;
}

function Pill({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600">
      {Icon ? <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> : null}
      <span>{children}</span>
    </span>
  );
}

Pill.propTypes = {
  icon: PropTypes.elementType,
  children: PropTypes.node.isRequired
};

function StatCard({ stat, format }) {
  return (
    <article className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-primary/60">{stat.label}</p>
      <p className="mt-4 text-2xl font-semibold text-primary">{formatStatValue(stat, format)}</p>
    </article>
  );
}

StatCard.propTypes = {
  stat: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    format: PropTypes.string
  }).isRequired,
  format: PropTypes.shape({
    number: PropTypes.func.isRequired,
    currency: PropTypes.func.isRequired,
    percentage: PropTypes.func.isRequired
  }).isRequired
};

function ScoreCard({ label, score, format }) {
  return (
    <article className="rounded-3xl border border-primary/20 bg-white p-6 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-primary/60">{label}</p>
      <div className="mt-4 flex items-center gap-3">
        <span className="text-3xl font-semibold text-primary">{score.value}</span>
        {score.band ? <StatusPill tone={resolveScoreTone(score.band)}>{formatScoreBand(score.band)}</StatusPill> : null}
      </div>
      {Number.isFinite(score.sampleSize) ? (
        <p className="mt-3 text-[0.7rem] uppercase tracking-[0.3em] text-primary/60">
          {format.number(score.sampleSize, { maximumFractionDigits: 0 })} samples
        </p>
      ) : null}
    </article>
  );
}

ScoreCard.propTypes = {
  label: PropTypes.string.isRequired,
  score: PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    band: PropTypes.string,
    sampleSize: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  }).isRequired,
  format: PropTypes.shape({ number: PropTypes.func.isRequired }).isRequired
};

function CertificationCard({ certification, format }) {
  const expiry = certification.expiresOn ? format.date(certification.expiresOn) : null;

  return (
    <article className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <CheckBadgeIcon className="h-5 w-5 text-primary" aria-hidden="true" />
        <p className="text-sm font-semibold text-primary">{certification.name}</p>
      </div>
      <div className="text-xs text-slate-500">
        {certification.issuer ? <p>{certification.issuer}</p> : null}
        {expiry ? <p>Valid to {expiry}</p> : null}
      </div>
    </article>
  );
}

CertificationCard.propTypes = {
  certification: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string.isRequired,
    issuer: PropTypes.string,
    expiresOn: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)])
  }).isRequired,
  format: PropTypes.shape({ date: PropTypes.func.isRequired }).isRequired
};

function ZoneCard({ zone }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-primary">{zone.name}</p>
      {zone.demandLevel ? (
        <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-500">{zone.demandLevel}</p>
      ) : null}
    </article>
  );
}

ZoneCard.propTypes = {
  zone: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string.isRequired,
    demandLevel: PropTypes.string
  }).isRequired
};

function SupportCard({ support }) {
  return (
    <article className="rounded-3xl border border-primary/20 bg-primary/5 p-6 shadow-sm">
      <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-primary/80">Support</h4>
      <div className="mt-4 flex flex-wrap gap-3">
        {support.email ? (
          <Button href={`mailto:${support.email}`} size="sm" variant="secondary" icon={EnvelopeIcon} iconPosition="start">
            Email
          </Button>
        ) : null}
        {support.phone ? (
          <Button href={`tel:${support.phone}`} size="sm" variant="ghost" icon={PhoneArrowDownLeftIcon} iconPosition="start">
            Call
          </Button>
        ) : null}
      </div>
      {support.concierge ? (
        <p className="mt-4 text-xs text-primary/70">{support.concierge}</p>
      ) : null}
    </article>
  );
}

SupportCard.propTypes = {
  support: PropTypes.shape({
    email: PropTypes.string,
    phone: PropTypes.string,
    concierge: PropTypes.string
  }).isRequired
};

function InfoSection({ stats, scores, certifications, serviceZones, support, format }) {
  const statItems = stats.slice(0, 6);
  const scoreEntries = Object.entries(scores || {}).filter(([, score]) => score && score.value != null);
  const hasSupport = Boolean(support.email || support.phone || support.concierge);

  return (
    <div className="space-y-10">
      {statItems.length ? (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Stats</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {statItems.map((stat) => (
              <StatCard key={stat.id || stat.label} stat={stat} format={format} />
            ))}
          </div>
        </section>
      ) : null}

      {scoreEntries.length ? (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Scores</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {scoreEntries.map(([key, score]) => (
              <ScoreCard key={key} label={formatScoreLabel(key)} score={score} format={format} />
            ))}
          </div>
        </section>
      ) : null}

      {certifications.length ? (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Certs</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {certifications.slice(0, 6).map((cert) => (
              <CertificationCard key={cert.id || cert.name} certification={cert} format={format} />
            ))}
          </div>
        </section>
      ) : null}

      {serviceZones.length ? (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Zones</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {serviceZones.slice(0, 9).map((zone) => (
              <ZoneCard key={zone.id || zone.name} zone={zone} />
            ))}
          </div>
        </section>
      ) : null}

      {hasSupport ? (
        <section>
          <SupportCard support={support} />
        </section>
      ) : null}
    </div>
  );
}

InfoSection.propTypes = {
  stats: PropTypes.arrayOf(StatCard.propTypes.stat).isRequired,
  scores: PropTypes.object.isRequired,
  certifications: PropTypes.arrayOf(CertificationCard.propTypes.certification).isRequired,
  serviceZones: PropTypes.arrayOf(ZoneCard.propTypes.zone).isRequired,
  support: PropTypes.shape({
    email: PropTypes.string,
    phone: PropTypes.string,
    concierge: PropTypes.string
  }).isRequired,
  format: PropTypes.shape({
    number: PropTypes.func.isRequired,
    currency: PropTypes.func.isRequired,
    percentage: PropTypes.func.isRequired,
    date: PropTypes.func.isRequired
  }).isRequired
};

function ServiceCard({ service, format }) {
  const priceLabel = Number.isFinite(Number(service.price))
    ? format.currency(Number(service.price), { currency: service.currency || undefined, maximumFractionDigits: 0 })
    : 'Pricing on request';

  return (
    <article className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-primary/60">{service.type}</p>
        <h4 className="mt-2 text-base font-semibold text-primary">{service.name}</h4>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{service.category}</p>
      </div>
      <div className="mt-auto space-y-2 text-sm text-primary">
        <p className="font-semibold">{priceLabel}</p>
        {service.availability?.label ? (
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{service.availability.label}</p>
        ) : null}
      </div>
      {service.tags?.length ? (
        <div className="flex flex-wrap gap-2">
          {service.tags.slice(0, 3).map((tag) => (
            <Pill key={tag}>{tag}</Pill>
          ))}
        </div>
      ) : null}
      {service.coverage?.length ? (
        <div className="flex flex-wrap gap-2">
          {service.coverage.slice(0, 3).map((zone) => (
            <Pill key={zone} icon={MapPinIcon}>
              {zone}
            </Pill>
          ))}
        </div>
      ) : null}
    </article>
  );
}

ServiceCard.propTypes = {
  service: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string.isRequired,
    type: PropTypes.string,
    category: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    currency: PropTypes.string,
    availability: PropTypes.shape({ label: PropTypes.string }),
    tags: PropTypes.arrayOf(PropTypes.string),
    coverage: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  format: PropTypes.shape({ currency: PropTypes.func.isRequired }).isRequired
};

function PackageCard({ pkg, format }) {
  const priceLabel = Number.isFinite(Number(pkg.price))
    ? format.currency(Number(pkg.price), { currency: pkg.currency || undefined, maximumFractionDigits: 0 })
    : null;

  return (
    <article className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-primary/60">Bundle</p>
        <h4 className="mt-2 text-base font-semibold text-primary">{pkg.name}</h4>
      </div>
      {pkg.highlights?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {pkg.highlights.slice(0, 3).map((highlight) => (
            <Pill key={highlight}>{highlight}</Pill>
          ))}
        </div>
      ) : null}
      {priceLabel ? <p className="mt-4 text-sm font-semibold text-primary/80">From {priceLabel}</p> : null}
    </article>
  );
}

PackageCard.propTypes = {
  pkg: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string.isRequired,
    highlights: PropTypes.arrayOf(PropTypes.string),
    price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    currency: PropTypes.string
  }).isRequired,
  format: PropTypes.shape({ currency: PropTypes.func.isRequired }).isRequired
};

function ServicesSection({ packages, services, format }) {
  const packageItems = packages.slice(0, 4);
  const serviceItems = services.slice(0, 9);

  return (
    <div className="space-y-10">
      {packageItems.length ? (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Bundles</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {packageItems.map((pkg) => (
              <PackageCard key={pkg.id || pkg.name} pkg={pkg} format={format} />
            ))}
          </div>
        </section>
      ) : null}

      {serviceItems.length ? (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Services</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {serviceItems.map((service) => (
              <ServiceCard key={service.id || service.name} service={service} format={format} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

ServicesSection.propTypes = {
  packages: PropTypes.arrayOf(PackageCard.propTypes.pkg).isRequired,
  services: PropTypes.arrayOf(ServiceCard.propTypes.service).isRequired,
  format: PropTypes.shape({ currency: PropTypes.func.isRequired }).isRequired
};

function JobCard({ job, format }) {
  const dateLabel = job.completedOn ? format.date(job.completedOn) : null;
  const valueLabel = Number.isFinite(Number(job.value))
    ? format.currency(Number(job.value), { currency: job.currency || undefined, maximumFractionDigits: 0 })
    : null;

  return (
    <article className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      {job.image ? (
        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <img src={job.image} alt={job.title} className="h-40 w-full object-cover" />
        </div>
      ) : null}
      <div>
        <p className="text-sm font-semibold text-primary">{job.title}</p>
        {job.zone ? <p className="text-xs text-slate-500">{job.zone}</p> : null}
      </div>
      <div className="mt-auto flex flex-wrap gap-3 text-xs text-slate-500">
        {dateLabel ? <span>{dateLabel}</span> : null}
        {valueLabel ? <span>{valueLabel}</span> : null}
      </div>
    </article>
  );
}

JobCard.propTypes = {
  job: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string.isRequired,
    zone: PropTypes.string,
    completedOn: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    currency: PropTypes.string,
    image: PropTypes.string
  }).isRequired,
  format: PropTypes.shape({
    date: PropTypes.func.isRequired,
    currency: PropTypes.func.isRequired
  }).isRequired
};

function DealCard({ deal, format }) {
  const savings = Number.isFinite(Number(deal.savings))
    ? format.currency(Number(deal.savings), { currency: deal.currency || undefined, maximumFractionDigits: 0 })
    : null;
  const validUntil = deal.validUntil ? format.date(deal.validUntil) : null;

  return (
    <article className="flex h-full flex-col justify-between rounded-3xl border border-primary/20 bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm font-semibold text-primary">{deal.title}</p>
        {deal.tags?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {deal.tags.slice(0, 3).map((tag) => (
              <Pill key={tag}>{tag}</Pill>
            ))}
          </div>
        ) : null}
      </div>
      <div className="mt-4 space-y-1 text-xs text-primary/70">
        {savings ? <p>Save {savings}</p> : null}
        {validUntil ? <p>Ends {validUntil}</p> : null}
      </div>
    </article>
  );
}

DealCard.propTypes = {
  deal: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string.isRequired,
    tags: PropTypes.arrayOf(PropTypes.string),
    savings: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    currency: PropTypes.string,
    validUntil: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)])
  }).isRequired,
  format: PropTypes.shape({
    currency: PropTypes.func.isRequired,
    date: PropTypes.func.isRequired
  }).isRequired
};

function WorkSection({ jobs, deals, format }) {
  const jobItems = jobs.slice(0, 6);
  const dealItems = deals.slice(0, 4);

  return (
    <div className="space-y-10">
      {jobItems.length ? (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Work</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {jobItems.map((job) => (
              <JobCard key={job.id || job.title} job={job} format={format} />
            ))}
          </div>
        </section>
      ) : null}

      {dealItems.length ? (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Deals</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dealItems.map((deal) => (
              <DealCard key={deal.id || deal.title} deal={deal} format={format} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

WorkSection.propTypes = {
  jobs: PropTypes.arrayOf(JobCard.propTypes.job).isRequired,
  deals: PropTypes.arrayOf(DealCard.propTypes.deal).isRequired,
  format: PropTypes.shape({
    currency: PropTypes.func.isRequired,
    date: PropTypes.func.isRequired
  }).isRequired
};

function ReviewCard({ review, format }) {
  const ratingLabel = Number.isFinite(Number(review.rating)) ? Number(review.rating).toFixed(1) : '—';
  const submittedLabel = review.submittedAt ? format.date(review.submittedAt) : null;

  return (
    <article className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 text-primary">
        <StarIcon className="h-5 w-5" aria-hidden="true" />
        <span className="text-lg font-semibold">{ratingLabel}</span>
      </div>
      <p className="text-sm text-slate-600">“{truncate(review.comment, 160)}”</p>
      <div className="mt-auto space-y-1 text-xs text-slate-500">
        <p className="uppercase tracking-[0.3em]">{review.reviewer}</p>
        {submittedLabel ? <p>{submittedLabel}</p> : null}
      </div>
    </article>
  );
}

ReviewCard.propTypes = {
  review: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    reviewer: PropTypes.string.isRequired,
    rating: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    comment: PropTypes.string.isRequired,
    submittedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)])
  }).isRequired,
  format: PropTypes.shape({ date: PropTypes.func.isRequired }).isRequired
};

function ReviewsSection({ reviewSummary, reviews, format }) {
  const summaryCards = [];
  if (reviewSummary?.averageRating != null) {
    summaryCards.push({
      id: 'average',
      label: 'Average rating',
      value: Number(reviewSummary.averageRating).toFixed(2)
    });
  }
  if (reviewSummary?.totalReviews != null) {
    summaryCards.push({
      id: 'total',
      label: 'Total reviews',
      value: format.number(reviewSummary.totalReviews, { maximumFractionDigits: 0 })
    });
  }
  if (Number.isFinite(reviewSummary?.verifiedShare)) {
    summaryCards.push({
      id: 'verified',
      label: 'Verified share',
      value: format.percentage(reviewSummary.verifiedShare)
    });
  }

  return (
    <div className="space-y-10">
      {summaryCards.length ? (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Summary</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {summaryCards.map((card) => (
              <article key={card.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-primary/60">{card.label}</p>
                <p className="mt-3 text-2xl font-semibold text-primary">{card.value}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {reviews.length ? (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Reviews</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {reviews.slice(0, 6).map((review) => (
              <ReviewCard key={review.id || review.reviewer} review={review} format={format} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

ReviewsSection.propTypes = {
  reviewSummary: PropTypes.shape({
    averageRating: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    totalReviews: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    verifiedShare: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  }),
  reviews: PropTypes.arrayOf(ReviewCard.propTypes.review).isRequired,
  format: PropTypes.shape({
    number: PropTypes.func.isRequired,
    percentage: PropTypes.func.isRequired
  }).isRequired
};

ReviewsSection.defaultProps = {
  reviewSummary: null
};

function MediaSection({ mediaItems, bannerStyles, onOpen }) {
  const galleryItems = mediaItems.slice(0, 6);
  const styleItems = bannerStyles.slice(0, 4);

  return (
    <div className="space-y-10">
      {galleryItems.length ? (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Gallery</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {galleryItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpen(item)}
                className="flex flex-col items-start gap-3 rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md"
              >
                <div className="aspect-video w-full overflow-hidden rounded-2xl border border-slate-100">
                  {item.type === 'video' ? (
                    <div className="flex h-full items-center justify-center bg-slate-900 text-white">
                      <PlayIcon className="h-8 w-8" aria-hidden="true" />
                    </div>
                  ) : (
                    <img src={item.src} alt={item.title} className="h-full w-full object-cover" />
                  )}
                </div>
                <p className="text-sm font-semibold text-primary">{item.title}</p>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {styleItems.length ? (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Banners</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {styleItems.map((style) => (
              <article
                key={style.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <PhotoIcon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-primary">{style.name}</p>
                    {style.layout ? (
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                        {formatScoreLabel(style.layout)}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                  {style.palette?.background ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border border-slate-200" style={{ backgroundColor: style.palette.background }} aria-hidden="true" />
                      Base
                    </span>
                  ) : null}
                  {style.palette?.accent ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border border-slate-200" style={{ backgroundColor: style.palette.accent }} aria-hidden="true" />
                      Accent
                    </span>
                  ) : null}
                  {style.palette?.highlight ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border border-slate-200" style={{ backgroundColor: style.palette.highlight }} aria-hidden="true" />
                      Highlight
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {style.supportsVideo ? <Pill icon={PlayIcon}>Video</Pill> : null}
                  {style.supportsCarousel ? <Pill>Carousel</Pill> : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

MediaSection.propTypes = {
  mediaItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['image', 'video']).isRequired,
      src: PropTypes.string.isRequired,
      poster: PropTypes.string
    })
  ).isRequired,
  bannerStyles: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      layout: PropTypes.string,
      palette: PropTypes.shape({
        background: PropTypes.string,
        accent: PropTypes.string,
        highlight: PropTypes.string
      }),
      supportsVideo: PropTypes.bool,
      supportsCarousel: PropTypes.bool
    })
  ).isRequired,
  onOpen: PropTypes.func.isRequired
};

function TeamCard({ member }) {
  return (
    <article className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        {member.avatar ? (
          <img src={member.avatar} alt={member.name} className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserGroupIcon className="h-6 w-6" aria-hidden="true" />
          </span>
        )}
        <div>
          <p className="text-sm font-semibold text-primary">{member.name}</p>
          {member.availability ? <p className="text-xs text-slate-500">{member.availability}</p> : null}
        </div>
      </div>
      {member.trades?.length ? (
        <div className="flex flex-wrap gap-2">
          {member.trades.slice(0, 3).map((trade) => (
            <Pill key={trade}>{trade}</Pill>
          ))}
        </div>
      ) : null}
    </article>
  );
}

TeamCard.propTypes = {
  member: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string.isRequired,
    trades: PropTypes.arrayOf(PropTypes.string),
    availability: PropTypes.string,
    avatar: PropTypes.string
  }).isRequired
};

function TeamSection({ servicemen }) {
  if (!servicemen.length) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {servicemen.slice(0, 9).map((member) => (
        <TeamCard key={member.id || member.name} member={member} />
      ))}
    </div>
  );
}

TeamSection.propTypes = {
  servicemen: PropTypes.arrayOf(TeamCard.propTypes.member).isRequired
};

function extractSlugFromUrl(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const parsed = new URL(url, 'https://fixnado.example');
    const segments = parsed.pathname.split('/').filter(Boolean);
    const providerIndex = segments.findIndex((segment) => segment === 'providers');
    if (providerIndex >= 0 && segments[providerIndex + 1]) {
      return segments[providerIndex + 1];
    }
    return segments.at(-1) ?? null;
  } catch (error) {
    const match = url.match(/\/providers\/([^/?#]+)/i);
    return match ? match[1] : null;
  }
}

function summariseProviders(services = []) {
  const index = new Map();

  services.forEach((service) => {
    const company = service.Company ?? service.company ?? {};
    const profile = company.profile ?? {};
    const id = company.id ?? service.companyId ?? service.slug;

    if (!id) {
      return;
    }

    if (!index.has(id)) {
      index.set(id, {
        id,
        slug: profile.storefrontSlug ?? extractSlugFromUrl(service.displayUrl),
        name: profile.displayName ?? company.contactName ?? service.title ?? 'Provider',
        companyName: company.contactName ?? null,
        programmes: new Set(),
        categories: new Set(),
        coverage: new Set(),
        tags: new Set()
      });
    }

    const entry = index.get(id);
    if (!entry.slug) {
      entry.slug = profile.storefrontSlug ?? extractSlugFromUrl(service.displayUrl);
    }
    if (!entry.name && (profile.displayName || company.contactName)) {
      entry.name = profile.displayName ?? company.contactName ?? entry.name;
    }
    if (!entry.companyName && company.contactName) {
      entry.companyName = company.contactName;
    }

    entry.programmes.add(service.title ?? service.name ?? 'Programme');

    if (service.category) {
      entry.categories.add(service.category);
    }

    const coverage = Array.isArray(service.coverage) ? service.coverage : [];
    coverage.forEach((zone) => {
      if (typeof zone === 'string') {
        entry.coverage.add(zone);
      } else if (zone?.name) {
        entry.coverage.add(zone.name);
      }
    });

    const tags = Array.isArray(service.tags) ? service.tags : [];
    tags.forEach((tag) => entry.tags.add(tag));
  });

  return Array.from(index.values()).map((entry) => ({
    id: entry.id,
    slug: entry.slug,
    name: entry.name,
    companyName: entry.companyName ?? entry.name,
    programmes: entry.programmes.size,
    categories: Array.from(entry.categories).slice(0, 3),
    coverage: Array.from(entry.coverage).slice(0, 3),
    tags: Array.from(entry.tags).slice(0, 3)
  }));
}

function DirectoryProviderCard({ provider }) {
  const programmeLabel = provider.programmes === 1 ? '1 line' : `${provider.programmes} lines`;

  return (
    <article className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Provider</p>
          <h3 className="mt-2 text-lg font-semibold text-primary">{provider.name}</h3>
          {provider.companyName && provider.companyName !== provider.name ? (
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{provider.companyName}</p>
          ) : null}
        </div>
        <StatusPill tone="info">{programmeLabel}</StatusPill>
        {provider.categories.length ? (
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            {provider.categories.map((category) => (
              <span key={category} className="rounded-full bg-slate-100 px-3 py-1">
                {category}
              </span>
            ))}
          </div>
        ) : null}
        {provider.coverage.length ? (
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            {provider.coverage.map((zone) => (
              <span
                key={zone}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1"
              >
                <MapPinIcon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                {zone}
              </span>
            ))}
          </div>
        ) : null}
        {provider.tags.length ? (
          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
            {provider.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-slate-200 px-3 py-1">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        {provider.slug ? (
          <Button as={Link} to={`/providers/${provider.slug}`} size="sm" variant="primary">
            Profile
          </Button>
        ) : null}
      </div>
    </article>
  );
}

DirectoryProviderCard.propTypes = {
  provider: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    slug: PropTypes.string,
    name: PropTypes.string.isRequired,
    companyName: PropTypes.string,
    programmes: PropTypes.number.isRequired,
    categories: PropTypes.arrayOf(PropTypes.string).isRequired,
    coverage: PropTypes.arrayOf(PropTypes.string).isRequired,
    tags: PropTypes.arrayOf(PropTypes.string).isRequired
  }).isRequired
};

function DirectoryServicemanCard({ member }) {
  return (
    <article className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Serviceman</p>
          <h3 className="mt-2 text-lg font-semibold text-primary">{member.name}</h3>
          {member.role ? <p className="text-sm text-slate-500">{member.role}</p> : null}
          {member.company ? <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{member.company}</p> : null}
        </div>
        {member.skills.length ? (
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            {member.skills.map((skill) => (
              <span key={skill} className="rounded-full bg-slate-100 px-3 py-1">
                {skill}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        {member.email ? (
          <Button href={`mailto:${member.email}`} size="sm" variant="secondary" icon={EnvelopeIcon} iconPosition="start">
            Email
          </Button>
        ) : null}
        {member.phone ? (
          <Button href={`tel:${member.phone}`} size="sm" variant="ghost" icon={PhoneArrowDownLeftIcon} iconPosition="start">
            Call
          </Button>
        ) : null}
        {member.slug ? (
          <Button as={Link} to={`/providers/${member.slug}`} size="sm" variant="ghost">
            Profile
          </Button>
        ) : null}
      </div>
    </article>
  );
}

DirectoryServicemanCard.propTypes = {
  member: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    role: PropTypes.string,
    company: PropTypes.string,
    skills: PropTypes.arrayOf(PropTypes.string).isRequired,
    email: PropTypes.string,
    phone: PropTypes.string,
    slug: PropTypes.string
  }).isRequired
};

function ProvidersDirectory() {
  const [activeTab, setActiveTab] = useState('providers');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 320);
  const [providerState, setProviderState] = useState({ loading: true, error: null, records: [] });
  const [servicemenState, setServicemenState] = useState({ loading: false, error: null, records: [] });

  const loadProviders = useCallback(
    async ({ term, signal } = {}) => {
      setProviderState((current) => ({ ...current, loading: true, error: null }));
      try {
        const filters = { limit: 24 };
        if (term && term.trim()) {
          filters.term = term.trim();
        }
        const result = await fetchExplorerResults(filters, { signal });
        const records = summariseProviders(result.services ?? []);
        setProviderState({ loading: false, error: null, records });
      } catch (error) {
        if (signal?.aborted || error?.name === 'AbortError') {
          return;
        }
        const message = error instanceof ExplorerApiError ? error.message : 'Unable to load providers';
        setProviderState({ loading: false, error: message, records: [] });
      }
    },
    []
  );

  const loadServicemen = useCallback(
    async ({ term, signal } = {}) => {
      if (!term || term.trim().length < 2) {
        setServicemenState({ loading: false, error: null, records: [] });
        return;
      }

      setServicemenState((current) => ({ ...current, loading: true, error: null }));
      try {
        const members = await fetchTalent(term.trim(), { signal });
        const records = (Array.isArray(members) ? members : []).map((member) => {
          const fallbackName = [member.firstName, member.lastName].filter(Boolean).join(' ');
          const name = member.name || fallbackName || 'Serviceman';
          const companyName =
            member.company?.name || member.companyName || member.company || member.providerName || null;
          const slug = member.company?.slug || member.slug || member.companySlug || null;
          const skills = Array.isArray(member.skills)
            ? member.skills
                .map((skill) => (typeof skill === 'string' ? skill.trim() : ''))
                .filter((skill) => skill)
                .slice(0, 6)
            : [];

          return {
            id: member.id ?? member.userId ?? member.email ?? name,
            name,
            role: member.role ?? member.title ?? null,
            company: companyName,
            skills,
            email: member.email ?? null,
            phone: member.phone ?? null,
            slug
          };
        });
        setServicemenState({ loading: false, error: null, records });
      } catch (error) {
        if (signal?.aborted || error?.name === 'AbortError') {
          return;
        }
        const message = error instanceof ExplorerApiError ? error.message : 'Unable to load servicemen';
        setServicemenState({ loading: false, error: message, records: [] });
      }
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    loadProviders({ term: debouncedSearch, signal: controller.signal }).catch(() => {});
    return () => controller.abort();
  }, [debouncedSearch, loadProviders]);

  useEffect(() => {
    if (activeTab !== 'servicemen') {
      return;
    }

    const controller = new AbortController();
    loadServicemen({ term: debouncedSearch, signal: controller.signal }).catch(() => {});
    return () => controller.abort();
  }, [activeTab, debouncedSearch, loadServicemen]);

  const providersReady = !providerState.loading && providerState.records.length > 0;
  const servicemenReady = !servicemenState.loading && servicemenState.records.length > 0;
  const requiresServicemenSearch = debouncedSearch.trim().length < 2;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-primary/60">Directory</p>
            <h1 className="text-4xl font-semibold text-primary">Providers</h1>
          </div>
          <div className="w-full max-w-md space-y-4">
            <TextInput
              label="Search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search providers or servicemen"
              inputClassName="px-4 py-3 text-sm"
            />
            <SegmentedControl
              name="Directory view"
              value={activeTab}
              onChange={setActiveTab}
              options={DIRECTORY_TABS}
              size="sm"
            />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-6 py-12 space-y-8">
          {activeTab === 'providers' ? (
            <>
              {providerState.error ? <StatusPill tone="danger">{providerState.error}</StatusPill> : null}
              {providerState.loading ? (
                <div className="flex justify-center py-24">
                  <Spinner className="h-10 w-10 text-primary" aria-label="Loading providers" />
                </div>
              ) : null}
              {providersReady ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {providerState.records.map((provider) => (
                    <DirectoryProviderCard key={provider.id} provider={provider} />
                  ))}
                </div>
              ) : null}
              {!providerState.loading && !providersReady && !providerState.error ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
                  No providers match right now.
                </div>
              ) : null}
            </>
          ) : (
            <>
              {servicemenState.error ? <StatusPill tone="danger">{servicemenState.error}</StatusPill> : null}
              {requiresServicemenSearch && !servicemenState.error ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
                  Enter 2+ letters to find servicemen.
                </div>
              ) : null}
              {servicemenState.loading ? (
                <div className="flex justify-center py-24">
                  <Spinner className="h-10 w-10 text-primary" aria-label="Loading servicemen" />
                </div>
              ) : null}
              {servicemenReady ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {servicemenState.records.map((member) => (
                    <DirectoryServicemanCard key={member.id} member={member} />
                  ))}
                </div>
              ) : null}
              {!servicemenState.loading &&
                !requiresServicemenSearch &&
                !servicemenReady &&
                !servicemenState.error ? (
                  <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
                    No servicemen found.
                  </div>
                ) : null}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function AccessDenied({ role }) {
  const allowedRolesLabel = BUSINESS_FRONT_ALLOWED_ROLES.map((roleKey) => ROLE_DISPLAY_NAMES[roleKey] || roleKey).join(' / ');
  const roleLabel = ROLE_DISPLAY_NAMES[role] || ROLE_DISPLAY_NAMES.guest || 'Guest';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-lg">
        <LockClosedIcon className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
        <h1 className="mt-6 text-2xl font-semibold text-primary">Enterprise access required</h1>
        <p className="mt-3 text-sm text-slate-600">Only {allowedRolesLabel} roles can view the provider directory.</p>
        <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-400">Signed in as {roleLabel}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button to="/register/company" variant="primary" size="sm">
            Join
          </Button>
          <Button to="/" variant="secondary" size="sm">
            Home
          </Button>
        </div>
      </div>
    </div>
  );
}

AccessDenied.propTypes = {
  role: PropTypes.string
};

AccessDenied.defaultProps = {
  role: 'guest'
};

export default function BusinessFront() {
  const { slug } = useParams();
  const { format } = useLocale();
  const { role: sessionRole, hasRole } = useSession();
  const canAccess = hasRole(BUSINESS_FRONT_ALLOWED_ROLES);
  const isDirectoryView = !slug;
  const [state, setState] = useState(() => ({ loading: canAccess && !isDirectoryView, data: null, meta: null, error: null }));
  const [activeSection, setActiveSection] = useState('info');
  const [selectedMedia, setSelectedMedia] = useState(null);

  const loadFront = useCallback(
    async ({ forceRefresh = false, signal } = {}) => {
      if (!canAccess || !slug) {
        return null;
      }

      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const result = await getBusinessFront(slug, { forceRefresh, signal });
        setState({ loading: false, data: result.data, meta: result.meta ?? {}, error: result.meta?.error || null });
        return result;
      } catch (error) {
        const resolvedError =
          error instanceof PanelApiError ? error : new PanelApiError('Unable to load directory', 500, { cause: error });
        setState((current) => ({ ...current, loading: false, error: resolvedError }));
        return null;
      }
    },
    [slug, canAccess]
  );

  useEffect(() => {
    if (!canAccess) {
      setState({ loading: false, data: null, meta: null, error: null });
      return undefined;
    }

    if (!slug) {
      setState({ loading: false, data: null, meta: null, error: null });
      return undefined;
    }

    const controller = new AbortController();
    loadFront({ signal: controller.signal }).catch(() => {});
    return () => controller.abort();
  }, [loadFront, canAccess, slug]);

  if (!canAccess) {
    return <AccessDenied role={sessionRole} />;
  }

  if (isDirectoryView) {
    return <ProvidersDirectory />;
  }

  const isLoading = state.loading && !state.data;

  const hero = state.data?.hero ?? null;
  const stats = state.data?.stats ?? [];
  const certifications = state.data?.certifications ?? [];
  const serviceZones = state.data?.serviceZones ?? [];
  const support = state.data?.support ?? {};
  const packages = state.data?.packages ?? [];
  const serviceCatalogue = state.data?.serviceCatalogue ?? [];
  const deals = state.data?.deals ?? [];
  const previousJobs = state.data?.previousJobs ?? [];
  const reviews = state.data?.reviews ?? [];
  const reviewSummary = state.data?.reviewSummary ?? null;
  const bannerStyles = state.data?.bannerStyles ?? [];
  const servicemen = state.data?.servicemen ?? [];
  const scores = state.data?.scores ?? {};
  const gallery = state.data?.gallery ?? [];

  const heroMedia = hero?.media ?? {};
  const mediaItems = useMemo(() => {
    const items = [];

    if (heroMedia.showcaseVideo) {
      items.push({
        id: 'showcase-video',
        type: 'video',
        title: 'Showcase',
        src: heroMedia.showcaseVideo,
        poster: heroMedia.heroImage || heroMedia.bannerImage || heroMedia.profileImage || null
      });
    }

    if (Array.isArray(heroMedia.carousel)) {
      heroMedia.carousel.forEach((item) => {
        if (item?.image) {
          items.push({
            id: item.id || item.title || item.image,
            type: 'image',
            title: item.title || 'Media',
            src: item.image
          });
        }
      });
    }

    gallery.forEach((item) => {
      if (item?.image) {
        items.push({
          id: item.id || item.image,
          type: 'image',
          title: item.title || 'Media',
          src: item.image
        });
      }
    });

    return items;
  }, [heroMedia, gallery]);

  const hasScores = Object.values(scores).some((entry) => entry && entry.value != null);
  const hasInfo = Boolean(
    stats.length || certifications.length || serviceZones.length || hasScores || support.email || support.phone || support.concierge
  );
  const hasServices = Boolean(packages.length || serviceCatalogue.length);
  const hasWork = Boolean(previousJobs.length || deals.length);
  const hasReviews = Boolean(reviews.length || reviewSummary);
  const hasMedia = Boolean(mediaItems.length || bannerStyles.length);
  const hasTeam = Boolean(servicemen.length);

  const sectionOptions = useMemo(() => {
    const options = [];
    if (hasInfo) options.push({ value: 'info', label: 'Info' });
    if (hasServices) options.push({ value: 'services', label: 'Services' });
    if (hasWork) options.push({ value: 'work', label: 'Work' });
    if (hasReviews) options.push({ value: 'reviews', label: 'Reviews' });
    if (hasMedia) options.push({ value: 'media', label: 'Media' });
    if (hasTeam) options.push({ value: 'team', label: 'Team' });
    return options;
  }, [hasInfo, hasServices, hasWork, hasReviews, hasMedia, hasTeam]);

  useEffect(() => {
    if (!sectionOptions.length) {
      setActiveSection('info');
      return;
    }

    if (!sectionOptions.some((option) => option.value === activeSection)) {
      setActiveSection(sectionOptions[0].value);
    }
  }, [sectionOptions, activeSection]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner className="h-10 w-10 text-primary" aria-label="Loading provider directory" />
      </div>
    );
  }

  const heroBackground = heroMedia.bannerImage || heroMedia.heroImage || null;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="relative isolate overflow-hidden bg-slate-900 text-white">
        {heroBackground ? (
          <img src={heroBackground} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        ) : null}
        <div className="absolute inset-0 bg-slate-900/70" aria-hidden="true" />
        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-16 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <BuildingStorefrontIcon className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/70">Provider</p>
                <h1 className="mt-1 text-4xl font-semibold leading-tight">{hero?.name || 'Provider directory'}</h1>
              </div>
            </div>
            {hero?.strapline ? <p className="mt-6 text-lg text-white/80">{hero.strapline}</p> : null}
            {hero?.locations?.length ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {hero.locations.slice(0, 4).map((location) => (
                  <span
                    key={location}
                    className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white"
                  >
                    <MapPinIcon className="h-4 w-4" aria-hidden="true" />
                    {location}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="mt-8 flex flex-wrap gap-3">
              <Button to="/register" variant="primary" size="sm">
                Book
              </Button>
              {support.email ? (
                <Button href={`mailto:${support.email}`} variant="secondary" size="sm" icon={EnvelopeIcon} iconPosition="start">
                  Email
                </Button>
              ) : null}
              {support.phone ? (
                <Button href={`tel:${support.phone}`} variant="ghost" size="sm" icon={PhoneArrowDownLeftIcon} iconPosition="start">
                  Call
                </Button>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={ArrowPathIcon}
                iconPosition="start"
                onClick={() => loadFront({ forceRefresh: true })}
                disabled={state.loading}
              >
                Refresh
              </Button>
            </div>
          </div>
          <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Snapshot</p>
            <div className="mt-4 space-y-4">
              {Object.entries(scores)
                .filter(([, score]) => score && score.value != null)
                .slice(0, 2)
                .map(([key, score]) => (
                  <div key={key} className="rounded-2xl border border-white/20 bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/70">{formatScoreLabel(key)}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-3xl font-semibold text-white">{score.value}</span>
                      {score.band ? (
                        <StatusPill tone={resolveScoreTone(score.band)}>{formatScoreBand(score.band)}</StatusPill>
                      ) : null}
                    </div>
                    {Number.isFinite(score.sampleSize) ? (
                      <p className="mt-2 text-[0.7rem] uppercase tracking-[0.3em] text-white/60">
                        {format.number(score.sampleSize, { maximumFractionDigits: 0 })} samples
                      </p>
                    ) : null}
                  </div>
                ))}
              {stats.slice(0, 2).map((stat) => (
                <div key={stat.id || stat.label} className="rounded-2xl border border-white/20 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/70">{stat.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{formatStatValue(stat, format)}</p>
                </div>
              ))}
              {state.loading ? <StatusPill tone="info">Updating…</StatusPill> : null}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-6 py-12">
          {state.error ? (
            <div className="mb-8">
              <StatusPill tone="danger">{state.error.message}</StatusPill>
            </div>
          ) : null}

          {sectionOptions.length > 1 ? (
            <SegmentedControl
              name="Directory navigation"
              value={activeSection}
              onChange={setActiveSection}
              options={sectionOptions}
              size="sm"
            />
          ) : null}

          <div className={sectionOptions.length > 1 ? 'mt-10' : ''}>
            {!sectionOptions.length ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                No directory data yet.
              </div>
            ) : null}

            {activeSection === 'info' && hasInfo ? (
              <InfoSection
                stats={stats}
                scores={scores}
                certifications={certifications}
                serviceZones={serviceZones}
                support={support}
                format={format}
              />
            ) : null}

            {activeSection === 'services' && hasServices ? (
              <ServicesSection packages={packages} services={serviceCatalogue} format={format} />
            ) : null}

            {activeSection === 'work' && hasWork ? (
              <WorkSection jobs={previousJobs} deals={deals} format={format} />
            ) : null}

            {activeSection === 'reviews' && hasReviews ? (
              <ReviewsSection reviewSummary={reviewSummary} reviews={reviews} format={format} />
            ) : null}

            {activeSection === 'media' && hasMedia ? (
              <MediaSection mediaItems={mediaItems} bannerStyles={bannerStyles} onOpen={setSelectedMedia} />
            ) : null}

            {activeSection === 'team' && hasTeam ? <TeamSection servicemen={servicemen} /> : null}
          </div>
        </div>
      </main>

      <Modal
        open={Boolean(selectedMedia)}
        onClose={() => setSelectedMedia(null)}
        title={selectedMedia?.title || 'Media'}
        size="lg"
      >
        {selectedMedia?.type === 'video' ? (
          <video
            src={selectedMedia.src}
            controls
            poster={selectedMedia.poster || undefined}
            className="w-full rounded-2xl"
          >
            Your browser does not support embedded videos.
          </video>
        ) : null}
        {selectedMedia?.type !== 'video' && selectedMedia?.src ? (
          <img src={selectedMedia.src} alt={selectedMedia.title} className="w-full rounded-2xl object-cover" />
        ) : null}
      </Modal>
    </div>
  );
}
