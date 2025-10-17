export const userNavigation = [
  {
    id: 'overview',
    label: 'Profile Overview',
    menuLabel: 'Home',
    icon: 'profile'
  },
  {
    id: 'calendar',
    label: 'Service Calendar',
    menuLabel: 'Calendar',
    icon: 'calendar'
  },
  {
    id: 'orders',
    label: 'Work Orders',
    menuLabel: 'Orders',
    icon: 'pipeline'
  },
  {
    id: 'rentals',
    label: 'Rental Desk',
    menuLabel: 'Rentals',
    icon: 'assets'
  },
  {
    id: 'support',
    label: 'Support Desk',
    menuLabel: 'Support',
    icon: 'support',
    href: '/communications'
  },
  {
    id: 'wallet',
    label: 'Wallet & Payments',
    menuLabel: 'Wallet',
    icon: 'finance'
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
    label: 'Account Settings',
    menuLabel: 'Settings',
    icon: 'settings'
  }
];

export default userNavigation;
