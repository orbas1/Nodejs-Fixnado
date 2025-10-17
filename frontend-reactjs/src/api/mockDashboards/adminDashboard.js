import { createWindow } from './helpers.js';
import { adminDashboardMetadata } from './admin/metadata.js';
import { adminOverviewSection } from './admin/sections/overview.js';
import { adminCalendarSection } from './admin/sections/calendar.js';
import { adminOperationsSection } from './admin/sections/operations.js';
import { adminAvailabilitySection } from './admin/sections/availability.js';
import { adminAssetsSection } from './admin/sections/assets.js';
import { adminZonesSection } from './admin/sections/zones.js';
import { adminSettingsSection } from './admin/sections/settings.js';

export const adminDashboard = {
  persona: 'admin',
  name: 'Admin Control Tower',
  headline: 'Command multi-tenant operations, compliance, zones, and assets in real time.',
  window: createWindow(),
  metadata: adminDashboardMetadata,
  navigation: [
    adminOverviewSection,
    adminCalendarSection,
    adminOperationsSection,
    adminAvailabilitySection,
    adminAssetsSection,
    adminZonesSection,
    adminSettingsSection
  ]
};

export default adminDashboard;
