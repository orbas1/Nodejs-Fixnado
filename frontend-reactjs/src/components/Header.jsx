import { Fragment, useMemo, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Bars3Icon, UserCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import clsx from 'clsx';
import { LOGO_URL } from '../constants/branding';
import { useLocale } from '../hooks/useLocale.js';
import { useSession } from '../hooks/useSession.js';
import { useProfile } from '../hooks/useProfile.js';
import LanguageSelector from './LanguageSelector.jsx';
import { buildMobileNavigation, buildPrimaryNavigation } from '../constants/navigationConfig.js';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLocale();
  const { isAuthenticated, dashboards } = useSession();
  const { profile } = useProfile();

  const { firstName, lastName, email } = profile ?? {};

  const primaryNavigation = useMemo(
    () => buildPrimaryNavigation({ dashboards, isAuthenticated }),
    [dashboards, isAuthenticated]
  );

  const mobileNavigation = useMemo(
    () => buildMobileNavigation({ dashboards, isAuthenticated }),
    [dashboards, isAuthenticated]
  );

  const hasPrimaryNavigation = primaryNavigation.length > 0;
  const dashboardLink = primaryNavigation.find((link) => link.id === 'dashboards')?.href ?? '/dashboards';
  const loginLink = '/login';

  const accountDisplayName = useMemo(() => {
    if (!isAuthenticated) {
      return '';
    }

    const safeFirst = typeof firstName === 'string' ? firstName.trim() : '';
    const safeLast = typeof lastName === 'string' ? lastName.trim() : '';
    if (safeFirst || safeLast) {
      return [safeFirst, safeLast].filter(Boolean).join(' ');
    }

    const safeEmail = typeof email === 'string' ? email.trim() : '';
    return safeEmail;
  }, [email, firstName, isAuthenticated, lastName]);

  const accountInitials = useMemo(() => {
    if (!isAuthenticated) {
      return 'FX';
    }

    const safeFirst = typeof firstName === 'string' ? firstName.trim() : '';
    const safeLast = typeof lastName === 'string' ? lastName.trim() : '';
    const combinedInitials = `${safeFirst ? safeFirst[0] : ''}${safeLast ? safeLast[0] : ''}`.trim();
    if (combinedInitials) {
      return combinedInitials.toUpperCase();
    }

    const safeEmail = typeof email === 'string' ? email.trim() : '';
    if (safeEmail) {
      return safeEmail.slice(0, 2).toUpperCase();
    }

    if (accountDisplayName) {
      return accountDisplayName.slice(0, 2).toUpperCase();
    }

    return 'FX';
  }, [accountDisplayName, email, firstName, isAuthenticated, lastName]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <div className="flex items-center gap-4">
          {hasPrimaryNavigation ? (
            <button
              type="button"
              className="inline-flex rounded-full border border-slate-200 bg-white p-2 text-slate-600 hover:border-accent/40 hover:text-accent lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label={t('nav.toggleMenu')}
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
          ) : null}
          <Link to="/" className="flex items-center gap-3" aria-label="Fixnado home">
            <img src={LOGO_URL} alt="Fixnado" className="h-10 w-auto" />
          </Link>
        </div>

        {hasPrimaryNavigation ? (
          <nav className="hidden flex-1 items-center justify-center gap-3 lg:flex">
            {primaryNavigation.map((item) => (
              <NavLink
                key={item.id}
                to={item.href}
                className={({ isActive }) =>
                  clsx(
                    'rounded-full px-5 py-2 text-sm font-semibold transition',
                    isActive
                      ? 'bg-accent text-white shadow-glow'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        ) : null}

        <div className="flex items-center gap-3">
          {!isAuthenticated ? <LanguageSelector /> : null}

          {isAuthenticated ? (
            <Link
              to={dashboardLink}
              className="hidden rounded-full border border-accent/40 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/10 lg:inline-flex"
            >
              {t('nav.viewDashboard')}
            </Link>
          ) : (
            <NavLink
              to="/register"
              className={({ isActive }) =>
                clsx(
                  'hidden rounded-full border border-accent/40 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/10 lg:inline-flex',
                  isActive ? 'bg-accent text-white hover:bg-accent/90' : 'bg-white'
                )
              }
            >
              {t('nav.register')}
            </NavLink>
          )}

          {isAuthenticated ? (
            <Link
              to="/account/profile"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-semibold uppercase text-white shadow-lg shadow-accent/30"
              aria-label={t('nav.accountMenu')}
              title={accountDisplayName || t('nav.accountMenu')}
            >
              <span className="sr-only">{accountDisplayName || t('nav.accountMenu')}</span>
              {accountInitials}
            </Link>
          ) : (
            <NavLink
              to={loginLink}
              className={({ isActive }) =>
                clsx(
                  'inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent/50 hover:text-accent',
                  isActive ? 'border-accent text-accent' : null
                )
              }
            >
              <UserCircleIcon className="h-5 w-5" />
              <span>{t('nav.login')}</span>
            </NavLink>
          )}
        </div>
      </div>

      <Transition.Root show={mobileOpen && hasPrimaryNavigation} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setMobileOpen}>
          <Transition.Child
            as={Fragment}
            enter="duration-150 ease-out"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="duration-150 ease-in"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-950/40" />
          </Transition.Child>

          <div className="fixed inset-0 z-50 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-out duration-150"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in duration-150"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-80 flex-col gap-6 overflow-y-auto border-r border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between">
                  <Link to="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
                    <img src={LOGO_URL} alt="Fixnado" className="h-10 w-auto" />
                  </Link>
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 hover:border-accent/40 hover:text-accent"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close menu"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <nav className="space-y-3">
                  {mobileNavigation.map((item) => (
                    <Link
                      key={item.id}
                      to={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-accent/40 hover:text-accent"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                <div className="mt-auto flex items-center justify-between border-t border-slate-200 pt-4 text-sm font-semibold text-slate-600">
                  {isAuthenticated ? accountDisplayName : t('nav.login')}
                  <LanguageSelector variant="menu" className="w-28" />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </header>
  );
}
