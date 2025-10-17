export const providerNavigation = [
  {
    id: 'overview',
    label: 'Performance Overview',
    menuLabel: 'Home',
    icon: 'profile'
  },
  {
    id: 'calendar',
    label: 'Operations Calendar',
    menuLabel: 'Calendar',
    icon: 'calendar'
  },
  {
    id: 'workboard',
    label: 'Service Pipeline',
    menuLabel: 'Pipeline',
    icon: 'pipeline'
  },
  {
    id: 'crew-availability',
    label: 'Crew Availability',
    menuLabel: 'Crew',
    icon: 'availability'
  },
  {
    id: 'servicemen',
    label: 'Serviceman Directory',
    menuLabel: 'Roster',
    icon: 'crew'
  },
  {
    id: 'rentals',
    label: 'Asset Rentals',
    menuLabel: 'Rentals',
    icon: 'assets'
  },
  {
    id: 'inventory-management',
    label: 'Inventory Management',
    menuLabel: 'Inventory',
    icon: 'assets',
    href: '/provider/inventory'
  },
  {
    id: 'services-control',
    label: 'Services Control',
    menuLabel: 'Services',
    icon: 'automation',
    href: '/provider/services'
  },
  {
    id: 'serviceman-payments',
    label: 'Crew Payments',
    menuLabel: 'Payments',
    icon: 'finance'
  },
  {
    id: 'storefront-control',
    label: 'Storefront Control',
    menuLabel: 'Storefront',
    icon: 'storefront',
    href: '/dashboards/provider/storefront'
  },
  {
    id: 'onboarding-management',
    label: 'Onboarding',
    menuLabel: 'Onboard',
    icon: 'documents',
    href: '/dashboards/provider/onboarding'
  },
  {
    id: 'escrow-management',
    label: 'Escrow Management',
    menuLabel: 'Escrow',
    icon: 'finance'
  },
  {
    id: 'profile-settings',
    label: 'Provider Profile',
    menuLabel: 'Profile',
    icon: 'settings',
    href: '/dashboards/provider/profile'
  },
  {
    id: 'workspace-hub',
    label: 'Workspace Hub',
    menuLabel: 'Hub',
    icon: 'analytics',
    href: '/dashboards',
    type: 'route'
  },
  {
    id: 'settings',
    label: 'Automation Settings',
    menuLabel: 'Settings',
    icon: 'automation'
  }
];

export default providerNavigation;
