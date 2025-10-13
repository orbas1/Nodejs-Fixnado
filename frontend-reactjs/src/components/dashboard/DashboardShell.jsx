import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import {
  Bars3BottomLeftIcon,
  XMarkIcon,
  HomeIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import StatusPill from '../ui/StatusPill.jsx';

function NavList({ navigation, activeSection, onNavigate }) {
  return (
    <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
      {navigation.map((item) => {
        const isActive = item.id === activeSection;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={clsx(
              'w-full rounded-xl border px-4 py-3 text-left transition-colors',
              isActive
                ? 'border-accent/50 bg-accent/10 text-accent shadow-sm'
                : 'border-transparent bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900'
            )}
          >
            <p className="text-sm font-semibold">{item.label}</p>
            {item.description ? <p className="mt-1 text-xs text-slate-500">{item.description}</p> : null}
          </button>
        );
      })}
    </nav>
  );
}

NavList.propTypes = {
  navigation: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      description: PropTypes.string
    })
  ).isRequired,
  activeSection: PropTypes.string,
  onNavigate: PropTypes.func.isRequired
};

NavList.defaultProps = {
  activeSection: null
};

function Sidebar({ sidebar, navigation, activeSection, onNavigate }) {
  return (
    <aside className="hidden min-h-screen w-80 flex-col border-r border-slate-200 bg-white/90 backdrop-blur lg:flex xl:w-96">
      <div className="border-b border-slate-200 p-8">
        <div className="flex items-center gap-3">
          <Bars3BottomLeftIcon className="h-8 w-8 text-accent" />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              {sidebar.eyebrow ?? 'Fixnado dashboard'}
            </p>
            <p className="text-lg font-semibold text-slate-900">{sidebar.title}</p>
          </div>
        </div>
        {sidebar.description ? <p className="mt-4 text-sm text-slate-600">{sidebar.description}</p> : null}
        {sidebar.meta?.length ? (
          <dl className="mt-6 space-y-3 text-sm text-slate-600">
            {sidebar.meta.map((item) => (
              <div key={item.label} className="flex flex-col rounded-xl bg-slate-50/80 p-3">
                <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {sidebar.extra}
      </div>
      <NavList navigation={navigation} activeSection={activeSection} onNavigate={onNavigate} />
      <div className="border-t border-slate-200 p-6 space-y-3">
        <Link
          to="/dashboards"
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
        >
          <Squares2X2Icon className="h-5 w-5" /> Dashboard hub
        </Link>
        <Link
          to="/"
          className="flex items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/20"
        >
          <HomeIcon className="h-5 w-5" /> Return to Fixnado.com
        </Link>
      </div>
    </aside>
  );
}

Sidebar.propTypes = {
  sidebar: PropTypes.shape({
    eyebrow: PropTypes.string,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    meta: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.node.isRequired
      })
    ),
    extra: PropTypes.node
  }).isRequired,
  navigation: NavList.propTypes.navigation,
  activeSection: PropTypes.string,
  onNavigate: PropTypes.func.isRequired
};

Sidebar.defaultProps = {
  activeSection: null
};

function MobileNav({ sidebar, navigation, activeSection, onNavigate, onClose }) {
  return (
    <div className="lg:hidden">
      <div className="fixed inset-0 z-30 bg-slate-950/40" onClick={onClose} role="presentation" />
      <div className="fixed inset-y-0 left-0 z-40 flex w-80 flex-col border-r border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              {sidebar.eyebrow ?? 'Fixnado dashboard'}
            </p>
            <p className="text-lg font-semibold text-slate-900">{sidebar.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 hover:border-slate-300 hover:text-slate-900"
            aria-label="Close menu"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <NavList navigation={navigation} activeSection={activeSection} onNavigate={onNavigate} />
        <div className="border-t border-slate-200 p-6 space-y-3">
          <Link
            to="/dashboards"
            onClick={onClose}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
          >
            <Squares2X2Icon className="h-5 w-5" /> Dashboard hub
          </Link>
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/20"
          >
            <HomeIcon className="h-5 w-5" /> Return to Fixnado.com
          </Link>
        </div>
      </div>
    </div>
  );
}

MobileNav.propTypes = {
  sidebar: Sidebar.propTypes.sidebar,
  navigation: NavList.propTypes.navigation,
  activeSection: PropTypes.string,
  onNavigate: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

MobileNav.defaultProps = {
  activeSection: null
};

export default function DashboardShell({
  eyebrow,
  title,
  subtitle,
  heroBadges,
  heroAside,
  navigation,
  sidebar,
  children
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(navigation[0]?.id ?? null);

  useEffect(() => {
    setActiveSection(navigation[0]?.id ?? null);
  }, [navigation]);

  useEffect(() => {
    if (navigation.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0.25, 0.5, 0.75] }
    );

    const observed = navigation
      .map((item) => document.getElementById(item.id))
      .filter(Boolean);

    observed.forEach((element) => observer.observe(element));

    return () => {
      observed.forEach((element) => observer.unobserve(element));
      observer.disconnect();
    };
  }, [navigation]);

  const sidebarConfig = useMemo(
    () => ({
      eyebrow,
      title,
      description: subtitle,
      meta: sidebar?.meta ?? [],
      extra: sidebar?.extra
    }),
    [eyebrow, title, subtitle, sidebar]
  );

  const handleNavigate = (id) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
    setMobileOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar sidebar={sidebarConfig} navigation={navigation} activeSection={activeSection} onNavigate={handleNavigate} />

      <main className="relative flex-1">
        <div className="border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto max-w-6xl px-6 py-6 lg:py-10">
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:border-accent hover:text-accent"
              >
                <Bars3BottomLeftIcon className="h-5 w-5" /> Menu
              </button>
              <Link
                to="/dashboards"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:border-accent hover:text-accent"
              >
                <Squares2X2Icon className="h-5 w-5" /> Hub
              </Link>
            </div>
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-4">
                {eyebrow ? (
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{eyebrow}</p>
                ) : null}
                <h1 className="text-3xl font-semibold text-primary">{title}</h1>
                {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
                {heroBadges?.length ? (
                  <div className="flex flex-wrap gap-3">
                    {heroBadges.map((badge) => (
                      <StatusPill key={badge.label} tone={badge.tone}>
                        {badge.label}
                      </StatusPill>
                    ))}
                  </div>
                ) : null}
              </div>
              {heroAside ? <div className="flex flex-col items-start gap-3 lg:items-end">{heroAside}</div> : null}
            </div>
          </div>
        </div>

        <div className="px-6 py-10">
          <div className="mx-auto max-w-6xl space-y-12">{children}</div>
        </div>
      </main>

      {mobileOpen ? (
        <MobileNav
          sidebar={sidebarConfig}
          navigation={navigation}
          activeSection={activeSection}
          onNavigate={handleNavigate}
          onClose={() => setMobileOpen(false)}
        />
      ) : null}
    </div>
  );
}

DashboardShell.propTypes = {
  eyebrow: PropTypes.string,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  heroBadges: PropTypes.arrayOf(
    PropTypes.shape({
      tone: PropTypes.oneOf(['neutral', 'success', 'warning', 'danger', 'info']),
      label: PropTypes.string.isRequired
    })
  ),
  heroAside: PropTypes.node,
  navigation: NavList.propTypes.navigation,
  sidebar: PropTypes.shape({
    meta: PropTypes.array,
    extra: PropTypes.node
  }),
  children: PropTypes.node.isRequired
};

DashboardShell.defaultProps = {
  eyebrow: null,
  subtitle: null,
  heroBadges: null,
  heroAside: null,
  sidebar: {}
};
