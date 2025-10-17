import { createWindow } from './helpers.js';
import { servicemanDashboardMetadata } from './serviceman/metadata.js';
import { servicemanOverviewSection } from './serviceman/sections/overview.js';
import { servicemanCalendarSection } from './serviceman/sections/calendar.js';
import { servicemanAvailabilitySection } from './serviceman/sections/availability.js';
import { servicemanScheduleSection } from './serviceman/sections/schedule.js';
import { servicemanToolkitSection } from './serviceman/sections/toolkit.js';
import { servicemanTrainingSection } from './serviceman/sections/training.js';

export const servicemanDashboard = {
  persona: 'serviceman',
  name: 'Crew Performance Cockpit',
  headline: 'Stay ahead of assignments, travel buffers, availability, and compliance.',
  window: createWindow(),
  metadata: servicemanDashboardMetadata,
  navigation: [
    servicemanOverviewSection,
    servicemanCalendarSection,
    servicemanAvailabilitySection,
    servicemanScheduleSection,
    servicemanToolkitSection,
    servicemanTrainingSection
  ]
};

export default servicemanDashboard;
