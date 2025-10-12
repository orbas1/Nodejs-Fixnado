import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getBusinessFront, PanelApiError } from '../api/panelClient.js';
import Skeleton from '../components/ui/Skeleton.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import {
  ArrowPathIcon,
  CheckBadgeIcon,
  EnvelopeIcon,
  PhoneArrowDownLeftIcon,
  PlayIcon
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
  const conciergeHeading = hero?.name
    ? t('businessFront.supportHeadline', { name: hero.name })
    : t('businessFront.supportFallbackHeadline');
  const heroName = hero?.name ?? t('businessFront.heroFeatured');
  const heroStrapline = hero?.strapline ?? t('businessFront.heroStraplineFallback');

  return (
    <div className="min-h-screen bg-slate-50 pb-24" data-qa="business-front">
      <header className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-primary/10 via-white to-white">
        {hero?.media?.heroImage ? (
          <img
            src={hero.media.heroImage}
            alt="Business front hero"
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
        ) : null}
        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-primary/80">{t('businessFront.heroFeatured')}</p>
            <h1 className="text-4xl font-semibold text-primary" data-qa="business-front-name">
              {heroName}
            </h1>
            <p className="text-lg text-slate-600" data-qa="business-front-strapline">
              {heroStrapline}
            </p>
            {hero?.locations?.length ? (
              <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.3em] text-primary/60">
                {hero.locations.map((location) => (
                  <span key={location} className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1">
                    {location}
                  </span>
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
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12 space-y-12">
        {!state.loading && state.error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5" role="alert">
            <p className="text-sm font-semibold text-rose-600">{t('businessFront.errorSummary')}</p>
            <p className="mt-1 text-xs text-rose-500">
              {state.error.message}
              {state.meta?.fallback ? ` — ${t('businessFront.errorFallbackHint')}` : ''}
            </p>
          </div>
        ) : null}

        <section aria-labelledby="business-front-packages" className="space-y-5">
          <header className="flex items-center justify-between">
            <div>
              <h2 id="business-front-packages" className="text-lg font-semibold text-primary">
                {t('businessFront.packagesHeadline')}
              </h2>
              <p className="text-sm text-slate-600">{t('businessFront.packagesDescription')}</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-primary shadow-sm transition hover:border-primary/40"
              onClick={() => loadFront({ forceRefresh: true })}
            >
              <ArrowPathIcon className="h-4 w-4" aria-hidden="true" /> {t('businessFront.refresh')}
            </button>
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

        <section aria-labelledby="business-front-testimonials" className="space-y-4">
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

        {certifications.length ? (
          <section aria-labelledby="business-front-certifications" className="space-y-4">
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

        {gallery.length ? (
          <section aria-labelledby="business-front-gallery" className="space-y-4">
            <header className="flex items-center gap-3">
              <PlayIcon className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 id="business-front-gallery" className="text-lg font-semibold text-primary">
                {t('businessFront.galleryHeadline')}
              </h2>
            </header>
            <div className="grid gap-6 md:grid-cols-2">
              {gallery.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-sm"
                  data-qa={`business-front-gallery-${item.id}`}
                >
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="h-48 w-full object-cover" />
                  ) : null}
                  <div className="space-y-2 p-6">
                    <h3 className="text-lg font-semibold text-primary">{item.title}</h3>
                    {item.description ? <p className="text-sm text-slate-600">{item.description}</p> : null}
                  </div>
                </article>
              ))}
            </div>
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

