import { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLocale } from '../hooks/useLocale.js';
import { useSession } from '../hooks/useSession.js';
import { reportClientError } from '../utils/errorReporting.js';

const SUPPORT_EMAIL = 'support@fixnado.com';

export default function NotFound() {
  const { t } = useLocale();
  const location = useLocation();
  const { isAuthenticated } = useSession();

  const reference = useMemo(() => `404-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, []);

  useEffect(() => {
    const payload = {
      reference,
      boundaryId: 'route-miss',
      error: {
        name: 'NotFoundError',
        message: `Route not found: ${location.pathname}`
      },
      metadata: {
        path: location.pathname,
        search: location.search || null,
        authenticated: isAuthenticated
      }
    };

    reportClientError(payload).catch(() => {});
  }, [location.pathname, location.search, isAuthenticated, reference]);

  const primaryActions = useMemo(() => {
    if (isAuthenticated) {
      return [
        { label: t('notFound.actions.dashboard'), to: '/dashboards' },
        { label: t('notFound.actions.supportCentre'), to: '/communications' }
      ];
    }

    return [
      { label: t('notFound.actions.home'), to: '/' },
      { label: t('notFound.actions.explore'), to: '/search' }
    ];
  }, [isAuthenticated, t]);

  const secondaryLinks = useMemo(() => (
    [
      { label: t('notFound.secondary.privacy'), to: '/privacy' },
      { label: t('notFound.secondary.terms'), to: '/legal/terms' },
      { label: t('notFound.secondary.contact'), href: `mailto:${SUPPORT_EMAIL}` }
    ]
  ), [t]);

  return (
    <section className="relative mx-auto flex min-h-[70vh] w-full max-w-6xl flex-col justify-center gap-12 px-6 py-16 lg:flex-row lg:items-center lg:gap-20">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-900 via-slate-950 to-sky-900/80 opacity-90" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_55%)]" aria-hidden="true" />
      <div className="max-w-xl rounded-3xl border border-white/10 bg-white/5 p-10 text-white shadow-[0_50px_120px_-50px_rgba(45,212,191,0.7)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-300">{t('notFound.code')}</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white" data-qa="not-found-title">
          {t('notFound.title')}
        </h1>
        <p className="mt-6 text-sm leading-relaxed text-slate-200">
          {t('notFound.description', { path: location.pathname })}
        </p>
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-xs text-slate-300">
          <p className="font-semibold text-slate-100">{t('notFound.reference')}</p>
          <p className="mt-2 font-mono tracking-wide text-slate-200">{reference}</p>
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          {primaryActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-6 py-3 text-sm font-semibold tracking-wide text-white transition hover:bg-sky-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-300"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
      <aside className="max-w-sm rounded-3xl border border-white/10 bg-white/80 p-8 text-slate-900 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.9)]">
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
          {t('notFound.secondary.title')}
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          {t('notFound.secondary.description', { email: SUPPORT_EMAIL })}
        </p>
        <ul className="mt-6 space-y-3 text-sm text-slate-700">
          {secondaryLinks.map((link) => (
            <li key={link.label}>
              {link.to ? (
                <Link
                  to={link.to}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 font-medium text-slate-800 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  href={link.href}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 font-medium text-slate-800 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  {link.label}
                </a>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-8 rounded-2xl bg-slate-900/5 px-4 py-3 text-xs text-slate-600">
          <p className="font-semibold text-slate-700">{t('notFound.auditTrail.title')}</p>
          <p className="mt-1 leading-relaxed">{t('notFound.auditTrail.copy')}</p>
        </div>
      </aside>
    </section>
  );
}
