import { DASHBOARD_ROLES } from './dashboardConfig.js';

const explorerSection = (t) => ({
  id: 'explorer',
  label: t('nav.explorer'),
  description: t('nav.explorerSearchServicesDescription'),
  items: [
    {
      id: 'explorer-search',
      title: t('nav.explorerSearchServices'),
      description: t('nav.explorerSearchServicesDescription'),
      href: '/search'
    },
    {
      id: 'explorer-providers',
      title: t('nav.explorerProviders'),
      description: t('nav.explorerProvidersDescription'),
      href: '/providers'
    },
    {
      id: 'explorer-services',
      title: t('nav.explorerServicemen'),
      description: t('nav.explorerServicemenDescription'),
      href: '/services#field-teams'
    },
    {
      id: 'explorer-materials',
      title: t('nav.explorerMaterials'),
      description: t('nav.explorerMaterialsDescription'),
      href: '/materials'
    }
  ]
});

const buildDashboardItems = (t, dashboards = []) => {
  const hasExplicitDashboards = dashboards.length > 0;
  const visibleDashboards = hasExplicitDashboards
    ? DASHBOARD_ROLES.filter((role) => dashboards.includes(role.id))
    : DASHBOARD_ROLES.filter((role) => role.registered && role.id !== 'admin');

  return visibleDashboards.map((role) => ({
    id: `dashboard-${role.id}`,
    title: role.name,
    description: role.headline,
    href: `/dashboards/${role.id}`
  }));
};

const workspaceSection = (t, dashboards) => ({
  id: 'workspaces',
  label: t('nav.dashboards'),
  description: t('nav.enterpriseAnalyticsDescription'),
  items: buildDashboardItems(t, dashboards)
});

const solutionsSection = (t) => ({
  id: 'solutions',
  label: t('nav.solutions'),
  description: t('nav.providerConsoleDescription'),
  items: [
    {
      id: 'solutions-business-fronts',
      title: t('nav.businessFronts'),
      description: t('nav.businessFrontsDescription'),
      href: '/providers'
    },
    {
      id: 'solutions-storefront',
      title: t('nav.providerStorefront'),
      description: t('nav.providerStorefrontDescription'),
      href: '/provider/storefront'
    },
    {
      id: 'solutions-geo',
      title: t('nav.geoMatching'),
      description: t('nav.geoMatchingDescription'),
      href: '/operations/geo-matching'
    },
    {
      id: 'solutions-communications',
      title: t('nav.communications'),
      description: t('nav.messagesViewMore'),
      href: '/communications'
    }
  ]
});

const resourcesSection = (t) => ({
  id: 'resources',
  label: t('nav.resources'),
  description: t('nav.blog'),
  items: [
    {
      id: 'resources-blog',
      title: t('nav.blog'),
      description: t('blog.hero.tagline'),
      href: '/blog'
    },
    {
      id: 'resources-about',
      title: t('nav.about'),
      description: t('nav.aboutDescription'),
      href: '/about'
    },
    {
      id: 'resources-trust',
      title: t('nav.trustCentre'),
      description: t('nav.trustCentreDescription'),
      href: '/privacy#trust'
    },
    {
      id: 'resources-terms',
      title: t('footer.terms'),
      description: t('legal.termsSummary'),
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
        description: t('auth.login.cta'),
        href: '/login'
      },
      {
        id: 'mobile-register',
        title: t('nav.register'),
        description: 'Create your Fixnado account',
        href: '/register'
      },
      {
        id: 'mobile-provider-register',
        title: 'Provider onboarding',
        description: 'Activate team dashboards and marketplace tools',
        href: '/register/company'
      }
    ];
  }

  const authLinks = [
    {
      id: 'mobile-dashboard-hub',
      title: t('nav.dashboards'),
      description: t('nav.enterpriseAnalyticsDescription'),
      href: '/dashboards'
    },
    {
      id: 'mobile-profile',
      title: 'Profile',
      description: 'Account hub',
      href: '/account/profile'
    }
  ];

  return [...flatLinks, ...authLinks];
};
