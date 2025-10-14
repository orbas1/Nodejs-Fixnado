import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { matchGeoServices, previewCoverage } from '../api/geoMatchingClient.js';
import { fetchCurrentUser } from '../api/authClient.js';
import { PanelApiError } from '../api/panelClient.js';
import Spinner from '../components/ui/Spinner.jsx';
import { useLocale } from '../hooks/useLocale.js';

const DEMAND_OPTIONS = [
  { id: 'high', label: 'High demand' },
  { id: 'medium', label: 'Balanced demand' },
  { id: 'low', label: 'Emerging demand' }
];

const INITIAL_FORM = {
  latitude: '51.509',
  longitude: '-0.118',
  radiusKm: '18',
  limit: '12',
  categories: '',
  demandLevels: ['high', 'medium', 'low']
};

function toNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseCategories(input) {
  return input
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function DemandToggle({ option, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-600 shadow-sm transition hover:border-accent/40">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
        checked={checked}
        onChange={() => onChange(option.id)}
      />
      <span className="font-medium text-primary">{option.label}</span>
    </label>
  );
}

function MatchResultCard({ match, formats }) {
  const demandTone = {
    high: 'bg-danger/10 text-danger',
    medium: 'bg-accent/10 text-accent',
    low: 'bg-success/10 text-success'
  };

  return (
    <article className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-primary">{match.zone.name}</h3>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${demandTone[match.zone.demandLevel] || 'bg-accent/10 text-accent'}`}>
            {match.zone.demandLevel}
          </span>
        </div>
        <p className="text-sm text-slate-500">{match.reason}</p>
      </header>
      <dl className="grid grid-cols-2 gap-4 text-sm text-slate-600 md:grid-cols-4">
        <div>
          <dt className="font-semibold text-primary">Match score</dt>
          <dd className="text-2xl font-bold text-primary">{match.score.toFixed(2)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-primary">Coverage company</dt>
          <dd>{match.zone.company?.contactName ?? 'Unassigned'}</dd>
        </div>
        <div>
          <dt className="font-semibold text-primary">Distance to centroid</dt>
          <dd>{match.distanceKm != null ? `${match.distanceKm.toFixed(1)} km` : 'n/a'}</dd>
        </div>
        <div>
          <dt className="font-semibold text-primary">Services surfaced</dt>
          <dd>{match.services.length}</dd>
        </div>
      </dl>
      <section className="space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Recommended services</h4>
        <ul className="space-y-3">
          {match.services.map((service) => (
            <li key={service.id} className="rounded-2xl border border-slate-200 bg-secondary/60 p-4">
              <div className="flex flex-col gap-1">
                <p className="text-base font-semibold text-primary">{service.title}</p>
                {service.description ? (
                  <p className="text-sm text-slate-600">{service.description}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="rounded-full bg-white/80 px-2 py-1 font-semibold uppercase tracking-wide text-primary">
                    {service.category ?? 'General'}
                  </span>
                  {service.price ? (
                    <span className="rounded-full bg-white/60 px-2 py-1 font-semibold text-primary">
                      {formats.currency(Number(service.price), { currency: service.currency ?? 'GBP' })}
                    </span>
                  ) : null}
                  {service.provider?.name ? <span>Lead provider: {service.provider.name}</span> : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}

function AccessGate({ status, copy, badge, retryLabel, loginLabel, onRetry }) {
  const isChecking = status === 'checking';
  const showRetry = status === 'error' || status === 'forbidden';
  const showLogin = status === 'unauthenticated' || status === 'forbidden';
  const Icon =
    status === 'error'
      ? ExclamationTriangleIcon
      : status === 'checking'
      ? ShieldCheckIcon
      : LockClosedIcon;

  return (
    <div className="bg-gradient-to-b from-white via-secondary/60 to-white">
      <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-24">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/95 p-12 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Icon className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{badge}</p>
          <h1 className="mt-3 text-2xl font-semibold text-primary sm:text-3xl">{copy.title}</h1>
          <p className="mt-4 text-sm text-slate-600 sm:text-base">{copy.message}</p>
          {isChecking ? (
            <div className="mt-8 flex justify-center" role="status" aria-live="polite">
              <Spinner className="h-5 w-5 text-accent" />
            </div>
          ) : (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {showRetry ? (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
                >
                  <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
                  {retryLabel}
                </button>
              ) : null}
              {showLogin ? (
                <a
                  href="/admin"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-primary transition hover:border-accent/50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  <LockClosedIcon className="h-4 w-4" aria-hidden="true" />
                  {loginLabel}
                </a>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GeoMatching() {
  const { t, format } = useLocale();
  const [accessState, setAccessState] = useState({ status: 'checking', profile: null });
  const [accessAttempt, setAccessAttempt] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [coverage, setCoverage] = useState(null);

  const demandState = useMemo(() => new Set(form.demandLevels), [form.demandLevels]);
  const accessCopy = useMemo(
    () => ({
      checking: {
        title: t('geoMatching.accessCheckingTitle', 'Confirming permissions'),
        message: t(
          'geoMatching.accessCheckingMessage',
          'Hold tight while we validate your operations administrator role and secure session.'
        )
      },
      unauthenticated: {
        title: t('geoMatching.accessUnauthenticatedTitle', 'Sign in required'),
        message: t(
          'geoMatching.accessUnauthenticatedMessage',
          'Authenticate with an operations administrator account to unlock the geo matching control surface.'
        )
      },
      forbidden: {
        title: t('geoMatching.accessForbiddenTitle', 'Operations administrator role required'),
        message: t(
          'geoMatching.accessForbiddenMessage',
          'Your profile is active, but it lacks the operations administrator role. Request elevated access from governance before proceeding.'
        )
      },
      error: {
        title: t('geoMatching.accessErrorTitle', 'We could not confirm access'),
        message: t(
          'geoMatching.accessErrorMessage',
          'An unexpected error prevented verifying your access. Retry or contact support if this continues.'
        )
      }
    }),
    [t]
  );

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleDemand = (id) => {
    setForm((current) => {
      const active = new Set(current.demandLevels);
      if (active.has(id)) {
        active.delete(id);
      } else {
        active.add(id);
      }
      if (active.size === 0) {
        active.add(id);
      }
      return { ...current, demandLevels: Array.from(active) };
    });
  };

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const latitude = toNumber(form.latitude);
      const longitude = toNumber(form.longitude);
      const radiusKm = toNumber(form.radiusKm);
      const limit = Number.parseInt(form.limit, 10);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        setError('Enter valid coordinates before running a match.');
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const payload = {
          latitude,
          longitude,
          radiusKm: Number.isFinite(radiusKm) ? radiusKm : undefined,
          limit: Number.isFinite(limit) && limit > 0 ? limit : undefined,
          demandLevels: form.demandLevels,
          categories: parseCategories(form.categories)
        };
        const matchResponse = await matchGeoServices(payload);
        setResult(matchResponse);

        try {
          const coverageResponse = await previewCoverage({ latitude, longitude, radiusKm });
          setCoverage(coverageResponse.geometry);
        } catch (previewError) {
          console.warn('[GeoMatching] coverage preview failed', previewError);
          setCoverage(null);
        }
      } catch (caught) {
        console.warn('[GeoMatching] match failed', caught);
        setError(caught.message ?? 'Unable to match services at this time.');
      } finally {
        setIsLoading(false);
      }
    },
    [form]
  );

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setAccessState((current) => ({ ...current, status: 'checking' }));

    const evaluateAccess = async () => {
      try {
        const profile = await fetchCurrentUser({ signal: controller.signal });
        if (!active) {
          return;
        }
        if (profile?.type === 'operations_admin') {
          setAccessState({ status: 'granted', profile });
        } else {
          setAccessState({ status: 'forbidden', profile });
        }
      } catch (caught) {
        if (!active || caught.name === 'AbortError') {
          return;
        }
        if (caught instanceof PanelApiError) {
          if (caught.status === 401) {
            setAccessState({ status: 'unauthenticated', profile: null });
            return;
          }
          if (caught.status === 403) {
            setAccessState({ status: 'forbidden', profile: null });
            return;
          }
        }
        setAccessState({ status: 'error', profile: null });
      }
    };

    evaluateAccess();

    return () => {
      active = false;
      controller.abort();
    };
  }, [accessAttempt]);

  const retryAccessCheck = useCallback(() => {
    setAccessAttempt((attempt) => attempt + 1);
  }, []);

  if (accessState.status !== 'granted') {
    const copy = accessCopy[accessState.status] ?? accessCopy.error;
    return (
      <AccessGate
        status={accessState.status}
        copy={copy}
        badge={t('geoMatching.badge', 'Operations Control')}
        retryLabel={t('geoMatching.accessRetryCta', 'Retry access check')}
        loginLabel={t('geoMatching.accessLoginCta', 'Go to operations login')}
        onRetry={retryAccessCheck}
      />
    );
  }

  return (
    <div className="bg-gradient-to-b from-white via-secondary/60 to-white">
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-accent text-white">
        <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden="true">
          <div className="h-full w-full bg-[radial-gradient(circle_at_top,#1F4ED8_0%,transparent_55%)]" />
        </div>
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-16 md:flex-row md:items-end">
          <div className="relative z-10 flex-1 space-y-4">
            <p className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-200">
              {t('geoMatching.badge', 'Operations Control')}
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {t('geoMatching.heroTitle', 'Geo-zonal matching for enterprise services')}
            </h1>
            <p className="max-w-2xl text-base text-slate-100 sm:text-lg">
              {t(
                'geoMatching.heroSubtitle',
                'Validate coverage, score dispatch-ready providers, and secure governance in a single control surface. This workspace mirrors production matching logic and respects all RBAC and SLA guardrails.'
              )}
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-slate-100">
              <span className="rounded-full bg-white/10 px-3 py-1 font-semibold">
                {t('geoMatching.heroPillMatching', 'Deterministic scoring engine')}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 font-semibold">
                {t('geoMatching.heroPillParity', 'Web + mobile parity assured')}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 font-semibold">
                {t('geoMatching.heroPillSecurity', 'RBAC locked to operations admins')}
              </span>
            </div>
          </div>
          <div className="relative z-10 w-full max-w-sm rounded-3xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-100">
              {t('geoMatching.guardrailTitle', 'Launch readiness checks')}
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-100">
              <li className="flex items-start gap-2">
                <span aria-hidden="true" className="mt-1 h-2 w-2 rounded-full bg-success shadow" />
                {t('geoMatching.guardrailOne', 'Token-based authentication stored client-side with rotation ready hooks.')}
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden="true" className="mt-1 h-2 w-2 rounded-full bg-success shadow" />
                {t('geoMatching.guardrailTwo', 'TLS, CSP, and helmet hardening enabled for API calls and preview endpoints.')}
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden="true" className="mt-1 h-2 w-2 rounded-full bg-success shadow" />
                {t('geoMatching.guardrailThree', 'Flutter parity shipped with matching repository + controller updates.')}
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-2">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg"
          >
            <header className="space-y-2">
              <h2 className="text-xl font-semibold text-primary">
                {t('geoMatching.formTitle', 'Calibrate a geo match request')}
              </h2>
              <p className="text-sm text-slate-500">
                {t(
                  'geoMatching.formSubtitle',
                  'Latitude and longitude drive polygon detection. Radius and demand filters align the scoring engine to your operational priorities.'
                )}
              </p>
            </header>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-primary">
                {t('geoMatching.latitudeLabel', 'Latitude')}
                <input
                  type="number"
                  step="0.0001"
                  value={form.latitude}
                  onChange={(event) => updateField('latitude', event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  required
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-primary">
                {t('geoMatching.longitudeLabel', 'Longitude')}
                <input
                  type="number"
                  step="0.0001"
                  value={form.longitude}
                  onChange={(event) => updateField('longitude', event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  required
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-primary">
                {t('geoMatching.radiusLabel', 'Search radius (km)')}
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.radiusKm}
                  onChange={(event) => updateField('radiusKm', event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-primary">
                {t('geoMatching.limitLabel', 'Max services to retrieve')}
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.limit}
                  onChange={(event) => updateField('limit', event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                />
              </label>
            </div>
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-primary">
                {t('geoMatching.demandLabel', 'Target demand tiers')}
              </legend>
              <div className="flex flex-wrap gap-3">
                {DEMAND_OPTIONS.map((option) => (
                  <DemandToggle
                    key={option.id}
                    option={option}
                    checked={demandState.has(option.id)}
                    onChange={toggleDemand}
                  />
                ))}
              </div>
            </fieldset>
            <label className="flex flex-col gap-2 text-sm font-medium text-primary">
              {t('geoMatching.categoriesLabel', 'Restrict to categories (optional)')}
              <textarea
                rows={2}
                value={form.categories}
                onChange={(event) => updateField('categories', event.target.value)}
                placeholder={t('geoMatching.categoriesPlaceholder', 'eg. electrical, hvac, fabrication')}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              />
              <span className="text-xs text-slate-500">
                {t('geoMatching.categoriesHelp', 'Comma-separated list. Leave blank to include all service catalogues within the detected zones.')}
              </span>
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
                disabled={isLoading}
              >
                {isLoading ? <Spinner className="h-4 w-4" /> : null}
                {t('geoMatching.submitCta', 'Run enterprise match')}
              </button>
              <p className="text-xs text-slate-500">
                {t('geoMatching.secureNotice', 'Only operations administrators with an active session token can execute live matches.')}
              </p>
            </div>
            {error ? (
              <div className="rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </div>
            ) : null}
          </form>

          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg">
              <header className="mb-4 space-y-2">
                <h2 className="text-xl font-semibold text-primary">
                  {t('geoMatching.resultTitle', 'Match intelligence')}
                </h2>
                <p className="text-sm text-slate-500">
                  {t(
                    'geoMatching.resultSubtitle',
                    'Scores are weighted by demand tier, distance to centroid, and the availability of compliant programmes. Enterprise guardrails apply automatically.'
                  )}
                </p>
              </header>
              {isLoading ? (
                <div className="flex min-h-[12rem] items-center justify-center" role="status" aria-live="polite">
                  <Spinner className="h-6 w-6 text-accent" />
                  <span className="ml-3 text-sm text-slate-500">{t('geoMatching.loading', 'Evaluating zones…')}</span>
                </div>
              ) : null}
              {!isLoading && result?.matches?.length > 0 ? (
                <div className="space-y-5">
                  <div className="grid gap-5">
                    {result.matches.map((match) => (
                      <MatchResultCard key={match.zone.id} match={match} formats={format} />
                    ))}
                  </div>
                  <footer className="rounded-2xl border border-accent/20 bg-secondary/80 p-4 text-xs text-slate-600">
                    <p className="font-semibold text-primary">
                      {t('geoMatching.auditTitle', 'Audit trail')}
                    </p>
                    <p>
                      {t('geoMatching.auditSummary', '{count} services surfaced across {zones} zone(s). Coverage window computed at {timestamp}.', {
                        count: result.totalServices ?? 0,
                        zones: result.matches.length,
                        timestamp: format.dateTime(result.auditedAt)
                      })}
                    </p>
                    {result.fallback ? (
                      <p className="mt-2 text-slate-500">
                        {t('geoMatching.fallbackNotice', 'Fallback engaged: {reason}', {
                          reason:
                            result.fallback.reason === 'closest-zone-projected'
                              ? t(
                                  'geoMatching.fallbackClosest',
                                  'Point outside all polygons. Selected nearest compliant zone.'
                                )
                              : result.fallback.reason
                        })}
                      </p>
                    ) : null}
                  </footer>
                </div>
              ) : null}
              {!isLoading && !result ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-secondary/60 p-6 text-sm text-slate-500">
                  {t(
                    'geoMatching.emptyState',
                    'Submit a location to surface weighted matches. Results appear here with demand context, scoring, and governance notes.'
                  )}
                </div>
              ) : null}
              {!isLoading && result?.matches?.length === 0 && result ? (
                <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4 text-sm text-slate-600">
                  {t(
                    'geoMatching.noMatches',
                    'No zones intersected the provided coordinates. The engine expanded to the closest configured polygon so you can sanity check readiness.'
                  )}
                </div>
              ) : null}
            </section>
            <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg">
              <header className="mb-4 space-y-2">
                <h2 className="text-xl font-semibold text-primary">
                  {t('geoMatching.coverageTitle', 'Coverage window preview')}
                </h2>
                <p className="text-sm text-slate-500">
                  {t(
                    'geoMatching.coverageSubtitle',
                    'Bounding box coordinates help operations teams compare dispatch radiuses between web and mobile clients. Flutter mirrors this payload for map overlays.'
                  )}
                </p>
              </header>
              {coverage ? (
                <pre className="overflow-auto rounded-2xl bg-secondary/70 p-4 text-xs text-slate-600">
                  {JSON.stringify(coverage, null, 2)}
                </pre>
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-secondary/60 p-4 text-sm text-slate-500">
                  {t('geoMatching.coverageEmpty', 'Run a match to generate the GeoJSON bounding polygon used by our map layers and Flutter widgets.')}
                </p>
              )}
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
