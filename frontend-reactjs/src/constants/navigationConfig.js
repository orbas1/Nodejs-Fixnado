import { DASHBOARD_ROLES } from './dashboardConfig.js';

const buildDashboardShortcuts = (dashboards = []) => {
  const hasExplicitDashboards = dashboards.length > 0;
  const visibleDashboards = hasExplicitDashboards
    ? DASHBOARD_ROLES.filter((role) => dashboards.includes(role.id))
    : DASHBOARD_ROLES.filter((role) => role.registered);

  return visibleDashboards.map((role) => ({
    id: `dash-${role.id}`,
    label: role.shortName,
    href: `/dashboards/${role.id}`
  }));
};

export const buildPrimaryNavigation = ({ dashboards, isAuthenticated }) => {
  const dashboardLinks = buildDashboardShortcuts(dashboards);
  const primaryLinks = [
    { id: 'home', label: 'Home', href: '/' },
    { id: 'dashboards', label: 'Dash', href: '/dashboards' },
    { id: 'tools', label: 'Tools', href: '/tools' },
    { id: 'market', label: 'Market', href: '/services' }
  ];

  if (dashboardLinks.length > 0) {
    const firstDashboard = dashboardLinks[0];
    primaryLinks[1] = { ...primaryLinks[1], href: firstDashboard.href };
  }

  if (isAuthenticated) {
    return [...primaryLinks, { id: 'account', label: 'Account', href: '/account/profile' }];
  }

  return [...primaryLinks, { id: 'join', label: 'Join', href: '/register' }];
};

export const buildMobileNavigation = ({ dashboards, isAuthenticated }) => {
  const primary = buildPrimaryNavigation({ dashboards, isAuthenticated });
  const dashboardLinks = buildDashboardShortcuts(dashboards).filter((item) =>
    primary.every((link) => link.href !== item.href)
  );

  const authExtras = isAuthenticated
    ? []
    : [
        { id: 'mobile-login', label: 'Login', href: '/login' },
        { id: 'mobile-provider', label: 'Provider', href: '/register/company' }
      ];

  return [...primary, ...dashboardLinks, ...authExtras];
};
