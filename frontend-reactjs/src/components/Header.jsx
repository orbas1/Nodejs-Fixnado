import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Bars3Icon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Dialog, Menu, Popover, Transition } from '@headlessui/react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { LOGO_URL } from '../constants/branding';
import { useLocale } from '../hooks/useLocale.js';
import { useSession } from '../hooks/useSession.js';
import { useProfile } from '../hooks/useProfile.js';
import LanguageSelector from './LanguageSelector.jsx';
import { buildMobileNavigation, buildPrimaryNavigation } from '../constants/navigationConfig.js';
import { buildCommandSuggestions, buildQuickLinks } from '../constants/globalShellConfig.js';

function normaliseTrayItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item, index) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const id = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `item-${index}`;
      const href = typeof item.href === 'string' && item.href.trim() ? item.href.trim() : null;
      const title =
        typeof item.title === 'string' && item.title.trim()
          ? item.title.trim()
          : typeof item.headline === 'string' && item.headline.trim()
          ? item.headline.trim()
          : null;
      const sender = typeof item.sender === 'string' && item.sender.trim() ? item.sender.trim() : null;
      const body =
        typeof item.body === 'string' && item.body.trim()
          ? item.body.trim()
          : typeof item.description === 'string' && item.description.trim()
          ? item.description.trim()
          : typeof item.snippet === 'string' && item.snippet.trim()
          ? item.snippet.trim()
          : null;
      const timeAgo = typeof item.timeAgo === 'string' && item.timeAgo.trim() ? item.timeAgo.trim() : null;

      if (!title && !sender && !body) {
        return null;
      }

      return {
        id,
        title,
        sender,
        body,
        snippet: typeof item.snippet === 'string' && item.snippet.trim() ? item.snippet.trim() : null,
        href,
        timeAgo
      };
    })
    .filter(Boolean);
}

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
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">{section.label}</p>
        {section.description ? <p className="text-sm text-slate-500">{section.description}</p> : null}
      </div>
      <div className="grid gap-3">
        {section.items.map((item) => (
          <NavLink
            key={item.id}
            to={item.href}
            className={({ isActive }) =>
              clsx(
                'group flex flex-col rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 transition hover:border-accent/40',
                isActive
                  ? 'border-accent/60 text-accent shadow-sm'
                  : 'text-slate-900 hover:text-accent'
              )
            }
          >
            <span className="text-sm font-semibold">{item.title}</span>
            {item.description ? (
              <span className="mt-1 text-xs text-slate-500 transition group-hover:text-slate-600">{item.description}</span>
            ) : null}
          </NavLink>
        ))}
      </div>
    </section>
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

function NotificationTray({ title, emptyLabel, items, viewAllHref }) {
  return (
    <div className="w-[22rem] rounded-3xl border border-slate-200 bg-white p-5 shadow-xl ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {viewAllHref ? (
          <Link to={viewAllHref} className="text-xs font-semibold text-accent hover:text-accent/80">
            View all
          </Link>
        ) : null}
      </div>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-xs text-slate-500">{emptyLabel}</p>
        ) : (
          items.map((item) =>
            item.href ? (
              <Link
                key={item.id}
                to={item.href}
                className="group block rounded-2xl border border-slate-200 p-3 transition hover:border-accent/30 hover:text-accent"
              >
                <p className="text-xs font-semibold text-slate-900 group-hover:text-accent">{item.title ?? item.sender}</p>
                {item.body ?? item.snippet ? (
                  <p className="mt-1 text-xs text-slate-500 group-hover:text-slate-600">{item.body ?? item.snippet}</p>
                ) : null}
                {item.timeAgo ? (
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">{item.timeAgo}</p>
                ) : null}
              </Link>
            ) : (
              <div key={item.id} className="rounded-2xl border border-slate-200 p-3">
                <p className="text-xs font-semibold text-slate-900">{item.title ?? item.sender}</p>
                {item.body ?? item.snippet ? <p className="mt-1 text-xs text-slate-500">{item.body ?? item.snippet}</p> : null}
                {item.timeAgo ? (
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">{item.timeAgo}</p>
                ) : null}
              </div>
            )
          )
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
  ).isRequired,
  viewAllHref: PropTypes.string
};

NotificationTray.defaultProps = {
  viewAllHref: null
};

function TrayPopover({ icon: Icon, label, badgeCount, children }) {
  return (
    <Popover className="relative hidden lg:block">
      {({ open }) => (
        <>
          <Popover.Button
            className={clsx(
              'relative inline-flex h-11 w-11 items-center justify-center rounded-full border text-slate-600 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              open ? 'border-accent/60 bg-accent/10 text-accent' : 'border-slate-200 bg-white hover:border-accent/40 hover:text-accent'
            )}
          >
            <span className="sr-only">{label}</span>
            <Icon className="h-5 w-5" aria-hidden="true" />
            {typeof badgeCount === 'number' && badgeCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
                {badgeCount > 9 ? '9+' : badgeCount}
              </span>
            ) : null}
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
            <Popover.Panel className="absolute right-0 z-30 mt-4 origin-top-right">
              {children}
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
}

TrayPopover.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  badgeCount: PropTypes.number,
  children: PropTypes.node.isRequired
};

TrayPopover.defaultProps = {
  badgeCount: null
};

function CommandBar({ placeholder, shortcutHint, suggestions, onSubmit, layout, className }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const descriptionId = useId();
  const datalistId = useId();

  useEffect(() => {
    const handleShortcut = (event) => {
      if (event.defaultPrevented) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (event.key !== '/') {
        return;
      }

      const targetTag = event.target?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea') {
        return;
      }

      event.preventDefault();
      inputRef.current?.focus();
    };

    window.addEventListener('keydown', handleShortcut);
    return () => {
      window.removeEventListener('keydown', handleShortcut);
    };
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(query);
  };

  const form = (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 shadow-sm transition focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/40"
    >
      <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        type="search"
        className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
        aria-label={placeholder}
        aria-describedby={descriptionId}
        list={suggestions.length ? datalistId : undefined}
      />
      {suggestions.length ? (
        <datalist id={datalistId}>
          {suggestions.map((item) => (
            <option key={item.id} value={item.query}>
              {item.label}
            </option>
          ))}
        </datalist>
      ) : null}
    </form>
  );

  const accessibilityHint = (
    <p className="sr-only" id={descriptionId}>
      {shortcutHint}
    </p>
  );

  if (layout === 'inline') {
    return (
      <div className={clsx('flex flex-1 flex-col gap-1', className)}>
        {accessibilityHint}
        {form}
      </div>
    );
  }

  return (
    <section className={clsx('flex flex-col gap-4 rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur', className)}>
      {accessibilityHint}
      {form}
    </section>
  );
}

CommandBar.propTypes = {
  placeholder: PropTypes.string.isRequired,
  shortcutHint: PropTypes.string.isRequired,
  suggestions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      query: PropTypes.string.isRequired
    })
  ),
  onSubmit: PropTypes.func.isRequired,
  layout: PropTypes.oneOf(['panel', 'inline']),
  className: PropTypes.string
};

CommandBar.defaultProps = {
  layout: 'panel',
  className: '',
  suggestions: []
};

function QuickLinks({ items, title, subtitle, currentPath, onNavigate }) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">{title}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath.startsWith(item.activeMatch ?? '');
          return (
            <NavLink
              key={item.id}
              to={item.href}
              onClick={onNavigate ?? null}
              className={({ isActive: navActive }) =>
                clsx(
                  'group flex items-center gap-3 rounded-2xl border bg-white/90 px-4 py-3 text-left transition',
                  navActive || isActive || (item.matchPaths && item.matchPaths.some((match) => currentPath.startsWith(match)))
                    ? 'border-accent/60 text-accent shadow-sm'
                    : 'border-slate-200 text-slate-700 hover:border-accent/40 hover:text-accent'
                )
              }
            >
              {Icon ? (
                <span
                  className={clsx(
                    'flex h-12 w-12 items-center justify-center rounded-2xl text-lg transition group-hover:scale-105',
                    item.accentBackground ?? 'bg-slate-100 text-slate-500'
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
              ) : null}
              <span className="flex flex-col">
                <span className="text-sm font-semibold">{item.title}</span>
                {item.description ? (
                  <span className="mt-1 text-xs text-slate-500 transition group-hover:text-slate-600">{item.description}</span>
                ) : null}
              </span>
            </NavLink>
          );
        })}
      </div>
    </section>
  );
}

QuickLinks.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      href: PropTypes.string.isRequired,
      activeMatch: PropTypes.string,
      icon: PropTypes.elementType,
      matchPaths: PropTypes.arrayOf(PropTypes.string),
      accentBackground: PropTypes.string
    })
  ).isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  currentPath: PropTypes.string.isRequired,
  onNavigate: PropTypes.func
};

QuickLinks.defaultProps = {
  onNavigate: null
};

function DesktopNavigation({ menus, currentPath }) {
  if (!menus.length) {
    return null;
  }

  return (
    <nav className="flex flex-1 items-center gap-2">
      {menus.map((menu) => (
        <Popover key={menu.id} className="relative">
          {({ open }) => (
            <>
              <Popover.Button
                className={clsx(
                  'inline-flex items-center gap-1 rounded-full border border-transparent bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                  open
                    ? 'border-accent/40 text-accent shadow-sm'
                    : 'hover:border-accent/40 hover:text-accent'
                )}
              >
                <span>{menu.label}</span>
                <ChevronDownIcon className={clsx('h-4 w-4 transition', open ? 'rotate-180 text-accent' : 'text-slate-400')} />
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
                <Popover.Panel className="absolute left-1/2 top-full z-30 mt-4 w-[min(68rem,calc(100vw-2rem))] -translate-x-1/2">
                  <div
                    className={clsx(
                      'grid gap-6 rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-2xl backdrop-blur',
                      menu.quickLinks?.length
                        ? 'lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]'
                        : 'lg:grid-cols-1'
                    )}
                  >
                    <div className="grid gap-6 lg:grid-cols-2">
                      {menu.sections.map((section) => (
                        <MegaMenuSection key={section.id ?? section.label} section={section} />
                      ))}
                    </div>
                    {menu.quickLinks?.length ? (
                      <QuickLinks
                        items={menu.quickLinks}
                        title={menu.quickLinksTitle}
                        subtitle={menu.quickLinksSubtitle}
                        currentPath={currentPath}
                      />
                    ) : null}
                  </div>
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>
      ))}
    </nav>
  );
}

DesktopNavigation.propTypes = {
  menus: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      sections: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          label: PropTypes.string.isRequired,
          description: PropTypes.string,
          items: PropTypes.array.isRequired
        }).isRequired
      ).isRequired,
      quickLinks: PropTypes.array,
      quickLinksTitle: PropTypes.string,
      quickLinksSubtitle: PropTypes.string
    })
  ).isRequired,
  currentPath: PropTypes.string.isRequired
};

function AccountMenu({
  isAuthenticated,
  accountInitials,
  accountMenuLabel,
  accountMenuTitle,
  email,
  t,
  loginLink,
  dashboards
}) {
  if (!isAuthenticated) {
    return (
      <NavLink
        to={loginLink}
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
        <span>{t('nav.login')}</span>
      </NavLink>
    );
  }

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        aria-label={accountMenuLabel}
        title={accountMenuTitle}
        className="inline-flex h-12 w-12 items-center justify-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent hover:bg-slate-100"
      >
        <span className="sr-only">{accountMenuLabel}</span>
        <span
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-semibold uppercase text-white shadow-lg shadow-accent/30"
        >
          {accountInitials}
        </span>
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-100"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-3 w-72 origin-top-right rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl focus:outline-none">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-semibold uppercase text-white shadow-lg shadow-accent/30">
              {accountInitials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{accountMenuTitle}</p>
              {email ? <p className="truncate text-xs text-slate-500">{email}</p> : null}
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Menu.Item>
              {({ active }) => (
                <NavLink
                  to={`/dashboards/${dashboards?.[0] ?? 'user'}`}
                  className={clsx(
                    'flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition',
                    active
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-slate-200 text-slate-700 hover:border-accent/40 hover:text-accent'
                  )}
                >
                  {t('nav.viewDashboard')}
                  <ChevronDownIcon className="h-4 w-4 -rotate-90" />
                </NavLink>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <NavLink
                  to="/account/profile"
                  className={clsx(
                    'flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition',
                    active
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-slate-200 text-slate-700 hover:border-accent/40 hover:text-accent'
                  )}
                >
                  {t('nav.profile')}
                  <ChevronDownIcon className="h-4 w-4 -rotate-90" />
                </NavLink>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <NavLink
                  to="/logout"
                  className={clsx(
                    'flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition',
                    active
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-slate-200 text-slate-700 hover:border-accent/40 hover:text-accent'
                  )}
                >
                  {t('nav.logout')}
                  <ChevronDownIcon className="h-4 w-4 -rotate-90" />
                </NavLink>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

AccountMenu.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired,
  accountInitials: PropTypes.string.isRequired,
  accountMenuLabel: PropTypes.string.isRequired,
  accountMenuTitle: PropTypes.string.isRequired,
  email: PropTypes.string,
  t: PropTypes.func.isRequired,
  loginLink: PropTypes.string.isRequired,
  dashboards: PropTypes.arrayOf(PropTypes.string)
};

AccountMenu.defaultProps = {
  email: null,
  dashboards: []
};

export default function Header({ notifications, inboxItems }) {
  const { t } = useLocale();
  const { data: session } = useSession();
  const { profile } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthenticated = Boolean(session?.isAuthenticated);
  const sessionDashboards = session?.dashboards;
  const dashboards = useMemo(
    () => (Array.isArray(sessionDashboards) ? sessionDashboards : []),
    [sessionDashboards]
  );
  const accountDisplayName = profile?.name ?? session?.user?.name ?? null;
  const firstName = profile?.firstName ?? session?.user?.firstName;
  const lastName = profile?.lastName ?? session?.user?.lastName;
  const email = profile?.email ?? session?.user?.email ?? null;

  const primaryNavigation = useMemo(
    () => buildPrimaryNavigation({ t, dashboards }),
    [t, dashboards]
  );
  const mobileNavigation = useMemo(
    () => buildMobileNavigation({ t, dashboards, isAuthenticated }),
    [t, dashboards, isAuthenticated]
  );
  const commandSuggestions = useMemo(() => buildCommandSuggestions(t), [t]);
  const quickLinks = useMemo(
    () => buildQuickLinks({ t, isAuthenticated }),
    [t, isAuthenticated]
  );
  const normalisedNotifications = useMemo(() => normaliseTrayItems(notifications), [notifications]);
  const normalisedInbox = useMemo(() => normaliseTrayItems(inboxItems), [inboxItems]);

  const desktopMenus = useMemo(() => {
    if (!primaryNavigation.length) {
      return [];
    }

    const sectionMap = new Map(primaryNavigation.map((section) => [section.id, section]));

    const quickLinksById = new Map(quickLinks.map((link) => [link.id, link]));

    const discoverSections = ['explorer', 'resources']
      .map((id) => sectionMap.get(id))
      .filter(Boolean);

    const workspaceSections = ['workspaces', 'solutions']
      .map((id) => sectionMap.get(id))
      .filter(Boolean);

    const discoverQuickLinks = ['feed', 'search', 'providers']
      .map((id) => quickLinksById.get(id))
      .filter(Boolean);

    const workspaceQuickLinks = ['communications', 'dashboards', 'login']
      .map((id) => quickLinksById.get(id))
      .filter(Boolean);

    const menus = [];

    if (discoverSections.length) {
      menus.push({
        id: 'discover',
        label: t('nav.menu.discover'),
        sections: discoverSections,
        quickLinks: discoverQuickLinks,
        quickLinksTitle: t('nav.quickLinks.title'),
        quickLinksSubtitle: t('nav.quickLinks.subtitle')
      });
    }

    if (workspaceSections.length) {
      menus.push({
        id: 'workspace',
        label: t('nav.menu.workspaces'),
        sections: workspaceSections,
        quickLinks: workspaceQuickLinks,
        quickLinksTitle: t('nav.quickLinks.title'),
        quickLinksSubtitle: t('nav.quickLinks.subtitle')
      });
    }

    return menus;
  }, [primaryNavigation, quickLinks, t]);

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

  const accountMenuLabel = accountDisplayName
    ? `${accountDisplayName} • ${t('nav.accountMenu')}`
    : t('nav.accountMenu');
  const accountMenuTitle = accountDisplayName || t('nav.accountMenu');

  const handleCommandSubmit = (value) => {
    const trimmed = value.trim();
    const target = trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search';
    navigate(target);
    setMobileOpen(false);
  };

  const hasPrimaryNavigation = primaryNavigation.length > 0;
  const showNotifications = isAuthenticated && normalisedNotifications.length > 0;
  const showInbox = isAuthenticated && normalisedInbox.length > 0;

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {hasPrimaryNavigation ? (
            <button
              type="button"
              className="inline-flex rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-accent/40 hover:text-accent lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label={t('nav.toggleMenu')}
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
          ) : null}
          <Link to="/" className="inline-flex shrink-0 items-center" aria-label="Fixnado home">
            <img src={LOGO_URL} alt="Fixnado" className="h-12 w-auto" />
          </Link>
        </div>
        <div className="hidden flex-1 items-center gap-3 lg:flex">
          <DesktopNavigation menus={desktopMenus} currentPath={location.pathname} />
          <CommandBar
            placeholder={t('nav.command.placeholder')}
            shortcutHint={t('nav.command.shortcut')}
            suggestions={commandSuggestions}
            onSubmit={handleCommandSubmit}
            layout="inline"
            className="flex-1"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <NavLink
            to="/search"
            className={({ isActive }) =>
              clsx(
                'inline-flex h-11 w-11 items-center justify-center rounded-full border transition lg:hidden',
                isActive
                  ? 'border-accent bg-accent text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-accent/40 hover:text-accent'
              )
            }
            aria-label={t('nav.search')}
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </NavLink>
          {!isAuthenticated ? <LanguageSelector /> : null}
          {showNotifications ? (
            <TrayPopover icon={BellIcon} label={t('nav.notifications')} badgeCount={normalisedNotifications.length}>
              <NotificationTray
                title={t('nav.notifications')}
                emptyLabel={t('nav.notificationsEmpty')}
                items={normalisedNotifications}
                viewAllHref={null}
              />
            </TrayPopover>
          ) : null}
          {showInbox ? (
            <TrayPopover icon={ChatBubbleLeftRightIcon} label={t('nav.inbox')} badgeCount={normalisedInbox.length}>
              <NotificationTray
                title={t('nav.inbox')}
                emptyLabel={t('nav.inboxEmpty')}
                items={normalisedInbox}
                viewAllHref="/communications"
              />
            </TrayPopover>
          ) : null}
          {isAuthenticated ? (
            <NavLink
              to="/account/profile"
              className={({ isActive }) =>
                clsx(
                  'hidden items-center justify-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition lg:inline-flex',
                  isActive
                    ? 'border-accent bg-accent text-white shadow-glow'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-accent/50 hover:text-accent'
                )
              }
            >
              {t('nav.profile')}
            </NavLink>
          ) : (
            <NavLink
              to="/register"
              className={({ isActive }) =>
                clsx(
                  'hidden items-center justify-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition lg:inline-flex',
                  isActive
                    ? 'border-accent bg-accent text-white shadow-glow'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-accent/50 hover:text-accent'
                )
              }
            >
              {t('nav.register')}
            </NavLink>
          )}
          <AccountMenu
            isAuthenticated={isAuthenticated}
            accountInitials={accountInitials}
            accountMenuLabel={accountMenuLabel}
            accountMenuTitle={accountMenuTitle}
            email={email ?? undefined}
            t={t}
            loginLink="/login"
            dashboards={dashboards}
          />
        </div>
      </div>

      <Transition show={mobileOpen} as={Fragment}>
        <Dialog as="div" className="lg:hidden" onClose={setMobileOpen}>
          <Transition.Child
            as={Fragment}
            enter="duration-150 ease-out"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="duration-150 ease-in"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/30" />
          </Transition.Child>

          <Transition.Child
            as={Fragment}
            enter="transition duration-150 ease-out"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition duration-150 ease-in"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col overflow-y-auto border-l border-white/40 bg-white/95 p-6 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between">
                <Link to="/" className="inline-flex items-center" onClick={() => setMobileOpen(false)}>
                  <img src={LOGO_URL} alt="Fixnado" className="h-10 w-auto" />
                </Link>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm"
                  onClick={() => setMobileOpen(false)}
                  aria-label={t('nav.closeMenu')}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 flex flex-col gap-6">
                <CommandBar
                  placeholder={t('nav.command.placeholder')}
                  shortcutHint={t('nav.command.shortcut')}
                  suggestions={commandSuggestions}
                  onSubmit={handleCommandSubmit}
                />

                <div className="flex flex-col gap-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{t('nav.navigation')}</p>
                  <div className="grid gap-3">
                    {mobileNavigation.map((item) => (
                      <MobileLink key={item.id} {...item} onNavigate={() => setMobileOpen(false)} />
                    ))}
                  </div>
                </div>

                <QuickLinks
                  items={quickLinks}
                  title={t('nav.quickLinks.title')}
                  subtitle={t('nav.quickLinks.subtitle')}
                  currentPath={location.pathname}
                  onNavigate={() => setMobileOpen(false)}
                />

                <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{t('nav.preferences')}</p>
                  <LanguageSelector />
                  {isAuthenticated ? (
                    <NavLink
                      to="/logout"
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        clsx(
                          'inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition',
                          isActive
                            ? 'border-accent bg-accent text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-accent/50 hover:text-accent'
                        )
                      }
                    >
                      {t('nav.logout')}
                    </NavLink>
                  ) : (
                    <NavLink
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        clsx(
                          'inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition',
                          isActive
                            ? 'border-accent bg-accent text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-accent/50 hover:text-accent'
                        )
                      }
                    >
                      {t('nav.login')}
                    </NavLink>
                  )}
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </header>
  );
}

Header.propTypes = {
  notifications: PropTypes.arrayOf(PropTypes.object),
  inboxItems: PropTypes.arrayOf(PropTypes.object)
};

Header.defaultProps = {
  notifications: [],
  inboxItems: []
};
