import { Fragment, useMemo, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  Bars3Icon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  UserCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Popover, Transition, Dialog } from '@headlessui/react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { LOGO_URL } from '../constants/branding';
import { useLocale } from '../hooks/useLocale.js';
import { useSession } from '../hooks/useSession.js';
import LanguageSelector from './LanguageSelector.jsx';
import { buildMobileNavigation, buildPrimaryNavigation } from '../constants/navigationConfig.js';

const notificationPreview = [
  {
    id: 'ops-1',
    title: 'Escrow verification cleared',
    body: 'Dispute #4830 resolved. Funds released to provider.',
    timeAgo: '12m'
  },
  {
    id: 'ops-2',
    title: 'Geo zone insights',
    body: 'Southbank crane requests increased 18% week-on-week.',
    timeAgo: '2h'
  }
];

const inboxPreview = [
  {
    id: 'inbox-1',
    sender: 'Operations HQ',
    snippet: 'Dispatch confirmed for Tuesday 07:30 with backup crew on-call.',
    href: '/communications?thread=operations'
  },
  {
    id: 'inbox-2',
    sender: 'Finance automation',
    snippet: 'Reminder: approve payout batch FNA-372 before Friday.',
    href: '/communications?thread=finance'
  }
];

const MobileLink = ({ title, description, href, onNavigate }) => (
  <Link
    to={href}
    onClick={onNavigate}
    className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:border-accent/40 hover:shadow-lg"
  >
    <p className="text-sm font-semibold text-slate-900">{title}</p>
    {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
  </Link>
);

MobileLink.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  href: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired
};

MobileLink.defaultProps = {
  description: null
};

function MegaMenuSection({ section }) {
  return (
    <div className="grid gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{section.label}</p>
        <p className="mt-1 text-sm text-slate-500">{section.description}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {section.items.map((item) => (
          <NavLink
            key={item.id}
            to={item.href}
            className={({ isActive }) =>
              clsx(
                'group flex h-full flex-col justify-between rounded-2xl border p-4 transition',
                isActive
                  ? 'border-accent/60 bg-accent/10 text-accent'
                  : 'border-slate-200 bg-white hover:border-accent/30 hover:shadow-glow'
              )
            }
          >
            <div>
              <p className="text-sm font-semibold text-slate-900 group-hover:text-accent">{item.title}</p>
              <p className="mt-2 text-xs text-slate-500 group-hover:text-slate-600">{item.description}</p>
            </div>
            <span className="mt-4 text-xs font-semibold uppercase tracking-wide text-accent/70 group-hover:text-accent">
              Explore
            </span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

MegaMenuSection.propTypes = {
  section: PropTypes.shape({
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        description: PropTypes.string,
        href: PropTypes.string.isRequired
      })
    ).isRequired
  }).isRequired
};

function NotificationTray({ title, emptyLabel, items }) {
  return (
    <div className="w-[22rem] rounded-3xl border border-slate-200 bg-white p-5 shadow-xl ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <Link to="/communications" className="text-xs font-semibold text-accent hover:text-accent/80">
          View all
        </Link>
      </div>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-xs text-slate-500">{emptyLabel}</p>
        ) : (
          items.map((item) => (
            <Link key={item.id} to={item.href ?? '#'} className="group block rounded-2xl border border-slate-200 p-3 hover:border-accent/30">
              <p className="text-xs font-semibold text-slate-900 group-hover:text-accent">{item.title ?? item.sender}</p>
              <p className="mt-1 text-xs text-slate-500">{item.body ?? item.snippet}</p>
              {item.timeAgo ? (
                <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">{item.timeAgo}</p>
              ) : null}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

NotificationTray.propTypes = {
  title: PropTypes.string.isRequired,
  emptyLabel: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string,
      sender: PropTypes.string,
      body: PropTypes.string,
      snippet: PropTypes.string,
      href: PropTypes.string,
      timeAgo: PropTypes.string
    })
  ).isRequired
};

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLocale();
  const { isAuthenticated, dashboards } = useSession();
  const showAuthenticatedNavigation = Boolean(isAuthenticated);

  const primaryNavigation = useMemo(
    () => buildPrimaryNavigation({ t, dashboards }),
    [dashboards, t]
  );

  const mobileNavigation = useMemo(
    () => buildMobileNavigation({ t, dashboards, isAuthenticated }),
    [dashboards, isAuthenticated, t]
  );

  const activeDashboard = dashboards?.[0] ?? 'user';
  const accountLink = isAuthenticated ? `/dashboards/${activeDashboard}` : '/login';
  const accountLabel = isAuthenticated ? t('nav.viewDashboard') : t('nav.login');

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 lg:px-6">
        <div className="flex items-center gap-4">
          {showAuthenticatedNavigation ? (
            <button
              type="button"
              className="inline-flex rounded-full border border-slate-200 bg-white p-2 text-slate-600 hover:border-accent/40 hover:text-accent lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label={t('nav.toggleMenu')}
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
          ) : null}
          <Link to="/" className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Fixnado" className="h-10 w-auto" />
          </Link>
        </div>

        {showAuthenticatedNavigation ? (
          <nav className="hidden flex-1 items-center justify-center gap-6 lg:flex">
            {primaryNavigation.map((section) => (
              <Popover className="relative" key={section.id}>
                {({ open }) => (
                  <>
                    <Popover.Button
                      className={clsx(
                        'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition',
                        open
                          ? 'bg-accent/10 text-accent shadow-glow'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      )}
                    >
                      <span>{section.label}</span>
                      <ChevronDownIcon className={clsx('h-4 w-4 transition-transform', open ? 'rotate-180' : 'rotate-0')} />
                    </Popover.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-150"
                      enterFrom="opacity-0 translate-y-1"
                      enterTo="opacity-100 translate-y-0"
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100 translate-y-0"
                      leaveTo="opacity-0 translate-y-1"
                    >
                      <Popover.Panel className="absolute left-1/2 mt-6 w-screen max-w-3xl -translate-x-1/2 px-4">
                        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl">
                          <MegaMenuSection section={section} />
                        </div>
                      </Popover.Panel>
                    </Transition>
                  </>
                )}
              </Popover>
            ))}
          </nav>
        ) : null}

        <div className="flex items-center gap-3">
          {showAuthenticatedNavigation ? (
            <>
              <Popover className="hidden lg:block">
                <Popover.Button className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-accent/40 hover:text-accent">
                  <span className="sr-only">{t('nav.notifications')}</span>
                  <BellIcon className="h-5 w-5" />
                </Popover.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-150"
                  enterFrom="opacity-0 translate-y-1"
                  enterTo="opacity-100 translate-y-0"
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 translate-y-1"
                >
                  <Popover.Panel className="absolute right-0 mt-4">
                    <NotificationTray
                      title={t('nav.notifications')}
                      emptyLabel={t('nav.notificationsEmpty')}
                      items={notificationPreview}
                    />
                  </Popover.Panel>
                </Transition>
              </Popover>

              <Popover className="hidden lg:block">
                <Popover.Button className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-accent/40 hover:text-accent">
                  <span className="sr-only">{t('nav.inbox')}</span>
                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                </Popover.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-150"
                  enterFrom="opacity-0 translate-y-1"
                  enterTo="opacity-100 translate-y-0"
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 translate-y-1"
                >
                  <Popover.Panel className="absolute right-0 mt-4">
                    <NotificationTray
                      title={t('nav.inbox')}
                      emptyLabel={t('nav.inboxEmpty')}
                      items={inboxPreview}
                    />
                  </Popover.Panel>
                </Transition>
              </Popover>
            </>
          ) : null}

          <LanguageSelector />

          <NavLink
            to={accountLink}
            className={({ isActive }) =>
              clsx(
                'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition',
                isActive
                  ? 'border-accent bg-accent text-white shadow-glow'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-accent/50 hover:text-accent'
              )
            }
          >
            <UserCircleIcon className="h-5 w-5" />
            <span>{accountLabel}</span>
          </NavLink>
        </div>
      </div>

      <Transition.Root show={mobileOpen && showAuthenticatedNavigation} as={Fragment}>
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
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Fixnado</span>
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

                <div className="space-y-4">
                  {primaryNavigation.map((section) => (
                    <div key={section.id} className="space-y-3">
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{section.label}</p>
                      <div className="grid gap-3">
                        {section.items.map((item) => (
                          <MobileLink
                            key={item.id}
                            title={item.title}
                            description={item.description}
                            href={item.href}
                            onNavigate={() => setMobileOpen(false)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-auto space-y-3 border-t border-slate-200 pt-4">
                  <MobileLink
                    title={accountLabel}
                    description={isAuthenticated ? t('nav.workspacesDescription') : t('auth.login.cta')}
                    href={accountLink}
                    onNavigate={() => setMobileOpen(false)}
                  />
                  {mobileNavigation
                    .filter((item) => item.href !== accountLink)
                    .map((item) => (
                      <MobileLink
                        key={item.id}
                        title={item.title}
                        description={item.description}
                        href={item.href}
                        onNavigate={() => setMobileOpen(false)}
                      />
                    ))}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </header>
  );
}
