import { createWindow } from './helpers.js';
import { userDashboardMetadata } from './user/metadata.js';
import { userOverviewSection } from './user/sections/overview.js';
import { userCalendarSection } from './user/sections/calendar.js';
import { userOrdersSection } from './user/sections/orders.js';
import { userRentalsSection } from './user/sections/rentals.js';
import { userSupportSection } from './user/sections/support.js';
import { userWalletSection } from './user/sections/wallet.js';
import { userSettingsSection } from './user/sections/settings.js';

export const userDashboard = {
  persona: 'user',
  name: 'User Command Center',
  headline: 'Coordinate service orders, rentals, and support without leaving the workspace.',
  window: createWindow(),
  metadata: userDashboardMetadata,
  navigation: [
    userOverviewSection,
    userCalendarSection,
    userOrdersSection,
    userRentalsSection,
    userSupportSection,
    userWalletSection,
    userSettingsSection
  ]
};

export default userDashboard;
