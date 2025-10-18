import { DASHBOARD_ROLES } from './dashboardConfig.js';

const explorerSection = (t) => ({
  id: 'explore',
  label: t('nav.explore'),
  items: [
    { id: 'explore-search', title: t('nav.search'), href: '/search' },
    { id: 'explore-providers', title: t('nav.providers'), href: '/providers' },
    { id: 'explore-teams', title: t('nav.teams'), href: '/services#field-teams' },
    { id: 'explore-gear', title: t('nav.gear'), href: '/materials' }
  ]
});

const buildDashboardItems = (t, dashboards = []) => {
  const hasExplicitDashboards = dashboards.length > 0;
  const visibleDashboards = hasExplicitDashboards
    ? DASHBOARD_ROLES.filter((role) => dashboards.includes(role.id))
    : DASHBOARD_ROLES.filter((role) => role.registered && role.id !== 'admin');

  return visibleDashboards.map((role) => ({
    id: `dashboard-${role.id}`,
    title: role.shortLabel ?? role.name,
    href: `/dashboards/${role.id}`
  }));
};

const workspaceSection = (t, dashboards) => ({
  id: 'work',
  label: t('nav.work'),
  items: buildDashboardItems(t, dashboards)
});

const solutionsSection = (t) => ({
  id: 'ops',
  label: t('nav.ops'),
  items: [
    {
      id: 'solutions-business-fronts',
      title: t('nav.fronts'),
      href: '/providers'
    },
    {
      id: 'solutions-storefront',
      title: t('nav.store'),
      href: '/provider/storefront'
    },
    {
      id: 'solutions-geo',
      title: t('nav.geo'),
      href: '/operations/geo-matching'
    },
    {
      id: 'solutions-communications',
      title: t('nav.comms'),
      href: '/communications'
    }
  ]
});

const resourcesSection = (t) => ({
  id: 'info',
  label: t('nav.info'),
  items: [
    {
      id: 'resources-blog',
      title: t('nav.blog'),
      href: '/blog'
    },
    {
      id: 'resources-about',
      title: t('nav.about'),
      href: '/about'
    },
    {
      id: 'resources-trust',
      title: t('nav.trust'),
      href: '/privacy#trust'
    },
    {
      id: 'resources-terms',
      title: t('nav.terms'),
      href: '/legal/terms'
    }
  ]
});

export const buildPrimaryNavigation = ({ t, dashboards }) => [
  explorerSection(t),
  workspaceSection(t, dashboards),
  solutionsSection(t),
  resourcesSection(t)
];

export const buildMobileNavigation = ({ t, dashboards, isAuthenticated }) => {
  const primary = buildPrimaryNavigation({ t, dashboards });
  const flatLinks = primary.flatMap((section) => section.items);

  if (!isAuthenticated) {
    return [
      ...flatLinks,
      {
        id: 'mobile-login',
        title: t('nav.login'),
        href: '/login'
      },
      {
        id: 'mobile-register',
        title: t('nav.register'),
        href: '/register'
      },
      {
        id: 'mobile-provider-register',
        title: t('nav.providerOnboarding'),
        href: '/register/company'
      }
    ];
  }

  const authLinks = [
    {
      id: 'mobile-dashboard-hub',
      title: t('nav.dashboards'),
      href: '/dashboards'
    },
    {
      id: 'mobile-profile',
      title: t('nav.profileShort'),
      href: '/account/profile'
    }
  ];

  return [...flatLinks, ...authLinks];
};
