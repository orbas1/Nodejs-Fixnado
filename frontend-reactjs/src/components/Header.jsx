import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { LOGO_URL } from '../constants/branding';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Solutions', href: '/services#solution-streams' },
  { name: 'Industries', href: '/#home-marketing' },
  { name: 'Platform', href: '/#home-operations' },
  { name: 'Resources', href: '/services#activation-blueprint' },
  {
    name: 'Dashboards',
    children: [
      {
        name: 'Provider console',
        href: '/provider/dashboard',
        description: 'Live booking, inventory, and campaign KPIs with compliance alerts.'
      },
      {
        name: 'Enterprise analytics',
        href: '/enterprise/panel',
        description: 'Multi-site SLA monitoring, spend visibility, and upcoming visit planning.'
      },
      {
        name: 'Business fronts',
        href: '/providers/metro-power-services',
        description: 'Curated storefronts showcasing credentials, testimonials, and service packages.'
      }
    ]
  },
  { name: 'Communications', href: '/communications' }
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [desktopMenu, setDesktopMenu] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(null);
  const menuRefs = useRef({});
  const location = useLocation();

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const containers = Object.values(menuRefs.current);
      if (containers.length === 0) {
        return;
      }
      const clickedInside = containers.some((node) => node && node.contains(event.target));
      if (!clickedInside) {
        setDesktopMenu(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setDesktopMenu(null);
        setMobileMenu(null);
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
  }, [location.pathname]);

  const setMenuRef = (name) => (node) => {
    if (!menuRefs.current) {
      menuRefs.current = {};
    }
    if (node) {
      menuRefs.current[name] = node;
    } else {
      delete menuRefs.current[name];
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

  const handleMenuBlur = (name, event) => {
    const container = menuRefs.current?.[name];
    if (!container) {
      setDesktopMenu(null);
      return;
    }
    if (event?.relatedTarget && container.contains(event.relatedTarget)) {
      return;
    }
    setDesktopMenu((current) => (current === name ? null : current));
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
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navigation.map((item) => (
            item.children ? (
              <div
                key={item.name}
                className="relative"
                ref={setMenuRef(item.name)}
                onMouseEnter={() => setDesktopMenu(item.name)}
                onFocus={() => setDesktopMenu(item.name)}
                onMouseLeave={() => setDesktopMenu(null)}
                onBlur={(event) => handleMenuBlur(item.name, event)}
              >
                <button
                  type="button"
                  className={`flex items-center gap-1 rounded-full px-4 py-2 transition-colors ${
                    isNavItemActive(item) ? 'text-primary' : 'text-slate-600 hover:text-accent'
                  }`}
                  aria-expanded={desktopMenu === item.name}
                  aria-haspopup="true"
                  onClick={() =>
                    setDesktopMenu((current) => (current === item.name ? null : item.name))
                  }
                >
                  {item.name}
                  <span aria-hidden="true" className="text-xs text-slate-400">
                    ▾
                  </span>
                </button>
                {desktopMenu === item.name ? (
                  <div
                    role="menu"
                    aria-label={`${item.name} menu`}
                    className="absolute left-1/2 z-50 mt-3 w-80 -translate-x-1/2 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur"
                  >
                    <ul className="space-y-2">
                      {item.children.map((child) => (
                        <li key={child.name}>
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
                key={item.name}
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
          <Link
            to="/login"
            className="px-4 py-2 rounded-full border border-accent text-accent font-semibold hover:bg-accent/10"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 rounded-full bg-accent text-white font-semibold shadow-lg shadow-accent/30 hover:bg-accent/90"
          >
            Get started
          </Link>
        </div>
        <button
          className="md:hidden inline-flex items-center justify-center rounded-full border border-slate-200 p-2"
          onClick={() => setOpen((prev) => !prev)}
        >
          <Bars3Icon className="h-6 w-6 text-primary" />
        </button>
      </div>
      {open && (
        <div className="md:hidden px-6 pb-6 space-y-4">
          {navigation.map((item) => (
            item.children ? (
              <div key={item.name}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-2xl bg-slate-100/60 px-4 py-3 text-left text-base font-semibold text-primary"
                  onClick={() =>
                    setMobileMenu((current) => (current === item.name ? null : item.name))
                  }
                  aria-expanded={mobileMenu === item.name}
                >
                  {item.name}
                  <span aria-hidden="true" className="text-xs text-slate-500">
                    {mobileMenu === item.name ? '▴' : '▾'}
                  </span>
                </button>
                {mobileMenu === item.name ? (
                  <ul className="mt-2 space-y-2 rounded-2xl border border-slate-200 bg-white/95 p-3">
                    {item.children.map((child) => (
                      <li key={child.name}>
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
                key={item.name}
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
          <div className="flex gap-3 pt-4">
            <Link
              to="/login"
              className="flex-1 px-4 py-2 rounded-full border border-accent text-center text-accent font-semibold hover:bg-accent/10"
              onClick={() => setOpen(false)}
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="flex-1 px-4 py-2 rounded-full bg-accent text-center text-white font-semibold shadow-lg shadow-accent/30 hover:bg-accent/90"
              onClick={() => setOpen(false)}
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
