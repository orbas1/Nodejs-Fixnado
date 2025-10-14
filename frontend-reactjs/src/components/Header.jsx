import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Bars3Icon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { LOGO_URL } from '../constants/branding';
import { useLocale } from '../hooks/useLocale.js';
import { useSession } from '../hooks/useSession.js';
import LanguageSelector from './LanguageSelector.jsx';

const explorerLinks = (t) => [
  {
    key: 'search-services',
    name: t('nav.explorerSearchServices'),
    description: t('nav.explorerSearchServicesDescription'),
    href: '/search'
  },
  {
    key: 'providers',
    name: t('nav.explorerProviders'),
    description: t('nav.explorerProvidersDescription'),
    href: '/providers'
  },
  {
    key: 'servicemen',
    name: t('nav.explorerServicemen'),
    description: t('nav.explorerServicemenDescription'),
    href: '/services#field-teams'
  },
  {
    key: 'materials',
    name: t('nav.explorerMaterials'),
    description: t('nav.explorerMaterialsDescription'),
    href: '/materials'
  }
];

const marketplaceLinks = (t) => [
  {
    key: 'tools',
    name: t('nav.marketplaceTools'),
    description: t('nav.marketplaceToolsDescription'),
    href: '/tools'
  },
  {
    key: 'materials',
    name: t('nav.marketplaceMaterials'),
    description: t('nav.marketplaceMaterialsDescription'),
    href: '/materials'
  }
];

const notificationPreview = [
  {
    id: 'n1',
    title: 'Marketplace scheduling',
    body: 'Tower crane inspection confirmed for Thursday 08:00.',
    time: '2h'
  },
  {
    id: 'n2',
    title: 'Compliance reminder',
    body: 'Upload updated insurance paperwork before 31 May.',
    time: '1d'
  }
];

const inboxPreview = [
  {
    id: 'c1',
    sender: 'Dispatch desk',
    snippet: 'We have a crew available to cover your shift tomorrow.',
    href: '/communications?thread=dispatch'
  },
  {
    id: 'c2',
    sender: 'Operations HQ',
    snippet: 'Thanks for confirming the preventative maintenance window.',
    href: '/communications?thread=operations'
  }
];

const capitalise = (value, fallback = 'Guest') => {
  if (!value || typeof value !== 'string') {
    return fallback;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const resolveAvatarInitial = (userId, role) => {
  if (userId && typeof userId === 'string') {
    const trimmed = userId.trim();
    if (trimmed.length > 0) {
      return trimmed.charAt(0).toUpperCase();
    }
  }
  if (role && typeof role === 'string') {
    return role.charAt(0).toUpperCase();
  }
  return 'F';
};

export default function Header() {
  const [open, setOpen] = useState(false);
  const [desktopMenu, setDesktopMenu] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(null);
  const [tray, setTray] = useState(null);
  const menuRefs = useRef({});
  const location = useLocation();
  const { t } = useLocale();
  const { isAuthenticated, role, userId } = useSession();

  const navigation = useMemo(() => {
    if (!isAuthenticated) {
      return [];
    }

    return [
      { key: 'feed', name: t('nav.feed'), href: '/feed' },
      { key: 'explorer', name: t('nav.explorer'), children: explorerLinks(t) },
      { key: 'marketplace', name: t('nav.marketplace'), children: marketplaceLinks(t) }
    ];
  }, [isAuthenticated, t]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const containers = Object.values(menuRefs.current);
      if (containers.length === 0) {
        return;
      }
      const clickedInside = containers.some((node) => node && node.contains(event.target));
      if (!clickedInside) {
        setDesktopMenu(null);
        setTray(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setDesktopMenu(null);
        setMobileMenu(null);
        setTray(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
    setDesktopMenu(null);
    setMobileMenu(null);
    setTray(null);
  }, [location.pathname]);

  const setMenuRef = (id) => (node) => {
    if (!menuRefs.current) {
      menuRefs.current = {};
    }
    if (node) {
      menuRefs.current[id] = node;
    } else {
      delete menuRefs.current[id];
    }
  };

  const matchPath = (target) => {
    if (!target) return false;
    const [path] = target.split('#');
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const isNavItemActive = (item) => {
    if (item.children) {
      return item.children.some((child) => matchPath(child.href));
    }
    return matchPath(item.href);
  };

  const handleMenuBlur = (id, event) => {
    const container = menuRefs.current?.[id];
    if (!container) {
      setDesktopMenu(null);
      return;
    }
    if (event?.relatedTarget && container.contains(event.relatedTarget)) {
      return;
    }
    setDesktopMenu((current) => (current === id ? null : current));
  };

  return (
    <header className="bg-white/90 backdrop-blur border-b border-slate-200 sticky top-0 z-40 shadow-glow">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={LOGO_URL}
            alt="Fixnado"
            className="h-[3.75rem] w-auto object-contain md:h-16"
            loading="lazy"
          />
        </Link>
        {isAuthenticated ? (
          <>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium" aria-label="Primary">
              {navigation.map((item) => (
                item.children ? (
                  <div
                    key={item.key}
                    className="relative"
                    ref={setMenuRef(item.key)}
                    onMouseEnter={() => setDesktopMenu(item.key)}
                    onFocus={() => setDesktopMenu(item.key)}
                    onMouseLeave={() => setDesktopMenu(null)}
                    onBlur={(event) => handleMenuBlur(item.key, event)}
                  >
                    <button
                      type="button"
                      className={`flex items-center gap-1 rounded-full px-4 py-2 transition-colors ${
                        isNavItemActive(item) ? 'text-primary' : 'text-slate-600 hover:text-accent'
                      }`}
                      aria-expanded={desktopMenu === item.key}
                      aria-haspopup="true"
                      onClick={() =>
                        setDesktopMenu((current) => (current === item.key ? null : item.key))
                      }
                    >
                      {item.name}
                      <ChevronDownIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    </button>
                    {desktopMenu === item.key ? (
                      <div
                        role="menu"
                        aria-label={`${item.name} menu`}
                        className="absolute left-1/2 z-50 mt-3 w-80 -translate-x-1/2 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur"
                      >
                        <ul className="space-y-2">
                          {item.children.map((child) => (
                            <li key={child.key}>
                              <NavLink
                                to={child.href}
                                className="block rounded-2xl p-3 text-left transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                onClick={() => setDesktopMenu(null)}
                              >
                                <p className="text-sm font-semibold text-primary">{child.name}</p>
                                {child.description ? (
                                  <p className="mt-1 text-xs text-slate-500">{child.description}</p>
                                ) : null}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <NavLink
                    key={item.key}
                    to={item.href}
                    className={({ isActive }) =>
                      `transition-colors ${isActive || isNavItemActive(item) ? 'text-primary' : 'text-slate-600 hover:text-accent'}`
                    }
                  >
                    {item.name}
                  </NavLink>
                )
              ))}
            </nav>
            <div className="hidden md:flex items-center gap-3">
              <LanguageSelector variant="header" />
              <div className="relative" ref={setMenuRef('tray:notifications')}>
                <button
                  type="button"
                  className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:text-primary"
                  onClick={() => setTray((current) => (current === 'notifications' ? null : 'notifications'))}
                  aria-haspopup="true"
                  aria-expanded={tray === 'notifications'}
                  aria-label={t('nav.notifications')}
                >
                  <BellIcon className="h-5 w-5" aria-hidden="true" />
                  <span className="absolute top-2 right-2 inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                </button>
                {tray === 'notifications' ? (
                  <div className="absolute right-0 z-50 mt-3 w-80 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur">
                    <h3 className="text-sm font-semibold text-primary">{t('nav.notifications')}</h3>
                    <ul className="mt-3 space-y-3">
                      {notificationPreview.length === 0 ? (
                        <li className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-500">
                          {t('nav.notificationsEmpty')}
                        </li>
                      ) : (
                        notificationPreview.map((item) => (
                          <li key={item.id} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                            <p className="text-sm font-semibold text-primary">{item.title}</p>
                            <p className="mt-1 text-xs text-slate-500">{item.body}</p>
                            <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">{item.time} {t('nav.notificationsAgo')}</p>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                ) : null}
              </div>
              <div className="relative" ref={setMenuRef('tray:inbox')}>
                <button
                  type="button"
                  className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:text-primary"
                  onClick={() => setTray((current) => (current === 'inbox' ? null : 'inbox'))}
                  aria-haspopup="true"
                  aria-expanded={tray === 'inbox'}
                  aria-label={t('nav.inbox')}
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5" aria-hidden="true" />
                  <span className="absolute top-2 right-2 inline-flex h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                </button>
                {tray === 'inbox' ? (
                  <div className="absolute right-0 z-50 mt-3 w-80 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur">
                    <h3 className="text-sm font-semibold text-primary">{t('nav.inbox')}</h3>
                    <ul className="mt-3 space-y-3">
                      {inboxPreview.length === 0 ? (
                        <li className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-500">
                          {t('nav.inboxEmpty')}
                        </li>
                      ) : (
                        inboxPreview.map((item) => (
                          <li key={item.id} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                            <p className="text-sm font-semibold text-primary">{item.sender}</p>
                            <p className="mt-1 text-xs text-slate-500">{item.snippet}</p>
                            <Link
                              to={item.href}
                              className="mt-2 inline-flex items-center text-xs font-semibold text-accent hover:text-primary"
                              onClick={() => setTray(null)}
                            >
                              {t('nav.messagesOpenThread')}
                            </Link>
                          </li>
                        ))
                      )}
                    </ul>
                    <Link
                      to="/communications"
                      className="mt-4 inline-flex w-full justify-center rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
                      onClick={() => setTray(null)}
                    >
                      {t('nav.messagesViewMore')}
                    </Link>
                  </div>
                ) : null}
              </div>
              <div className="relative" ref={setMenuRef('tray:avatar')}>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"
                  onClick={() => setTray((current) => (current === 'avatar' ? null : 'avatar'))}
                  aria-haspopup="true"
                  aria-expanded={tray === 'avatar'}
                  aria-label={t('nav.accountMenu')}
                >
                  <span className="text-sm font-semibold">
                    {resolveAvatarInitial(userId, role)}
                  </span>
                </button>
                {tray === 'avatar' ? (
                  <div className="absolute right-0 z-50 mt-3 w-72 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <UserCircleIcon className="h-7 w-7" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary">{capitalise(userId, 'Fixnado member')}</p>
                        <p className="text-xs text-slate-500">{t('nav.statusLabel', { status: capitalise(role, 'guest') })}</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <Link
                        to="/dashboards"
                        className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
                        onClick={() => setTray(null)}
                      >
                        {t('nav.viewDashboard')}
                        <span aria-hidden="true">→</span>
                      </Link>
                      <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-xs text-slate-500">
                        {t('nav.manageAccountHint')}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </>
        ) : (
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 rounded-full border border-accent text-accent font-semibold hover:bg-accent/10"
            >
              {t('nav.login')}
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-full bg-accent text-white font-semibold shadow-lg shadow-accent/30 hover:bg-accent/90"
            >
              {t('nav.getStarted')}
            </Link>
          </div>
        )}
        {isAuthenticated ? (
          <button
            className="md:hidden inline-flex items-center justify-center rounded-full border border-slate-200 p-2"
            onClick={() => setOpen((prev) => !prev)}
            aria-label={t('nav.toggleMenu')}
          >
            <Bars3Icon className="h-6 w-6 text-primary" />
          </button>
        ) : (
          <div className="md:hidden flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-full border border-accent px-4 py-2 text-sm font-semibold text-accent"
            >
              {t('nav.login')}
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
            >
              {t('nav.getStarted')}
            </Link>
          </div>
        )}
      </div>
      {isAuthenticated && open ? (
        <div className="md:hidden px-6 pb-6 space-y-4">
          {navigation.map((item) => (
            item.children ? (
              <div key={item.key}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-2xl bg-slate-100/60 px-4 py-3 text-left text-base font-semibold text-primary"
                  onClick={() =>
                    setMobileMenu((current) => (current === item.key ? null : item.key))
                  }
                  aria-expanded={mobileMenu === item.key}
                >
                  {item.name}
                  <span aria-hidden="true" className="text-xs text-slate-500">
                    {mobileMenu === item.key ? '▴' : '▾'}
                  </span>
                </button>
                {mobileMenu === item.key ? (
                  <ul className="mt-2 space-y-2 rounded-2xl border border-slate-200 bg-white/95 p-3">
                    {item.children.map((child) => (
                      <li key={child.key}>
                        <NavLink
                          to={child.href}
                          className="block rounded-xl px-3 py-2 text-sm text-slate-600 transition-colors hover:text-primary"
                          onClick={() => {
                            setOpen(false);
                            setMobileMenu(null);
                          }}
                        >
                          <p className="font-semibold text-primary">{child.name}</p>
                          {child.description ? (
                            <p className="text-xs text-slate-500">{child.description}</p>
                          ) : null}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <NavLink
                key={item.key}
                to={item.href}
                className={({ isActive }) =>
                  `block text-base ${isActive || isNavItemActive(item) ? 'text-primary font-semibold' : 'text-slate-600 hover:text-accent'}`
                }
                onClick={() => setOpen(false)}
              >
                {item.name}
              </NavLink>
            )
          ))}
          <div className="flex flex-col gap-3 pt-2">
            <LanguageSelector variant="mobile" />
            <Link
              to="/communications"
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-primary"
              onClick={() => setOpen(false)}
            >
              {t('nav.inbox')}
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              to="/dashboards"
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-primary"
              onClick={() => setOpen(false)}
            >
              {t('nav.viewDashboard')}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
