import { createWindow } from './helpers.js';
import { providerDashboardMetadata } from './provider/metadata.js';
import { providerOverviewSection } from './provider/sections/overview.js';
import { providerCalendarSection } from './provider/sections/calendar.js';
import { providerCrewAvailabilitySection } from './provider/sections/crewAvailability.js';
import { providerWorkboardSection } from './provider/sections/workboard.js';
import { providerRentalsSection } from './provider/sections/rentals.js';
import { providerInventorySection } from './provider/sections/inventory.js';
import { providerServicemenSection } from './provider/sections/servicemen.js';
import { providerAdsSection } from './provider/sections/ads.js';
import { providerFinanceSection } from './provider/sections/finance.js';
import { providerSettingsSection } from './provider/sections/settings.js';

export const providerDashboard = {
  persona: 'provider',
  name: 'Provider Operations Studio',
  headline: 'Monitor revenue, crew utilisation, availability, assets, and automation in one studio.',
  window: createWindow(),
  metadata: providerDashboardMetadata,
  navigation: [
    providerOverviewSection,
    providerCalendarSection,
    providerCrewAvailabilitySection,
    providerWorkboardSection,
    providerRentalsSection,
    providerInventorySection,
    providerServicemenSection,
    providerAdsSection,
    providerFinanceSection,
    providerSettingsSection
  ]
};

export default providerDashboard;
